import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const WEBSOCKET_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference';

// WebSocket连接管理
const activeConnections = new Map<string, {
  websocket: WebSocket;
  sessionId: string;
  taskId: string;
  isConnected: boolean;
  partialResults: string[];
  finalResults: string[];
}>();

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 ===== 实时语音识别API =====');
    
    const body = await request.json();
    const { action, audio_data, session_id } = body;

    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json({ 
        error: '未配置 DASHSCOPE_API_KEY',
        success: false 
      }, { status: 500 });
    }

    switch (action) {
      case 'start':
        return await handleStartSession();
      
      case 'send_audio':
        return await handleSendAudio(session_id, audio_data);
      
      case 'stop':
        return await handleStopSession(session_id);
      
      default:
        return NextResponse.json({ 
          error: '无效的操作类型',
          success: false 
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('💥 语音识别API错误:', error);
    return NextResponse.json({ 
      error: `服务器错误: ${error.message}`,
      success: false 
    }, { status: 500 });
  }
}

async function handleStartSession(): Promise<NextResponse> {
  console.log('🚀 启动语音识别会话...');
  
  const sessionId = uuidv4();
  const taskId = uuidv4();
  
  try {
    // 创建WebSocket连接
    const ws = new WebSocket(WEBSOCKET_URL, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'X-DashScope-DataInspection': 'enable'
      }
    });

    // 设置最大监听器数量
    ws.setMaxListeners(20);

    const connectionInfo = {
      websocket: ws,
      sessionId,
      taskId,
      isConnected: false,
      partialResults: [] as string[],
      finalResults: [] as string[]
    };

    // 设置最大监听器数量，避免内存泄漏警告
    ws.setMaxListeners(15);
    
    // 设置WebSocket事件监听器
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📥 WebSocket消息:', message);
        
        if (message.header?.event === 'result-generated') {
          const sentence = message.payload?.output?.sentence;
          if (sentence) {
            const text: string = sentence.text || '';
            const isFinal = sentence.sentence_end === true;
            
            console.log(`🎯 识别结果: "${text}" (${isFinal ? '最终' : '部分'})`);
            
            if (isFinal && text) {
              connectionInfo.finalResults.push(text);
            } else if (text) {
              connectionInfo.partialResults = [text]; // 只保留最新的部分结果
            }
          }
        } else if (message.header?.event === 'task-started') {
          console.log('✅ 任务已启动');
          connectionInfo.isConnected = true;
        } else if (message.header?.event === 'task-finished') {
          console.log('✅ 任务已完成');
          connectionInfo.isConnected = false;
        } else if (message.header?.event === 'task-failed') {
          console.error('❌ 任务失败:', message);
          connectionInfo.isConnected = false;
        }
      } catch (error) {
        console.error('❌ 解析WebSocket消息失败:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket错误:', error);
      connectionInfo.isConnected = false;
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket连接已关闭');
      connectionInfo.isConnected = false;
    });

    // 等待连接建立
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket连接超时'));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket连接已建立');
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // 发送run-task指令
    const runTaskCommand = {
      header: {
        action: 'run-task',
        task_id: taskId,
        streaming: 'duplex'
      },
      payload: {
        task_group: 'audio',
        task: 'asr',
        function: 'recognition',
        model: 'paraformer-realtime-v2',
        parameters: {
          format: 'pcm',
          sample_rate: 16000,
          disfluency_removal_enabled: false,
          punctuation_prediction_enabled: true,
          inverse_text_normalization_enabled: true
        },
        input: {}
      }
    };

    ws.send(JSON.stringify(runTaskCommand));
    console.log('📤 已发送run-task指令');

    // 等待task-started事件
    const isTaskStarted = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      const checkStarted = () => {
        if (connectionInfo.isConnected) {
          clearTimeout(timeout);
          resolve(true);
        }
      };

      // 定期检查连接状态
      const interval = setInterval(() => {
        checkStarted();
        if (connectionInfo.isConnected) {
          clearInterval(interval);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
      }, 5000);
    });

    if (!isTaskStarted) {
      ws.close();
      return NextResponse.json({ 
        error: '语音识别任务启动失败',
        success: false 
      }, { status: 500 });
    }

    // 保存连接信息
    activeConnections.set(sessionId, connectionInfo);

    console.log(`✅ 会话 ${sessionId} 已启动`);
    
    return NextResponse.json({ 
      success: true, 
      session_id: sessionId,
      task_id: taskId,
      message: '会话已启动'
    });

  } catch (error: any) {
    console.error('💥 启动会话失败:', error);
    return NextResponse.json({ 
      error: `启动会话失败: ${error.message}`,
      success: false 
    }, { status: 500 });
  }
}

async function handleSendAudio(sessionId: string, audioData: string): Promise<NextResponse> {
  if (!sessionId || !audioData) {
    return NextResponse.json({ 
      error: '缺少session_id或audio_data',
      success: false 
    }, { status: 400 });
  }

  const connection = activeConnections.get(sessionId);
  if (!connection || !connection.isConnected) {
    return NextResponse.json({ 
      error: '会话不存在或已断开',
      success: false 
    }, { status: 404 });
  }

  try {
    // 将base64音频数据转换为二进制
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // 发送音频数据
    connection.websocket.send(audioBuffer);
    console.log('🎵 已发送音频数据，大小:', audioBuffer.length, 'bytes');

    // 获取当前识别结果
    const partialText = connection.partialResults.join(' ');
    const finalText = connection.finalResults.join(' ');

    return NextResponse.json({
      success: true,
      partial_text: partialText,
      final_text: finalText,
      message: '音频已发送'
    });

  } catch (error: any) {
    console.error('💥 发送音频失败:', error);
    return NextResponse.json({ 
      error: `发送音频失败: ${error.message}`,
      success: false 
    }, { status: 500 });
  }
}

async function handleStopSession(sessionId: string): Promise<NextResponse> {
  console.log('🛑 停止语音识别会话...');
  
  if (!sessionId) {
    return NextResponse.json({ 
      error: '缺少session_id',
      success: false 
    }, { status: 400 });
  }

  const connection = activeConnections.get(sessionId);
  if (!connection) {
    return NextResponse.json({ 
      error: '会话不存在',
      success: false 
    }, { status: 404 });
  }

  try {
    // 发送finish-task指令
    const finishTaskCommand = {
      header: {
        action: 'finish-task',
        task_id: connection.taskId,  // 使用正确的task_id
        streaming: 'duplex'
      },
      payload: {
        input: {}
      }
    };

    connection.websocket.send(JSON.stringify(finishTaskCommand));
    console.log('📤 已发送finish-task指令');

    // 获取最终结果
    const finalText = connection.finalResults.join(' ');
    
    // 等待一段时间后关闭连接
    setTimeout(() => {
      if (connection.websocket.readyState === WebSocket.OPEN) {
        connection.websocket.close();
      }
      activeConnections.delete(sessionId);
      console.log(`✅ 会话 ${sessionId} 已关闭`);
    }, 1000);

    return NextResponse.json({
      success: true,
      final_text: finalText,
      message: '会话已停止'
    });

  } catch (error: any) {
    console.error('💥 停止会话失败:', error);
    return NextResponse.json({ 
      error: `停止会话失败: ${error.message}`,
      success: false 
    }, { status: 500 });
  }
} 