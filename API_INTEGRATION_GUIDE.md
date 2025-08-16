# 🤖 NOX AI - 阿里百炼集成指南

## 📋 概述

NOX AI 已成功集成阿里百炼的通义千问VL-Max模型，支持以下功能：

- 📝 **文本聊天**: 使用 `qwen-plus` 模型进行智能对话
- 🖼️ **图片识别**: 使用 `qwen-vl-max` 模型进行图像理解与分析

## 🚀 快速开始

### 1. 启动应用
```bash
npm run dev
```

### 2. 访问应用
- **主应用**: http://localhost:3000
- **API测试页面**: http://localhost:3000/test-api.html

## 🔧 API配置

### 当前配置
- **API端点**: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- **API密钥**: `sk-01267fbd0c5a4f55ab3493e738245cde`
- **文本模型**: `qwen-plus`
- **视觉模型**: `qwen-vl-max`

### 环境变量配置（可选）
您可以通过环境变量来配置API：

```bash
# .env.local
DASHSCOPE_API_KEY=your-api-key-here
DASHSCOPE_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

## 📱 功能使用

### 文本聊天
1. 在主界面选择"文本输入"模式
2. 输入您的问题
3. 点击发送或按Enter键
4. AI将使用通义千问Plus模型回复

### 图片识别
1. 点击相机图标或选择文件上传
2. 选择要分析的图片
3. 可选：输入对图片的具体问题
4. AI将使用通义千问VL-Max模型分析图片

## 🔍 API测试

访问 `http://localhost:3000/test-api.html` 进行详细的API测试：

### 可用测试
- ✅ 文本聊天API测试
- ✅ 图片识别API测试  
- ✅ API状态检查

## 📊 API响应格式

### 成功响应
```json
{
  "success": true,
  "response": "AI的回复内容",
  "hasAudio": true,
  "model": "qwen-plus" // 或 "qwen-vl-max"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "response": "用户友好的错误信息"
}
```

## 🛠️ 技术实现

### API路由 (`app/api/chat/route.ts`)
- 处理文本和图片请求
- 自动选择合适的模型
- 错误处理和日志记录

### 前端集成 (`app/page.tsx`)
- React组件处理用户交互
- 图片base64编码
- 实时响应显示

## 🔐 安全考虑

1. **API密钥保护**: 密钥存储在服务端，不暴露给客户端
2. **请求验证**: 服务端验证所有传入请求
3. **错误处理**: 避免敏感信息泄露

## 📈 性能优化

- **智能模型选择**: 文本使用轻量模型，图片使用视觉模型
- **请求缓存**: 避免重复API调用
- **错误重试**: 网络异常时的重试机制

## 🐛 故障排除

### 常见问题

1. **API调用失败**
   - 检查网络连接
   - 验证API密钥是否正确
   - 查看控制台错误日志

2. **图片上传失败**
   - 确保图片格式支持（JPG, PNG, GIF等）
   - 检查图片大小限制
   - 验证base64编码是否正确

3. **响应缓慢**
   - 检查网络状况
   - 阿里百炼服务器可能有延迟
   - 考虑使用更轻量的模型

### 调试步骤

1. 打开浏览器开发者工具
2. 查看Console标签页的错误信息
3. 检查Network标签页的API请求
4. 使用测试页面验证API功能

## 📝 更新日志

### v1.0.0 - 阿里百炼集成
- ✅ 集成通义千问Plus文本模型
- ✅ 集成通义千问VL-Max视觉模型
- ✅ 添加API测试页面
- ✅ 完善错误处理机制
- ✅ 优化用户体验

## 📞 技术支持

如遇到问题，请检查：
1. 控制台错误日志
2. API测试页面的详细错误信息
3. 网络连接状态
4. API密钥是否有效

---

🎉 **恭喜！您的NOX AI应用现在已经成功集成了阿里百炼的强大AI能力！** 