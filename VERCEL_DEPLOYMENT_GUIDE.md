# 🚀 NOX AI 助手 - Vercel 部署指南

## 📋 部署前准备

### 1. **GitHub仓库准备**
```bash
# 初始化Git仓库（如果还没有）
git init
git add .
git commit -m "Initial commit: NOX AI Chat Assistant"

# 添加远程仓库并推送
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### 2. **移除敏感信息**
确保以下文件不会被推送到GitHub：
- `.env.local` （已在.gitignore中）
- `env.local.example` 中的真实API密钥

## 🔧 Vercel环境变量配置

在Vercel项目设置中，**必须配置**以下环境变量：

### **必需的环境变量**

#### 1. `DASHSCOPE_API_KEY`
- **用途**: 阿里百炼API密钥，用于聊天对话和语音合成
- **获取方式**: 
  1. 访问 [阿里百炼控制台](https://dashscope.aliyun.com/)
  2. 注册/登录阿里云账号
  3. 开通百炼服务
  4. 创建API Key
- **格式**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **示例**: `sk-01267fbd0c5a4f55ab3493e738245cde`

#### 2. `NEXT_PUBLIC_BASE_URL` (可选)
- **用途**: 应用的基础URL，用于客户端API请求
- **生产环境值**: `https://your-app-name.vercel.app`
- **开发环境值**: `http://localhost:3000`

### **可选的环境变量**

#### 1. `LLM_API_KEY` (备用)
- **用途**: 智谱AI GLM-4V API密钥（备用聊天服务）
- **获取方式**: [智谱AI开放平台](https://open.bigmodel.cn/)
- **格式**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🌐 Vercel部署步骤

### 1. **连接GitHub**
1. 登录 [Vercel](https://vercel.com/)
2. 点击 "New Project"
3. 选择你的GitHub仓库
4. 导入项目

### 2. **项目配置**
- **Framework Preset**: Next.js
- **Root Directory**: `./` (项目根目录)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. **环境变量设置**
在Vercel项目设置 → Environment Variables 中添加：

```bash
# 生产环境 (Production)
DASHSCOPE_API_KEY=sk-your-real-dashscope-api-key-here

# 预览环境 (Preview) - 可选
DASHSCOPE_API_KEY=sk-your-real-dashscope-api-key-here

# 开发环境 (Development) - 可选
DASHSCOPE_API_KEY=sk-your-real-dashscope-api-key-here
```

### 4. **域名配置**
- Vercel会自动分配域名: `your-project-name.vercel.app`
- 可以添加自定义域名（可选）

## 🔍 功能检查清单

部署完成后，请检查以下功能：

### ✅ **基础功能**
- [ ] 页面正常加载
- [ ] 聊天界面显示正常
- [ ] 可以发送文本消息
- [ ] AI回复正常

### ✅ **高级功能**
- [ ] 语音合成(TTS)功能
- [ ] 图片上传和分析
- [ ] 话题历史记录
- [ ] New Chat 功能
- [ ] 话题删除功能

### ✅ **性能检查**
- [ ] 首页加载速度 < 3秒
- [ ] API响应时间 < 10秒
- [ ] 移动端适配正常

## 🐛 常见问题与解决方案

### 1. **API调用失败**
**问题**: 聊天或TTS功能无响应
**解决方案**:
- 检查 `DASHSCOPE_API_KEY` 是否正确配置
- 确认API密钥有足够的调用额度
- 检查阿里云账户是否已开通相关服务

### 2. **环境变量未生效**
**问题**: 配置了环境变量但功能仍然异常
**解决方案**:
- 重新部署项目（Environment Variables → Redeploy）
- 确认变量名称完全正确（区分大小写）
- 检查变量值中没有多余的空格

### 3. **图片上传功能异常**
**问题**: 图片上传后无法分析
**解决方案**:
- 确认API密钥有多模态分析权限
- 检查图片格式是否支持（JPEG、PNG、GIF、WebP）
- 确认图片大小不超过限制

### 4. **语音合成失败**
**问题**: TTS功能无法正常工作
**解决方案**:
- 确认已开通CosyVoice语音合成服务
- 检查API调用额度是否充足
- 确认网络连接正常

## 📱 移动端优化

项目已针对移动端进行优化：
- 响应式设计适配各种屏幕尺寸
- 触摸友好的交互界面
- 移动端语音功能支持

## 🔒 安全最佳实践

1. **API密钥安全**:
   - 绝不在客户端代码中暴露API密钥
   - 定期轮换API密钥
   - 监控API使用情况

2. **访问控制**:
   - 可以通过Vercel的访问控制功能限制访问
   - 考虑添加简单的用户认证（如果需要）

3. **数据隐私**:
   - 聊天历史只在本地存储
   - 不会向第三方发送用户数据
   - 按IP地址隔离用户数据

## 🎯 性能优化建议

1. **缓存策略**:
   - 静态资源自动缓存
   - API响应可考虑适当缓存

2. **图片优化**:
   - 上传的图片会自动压缩
   - 支持多种格式的图片

3. **网络优化**:
   - 使用CDN加速静态资源
   - API请求超时时间已优化

## 📞 技术支持

如果在部署过程中遇到问题：

1. **检查Vercel部署日志**
2. **查看浏览器控制台错误**
3. **确认所有环境变量已正确配置**
4. **验证API密钥的有效性和权限**

## 🚀 部署完成！

部署成功后，你将拥有一个功能完整的AI聊天助手，包含：
- 🤖 智能对话
- 🎵 语音合成
- 🖼️ 图片分析
- 📚 话题管理
- 📱 移动端支持

享受你的NOX AI助手吧！🎉 