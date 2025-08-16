# 🌙 NOX AI 助手

一个功能强大的AI聊天助手，集成了智能对话、语音合成、图片分析和话题管理功能。

## ✨ 主要功能

### 🤖 **智能对话**
- 基于阿里百炼通义千问大模型
- 支持多轮对话，保持上下文
- 智能响应，理解自然语言

### 🎵 **语音合成**
- 集成CosyVoice语音合成技术
- 多种音色选择
- 高质量语音输出

### 🖼️ **图片分析**
- 支持图片上传和分析
- 多模态AI理解图片内容
- 支持JPEG、PNG、GIF、WebP格式

### 📚 **话题管理**
- 自动保存聊天话题
- 话题历史记录查看
- 点击话题继续聊天
- 话题删除和管理

### 📱 **移动端优化**
- 响应式设计
- 触摸友好界面
- 移动端完美适配

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/nox-ai-assistant.git
cd nox-ai-assistant
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制环境变量模板：
```bash
cp env.example .env.local
```

编辑 `.env.local` 文件，添加你的API密钥：
```bash
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 🔧 环境变量配置

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | ✅ | 阿里百炼API密钥，用于聊天和语音合成 |
| `LLM_API_KEY` | ❌ | 智谱AI API密钥（备用） |

### 获取API密钥

#### 阿里百炼API密钥
1. 访问 [阿里百炼控制台](https://dashscope.aliyun.com/)
2. 注册/登录阿里云账号
3. 开通百炼服务
4. 创建API Key

## 📦 技术栈

- **前端框架**: Next.js 13 (App Router)
- **UI框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **AI模型**: 阿里百炼通义千问
- **语音合成**: CosyVoice
- **部署**: Vercel

## 🌐 部署到Vercel

详细部署指南请查看 [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

### 快速部署
1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量 `DASHSCOPE_API_KEY`
4. 部署完成！

## 📁 项目结构

```
nox-ai-assistant/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── chat/          # 聊天API
│   │   ├── tts/           # 语音合成API
│   │   ├── topics/        # 话题管理API
│   │   └── get-ip/        # IP获取API
│   ├── page.tsx           # 主页面
│   └── layout.tsx         # 根布局
├── public/                # 静态资源
│   └── logo.png          # 应用Logo
├── data/                  # 数据存储
│   └── history/          # 聊天历史
└── docs/                  # 文档
```

## 🎯 使用指南

### 基础聊天
1. 在输入框中输入问题
2. 点击发送或按Enter键
3. AI会智能回复您的问题

### 图片分析
1. 点击📎图标选择图片
2. 输入相关问题
3. AI会分析图片内容并回答

### 语音功能
1. AI回复后点击🔊图标
2. 系统会自动播放语音
3. 支持多种音色选择

### 话题管理
1. 聊天后点击"New Chat"保存当前话题
2. 点击"History"查看历史话题
3. 点击任意话题继续之前的聊天

## 🐛 故障排除

### 常见问题

1. **API调用失败**
   - 检查API密钥是否正确
   - 确认账户余额充足
   - 检查网络连接

2. **语音合成不工作**
   - 确认已开通CosyVoice服务
   - 检查浏览器音频权限
   - 尝试刷新页面

3. **图片上传失败**
   - 检查图片格式是否支持
   - 确认文件大小不超过限制
   - 尝试使用其他图片

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如果您遇到问题或有建议，请创建Issue。 