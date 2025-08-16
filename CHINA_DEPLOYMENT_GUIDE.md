# 🇨🇳 中国大陆访问友好部署指南

## 📋 问题说明

Vercel的默认域名 `*.vercel.app` 在中国大陆经常无法访问，这是由于网络限制导致的。本指南提供多种解决方案。

## 🚀 解决方案

### 方案一：自定义域名（最佳）

#### 1. 购买域名
- **国内平台**：阿里云、腾讯云、华为云
- **国外平台**：Cloudflare、Namecheap、GoDaddy
- **推荐后缀**：`.com`、`.cn`、`.net`

#### 2. 配置Vercel自定义域名
```bash
# 1. 登录Vercel控制台
# 2. 项目设置 → Domains
# 3. 添加自定义域名
# 4. 配置DNS记录
```

#### 3. DNS配置示例
```dns
类型: CNAME
名称: www
值: cname.vercel-dns.com
TTL: 300

类型: A
名称: @
值: 76.76.19.61
TTL: 300
```

### 方案二：Netlify部署（推荐）

Netlify在中国的访问情况通常更好：

#### 1. 部署到Netlify
1. 访问 [netlify.com](https://netlify.com)
2. 使用GitHub账号登录
3. 选择您的仓库
4. 配置构建设置：
   ```
   Build command: npm run build
   Publish directory: .next
   ```

#### 2. 环境变量配置
在Netlify项目设置中添加：
```bash
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
```

#### 3. 域名访问
- 默认域名：`*.netlify.app`
- 可以绑定自定义域名

### 方案三：Railway部署

#### 1. 部署到Railway
1. 访问 [railway.app](https://railway.app)
2. 连接GitHub仓库
3. 自动部署

#### 2. 环境变量
```bash
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
PORT=3000
```

### 方案四：国内云服务

#### 1. 腾讯云Webify
- 支持静态网站托管
- 需要实名认证
- 域名需要备案

#### 2. 阿里云
- 函数计算 + 对象存储
- 需要备案域名
- 访问速度最快

## 📱 快速迁移到Netlify

已为您创建了 `netlify.toml` 配置文件，执行以下步骤：

### 1. 提交代码
```bash
git add netlify.toml
git commit -m "添加Netlify部署配置"
git push origin main
```

### 2. 部署到Netlify
1. 访问 [netlify.com](https://netlify.com)
2. 点击 "New site from Git"
3. 选择GitHub并授权
4. 选择您的仓库
5. 设置构建配置：
   - Build command: `npm run build`
   - Publish directory: `.next`
6. 添加环境变量：`DASHSCOPE_API_KEY`
7. 点击 "Deploy site"

### 3. 测试访问
- Netlify会提供形如 `*.netlify.app` 的域名
- 测试在中国的访问情况

## 🌍 访问测试工具

### 在线测试工具
- **17CE**: https://www.17ce.com/
- **站长工具**: http://ping.chinaz.com/
- **阿里云监控**: https://boce.aliyun.com/

### 本地测试
```bash
# 测试域名连通性
ping your-domain.com

# 测试DNS解析
nslookup your-domain.com

# 测试HTTP访问
curl -I https://your-domain.com
```

## 🔧 域名备案（可选）

如果使用国内云服务，需要进行域名备案：

### 备案流程
1. **购买国内服务器**（阿里云、腾讯云等）
2. **提交备案申请**
   - 个人备案：身份证、照片
   - 企业备案：营业执照、负责人信息
3. **等待审核**（通常10-20个工作日）
4. **备案完成**后可以正常访问

### 免备案选项
- 使用香港、海外服务器
- 使用CDN加速（如Cloudflare）
- 使用 `.com`、`.net` 等国际域名

## 📊 方案对比

| 方案 | 访问速度 | 稳定性 | 成本 | 复杂度 |
|------|---------|-------|------|--------|
| Vercel + 自定义域名 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 💰 | ⭐⭐ |
| Netlify | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 免费 | ⭐ |
| Railway | ⭐⭐⭐ | ⭐⭐⭐ | 💰 | ⭐⭐ |
| 国内云服务 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 💰💰 | ⭐⭐⭐ |

## 🎯 推荐方案

### 个人开发者
1. **Netlify**（免费且稳定）
2. **Vercel + 自定义域名**（功能最全）

### 企业用户
1. **国内云服务 + 备案域名**（最佳体验）
2. **Vercel/Netlify + 自定义域名**（快速上线）

## 🆘 常见问题

### Q: 为什么vercel.app无法访问？
A: 这是网络政策导致的，属于正常现象。

### Q: 自定义域名会影响功能吗？
A: 不会，所有功能都正常工作。

### Q: Netlify和Vercel有什么区别？
A: 功能类似，但Netlify在中国的访问情况通常更好。

### Q: 需要修改代码吗？
A: 不需要，代码完全兼容所有平台。

## 📞 技术支持

如果在部署过程中遇到问题：
1. 检查环境变量配置
2. 查看部署日志
3. 测试API连通性
4. 联系平台技术支持

---

选择最适合您的方案，祝您部署顺利！🎉 