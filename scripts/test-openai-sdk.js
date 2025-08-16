// 测试 OpenAI SDK 调用阿里云百炼 API
const { OpenAI } = require('openai');

// 初始化 OpenAI 客户端，配置为阿里云百炼的端点
const client = new OpenAI({
  // 阿里云百炼兼容 OpenAI 的 API 端点
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  // 使用您的 DashScope API Key
  apiKey: process.env.DASHSCOPE_API_KEY || 'sk-01267fbd0c5a4f55ab3493e738245cde',
});

async function testChatCompletion() {
  try {
    console.log('🔄 正在测试 OpenAI SDK 调用阿里云百炼 Chat API...');
    
    const response = await client.chat.completions.create({
      model: 'qwen-turbo', // 使用通义千问模型
      messages: [
        { role: 'user', content: '你好，请介绍一下你自己' }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    console.log('✅ Chat API 调用成功!');
    console.log('📝 回复内容:', response.choices[0].message.content);
    console.log('📊 使用模型:', response.model);
    console.log('🔍 完整响应:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('❌ Chat API 调用失败:', error.message);
    if (error.response) {
      console.error('📋 响应状态:', error.response.status);
      console.error('📋 响应数据:', error.response.data);
    }
  }
}

async function testTTS() {
  try {
    console.log('\n🔄 正在测试语音合成 API...');
    
    // 注意：OpenAI SDK 的 TTS API 可能与阿里云百炼的格式不完全一致
    // 这里我们测试基本的 HTTP 请求
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY || 'sk-01267fbd0c5a4f55ab3493e738245cde'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cosyvoice-v1',
        input: {
          text: '你好，这是一个语音合成测试'
        },
        parameters: {
          voice: 'longxiaochun'
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ TTS API 调用成功!');
      console.log('📊 响应数据:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ TTS API 调用失败:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ TTS API 调用异常:', error.message);
  }
}

async function main() {
  console.log('🚀 开始测试 OpenAI SDK 与阿里云百炼的兼容性...\n');
  
  // 检查 API Key
  const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-01267fbd0c5a4f55ab3493e738245cde';
  console.log('🔑 使用的 API Key:', apiKey.substring(0, 8) + '...');
  
  // 测试聊天完成
  await testChatCompletion();
  
  // 测试语音合成
  await testTTS();
  
  console.log('\n✨ 测试完成!');
}

// 运行测试
main().catch(console.error); 