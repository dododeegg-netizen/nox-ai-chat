import { NextRequest, NextResponse } from 'next/server';

// 阿里百炼Qwen-TTS API配置
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

// 稳定的网络配置 - 确保Qwen-TTS成功率
const TTS_TIMEOUT = 15000; // 15秒超时，确保稳定性
const MAX_RETRIES = 2; // 增加重试次数

// 稳定fetch函数
async function stableFetch(url: string, options: any, timeout = TTS_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⏰ TTS请求超时');
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('\n🎵 ===== 稳定TTS API =====');
  
  try {
    const body = await request.json();
    const { text, voice = 'Cherry', format = 'mp3' } = body;

    console.log('📝 TTS请求:');
    console.log('  - 文本:', text?.substring(0, 50) + (text?.length > 50 ? '...' : ''));
    console.log('  - 音色:', voice);

    if (!text) {
      return NextResponse.json({ 
        error: '缺少text参数',
        success: false 
      }, { status: 400 });
    }

    // 文本长度限制 - 避免过长文本导致失败
    if (text.length > 300) {
      console.log('⚠️ 文本过长，截断处理');
      const truncatedText = text.substring(0, 300) + '...';
      return await processTTS(truncatedText, voice, format);
    }

    return await processTTS(text, voice, format);

  } catch (error: any) {
    console.error('💥 TTS错误:', error.message);
    return NextResponse.json({ 
      error: '语音合成失败',
      success: false,
      details: error.message
    }, { status: 500 });
  }
}

// 稳定的TTS处理函数 - 带重试机制
async function processTTS(text: string, voice: string, format: string) {
  console.log('🚀 开始稳定TTS处理...');
  
  const requestData = {
    model: 'qwen-tts',
    input: {
      text: text,
      voice: voice
    }
  };

  let lastError = null;
  
  // 重试机制
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 发送TTS请求... (尝试 ${attempt}/${MAX_RETRIES})`);
      
      const response = await stableFetch(DASHSCOPE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log('📥 TTS响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS API错误:', response.status, errorText);
        throw new Error(`TTS API错误: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 TTS响应类型:', typeof data);

      if (data.output?.audio?.url) {
        console.log('🎵 获取音频URL:', data.output.audio.url);
        
        // 下载音频
        const audioResponse = await stableFetch(data.output.audio.url, {
          method: 'GET'
        });

        if (!audioResponse.ok) {
          throw new Error(`音频下载失败: ${audioResponse.status}`);
        }

        const audioBuffer = await audioResponse.arrayBuffer();
        console.log('✅ 音频下载成功:', audioBuffer.byteLength, 'bytes');

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'no-cache'
          },
        });
      } else {
        console.error('❌ 未找到音频URL:', data);
        throw new Error('API响应中未找到音频URL');
      }

    } catch (error: any) {
      lastError = error;
      console.error(`❌ 尝试 ${attempt} 失败:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ 等待 2 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // 所有重试都失败了
  console.error('💥 所有TTS重试都失败了:', lastError?.message);
  return NextResponse.json({ 
    error: 'Qwen-TTS服务暂时不可用，请稍后重试',
    success: false,
    details: lastError?.message,
    retries: MAX_RETRIES
  }, { status: 503 });
}

// 获取可用音色列表
export async function GET() {
  const VOICE_PRESETS = {
    'Cherry': '温婉女声(中英双语)',
    'Ethan': '稳重男声(中英双语)', 
    'Chelsie': '活力女声(中英双语)',
    'Serena': '优雅女声(中英双语)'
  };
  
  return NextResponse.json({
    voices: VOICE_PRESETS,
    defaultVoice: 'Cherry',
    supportedFormats: ['mp3', 'wav'],
    model: 'qwen-tts',
    timeout: TTS_TIMEOUT,
    retries: MAX_RETRIES
  });
} 