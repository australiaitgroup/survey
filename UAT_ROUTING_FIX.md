# UAT Assessment 路由问题修复方案

## 🎯 问题根因

通过代码分析发现，问题**不是nginx配置**，而是**Express路由优先级**问题：

1. **多租户API路由已正确配置** - 在server.js中第65-69行
2. **本地环境工作正常** - 多租户API返回正确JSON
3. **UAT环境返回HTML** - 说明catch-all路由拦截了多租户API请求

## 🔧 修复方案

### 第一步：更新UAT环境代码

确保UAT环境的代码是最新版本，包含以下修复：

**文件：`server.js`第151-155行**
```javascript
// Handle React routing, return all requests to React app  
// IMPORTANT: This catch-all route catches non-API routes for SPA routing
app.get('*', (req, res) => {
	// This should only catch frontend routes, API routes are already handled above
	res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});
```

### 第二步：前端Debug功能

已添加全面的前端debug功能：

**自动启用条件：**
- URL包含`?debug`参数
- hostname包含`localhost` 
- hostname包含`uat`

**Debug信息包括：**
- API请求URL和参数
- 响应状态和数据
- 错误详情
- 类型检查结果
- 用户环境信息

## 🚀 部署验证步骤

### 1. 部署最新代码到UAT
```bash
# 确保UAT环境获取最新代码
git pull origin main
npm install
npm run build

# 重启应用
pm2 restart sigmaq-uat
# 或
sudo systemctl restart sigmaq-uat
```

### 2. 验证多租户API
```bash
# 测试多租户API (应该返回JSON)
curl -H "Accept: application/json" https://uat.sigmaq.co/jobpin/api/assessment/ta

# 测试全局API (作为对比)  
curl -H "Accept: application/json" https://uat.sigmaq.co/api/assessment/ta
```

### 3. 前端Debug测试
访问: `https://uat.sigmaq.co/jobpin/assessment/dafdf?debug`

预期看到：
- 错误页面下方显示debug信息面板
- 详细的API请求/响应信息
- 具体的错误原因诊断

## 🔍 使用Debug功能排查

### URL格式
- 基础访问: `https://uat.sigmaq.co/jobpin/assessment/slug`
- Debug模式: `https://uat.sigmaq.co/jobpin/assessment/slug?debug`

### Debug信息解读

**如果看到 "API returned HTML instead of JSON":**
- 表明路由配置问题，API请求被静态文件服务拦截

**如果看到 "Survey type mismatch":**
- 表明API正常工作，但survey类型不正确
- 检查数据库中survey的type字段

**如果看到 "Assessment not found":**
- 检查company slug和survey slug是否匹配
- 检查数据库中是否有对应的数据

## 📊 常见问题排查

### 问题1: 多租户API返回HTML
**原因**: catch-all路由优先级过高  
**解决**: 更新server.js路由配置

### 问题2: Survey类型错误
**原因**: 数据库中survey.type不是'assessment'  
**解决**: 运行数据库迁移或手动修复数据

### 问题3: Company/Survey不存在
**原因**: 数据未正确迁移到多租户结构  
**解决**: 运行多租户迁移脚本

## 💡 临时解决方案

如果UAT部署有问题，可以临时修改前端API路径：

**文件：`client/src/TakeAssessment.tsx`第44-46行**
```typescript
const getApiPath = (path: string) => {
	// 临时使用全局API
	return `/api${path}`;
	// 原来是: return companySlug ? `/${companySlug}/api${path}` : `/api${path}`;
};
```

⚠️ **注意**: 这只是临时方案，会失去多租户功能。

## 🎉 验证成功标志

修复成功后，以下测试应该通过：

1. ✅ `curl https://uat.sigmaq.co/jobpin/api/assessment/ta` 返回JSON
2. ✅ `https://uat.sigmaq.co/jobpin/assessment/ta` 页面正常加载
3. ✅ Debug页面显示详细诊断信息
4. ✅ 不同公司的相同slug可以正常访问

部署后运行`node debug_uat_assessment.js`进行完整验证。