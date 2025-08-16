# 🚀 NOX AI 项目设置指南

## 📦 1. 安装 OpenAI SDK

已经将 OpenAI SDK 添加到 package.json 中，请运行以下命令安装依赖：

```bash
npm install
```

如果安装失败，可以配置国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com/
npm install
```

## 🔑 2. 配置 API Key

### 方法1: 创建 .env.local 文件（推荐）
在项目根目录创建 `.env.local` 文件，添加以下内容：

```env
DASHSCOPE_API_KEY=sk-01267fbd0c5a4f55ab3493e738245cde
```

### 方法2: 设置环境变量
Windows PowerShell:
```powershell
$env:DASHSCOPE_API_KEY="sk-01267fbd0c5a4f55ab3493e738245cde"
```

## 🧪 3. 测试安装

### 测试 OpenAI SDK 兼容性
```bash
npm run test-openai
```

### 测试语音合成配置
```bash
npm run check-tts
```

### 测试实时语音识别
```bash
npm run test-realtime-asr
```

### 启动开发服务器
```bash
npm run dev
```

## 📋 4. API 使用示例

### Chat 对话 (兼容 OpenAI 格式)
```javascript
import { OpenAI } from 'openai';

const client = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
});

const response = await client.chat.completions.create({
  model: 'qwen-turbo',
  messages: [{ role: 'user', content: '你好' }],
});
```

### 语音合成 (DashScope 原生格式)
```javascript
const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'cosyvoice-v1',
    input: { text: '要合成的文本' },
    parameters: { voice: 'longxiaochun' }
  })
});
```

## 🎯 5. 下一步

配置完成后，您可以：
1. 测试现有的语音合成功能
2. 体验 **Paraformer 实时语音识别** - 访问 `/realtime-asr` 页面
3. 测试 OpenAI SDK 兼容性调用
4. 集成新的 API 格式到前端组件

### 🎤 新功能: Paraformer 实时语音识别

**访问地址:** `http://localhost:3000/realtime-asr`

**功能特点:**
- ✨ **边说边出文字** - 真正的实时语音识别
- 🎯 **部分与最终结果** - 蓝色临时结果，黑色确认结果  
- 📊 **音频电平监控** - 实时显示麦克风音量
- 🔧 **基于 Paraformer-realtime-v2** - 阿里云最新实时识别模型

## ⚠️ 注意事项

- API Key 请妥善保管，不要提交到代码仓库
- `.env.local` 文件已在 `.gitignore` 中排除
- 确保账户有足够的调用额度
- 新用户通常有免费试用额度 