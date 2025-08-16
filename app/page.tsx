"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Camera, MessageCircle, Trash2, Upload, Play, Pause, Moon, Sun, Image, FolderOpen, Plus } from 'lucide-react';
import { useRealtimeASR } from '@/hooks/useRealtimeASR';
import { VoiceWaveform } from '../components/VoiceWaveform';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotion?: string;
  hasAudio?: boolean;
  image?: string; // 添加图片字段
}

// 话题接口定义
interface Topic {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
  messages: Message[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [ttsStatus, setTtsStatus] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [textInput, setTextInput] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [currentIP, setCurrentIP] = useState<string>('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 实时语音识别Hook
  const {
    isListening,
    status,
    partialText,
    finalText,
    audioLevel,
    error: voiceError,
    startListening,
    stopListening
  } = useRealtimeASR({
    onFinalResult: (text: string) => {
      // 显示用户的语音识别文字
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        timestamp: new Date(),
        hasAudio: false
      };
      setMessages(prev => [...prev, userMessage]);
      
      // 发送消息到AI并获取回应
      handleSendMessage(text);
    },
    onError: (error: string) => {
      console.error('语音识别错误:', error);
    }
  });

  // 兼容性变量映射
  const isRecording = isListening;
  const isProcessing = status === 'starting' || status === 'stopping';
  const startRecording = startListening;
  const stopRecording = stopListening;

  // 获取客户端IP地址并加载历史记录
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 获取客户端IP
        const ipResponse = await fetch('/api/get-ip');
        const ipData = await ipResponse.json();
        
        if (ipData.success) {
          setCurrentIP(ipData.ip);
          console.log('🌍 当前IP地址:', ipData.ip);
          
          // 加载话题列表
          const topicsResponse = await fetch(`/api/topics?ip=${ipData.ip}`);
          const topicsData = await topicsResponse.json();
          
          if (topicsData.success && topicsData.topics) {
            setTopics(topicsData.topics);
            console.log('📚 已加载话题列表:', topicsData.topics.length, '个话题');
          }
        }
      } catch (error) {
        console.error('❌ 初始化失败:', error);
        setCurrentIP('localhost'); // 默认值
      } finally {
        setHistoryLoaded(true);
      }
    };

    initializeApp();
  }, []);

  // 不再自动保存消息到历史记录，只在"New Chat"时手动保存话题

  // 点击外部关闭图片选项菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImageOptions) {
        const target = event.target as HTMLElement;
        if (!target.closest('.image-options-container')) {
          setShowImageOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImageOptions]);

  // 实时语音录制处理
  const handleVoiceToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      
      try {
        // 将图片转换为base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result as string;
          
          // 添加用户消息（包含图片）
          const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: '请详细描述这张图片的内容，如果是一道题请帮我解答',
            timestamp: new Date(),
            image: base64Image // 保存图片数据
          };
          setMessages(prev => [...prev, userMessage]);
          
          // 调用API
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: '请详细描述这张图片的内容，如果是一道题请帮我解答',
              image: base64Image,
              type: 'image'
            }),
          });

          const data = await response.json();
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: data.success ? data.response : '抱歉，图片分析失败了，请稍后再试。',
            timestamp: new Date(),
            hasAudio: data.hasAudio || false
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Image upload error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '抱歉，图片处理失败了，请检查网络连接后重试。',
          timestamp: new Date(),
          hasAudio: false
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
    }
  };

  // 通用消息发送函数
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };
    
    // 立即显示用户消息和加载状态
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      console.log('⚡ 发送消息:', messageText);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText.trim(),
          type: 'text'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('⚡ 收到回复:', data.response?.length || 0, '字符');
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.success ? data.response : '抱歉，我暂时无法回答，请稍后再试。',
        timestamp: new Date(),
        hasAudio: data.hasAudio || false
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error: any) {
      console.error('❌ 发送失败:', error.name === 'AbortError' ? '超时' : error.message);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: error.name === 'AbortError' ? 
          '响应超时，请稍后再试。' : 
          '网络连接失败，请检查网络后重试。',
        timestamp: new Date(),
        hasAudio: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 文本输入提交
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    const currentInput = textInput.trim();
    setTextInput('');
    await handleSendMessage(currentInput);
  };

    // 快速语音播放 - 优先使用Qwen-TTS，快速回退到浏览器TTS
  const handleAudioPlay = async (messageId: string) => {
    if (currentAudioId === messageId) {
      // 停止播放
      setCurrentAudioId(null);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // 找到对应的消息
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    try {
      setCurrentAudioId(messageId);
      setTtsStatus('NOX正在组织语言…');
      console.log('🎵 稳定语音播放:', message.content.substring(0, 20) + '...');

      // 稳定尝试Qwen-TTS（15秒超时）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message.content,
            voice: 'Cherry',
            format: 'mp3'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = new Audio(audioUrl);
          audio.playbackRate = 1.2; // 稍微加快播放速度
          
          audio.onended = () => {
            setCurrentAudioId(null);
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = () => {
            setCurrentAudioId(null);
            URL.revokeObjectURL(audioUrl);
            console.error('音频播放失败');
          };

          await audio.play();
          console.log('✅ Qwen-TTS播放成功');
          setTtsStatus('NOX回答中...');
          
          audio.onended = () => {
            setTtsStatus(null);
            setCurrentAudioId(null);
          };
          
          return;
        }
      } catch (apiError) {
        console.error('❌ Qwen-TTS失败:', apiError);
        setCurrentAudioId(null);
        setTtsStatus('NOX暂时失声了，请稍后重试');
        // 显示错误提示但不使用浏览器TTS
        console.log('🔇 语音合成暂时不可用，请稍后重试');
        
        // 3秒后清除错误状态
        setTimeout(() => {
          setTtsStatus(null);
        }, 3000);
      }

    } catch (error) {
      console.error('❌ 语音播放错误:', error);
      setCurrentAudioId(null);
      setTtsStatus(null);
    }
  };



  // 轮询异步任务状态
  const pollTaskStatus = async (taskId: string, messageId: string) => {
    const maxAttempts = 30; // 最多轮询30次（3分钟）
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.error('任务超时');
        setCurrentAudioId(null);
        return;
      }

      try {
        const response = await fetch(`/api/tts/task?task_id=${taskId}`);
        const result = await response.json();

        if (response.ok && response.headers.get('content-type')?.includes('audio')) {
          // 任务完成，播放音频
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            setCurrentAudioId(null);
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = () => {
            setCurrentAudioId(null);
            URL.revokeObjectURL(audioUrl);
            console.error('音频播放失败');
          };

          await audio.play();
          return;
        } else if (result.status === 'FAILED') {
          console.error('语音生成失败');
          setCurrentAudioId(null);
          return;
        } else if (result.status === 'PENDING' || result.status === 'RUNNING') {
          // 继续轮询
          attempts++;
          setTimeout(poll, 6000); // 6秒后再次查询
        }
      } catch (error) {
        console.error('查询任务状态失败:', error);
        setCurrentAudioId(null);
      }
    };

    poll();
  };

  // 清空话题历史（只有手动清空）
  const clearTopics = async () => {
    if (!confirm('确定要清空所有话题历史吗？此操作不可恢复！')) {
      return;
    }
    
    try {
      if (currentIP) {
        await fetch(`/api/topics?ip=${currentIP}`, {
          method: 'DELETE',
        });
        setTopics([]);
        console.log('🗑️ 已清空所有话题历史:', currentIP);
      }
    } catch (error) {
      console.error('❌ 清空话题历史失败:', error);
    }
  };

  // 删除单个话题
  const deleteTopic = async (topicId: string) => {
    if (!confirm('确定要删除这个话题吗？')) {
      return;
    }
    
    try {
      if (currentIP) {
        await fetch(`/api/topics?ip=${currentIP}&topicId=${topicId}`, {
          method: 'DELETE',
        });
        setTopics(prev => prev.filter(topic => topic.id !== topicId));
        console.log('🗑️ 已删除话题:', topicId);
      }
    } catch (error) {
      console.error('❌ 删除话题失败:', error);
    }
  };

  // 加载话题继续聊天
  const loadTopicChat = async (topicId: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}?ip=${currentIP}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.topic) {
          // 将话题的消息加载到当前聊天中
          const loadedMessages = data.topic.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(loadedMessages);
          setShowHistory(false); // 关闭历史面板
          console.log('💬 已加载话题聊天:', data.topic.title);
        }
      }
    } catch (error) {
      console.error('❌ 加载话题失败:', error);
    }
  };

  // 开启新对话
  const startNewChat = async () => {
    try {
      // 先保存当前对话为新话题
      if (messages.length > 0 && currentIP) {
        const response = await fetch('/api/topics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ip: currentIP,
            messages: messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString()
            }))
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('💾 当前对话已保存为话题:', result.title);
          
          // 更新话题列表
          const topicsResponse = await fetch(`/api/topics?ip=${currentIP}`);
          const topicsData = await topicsResponse.json();
          if (topicsData.success) {
            setTopics(topicsData.topics);
          }
        }
      }
      
      // 清空当前对话界面
      setMessages([]);
      setShowHistory(false);
      console.log('🆕 开始新对话');
    } catch (error) {
      console.error('❌ 保存话题失败:', error);
      // 即使保存失败，也允许开始新对话
      setMessages([]);
      setShowHistory(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white overflow-hidden relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-8">
        <div className="absolute top-10 left-10 w-16 h-16 bg-amber-400/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-20 w-12 h-12 bg-orange-400/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-yellow-500/25 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-20 h-20 bg-amber-500/35 rounded-full blur-3xl"></div>
      </div>

      {/* 顶部栏 */}
      <div className="relative z-10 flex justify-between items-center p-4 bg-gray-900/60 backdrop-blur-sm border-b border-gray-800/40">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Sun className="w-6 h-6 text-amber-400" />
            <Moon className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              NOX AI
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={startNewChat}
            className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-green-400 transition-colors text-sm font-medium border border-gray-600/30 rounded-lg hover:border-green-400/30 backdrop-blur-sm"
            title="开始新对话"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 text-gray-400 hover:text-amber-400 transition-colors text-sm font-medium border border-gray-600/30 rounded-lg hover:border-amber-400/30 backdrop-blur-sm"
          >
            History
          </button>
        </div>
      </div>

      {/* 历史记录面板 */}
      {showHistory && (
        <div className="absolute top-16 right-4 z-20 bg-gray-900/95 backdrop-blur-md rounded-2xl p-4 border border-gray-700/50 w-80">
          <div className="text-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 font-medium">话题历史</p>
                <p className="text-xs text-gray-500">IP: {currentIP || '获取中...'} • {topics.length} 个话题</p>
              </div>
              <button
                onClick={clearTopics}
                className="flex items-center space-x-1 px-2 py-1 hover:bg-red-500/20 rounded-lg transition-all text-gray-400 hover:text-white text-xs"
              >
                <Trash2 className="w-3 h-3" />
                <span>清空</span>
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {topics.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">暂无话题记录</p>
                  <p className="text-gray-600 text-xs mt-1">开始聊天后会自动保存话题</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mb-2">
                    <p className="text-gray-400 text-xs mb-2">💡 点击话题可以继续之前的聊天</p>
                  </div>
                  {topics.map((topic) => (
                    <div key={topic.id} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/30 hover:bg-gray-700/50 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-sm font-medium text-amber-400 truncate group-hover:text-amber-300 transition-colors flex-1"
                          onClick={() => loadTopicChat(topic.id)}
                          title="点击继续这个话题的聊天"
                        >
                          💬 {topic.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTopic(topic.id);
                          }}
                          className="text-gray-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                          title="删除话题"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div 
                        className="flex items-center justify-between text-xs text-gray-500 mb-1"
                        onClick={() => loadTopicChat(topic.id)}
                      >
                        <span>{topic.messageCount} 条消息</span>
                        <span>{new Date(topic.createdAt).toLocaleDateString()} {new Date(topic.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p 
                        className="text-gray-300 text-xs line-clamp-2 group-hover:text-gray-200 transition-colors"
                        onClick={() => loadTopicChat(topic.id)}
                      >
                        {topic.preview}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="relative z-10 flex flex-col h-[calc(100vh-4rem)] p-4">
        
        {/* AI头像和状态 */}
        <div className="text-center mb-4">
          <div className="relative w-20 h-20 mx-auto mb-3">
            {/* 发光背景动画 */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-orange-500/30 to-amber-600/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping"></div>
            
            {/* 头像容器 */}
            <div className="relative w-full h-full bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-600/20 rounded-full flex items-center justify-center shadow-2xl border border-amber-400/40 overflow-hidden backdrop-blur-sm">
              <img 
                src="/logo.png" 
                alt="NOX AI Logo" 
                className="w-18 h-18 object-contain relative z-10"
              />
            </div>
          </div>
          <h2 className="text-lg font-bold mb-1 text-amber-100">Hi！我是你的助手Nox</h2>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm mb-4">
                开始我们的对话吧！你可以：
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span>输入文字和我聊天</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>点击麦克风说话</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>上传图片让我帮你看看</span>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-white shadow-lg'
              }`}>
                {/* 图片消息指示器 */}
                {message.image && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center space-x-1">
                    <Camera className="w-3 h-3" />
                    <span>图片</span>
                  </div>
                )}
                {/* 显示图片（如果有） */}
                {message.image && (
                  <div className="mb-3">
                    <img 
                      src={message.image} 
                      alt="上传的图片" 
                      className="max-w-full h-auto rounded-xl shadow-lg border border-gray-600/50 hover:border-amber-400/50 transition-all cursor-pointer"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                      onClick={() => {
                        // 点击图片可以在新窗口查看大图
                        const newWindow = window.open();
                        newWindow?.document.write(`
                          <html>
                            <head><title>查看图片</title></head>
                            <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                              <img src="${message.image}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="查看大图"/>
                            </body>
                          </html>
                        `);
                      }}
                    />
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                {message.hasAudio && (
                  <button
                    onClick={() => handleAudioPlay(message.id)}
                    className="mt-2 flex items-center space-x-1 text-xs opacity-80 hover:opacity-100"
                  >
                    {currentAudioId === message.id ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>播放中...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>播放语音</span>
                      </>
                    )}
                  </button>
                )}
                {message.emotion && (
                  <div className="mt-1 text-xs opacity-60">
                    情绪：{message.emotion === 'sad' ? '难过' : message.emotion}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          {ttsStatus && (
            <div className="flex justify-center">
              <div className="bg-blue-800/60 backdrop-blur-sm border border-blue-700/50 rounded-2xl px-4 py-2">
                <div className="flex items-center space-x-2 text-sm text-blue-200">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>{ttsStatus}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入模式切换和文本输入 */}
        {inputMode === 'text' && (
          <div className="mb-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                placeholder="在这里输入你想说的话..."
                className="flex-1 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg"
              >
                发送
              </button>
            </div>
          </div>
        )}

        {/* 底部控制栏 */}
        <div className="flex justify-center items-center space-x-6">
          {/* 图片上传选项 */}
          <div className="relative image-options-container">
            <button
              onClick={() => setShowImageOptions(!showImageOptions)}
              className="p-4 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-full shadow-2xl transition-all transform hover:scale-105 border border-gray-600/50 hover:border-amber-400/50"
            >
              <Camera className="w-6 h-6 text-gray-300 hover:text-amber-400 transition-colors" />
            </button>
            
            {/* 图片选择选项菜单 */}
            {showImageOptions && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800/95 backdrop-blur-md rounded-xl p-2 shadow-2xl border border-gray-700/50 min-w-[160px] animate-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => {
                    cameraInputRef.current?.click();
                    setShowImageOptions(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-amber-400 hover:bg-gray-700/50 rounded-lg transition-all active:bg-gray-600/50 touch-manipulation"
                  title="使用相机拍摄新照片"
                >
                  <Camera className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">拍照</span>
                    <span className="text-xs text-gray-400">使用相机</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowImageOptions(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-amber-400 hover:bg-gray-700/50 rounded-lg transition-all active:bg-gray-600/50 touch-manipulation"
                  title="从相册中选择已有照片"
                >
                  <Image className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">相册</span>
                    <span className="text-xs text-gray-400">选择图片</span>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          {/* 隐藏的文件输入 */}
          {/* 相册选择 - 不使用capture属性，允许从相册选择 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            className="hidden"
          />
          {/* 相机拍照 - 使用capture属性，优先使用后置摄像头 */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/jpg,image/png"
            capture="environment"
            className="hidden"
          />

          {/* 主要语音按钮 */}
          <button
            onClick={handleVoiceToggle}
            disabled={isLoading || isProcessing}
            className={`relative p-6 rounded-full shadow-2xl transition-all transform hover:scale-105 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse border border-red-400/50'
                : isProcessing
                ? 'bg-blue-500 animate-pulse border border-blue-400/50'
                : isLoading
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:via-orange-700 hover:to-amber-800 border border-amber-500/50'
            }`}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center space-y-1">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs text-white">识别中</div>
              </div>
            ) : isRecording ? (
              <div className="flex flex-col items-center space-y-1">
                <VoiceWaveform 
                  isRecording={isRecording} 
                  audioLevel={audioLevel} 
                  className="text-white" 
                />
                <div className="text-xs text-white">录音中</div>
              </div>
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* 输入模式切换 */}
          <button
            onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
            className="p-4 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-full shadow-2xl transition-all transform hover:scale-105 border border-gray-600/50 hover:border-amber-400/50"
          >
            <MessageCircle className="w-6 h-6 text-gray-300 hover:text-amber-400 transition-colors" />
          </button>
        </div>

        {/* 操作提示 */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            {inputMode === 'voice'
              ? isProcessing
                ? '正在识别语音内容，请稍候...'
                : isRecording
                ? '正在录音中，再次点击结束录音'
                : '点击麦克风开始语音对话'
              : '输入文字和我聊天，或切换到语音模式'
            }
          </p>
          {voiceError && (
            <p className="text-xs text-red-400 mt-1">
              {voiceError}
            </p>
          )}
        </div>



        {/* 隐私说明 */}
        <div className="text-center mt-4 px-4">
          <p className="text-xs text-gray-500">
            此为辅助手段，不替代家长/老师与专业人员。
          </p>
        </div>
      </div>
    </div>
  );
}