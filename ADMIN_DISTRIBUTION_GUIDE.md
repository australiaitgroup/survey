# 管理端测评发布与分发指南 / Admin Assessment Publishing & Distribution Guide

## 概述 / Overview

本系统现已支持三种测评分发模式：
- **链接邀请** (Link Invitations): 生成专用链接分享给指定用户
- **指定学生/用户** (Targeted Distribution): 针对特定学生或用户群体
- **开放问卷** (Open Questionnaires): 允许任何人访问的公开测评

The system now supports three assessment distribution modes:
- **Link Invitations**: Generate dedicated links to share with specific users
- **Targeted Distribution**: Target specific students or user groups
- **Open Questionnaires**: Public assessments accessible to anyone

## 功能特性 / Features

### 🎯 分发模式 / Distribution Modes

#### 1. 开放问卷 (Open Mode)
- 任何人都可以访问和参与
- 适用于公开调研、意见收集
- 无需登录或认证

#### 2. 指定用户 (Targeted Mode)
- 只有指定的用户可以参与
- 支持按用户ID、邮箱地址筛选
- 可以按角色、部门、班级批量指定

#### 3. 链接邀请 (Link Mode)
- 生成唯一的邀请链接
- 持有链接的用户可以参与
- 支持设置访问限制和过期时间

### 👥 用户管理 / User Management

- 支持学生、教师、管理员、普通用户四种角色
- 批量导入用户数据
- 用户信息包括：姓名、邮箱、学号、部门、班级
- 支持用户搜索和筛选

### 📊 统计分析 / Analytics

- 实时访问统计
- 完成率分析
- 用户行为追踪
- 分发效果监控

## API 接口 / API Endpoints

### 用户管理 / User Management

```bash
# 获取所有用户
GET /api/admin/users

# 创建用户
POST /api/admin/users
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "role": "student",
  "studentId": "2023001",
  "department": "计算机科学",
  "class": "软件工程1班"
}

# 批量创建用户
POST /api/admin/users/bulk
{
  "users": [
    {
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "student",
      "studentId": "2023001",
      "department": "计算机科学",
      "class": "软件工程1班"
    }
  ]
}

# 更新用户
PUT /api/admin/users/:id

# 删除用户
DELETE /api/admin/users/:id

# 用户统计
GET /api/admin/users/statistics
```

### 邀请管理 / Invitation Management

```bash
# 创建邀请
POST /api/invitations
{
  "surveyId": "survey_id",
  "distributionMode": "targeted",
  "targetUsers": ["user_id1", "user_id2"],
  "targetEmails": ["email1@example.com", "email2@example.com"],
  "maxResponses": 100,
  "expiresAt": "2024-12-31T23:59:59Z"
}

# 获取测评的所有邀请
GET /api/invitations/survey/:surveyId

# 获取所有邀请
GET /api/invitations

# 更新邀请
PUT /api/invitations/:id

# 删除邀请
DELETE /api/invitations/:id

# 邀请统计
GET /api/invitations/:id/statistics

# 通过邀请码访问测评
GET /api/invitations/access/:invitationCode

# 获取邀请链接
GET /api/invitations/:id/urls

# 批量创建邀请
POST /api/invitations/bulk
```

### 测评发布 / Survey Publishing

```bash
# 发布测评
POST /api/admin/surveys/:id/publish
{
  "distributionMode": "targeted",
  "targetUsers": ["user_id1", "user_id2"],
  "targetEmails": ["email1@example.com"],
  "maxResponses": 50,
  "expiresAt": "2024-12-31T23:59:59Z",
  "distributionSettings": {
    "allowAnonymous": false,
    "requireLogin": true,
    "allowedRoles": ["student", "teacher"],
    "maxResponsesPerUser": 1
  }
}

# 获取测评邀请
GET /api/admin/surveys/:id/invitations

# 为测评创建邀请
POST /api/admin/surveys/:id/invitations

# 管理面板统计
GET /api/admin/dashboard/statistics
```

## 使用示例 / Usage Examples

### 创建开放问卷 / Creating Open Questionnaire

```javascript
// 1. 创建测评
const survey = await fetch('/api/admin/surveys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '客户满意度调研',
    description: '请参与我们的客户满意度调研',
    type: 'survey'
  })
});

// 2. 发布为开放问卷
const publication = await fetch(`/api/admin/surveys/${survey.id}/publish`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    distributionMode: 'open',
    distributionSettings: {
      allowAnonymous: true,
      requireLogin: false
    }
  })
});
```

### 创建指定用户测评 / Creating Targeted Assessment

```javascript
// 1. 批量创建学生用户
const users = await fetch('/api/admin/users/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    users: [
      {
        name: '张三',
        email: 'zhangsan@school.edu',
        role: 'student',
        studentId: '2023001',
        department: '计算机科学',
        class: '软件工程1班'
      },
      {
        name: '李四',
        email: 'lisi@school.edu',
        role: 'student',
        studentId: '2023002',
        department: '计算机科学',
        class: '软件工程1班'
      }
    ]
  })
});

// 2. 创建针对特定学生的测评
const invitation = await fetch('/api/invitations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    surveyId: 'survey_id',
    distributionMode: 'targeted',
    targetUsers: ['user_id1', 'user_id2'],
    targetEmails: ['external@example.com'],
    maxResponses: 50,
    expiresAt: '2024-12-31T23:59:59Z'
  })
});
```

### 创建链接邀请 / Creating Link Invitation

```javascript
// 1. 创建链接邀请
const invitation = await fetch('/api/invitations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    surveyId: 'survey_id',
    distributionMode: 'link',
    maxResponses: 100,
    expiresAt: '2024-12-31T23:59:59Z'
  })
});

// 2. 获取分享链接
const urls = await fetch(`/api/invitations/${invitation.id}/urls`);
console.log(urls.invitationUrl); // 邀请链接
```

## 数据模型 / Data Models

### 用户模型 / User Model

```javascript
{
  name: String,        // 姓名
  email: String,       // 邮箱
  role: String,        // 角色: student, teacher, admin, user
  studentId: String,   // 学号
  department: String,  // 部门
  class: String,       // 班级
  isActive: Boolean,   // 是否激活
  createdAt: Date,     // 创建时间
  lastLoginAt: Date    // 最后登录时间
}
```

### 邀请模型 / Invitation Model

```javascript
{
  surveyId: ObjectId,           // 测评ID
  invitationCode: String,       // 邀请码
  distributionMode: String,     // 分发模式: open, targeted, link
  targetUsers: [ObjectId],      // 目标用户ID列表
  targetEmails: [String],       // 目标邮箱列表
  maxResponses: Number,         // 最大响应数
  currentResponses: Number,     // 当前响应数
  expiresAt: Date,             // 过期时间
  isActive: Boolean,           // 是否激活
  createdAt: Date,             // 创建时间
  createdBy: ObjectId,         // 创建者ID
  accessLog: [{                // 访问日志
    userId: ObjectId,
    email: String,
    accessedAt: Date,
    ipAddress: String
  }],
  completedBy: [{              // 完成记录
    userId: ObjectId,
    email: String,
    completedAt: Date
  }]
}
```

### 测评模型 / Survey Model

```javascript
{
  title: String,
  description: String,
  slug: String,
  type: String,                // survey, assessment
  questions: [Question],
  status: String,              // draft, active, closed
  
  // 分发设置
  distributionSettings: {
    allowAnonymous: Boolean,   // 允许匿名
    requireLogin: Boolean,     // 需要登录
    allowedRoles: [String],    // 允许的角色
    maxResponsesPerUser: Number // 每用户最大响应数
  },
  
  // 发布设置
  publishingSettings: {
    publishedAt: Date,         // 发布时间
    publishedBy: ObjectId,     // 发布者ID
    scheduledPublishAt: Date,  // 计划发布时间
    scheduledCloseAt: Date,    // 计划关闭时间
    autoClose: Boolean         // 自动关闭
  },
  
  createdAt: Date,
  isActive: Boolean
}
```

## 权限管理 / Permission Management

### 角色权限 / Role Permissions

- **管理员 (admin)**: 所有功能的完全访问权限
- **教师 (teacher)**: 创建和管理自己的测评
- **学生 (student)**: 参与被指定的测评
- **普通用户 (user)**: 参与开放测评和被邀请的测评

### 安全特性 / Security Features

- 会话认证
- 邀请码验证
- 过期时间检查
- 访问日志记录
- IP地址追踪

## 最佳实践 / Best Practices

### 1. 用户管理
- 定期清理不活跃用户
- 使用批量导入功能提高效率
- 设置合理的用户角色权限

### 2. 邀请管理
- 为不同场景设置合适的过期时间
- 限制最大响应数以控制参与规模
- 定期检查邀请状态和统计数据

### 3. 测评发布
- 根据测评性质选择合适的分发模式
- 测试发布前确保所有设置正确
- 监控发布后的参与情况

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

1. **邀请链接无法访问**
   - 检查邀请是否已过期
   - 确认邀请状态为激活
   - 验证用户是否有访问权限

2. **用户无法参与测评**
   - 检查用户角色是否在允许范围内
   - 确认用户是否在目标用户列表中
   - 验证测评状态是否为活跃

3. **统计数据不准确**
   - 检查数据库连接
   - 确认统计查询的时间范围
   - 验证数据模型的完整性

## 技术支持 / Technical Support

如需技术支持，请联系系统管理员或查看系统日志获取详细错误信息。

For technical support, please contact the system administrator or check system logs for detailed error information.