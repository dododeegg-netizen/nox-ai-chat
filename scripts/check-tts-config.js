#!/usr/bin/env node

/**
 * NOX AI - Qwen-TTS配置检查工具
 * 
 * 检查Qwen-TTS语音合成服务的配置状态
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NOX AI - Qwen-TTS配置检查工具\n');

// 1. 检查环境变量配置
console.log('📋 1. 检查环境变量配置...');
const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
    console.log('✅ .env.local 文件存在');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasApiKey = envContent.includes('DASHSCOPE_API_KEY');
    
    if (hasApiKey) {
        console.log('✅ DASHSCOPE_API_KEY 已配置');
    } else {
        console.log('❌ DASHSCOPE_API_KEY 未配置');
        console.log('💡 请在 .env.local 文件中添加: DASHSCOPE_API_KEY=your-api-key');
    }
} else {
    console.log('❌ .env.local 文件不存在');
    console.log('💡 请创建 .env.local 文件并添加 DASHSCOPE_API_KEY');
}

// 2. 检查样音文件（虽然Qwen-TTS不需要，但保留兼容性）
console.log('\n📋 2. 检查样音文件...');
const voiceSamplesDir = path.join(process.cwd(), 'voice-samples');

if (fs.existsSync(voiceSamplesDir)) {
    console.log('✅ voice-samples 目录存在');
    
    const files = fs.readdirSync(voiceSamplesDir);
    const audioFiles = files.filter(file => 
        /\.(wav|mp3|flac|m4a)$/i.test(file)
    );
    
    if (audioFiles.length > 0) {
        audioFiles.forEach(file => {
            const filePath = path.join(voiceSamplesDir, file);
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`   - ${file} (${sizeKB} KB)`);
        });
        
        // 检查默认样音文件
        const defaultSample = 'longxiaochun-utt3-0.wav';
        if (audioFiles.includes(defaultSample)) {
            console.log(`✅ 默认样音文件存在 (${defaultSample})`);
        } else {
            console.log('⚠️  默认样音文件不存在，但Qwen-TTS使用预设音色，无需样音文件');
        }
    } else {
        console.log('⚠️  voice-samples 目录为空，但Qwen-TTS使用预设音色，无需样音文件');
    }
} else {
    console.log('⚠️  voice-samples 目录不存在，但Qwen-TTS使用预设音色，无需样音文件');
}

// 3. 检查API连接
console.log('\n📋 3. 检查API连接...');

async function checkAPI() {
    try {
        // 检查开发服务器是否运行
        const response = await fetch('http://localhost:3000/api/tts', {
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 本地开发服务器运行正常');
            console.log(`   - 模型: ${data.model || 'qwen-tts'}`);
            console.log(`   - 默认音色: ${data.defaultVoice || 'Cherry'}`);
            console.log(`   - 支持格式: ${(data.supportedFormats || []).join(', ')}`);
            console.log(`   - 可用音色数量: ${Object.keys(data.voices || {}).length}`);
            
            if (data.voices && Object.keys(data.voices).length > 0) {
                console.log('   - 可用音色:');
                Object.entries(data.voices).forEach(([voice, desc]) => {
                    console.log(`     * ${voice}: ${desc}`);
                });
            }
            
        } else {
            console.log(`❌ API响应异常: ${response.status}`);
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ 本地开发服务器未启动');
            console.log('💡 请运行: npm run dev');
        } else {
            console.log(`❌ API连接失败: ${error.message}`);
        }
    }
}

// 运行API检查
checkAPI().then(() => {
    console.log('\n📊 诊断报告:');
    console.log('================');
    
    // 环境变量检查结果
    const envExists = fs.existsSync(envPath);
    const hasApiKey = envExists && fs.readFileSync(envPath, 'utf8').includes('DASHSCOPE_API_KEY');
    
    console.log(`环境变量配置: ${hasApiKey ? '✅ 正常' : '❌ 需要配置'}`);
    
    // 样音文件检查结果（对Qwen-TTS不重要）
    const voiceSamplesExists = fs.existsSync(voiceSamplesDir);
    console.log(`样音文件: ${voiceSamplesExists ? '✅ 正常' : '⚠️  可选（Qwen-TTS使用预设音色）'}`);
    
    console.log('API连接: ⏳ 请查看上方检查结果');
    
    if (hasApiKey) {
        console.log('\n🎉 配置检查通过！');
        console.log('💡 建议测试步骤:');
        console.log('   1. 访问 http://localhost:3000/tts-debug.html');
        console.log('   2. 点击"检查API状态"按钮');
        console.log('   3. 选择音色并输入文本测试语音合成');
        console.log('\n🎵 Qwen-TTS支持的音色:');
        console.log('   - Cherry: 温婉女声(中英双语)');
        console.log('   - Ethan: 稳重男声(中英双语)');
        console.log('   - Chelsie: 活力女声(中英双语)');
        console.log('   - Serena: 优雅女声(中英双语)');
        console.log('   - Dylan: 北京话男声');
        console.log('   - Jada: 上海话女声');
        console.log('   - Sunny: 四川话女声');
    } else {
        console.log('\n❌ 配置不完整');
        console.log('💡 请完成以下步骤:');
        console.log('   1. 创建 .env.local 文件');
        console.log('   2. 添加 DASHSCOPE_API_KEY=your-api-key');
        console.log('   3. 重启开发服务器: npm run dev');
    }
}).catch(error => {
    console.error('💥 配置检查过程中发生错误:', error.message);
}); 