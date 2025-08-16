import { NextRequest, NextResponse } from 'next/server';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 ===== ASR语音识别API =====');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ 
        error: '未提供音频文件',
        success: false 
      }, { status: 400 });
    }

    console.log('📁 音频文件信息:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    console.log('🚀 发送ASR请求...');

    // 将音频转换为Base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    console.log('📊 音频数据大小:', base64Audio.length);

    // 使用阿里云语音识别API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/asr/transcription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'paraformer-realtime-v2',
        input: {
          audio: `data:audio/webm;base64,${base64Audio}`
        },
        parameters: {
          format: 'webm',
          sample_rate: 16000,
          language_hints: ['zh', 'en']
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('💥 ASR请求失败:', response.status, errorText);
      return NextResponse.json({ 
        error: `ASR请求失败: ${response.status}`,
        details: errorText,
        success: false 
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('📥 ASR响应:', JSON.stringify(result, null, 2));

    // 解析响应
    let recognizedText = '';
    
    if (result.output && result.output.text) {
      recognizedText = result.output.text;
    } else if (result.output && result.output.transcription) {
      recognizedText = result.output.transcription;
    } else if (result.text) {
      recognizedText = result.text;
    }

    if (!recognizedText || recognizedText.trim().length === 0) {
      console.log('⚠️ 未识别出有效文本');
      return NextResponse.json({ 
        success: false, 
        text: '', 
        message: '未识别出有效文本',
        debug: result
      });
    }

    console.log('✅ ASR识别完成:', `"${recognizedText}"`);

    // 🚀 自动调用LLM进行对话
    console.log('🤖 开始调用LLM对话...');
    try {
      const chatResponse = await fetch(`${request.nextUrl.origin}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: recognizedText
        })
      });

      if (chatResponse.ok) {
        const chatResult = await chatResponse.json();
        console.log('🤖 LLM回答:', chatResult.response);
        
        return NextResponse.json({
          success: true,
          text: recognizedText,
          llmResponse: chatResult.response
        });
      } else {
        console.log('⚠️ LLM调用失败，仅返回识别文本');
        return NextResponse.json({
          success: true,
          text: recognizedText
        });
      }
    } catch (chatError) {
      console.error('🤖 LLM调用出错:', chatError);
      return NextResponse.json({
        success: true,
        text: recognizedText
      });
    }

  } catch (error) {
    console.error('💥 ASR处理出错:', error);
    return NextResponse.json({ 
      error: 'ASR处理失败',
      details: error instanceof Error ? error.message : '未知错误',
      success: false 
    }, { status: 500 });
  }
} 