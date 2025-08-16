/**
 * IP历史记录功能测试脚本
 * 测试基于IP地址的聊天记录存储和检索功能
 */

const BASE_URL = 'http://localhost:3000';

async function testIPHistory() {
  console.log('🧪 开始测试IP历史记录功能\n');

  try {
    // 1. 测试获取IP地址
    console.log('1️⃣ 测试获取IP地址...');
    const ipResponse = await fetch(`${BASE_URL}/api/get-ip`);
    const ipData = await ipResponse.json();
    console.log('✅ IP数据:', ipData);
    
    if (!ipData.success) {
      throw new Error('获取IP失败');
    }

    const testIP = ipData.ip;
    console.log(`🌍 测试IP: ${testIP}\n`);

    // 2. 测试保存历史记录
    console.log('2️⃣ 测试保存历史记录...');
    const testMessages = [
      {
        id: '1',
        type: 'user',
        content: '你好，NOX！',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'ai',
        content: '你好！我是NOX，很高兴为你服务！',
        timestamp: new Date().toISOString()
      }
    ];

    const saveResponse = await fetch(`${BASE_URL}/api/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: testIP,
        messages: testMessages
      }),
    });

    const saveData = await saveResponse.json();
    console.log('✅ 保存结果:', saveData);

    if (!saveData.success) {
      throw new Error('保存历史记录失败');
    }
    console.log(`💾 已保存 ${saveData.saved} 条消息\n`);

    // 3. 测试获取历史记录
    console.log('3️⃣ 测试获取历史记录...');
    const getResponse = await fetch(`${BASE_URL}/api/history?ip=${testIP}`);
    const getData = await getResponse.json();
    console.log('✅ 获取结果:', getData);

    if (!getData.success) {
      throw new Error('获取历史记录失败');
    }
    console.log(`📖 获取到 ${getData.total} 条历史消息\n`);

    // 4. 测试管理员概览
    console.log('4️⃣ 测试管理员概览...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/history`);
    const adminData = await adminResponse.json();
    console.log('✅ 管理员数据:', adminData);

    if (!adminData.success) {
      throw new Error('获取管理员概览失败');
    }
    console.log(`📊 发现 ${adminData.total} 个IP的历史记录\n`);

    // 5. 测试清空历史记录
    console.log('5️⃣ 测试清空历史记录...');
    const clearResponse = await fetch(`${BASE_URL}/api/history?ip=${testIP}`, {
      method: 'DELETE',
    });
    const clearData = await clearResponse.json();
    console.log('✅ 清空结果:', clearData);

    if (!clearData.success) {
      throw new Error('清空历史记录失败');
    }
    console.log(`🗑️ 已清空IP ${clearData.ip} 的历史记录\n`);

    // 6. 验证清空效果
    console.log('6️⃣ 验证清空效果...');
    const verifyResponse = await fetch(`${BASE_URL}/api/history?ip=${testIP}`);
    const verifyData = await verifyResponse.json();
    console.log('✅ 验证结果:', verifyData);

    if (verifyData.total === 0) {
      console.log('🎉 清空验证成功！历史记录已完全清除\n');
    } else {
      console.log('⚠️ 清空验证失败，仍有历史记录存在\n');
    }

    console.log('🎊 所有测试完成！IP历史记录功能正常工作');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testIPHistory();
}

module.exports = { testIPHistory }; 