# 🚀 NOX AI 快速部署指南

## 📋 部署步骤总览

### 1. **准备代码**
```bash
# 确保所有更改已保存
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. **在Vercel部署**

#### 步骤1: 登录Vercel
访问 [vercel.com](https://vercel.com) 并登录

#### 步骤2: 导入项目
- 点击 "New Project"
- 选择你的GitHub仓库
- 点击 "Import"

#### 步骤3: 配置项目
- Framework Preset: **Next.js** (自动检测)
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### 步骤4: 添加环境变量
在项目设置中添加：

```
DASHSCOPE_API_KEY = sk-your-real-api-key-here
```

#### 步骤5: 部署
点击 "Deploy" 按钮开始部署

### 3. **验证部署**

部署完成后访问分配的URL，检查：
- [ ] 页面正常加载
- [ ] 聊天功能正常
- [ ] 语音合成工作
- [ ] 图片上传功能
- [ ] 话题管理功能

## 🔧 环境变量详情

### **必需配置**
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DASHSCOPE_API_KEY` | `sk-xxxxx` | 阿里百炼API密钥 |

### **可选配置**
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `LLM_API_KEY` | `sk-xxxxx` | 智谱AI API密钥 |

## 🎯 获取API密钥

### 阿里百炼API密钥
1. 访问 [https://dashscope.aliyun.com/](https://dashscope.aliyun.com/)
2. 注册并登录阿里云账号
3. 开通百炼服务（有免费额度）
4. 进入"API-KEY管理"
5. 创建新的API Key
6. 复制密钥（格式：`sk-xxxxxxxx...`）

## 🚨 注意事项

1. **API密钥安全**
   - 绝不在客户端代码中暴露API密钥
   - 只在Vercel环境变量中配置
   - 定期轮换密钥

2. **费用控制**
   - 阿里百炼新用户有免费额度
   - 监控API使用量避免超额
   - 设置合理的使用限制

3. **功能验证**
   - 部署后务必测试所有功能
   - 检查移动端适配
   - 验证图片上传限制

## 📱 域名配置

Vercel会自动分配域名：
- 主域名：`your-project-name.vercel.app`
- 可添加自定义域名

## 🔄 持续部署

配置完成后，每次推送到main分支都会自动触发部署：

```bash
git add .
git commit -m "Update features"
git push origin main
# Vercel会自动部署新版本
```

## ✅ 部署完成！

恭喜！您的NOX AI助手已成功部署到生产环境。

🌐 **访问地址**: `https://your-project-name.vercel.app`

享受您的AI助手吧！🎉 