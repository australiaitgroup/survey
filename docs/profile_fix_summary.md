# Profile Details显示问题修复

## 问题描述

用户完成注册后，在Profile Settings里的Profile Details中的name和email没有按照注册时的信息显示出来。

## 根本原因分析

**问题出现在后端 `routes/admin.js` 的 `/admin/profile` 接口：**

### 原始问题代码 (第1534行)

```javascript
// 错误：查找任意一个admin用户，而不是当前登录用户
let adminUser = await User.findOne({ role: 'admin' }).populate('companyId');
```

**问题分析：**

1. `User.findOne({ role: 'admin' })` 会返回数据库中**第一个**admin用户
2. 不管当前登录的是哪个用户，都会返回同一个用户的信息
3. 如果有多个注册用户，后注册的用户看到的会是第一个用户的信息

### 修复后的代码

```javascript
// 修复：根据JWT token中的用户ID查找正确的用户
let adminUser = null;

if (req.user.id && req.user.id !== 'admin') {
	// 对于注册用户：使用JWT token中的用户ID查找
	adminUser = await User.findById(req.user.id).populate('companyId');
} else {
	// 对于旧版admin：保持原有逻辑作为后备
	adminUser = await User.findOne({ role: 'admin' }).populate('companyId');
}
```

## 修复逻辑

### 1. JWT Token验证

- 检查 `req.user.id`（来自JWT middleware `jwtAuth`）
- 如果是有效的用户ID且不是旧版'admin'，使用该ID查找用户

### 2. 用户查找优先级

1. **注册用户**：使用 `User.findById(req.user.id)` 查找具体用户
2. **旧版admin**：使用 `User.findOne({ role: 'admin' })` 作为后备

### 3. 向后兼容

- 保持对旧版环境变量admin账户的支持
- 不破坏现有的admin功能

## 修复验证

### 自动化测试（容器启动中）

```bash
node test_profile_display.js
```

### 手动测试步骤

#### 步骤1：注册新用户

1. 访问：http://localhost:8080/admin/register
2. 填写信息，例如：
    - Name: `张三`
    - Email: `zhangsan@example.com`
    - Password: `password123`
    - Company: `测试公司`
3. 点击"Create Account"

#### 步骤2：检查Profile显示

1. 注册成功后，可能跳转到onboarding页面，完成或跳过
2. 进入admin dashboard后，点击右上角的profile图标
3. 或直接访问：http://localhost:8080/admin/profile
4. 在"Profile Details"部分检查：

**修复前的错误现象：**

- ❌ Name显示为："Administrator" 或其他用户的名字
- ❌ Email显示为："admin@example.com" 或其他用户的邮箱

**修复后的正确现象：**

- ✅ Name显示为："张三" (你注册时填写的名字)
- ✅ Email显示为："zhangsan@example.com" (你注册时填写的邮箱)

#### 步骤3：验证用户隔离

1. 打开新的隐私浏览器窗口
2. 注册另一个用户，例如：
    - Name: `李四`
    - Email: `lisi@example.com`
3. 检查新用户的Profile Details应该显示"李四"和"lisi@example.com"
4. 原窗口刷新profile页面，应该仍然显示"张三"的信息

## 技术细节

### 相关文件

- **主要修复**：`routes/admin.js` - `/admin/profile` 接口
- **相关组件**：
    - `client/src/contexts/AdminContext.tsx` - `loadProfile()` 函数
    - `client/src/components/AdminDashboard.tsx` - Profile页面显示
    - `middlewares/jwtAuth.js` - JWT认证中间件

### JWT Token结构

注册/登录成功后，JWT token包含：

```javascript
{
  id: "用户的MongoDB ObjectId",
  email: "用户邮箱",
  role: "admin",
  iat: "签发时间",
  exp: "过期时间"
}
```

### 修复流程

1. 用户注册 → JWT token包含用户ID
2. 前端调用 `/admin/profile` → 携带JWT token
3. 后端解析token → 获取用户ID
4. 数据库查询 → `User.findById(用户ID)`
5. 返回正确用户信息 → 前端显示

## 部署状态

- ✅ 代码修复已完成
- ✅ Backend容器已重建
- 🔄 等待容器完全启动
- 📋 手动测试步骤已提供

## 预期结果

修复后，每个用户登录后在Profile Settings中看到的将是自己注册时填写的信息，而不是其他用户或默认admin的信息，实现了正确的用户隔离和数据显示。
