import { NextRequest, NextResponse } from 'next/server';

// 阿里百炼通义千问VL-Max API配置
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

// 优化的网络请求配置 - 减少超时时间提升响应速度
const API_TIMEOUT = 8000; // 8秒超时（从15秒减少）
const MAX_RETRIES = 1; // 减少重试次数（从2次减少到1次）

// 带超时和重试的fetch函数
async function fetchWithTimeout(url: string, options: any, timeout = API_TIMEOUT, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🚀 快速请求 ${i + 1}/${retries}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⚡ 快速超时，中止连接');
        controller.abort();
      }, timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`✅ 响应成功: ${response.status}`);
      return response;
    } catch (error: any) {
      console.error(`❌ 请求失败 ${i + 1}/${retries}:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // 减少重试等待时间（从1秒减少到500ms）
      console.log('⚡ 快速重试...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('请求失败');
}

export async function POST(request: NextRequest) {
  console.log('\n⚡ ===== 快速聊天API =====');
  
  try {
    const body = await request.json();
    const { message, image, type } = body;
    
    console.log('📥 请求:', body.message);
    console.log('🖼️ 图片数据:', image ? '有图片' : '无图片');
    console.log('📋 请求类型:', type);

    // 验证输入
    if (!message) {
      console.error('❌ 缺少message参数');
      return NextResponse.json({ 
        error: '缺少必需的message参数',
        success: false 
      }, { status: 400 });
    }

    // 根据是否有图片选择模型和构建消息
    const isImageRequest = image && type === 'image';
    const selectedModel = isImageRequest ? 'qwen-vl-max' : 'qwen-plus';
    
    console.log('🤖 选择模型:', selectedModel);

    let userContent;
    if (isImageRequest) {
      // 构建图片消息格式
      userContent = [
        {
          type: 'text',
          text: message
        },
        {
          type: 'image_url',
          image_url: {
            url: image
          }
        }
      ];
    } else {
      // 普通文本消息
      userContent = message;
    }

    // 优化的请求数据 - 减少token数量提升速度
    const requestData = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: '你叫NOX，是生活助手。风格年轻化，共情幽默。回复简洁有趣，每次回复不超过150个字（如果超过150个字，分几次回答），回答中不使用表情和手势。' // 更新system prompt
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: 500, // 减少到500（从1000减少）
      temperature: 0.8, // 稍微提高创造性
      stream: false // 确保非流式响应
    };

    console.log('🚀 发送请求...');

    // 调用阿里百炼API
    const response = await fetchWithTimeout(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API错误:', response.status);
      
      // 返回友好的错误信息
      return NextResponse.json({ 
        error: '抱歉，AI服务暂时不可用，请稍后再试',
        success: false,
        details: `API错误: ${response.status}`
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('📥 响应长度:', data.choices?.[0]?.message?.content?.length || 0);
    
    const aiResponse = data.choices?.[0]?.message?.content || '抱歉，我没有收到有效的响应。';
    console.log('✅ 回复完成');

    return NextResponse.json({ 
      success: true, 
      response: aiResponse,
      hasAudio: true, // 标记支持语音播放
      model: selectedModel
    });

  } catch (error: any) {
    console.error('💥 API错误:', error.message);
    
    // 返回用户友好的错误信息
    return NextResponse.json({ 
      error: '抱歉，我暂时无法回答，请稍后再试。',
      success: false,
      details: error.message
    }, { status: 500 });
  }
} 