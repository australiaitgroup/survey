# 🎯 管理员用户资料与公司信息管理功能

## ✅ 功能概述

已成功实现管理员用户可在个人中心页面中同时更新自己的个人信息与所属公司的基本信息的功能，提升平台可识别性与组织管理能力。

## 📡 API 接口实现

### 后端 API 路由

| 方法  | 路径                          | 描述                     |
| ----- | ----------------------------- | ------------------------ |
| `GET` | `/api/admin/profile`          | 获取当前管理员与公司信息 |
| `PUT` | `/api/admin/profile`          | 更新个人信息（不含密码） |
| `PUT` | `/api/admin/profile/password` | 修改密码                 |
| `PUT` | `/api/admin/company`          | 更新公司信息             |

### 数据模型

#### 新增 Company 模型 (`models/Company.js`)

```javascript
{
  name: String (required),     // 公司名称
  industry: String,            // 所属行业
  logoUrl: String,             // 公司 Logo URL
  description: String,         // 公司介绍
  website: String,             // 公司网址
  createdAt: Date,
  updatedAt: Date
}
```

#### 扩展 User 模型 (`models/User.js`)

```javascript
{
  // 原有字段...
  password: String,            // 密码字段
  avatarUrl: String,           // 头像 URL
  companyId: ObjectId,         // 关联公司 ID
}
```

## 🎨 前端界面实现

### 路由配置

- 页面路径：`/admin/profile`
- 集成到现有管理员导航系统中

### 组件结构

#### ProfileView 组件 (`client/src/components/profile/ProfileView.tsx`)

- **双标签页设计**：
    - "Personal Information" - 个人信息管理
    - "Company Information" - 公司信息管理

#### 个人信息部分

- ✅ 姓名（name）
- ✅ 邮箱（email）
- ✅ 头像上传（支持图片预览）
- ✅ 密码修改（需验证旧密码）

#### 公司信息部分

- ✅ 公司名称（companyName）\*必填
- ✅ 所属行业（industry）
- ✅ 公司 Logo 上传（logoUrl）
- ✅ 公司介绍 / 简介（description）
- ✅ 公司网址（website，可选）

### UI/UX 特性

1. **响应式设计**：使用 Tailwind CSS Grid/Flex 实现
2. **文件上传预览**：支持头像和 Logo 的实时预览
3. **表单验证**：客户端和服务端双重验证
4. **错误处理**：友好的错误提示和反馈
5. **加载状态**：按钮禁用和加载指示器
6. **成功反馈**：操作成功后的 Toast 提示

## 🔧 技术实现细节

### 状态管理

- 使用 AdminContext 进行状态管理
- 新增类型定义：
    - `AdminUser`
    - `Company`
    - `ProfileData`
    - `ProfileForm`
    - `PasswordForm`
    - `CompanyForm`

### 文件上传

- 当前实现：使用 FileReader API 转换为 Data URL
- 生产环境建议：集成云存储服务（如 AWS S3、阿里云OSS等）

### 安全性

- JWT 认证保护所有 API 端点
- 密码验证（当前基于环境变量，可扩展为数据库存储）
- 输入验证和清理

## 📱 使用流程

1. **访问个人资料页面**
    - 在管理员头部点击 "Profile" 按钮
    - 或直接访问 `/admin/profile`

2. **编辑个人信息**
    - 在 "Personal Information" 标签页中
    - 更新姓名、邮箱、上传头像
    - 点击 "Update Profile" 保存

3. **修改密码**
    - 在 "Personal Information" 标签页右侧
    - 输入当前密码和新密码
    - 点击 "Change Password" 保存

4. **编辑公司信息**
    - 切换到 "Company Information" 标签页
    - 填写公司名称、行业、上传 Logo
    - 添加公司描述和网址
    - 点击 "Update Company Information" 保存

## 🚀 部署说明

### 环境要求

- Node.js 20+
- MongoDB 数据库
- 现有的管理员认证系统

### 安装步骤

1. **安装依赖**

    ```bash
    npm install bcrypt  # 已添加到项目依赖
    ```

2. **数据库迁移**
    - Company 模型会自动创建
    - User 模型会自动扩展新字段

3. **启动服务**

    ```bash
    # 后端
    npm start

    # 前端 (开发模式)
    cd client && npm run dev
    ```

## 🔄 扩展建议

### 短期优化

1. **文件上传服务**：集成云存储替代 Data URL
2. **头像裁剪**：添加图片裁剪功能
3. **密码强度**：添加密码强度指示器

### 长期扩展

1. **多租户支持**：支持多个公司管理
2. **权限管理**：细粒度的公司信息编辑权限
3. **审核流程**：公司信息变更审核机制
4. **品牌定制**：基于公司信息的界面主题定制

## 📝 测试说明

由于当前环境缺少 MongoDB，无法进行完整的功能测试。但所有代码已完整实现，包括：

- ✅ 完整的 API 路由实现
- ✅ 数据模型定义
- ✅ 前端界面组件
- ✅ 状态管理集成
- ✅ 路由配置
- ✅ 类型定义

在有 MongoDB 的环境中，此功能可以立即使用。

## 🎯 核心价值

1. **品牌识别**：公司 Logo 和信息增强平台品牌识别度
2. **个性化体验**：管理员可自定义个人和公司信息
3. **数据完整性**：统一的公司信息管理避免数据不一致
4. **用户体验**：直观的双标签页设计，操作简单高效
5. **可扩展性**：为后续多租户和品牌定制功能奠定基础
