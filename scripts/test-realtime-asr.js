// 测试实时语音识别 API
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : 'http://localhost:3000';

async function testRealtimeASR() {
  console.log('🎤 ===== 测试实时语音识别API =====\n');

  try {
    // 1. 测试启动实时识别会话
    console.log('🚀 步骤1: 启动实时识别会话...');
    
    const startResponse = await fetch(`${API_BASE}/api/realtime-asr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'start'
      })
    });

    const startResult = await startResponse.json();
    console.log('📊 启动响应:', startResult);

    if (!startResult.success) {
      throw new Error('启动实时识别会话失败: ' + startResult.error);
    }

    const sessionId = startResult.session_id;
    console.log('✅ 会话启动成功, Session ID:', sessionId);

    // 2. 测试发送模拟音频数据
    console.log('\n📤 步骤2: 发送模拟音频数据...');
    
    // 创建模拟的PCM音频数据 (16kHz, 16位, 单声道)
    const sampleRate = 16000;
    const duration = 1; // 1秒
    const samples = sampleRate * duration;
    const audioBuffer = new Int16Array(samples);
    
    // 生成一个简单的正弦波作为测试音频
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      audioBuffer[i] = Math.sin(2 * Math.PI * 440 * t) * 0x7FFF * 0.1; // 440Hz 正弦波
    }

    // 转换为base64
    const base64Audio = Buffer.from(audioBuffer.buffer).toString('base64');
    
    const audioResponse = await fetch(`${API_BASE}/api/realtime-asr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'send_audio',
        session_id: sessionId,
        audio_data: base64Audio
      })
    });

    const audioResult = await audioResponse.json();
    console.log('📊 音频发送响应:', audioResult);

    // 3. 测试停止识别会话
    console.log('\n🛑 步骤3: 停止实时识别会话...');
    
    const stopResponse = await fetch(`${API_BASE}/api/realtime-asr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'stop',
        session_id: sessionId
      })
    });

    const stopResult = await stopResponse.json();
    console.log('📊 停止响应:', stopResult);

    if (stopResult.success) {
      console.log('✅ 会话停止成功');
      if (stopResult.final_result) {
        console.log('🎯 最终识别结果:', stopResult.final_result);
      }
    }

    console.log('\n✨ 实时语音识别API测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📋 响应状态:', error.response.status);
      console.error('📋 响应数据:', await error.response.text());
    }
  }
}

async function testAPIAvailability() {
  console.log('🔍 检查API可用性...\n');
  
  try {
    // 检查环境变量
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.log('⚠️  警告: 未设置 DASHSCOPE_API_KEY 环境变量');
      console.log('💡 请在 .env.local 文件中设置或通过环境变量设置');
    } else {
      console.log('✅ DASHSCOPE_API_KEY 已设置:', apiKey.substring(0, 8) + '...');
    }

    // 测试基础网络连接
    console.log('🌐 测试网络连接...');
    const testResponse = await fetch('https://dashscope.aliyuncs.com', {
      method: 'HEAD'
    });
    
    if (testResponse.ok) {
      console.log('✅ 网络连接正常');
    } else {
      console.log('⚠️  网络连接可能有问题');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 实时语音识别测试工具\n');
  
  // 检查API可用性
  await testAPIAvailability();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试实时语音识别API
  await testRealtimeASR();
  
  console.log('\n🎯 测试完成! 您现在可以访问以下页面进行体验:');
  console.log('🔗 http://localhost:3000/realtime-asr');
  console.log('\n💡 使用说明:');
  console.log('1. 确保已安装依赖: npm install');
  console.log('2. 确保已配置API Key到 .env.local 文件');
  console.log('3. 启动开发服务器: npm run dev');
  console.log('4. 在浏览器中访问上述链接进行测试');
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testRealtimeASR,
  testAPIAvailability
}; 