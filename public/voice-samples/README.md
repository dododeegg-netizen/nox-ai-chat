# 样音文件使用指南

## 📁 目录说明

这个目录用于存放语音合成的样音文件，支持阿里百炼CosyVoice的零样本语音克隆功能。

## 🎵 支持的音频格式

- **MP3** (.mp3) - 推荐使用
- **WAV** (.wav) - 高质量音频
- **FLAC** (.flac) - 无损音频格式
- **M4A** (.m4a) - Apple音频格式

## 📏 文件要求

- **最大文件大小**: 10MB
- **推荐时长**: 3-30秒
- **音质要求**: 清晰、无噪音
- **内容建议**: 包含目标说话人的多种语调和情感

## 🎯 最佳实践

### 样音质量要求
1. **清晰度**: 音频清晰，无背景噪音
2. **时长**: 建议3-30秒，包含完整的句子
3. **音色**: 目标说话人的典型音色特征
4. **情感**: 包含不同的语调和情感变化

### 录制建议
- 使用质量较好的麦克风
- 在安静的环境中录制
- 保持正常的说话速度和音量
- 避免回音和杂音

## 🔧 使用方法

### 1. 上传样音文件
```bash
# 通过API上传
curl -X POST http://localhost:3000/api/voice-samples \
  -F "file=@your-voice-sample.mp3" \
  -F "name=sample_name"
```

### 2. 使用样音进行TTS
```bash
# 通过API使用样音克隆
curl -X POST http://localhost:3000/api/tts \
  -F "text=要合成的文本" \
  -F "sampleAudio=@your-voice-sample.mp3" \
  -F "format=mp3"
```

### 3. 管理样音文件
```bash
# 查看所有样音文件
curl http://localhost:3000/api/voice-samples

# 删除样音文件
curl -X DELETE "http://localhost:3000/api/voice-samples?filename=sample.mp3"
```

## 🎨 预设音色

如果不使用自定义样音，系统提供以下预设音色：

- **longwan**: 温婉女声
- **longxiaochun**: 中性青年音
- **longjing**: 稳重男声  
- **longwan_emo**: 情感女声
- **longyue**: 活力女声

## 📝 示例

### 好的样音示例
- "你好，我是小明，今天天气不错，心情也很好。"
- "欢迎来到我们的节目，希望大家喜欢今天的内容。"

### 避免的样音内容
- 过短的单词或感叹词
- 有明显噪音的录音
- 说话过快或过慢
- 音量过小或过大

## ⚠️ 注意事项

1. **版权声明**: 请确保使用的样音文件具有合法的使用权限
2. **隐私保护**: 不要上传包含敏感信息的音频文件
3. **文件安全**: 系统会自动重命名文件以确保安全性
4. **存储限制**: 定期清理不需要的样音文件

## 🔗 相关链接

- [阿里百炼CosyVoice文档](https://help.aliyun.com/zh/dashscope/developer-reference/cosyvoice-quick-start)
- [语音合成最佳实践](https://help.aliyun.com/zh/dashscope/use-cases/voice-cloning) 