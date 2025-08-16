import { useState, useRef, useCallback } from 'react';

interface UseRealtimeASROptions {
  onPartialResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseRealtimeASRReturn {
  isListening: boolean;
  status: 'idle' | 'starting' | 'listening' | 'stopping' | 'error';
  partialText: string;
  finalText: string;
  audioLevel: number;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
}

// 获取支持的音频MIME类型
function getSupportedMimeType(): string {
  // 优先使用WAV格式，避免WebM解码问题
  const types = [
    'audio/wav',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/webm;codecs=opus'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('✅ 使用音频格式:', type);
      return type;
    }
  }
  
  console.warn('⚠️ 使用默认音频格式');
  return 'audio/wav'; // 默认格式改为WAV，兼容性更好
}

// 音频格式转换函数：支持多种格式转PCM
async function convertToPCM(audioBlob: Blob): Promise<ArrayBuffer> {
  // 检查音频数据是否有效
  if (audioBlob.size === 0) {
    throw new Error('音频数据为空');
  }

  if (audioBlob.size < 1024) { // 提高到1KB
    throw new Error('音频数据太小，可能无效');
  }

  // 检查MIME类型是否有效
  if (!audioBlob.type || audioBlob.type === '') {
    console.warn('⚠️ 音频MIME类型缺失');
  }

  console.log('🔧 开始音频转换，输入大小:', audioBlob.size, 'bytes, 类型:', audioBlob.type);
  
  let audioContext: AudioContext | null = null;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const arrayBuffer = await audioBlob.arrayBuffer();
    console.log('📊 读取音频数据，大小:', arrayBuffer.byteLength, 'bytes');
    
    // 检查是否为有效的音频数据
    if (arrayBuffer.byteLength === 0) {
      throw new Error('音频缓冲区为空');
    }

    // 解码音频数据，增加更好的错误处理
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      console.log('✅ 音频解码成功，采样率:', audioBuffer.sampleRate, '声道数:', audioBuffer.numberOfChannels, '时长:', audioBuffer.duration.toFixed(3), 's');
    } catch (decodeError: any) {
      console.error('❌ 音频解码失败:', decodeError.message);
      
      // 尝试备用解码方法
      try {
        console.log('🔄 尝试备用解码方法...');
        const audioBuffer2 = await new Promise<AudioBuffer>((resolve, reject) => {
          audioContext!.decodeAudioData(
            arrayBuffer.slice(0), 
            resolve, 
            reject
          );
        });
        audioBuffer = audioBuffer2;
        console.log('✅ 备用解码成功');
      } catch (fallbackError: any) {
        throw new Error(`音频解码失败: ${decodeError.message} (备用方法也失败: ${fallbackError.message})`);
      }
    }
    
    // 检查音频缓冲区是否有效
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('解码后的音频缓冲区无效');
    }

    // 重采样到16000Hz单声道
    const targetSampleRate = 16000;
    const length = Math.floor(audioBuffer.length * targetSampleRate / audioBuffer.sampleRate);
    
    if (length <= 0) {
      throw new Error('重采样后长度无效');
    }

    const offlineContext = new OfflineAudioContext(1, length, targetSampleRate);
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const resampledBuffer = await offlineContext.startRendering();
    console.log('🔄 重采样完成，新长度:', resampledBuffer.length, '目标采样率:', targetSampleRate);
    
    // 转换为16位PCM
    const samples = resampledBuffer.getChannelData(0);
    const int16Array = new Int16Array(samples.length);
    
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    console.log('✅ PCM转换完成，输出大小:', int16Array.buffer.byteLength, 'bytes');
    return int16Array.buffer;
    
  } catch (error: any) {
    console.error('❌ 音频转换失败:', error.message);
    throw new Error(`音频转换失败: ${error.message}`);
  } finally {
    if (audioContext && audioContext.state !== 'closed') {
      try {
        await audioContext.close();
      } catch (e) {
        console.warn('⚠️ 音频上下文关闭失败:', e);
      }
    }
  }
}

export const useRealtimeASR = (options: UseRealtimeASROptions = {}): UseRealtimeASRReturn => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<'idle' | 'starting' | 'listening' | 'stopping' | 'error'>('idle');
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 更新音频电平
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // 计算平均音量
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const level = Math.min(average / 128, 1); // 归一化到0-1
      
      setAudioLevel(level);
      
      // 继续动画循环
      if (isListening) {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    }
  }, [isListening]);

  // 开始录音
  const startListening = useCallback(async () => {
    try {
      setStatus('starting');
      setError(null);
      setPartialText('');
      setFinalText('');
      
      console.log('🎤 开始启动语音识别...');

      // 1. 启动识别会话
      const startResponse = await fetch('/api/realtime-asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      const startResult = await startResponse.json();
      if (!startResult.success) {
        throw new Error(startResult.error || '启动会话失败');
      }

      sessionIdRef.current = startResult.session_id;
      console.log('✅ 语音识别会话已启动，ID:', sessionIdRef.current);

      // 2. 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000, // 使用更高的采样率，然后转换
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      // 3. 设置音频分析器（用于显示音频电平）
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // 4. 获取支持的音频格式
      const mimeType = getSupportedMimeType();
      
      // 5. 设置录音器
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 6. 处理录音数据
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          console.log('📦 收到音频数据块，大小:', event.data.size, 'bytes, 类型:', event.data.type);
          audioChunksRef.current.push(event.data);
          
          // 当累积足够的音频数据时才处理（优化处理逻辑）
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log('📊 累积音频大小:', totalSize, 'bytes, 块数:', audioChunksRef.current.length);
          
          // 更严格的处理条件：确保音频数据足够大且有效
          if (audioChunksRef.current.length >= 3 || totalSize >= 8192) { // 提高到8KB
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            const chunksProcessed = audioChunksRef.current.length;
            audioChunksRef.current = []; // 清空缓存
            
            console.log('🎵 处理音频块，合并大小:', audioBlob.size, 'bytes, 来源块数:', chunksProcessed);
            
            // 增加更严格的音频数据验证
            if (sessionIdRef.current && audioBlob.size >= 4096) { // 提高到至少4KB的音频数据
              try {
                // 转换音频格式为PCM
                const pcmBuffer = await convertToPCM(audioBlob);
                const uint8Array = new Uint8Array(pcmBuffer);
                const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

                console.log('🎵 已发送音频数据，PCM大小:', pcmBuffer.byteLength, 'bytes');

                // 发送音频数据到服务器
                const response = await fetch('/api/realtime-asr', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'send_audio',
                    session_id: sessionIdRef.current,
                    audio_data: base64Audio
                  })
                });

                const result = await response.json();
                if (result.success) {
                  // 处理部分识别结果
                  if (result.partial_text) {
                    setPartialText(result.partial_text);
                    options.onPartialResult?.(result.partial_text);
                  }
                  
                  // 处理最终识别结果
                  if (result.final_text) {
                    setFinalText(result.final_text);
                    setPartialText('');
                    options.onFinalResult?.(result.final_text);
                    console.log('📝 最终识别结果:', result.final_text);
                  }
                } else {
                  console.warn('⚠️ 服务器返回错误:', result.error);
                }
              } catch (err: any) {
                console.error('❌ 处理音频数据失败:', err.message);
                // 不设置错误状态，继续处理下一块音频
                console.log('🔄 跳过当前音频块，继续处理...');
              }
            } else {
              console.log('⏭️ 音频块太小，跳过处理:', audioBlob.size, 'bytes');
            }
          }
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder 错误:', event);
        setError('录音器错误');
        options.onError?.('录音器错误');
      };

      // 7. 开始录音（每3秒生成一个音频块，确保足够大小）
      mediaRecorder.start(3000);
      setIsListening(true);
      setStatus('listening');
      
      // 开始音频电平监控
      updateAudioLevel();
      
      console.log('✅ 开始录音和识别');

    } catch (err: any) {
      console.error('❌ 启动语音识别失败:', err);
      setStatus('error');
      setError(err.message);
      options.onError?.(err.message);
    }
  }, [options, updateAudioLevel]);

  // 停止录音
  const stopListening = useCallback(async () => {
    try {
      setStatus('stopping');
      console.log('🛑 停止语音识别...');

      // 停止录音
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // 停止音频电平监控
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // 关闭音频流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // 关闭音频上下文
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // 停止服务器会话
      if (sessionIdRef.current) {
        try {
          await fetch('/api/realtime-asr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'stop',
              session_id: sessionIdRef.current
            })
          });
        } catch (err) {
          console.warn('⚠️ 停止会话请求失败:', err);
        }
        sessionIdRef.current = null;
      }

      setIsListening(false);
      setStatus('idle');
      setAudioLevel(0);
      audioChunksRef.current = [];
      
      console.log('✅ 语音识别已停止');

    } catch (err: any) {
      console.error('❌ 停止语音识别失败:', err);
      setStatus('error');
      setError(err.message);
      options.onError?.(err.message);
    }
  }, [options]);

  return {
    isListening,
    status,
    partialText,
    finalText,
    audioLevel,
    error,
    startListening,
    stopListening
  };
}; 