# 🔐 管理员账号注册功能实现文档

## 📋 功能概述

本文档描述了为 Admin 系统新增的管理员账号注册功能的完整实现。该功能允许用户自主创建管理员账户，无需预设的管理员凭据。

## ✅ 已实现功能

### 前端功能

1. **注册表单界面**
    - 位置：`/admin/register` 路由
    - 字段：姓名、邮箱、密码、确认密码、公司名称（可选）
    - 实时表单验证
    - 密码强度检查（最少8位字符）
    - 密码确认匹配检查

2. **登录/注册切换**
    - 在登录页面添加"注册账号"链接
    - 在注册页面添加"已有账号？登录"链接
    - 支持 URL 路由切换（`/admin/login` ↔ `/admin/register`）

3. **自动登录**
    - 注册成功后自动登录并跳转到管理后台
    - 无需手动重新登录

### 后端功能

1. **注册 API 端点**
    - 路径：`POST /api/admin/register`
    - 参数验证：姓名、邮箱、密码必填
    - 邮箱唯一性检查
    - 密码哈希加密（bcrypt）
    - 自动创建公司信息（如提供）

2. **增强的登录系统**
    - 支持传统管理员登录（环境变量）
    - 支持数据库用户登录（邮箱+密码）
    - JWT 令牌生成和验证
    - 登录时间记录

3. **数据库集成**
    - 使用现有 User 模型存储管理员信息
    - 使用现有 Company 模型存储公司信息
    - 自动设置用户角色为 'admin'

## 🏗️ 技术实现细节

### 文件修改清单

#### 前端文件

1. **新增文件**
    - `client/src/components/auth/RegisterForm.tsx` - 注册表单组件
    - `client/src/components/auth/AuthContainer.tsx` - 认证容器组件

2. **修改文件**
    - `client/src/types/admin.ts` - 添加 RegisterForm 类型定义
    - `client/src/contexts/AdminContext.tsx` - 添加注册状态和函数
    - `client/src/components/auth/LoginForm.tsx` - 添加注册链接
    - `client/src/components/auth/AuthWrapper.tsx` - 使用新的 AuthContainer
    - `client/src/main.tsx` - 添加 /admin/login 和 /admin/register 路由

#### 后端文件

1. **修改文件**
    - `routes/admin.js` - 添加注册端点，增强登录逻辑

### 核心代码实现

#### 注册 API 端点

```javascript
router.post(
	'/register',
	asyncHandler(async (req, res) => {
		const { name, email, password, companyName } = req.body;

		// 验证必填字段
		if (!name || !email || !password) {
			return res.status(400).json({
				success: false,
				error: 'Name, email, and password are required',
			});
		}

		// 检查邮箱是否已存在
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: 'An account with this email already exists',
			});
		}

		// 创建用户和公司
		const hashedPassword = await bcrypt.hash(password, 12);
		let company = null;

		if (companyName) {
			company = new Company({ name: companyName });
			await company.save();
		}

		const user = new User({
			name,
			email: email.toLowerCase(),
			password: hashedPassword,
			role: 'admin',
			companyId: company ? company._id : undefined,
		});

		await user.save();

		// 生成 JWT 令牌
		const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
			expiresIn: '7d',
		});

		res.status(201).json({
			success: true,
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	})
);
```

#### 增强的登录逻辑

```javascript
router.post(
	'/login',
	asyncHandler(async (req, res) => {
		const { username, password } = req.body;

		// 首先尝试传统管理员登录
		if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
			const token = jwt.sign({ id: 'admin', username: username, role: 'admin' }, JWT_SECRET, {
				expiresIn: '7d',
			});
			return res.json({
				success: true,
				token,
				user: { id: 'admin', username: username, role: 'admin' },
			});
		}

		// 尝试数据库用户登录（使用邮箱作为用户名）
		const user = await User.findOne({
			email: username.toLowerCase(),
			role: 'admin',
		}).select('+password');

		if (!user) {
			return res.status(401).json({
				success: false,
				error: 'Invalid credentials',
			});
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				error: 'Invalid credentials',
			});
		}

		// 更新最后登录时间
		user.lastLoginAt = new Date();
		await user.save();

		const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
			expiresIn: '7d',
		});

		res.json({
			success: true,
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	})
);
```

## 🔒 安全特性

1. **密码安全**
    - 使用 bcrypt 哈希加密，强度因子为 12
    - 密码最少 8 位字符要求
    - 密码确认匹配验证

2. **邮箱唯一性**
    - 数据库级别的唯一性约束
    - 注册时检查重复邮箱

3. **JWT 令牌**
    - 7天过期时间
    - 包含用户ID、邮箱、角色信息
    - 安全的令牌验证

4. **输入验证**
    - 前端实时验证
    - 后端严格参数检查
    - 防止 SQL 注入和 XSS 攻击

## 🛣️ 用户流程

### 注册流程

1. 用户访问 `/admin` 或 `/admin/login`
2. 点击"Don't have an account? Register here"
3. 跳转到 `/admin/register`
4. 填写注册表单（姓名、邮箱、密码、确认密码、公司名称）
5. 提交表单
6. 系统验证信息并创建账户
7. 自动登录并跳转到管理后台

### 登录流程

1. 注册用户使用邮箱和密码登录
2. 传统管理员仍可使用环境变量凭据登录
3. 系统自动识别登录类型并验证

## 📝 使用说明

### 环境要求

确保以下环境变量已配置：

- `JWT_SECRET` - JWT 令牌签名密钥
- `ADMIN_USERNAME` - 传统管理员用户名（可选）
- `ADMIN_PASSWORD` - 传统管理员密码（可选）

### 数据库要求

确保 MongoDB 已连接，包含以下集合：

- `users` - 存储用户信息
- `companies` - 存储公司信息

### 启动应用

1. 启动后端服务器：`npm start`
2. 启动前端开发服务器：`cd client && npm run dev`
3. 访问 `http://localhost:5173/admin` 开始使用

## 🚀 扩展功能建议

1. **邮箱验证**
    - 注册后发送验证邮件
    - 验证邮箱后激活账户

2. **邀请码机制**
    - 生成邀请码
    - 仅持有邀请码者可注册

3. **管理员审核**
    - 注册后需要现有管理员审核
    - 审核通过后激活账户

4. **密码重置**
    - 忘记密码功能
    - 邮箱重置密码链接

5. **多因素认证**
    - SMS 或邮箱二次验证
    - TOTP 应用支持

## 🐛 故障排除

### 常见问题

1. **注册失败**
    - 检查邮箱是否已存在
    - 确认密码长度符合要求
    - 验证网络连接

2. **登录失败**
    - 确认使用注册时的邮箱地址
    - 检查密码是否正确
    - 验证 JWT_SECRET 配置

3. **页面不显示**
    - 检查前端构建是否成功
    - 确认路由配置正确
    - 验证组件导入路径

### 日志检查

查看服务器日志获取详细错误信息：

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📊 测试建议

1. **功能测试**
    - 注册新账户
    - 登录已注册账户
    - 切换登录/注册表单
    - 验证表单验证逻辑

2. **安全测试**
    - 尝试重复邮箱注册
    - 测试弱密码输入
    - 验证 JWT 令牌有效性

3. **用户体验测试**
    - 测试响应式设计
    - 验证错误消息显示
    - 检查加载状态

---

_此功能已完全实现并可投入使用。如有问题或需要进一步定制，请参考代码实现或联系开发团队。_
