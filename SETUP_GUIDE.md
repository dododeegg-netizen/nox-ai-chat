# NOX AI助手 - CosyVoice语音合成设置指南

## 🚀 快速开始

### 1. 环境变量配置

请创建 `.env.local` 文件（复制 `env.example`），并配置以下环境变量：

```bash
# 复制示例文件
cp env.example .env.local

# 编辑环境变量
# LLM API Configuration
LLM_API_KEY=sk-your-glm-4v-api-key-here

# 阿里百炼 API Key（用于TTS语音合成）
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
```

### 2. 获取API密钥

#### 阿里百炼CosyVoice API密钥
1. 访问 [阿里百炼控制台](https://dashscope.aliyun.com/)
2. 注册/登录阿里云账号
3. 开通百炼服务
4. 在API-KEY管理页面创建新的API Key
5. 将密钥复制到 `DASHSCOPE_API_KEY` 环境变量

#### 智谱AI GLM-4V API密钥（可选）
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 创建API Key
4. 将密钥复制到 `LLM_API_KEY` 环境变量

### 3. 样音文件准备

将您的样音文件放置在 `public/voice-samples/` 目录下：

```bash
# 示例：将样音文件复制到指定目录
cp your-voice-sample.wav public/voice-samples/
```

**支持的音频格式：**
- MP3 (.mp3)
- WAV (.wav) 
- FLAC (.flac)
- M4A (.m4a)

**样音要求：**
- 文件大小：不超过10MB
- 时长：建议3-30秒
- 质量：清晰无噪音，包含完整句子

### 4. 启动应用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

应用将在 http://localhost:3000 或下一个可用端口启动。

## 🎵 使用CosyVoice语音合成

### 前端使用方法

1. **在聊天界面输入文本**
2. **点击语音播放按钮** 🔊
3. **系统会自动：**
   - 首先尝试使用CosyVoice API
   - 如果检测到样音文件，会使用语音克隆
   - 如果API失败，会降级使用浏览器TTS

### API直接调用

```bash
# 使用样音克隆
curl -X POST http://localhost:3000/api/tts \
  -F "text=你好，这是语音克隆测试" \
  -F "sampleAudio=@public/voice-samples/your-voice.wav" \
  -F "format=mp3"

# 使用预设音色
curl -X POST http://localhost:3000/api/tts \
  -F "text=你好，这是预设音色测试" \
  -F "voice=longwan" \
  -F "format=mp3"
```

## 🔧 故障排除

### API密钥配置问题

**错误信息：** "未配置DASHSCOPE_API_KEY"

**解决方案：**
1. 确认 `.env.local` 文件存在
2. 检查 `DASHSCOPE_API_KEY` 是否正确配置
3. 重启开发服务器

### 样音文件问题

**错误信息：** "样音文件不存在"

**解决方案：**
1. 确认文件路径：`public/voice-samples/longxiaochun-utt3-0.wav`
2. 检查文件权限
3. 确认文件格式正确

### API调用失败

**常见错误：**
- `400 Bad Request`: 检查请求参数
- `401 Unauthorized`: 检查API密钥
- `500 Internal Server Error`: 查看服务器日志

**调试方法：**
```bash
# 查看详细日志
npm run dev

# 测试API连通性
node test-cosyvoice.js
```

## 📝 配置示例

### 完整的.env.local示例

```bash
# LLM API Configuration
LLM_API_KEY=sk-1234567890abcdef1234567890abcdef

# 阿里百炼 API Key（用于TTS语音合成）
DASHSCOPE_API_KEY=sk-abcdef1234567890abcdef1234567890

# Application Configuration (可选)
NEXT_PUBLIC_APP_NAME=NOX AI Assistant
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 预设音色选项

- **longwan**: 温婉女声
- **longxiaochun**: 中性青年音
- **longjing**: 稳重男声
- **longwan_emo**: 情感女声
- **longyue**: 活力女声

## 🎯 最佳实践

1. **样音质量**
   - 使用清晰、无背景噪音的录音
   - 包含完整的句子而非单个词汇
   - 体现说话人的典型音色特征

2. **API调用优化**
   - 缓存常用音频结果
   - 使用适当的音频格式和采样率
   - 实现降级方案（浏览器TTS）

3. **用户体验**
   - 提供加载状态指示
   - 支持音频播放控制
   - 优雅处理错误情况

## 📞 获取支持

如果遇到问题，请：

1. 查看详细的错误日志
2. 确认所有配置步骤都已完成
3. 参考API文档和示例代码
4. 检查网络连接和API配额

---

🎉 **恭喜！您现在已经可以使用强大的CosyVoice语音合成功能了！** 