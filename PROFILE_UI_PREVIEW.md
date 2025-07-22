# 📱 管理员个人资料页面 UI 预览

## 🎨 界面布局设计

### 页面标题区域
```
┌─────────────────────────────────────────────────────────────┐
│                     Profile Settings                        │
│            Manage your personal information and             │
│                   company details                           │
└─────────────────────────────────────────────────────────────┘
```

### 标签页导航
```
┌─────────────────────────────────────────────────────────────┐
│  [Personal Information]  [Company Information]             │
└─────────────────────────────────────────────────────────────┘
```

## 📝 个人信息标签页 (Personal Information)

### 左侧 - 个人资料表单
```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│          Profile Details        │  │        Change Password          │
│                                 │  │                                 │
│  Name: [John Administrator]     │  │  Current Password: [********]   │
│                                 │  │                                 │
│  Email: [admin@example.com]     │  │  New Password: [********]       │
│                                 │  │  (min 6 characters)             │
│  Avatar: [📷] [Choose File...]  │  │                                 │
│         [👤 Preview Image]      │  │  [Change Password] (Green Btn)  │
│                                 │  │                                 │
│  [Update Profile] (Blue Button) │  │                                 │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

## 🏢 公司信息标签页 (Company Information)

### 公司详情表单
```
┌─────────────────────────────────────────────────────────────┐
│                     Company Details                         │
│                                                             │
│  Company Name: [My Company] *                               │
│  Industry: [Technology, Education, Healthcare...]           │
│                                                             │
│  Company Logo: [🏢] [Choose File...]                       │
│               [📷 Logo Preview]                             │
│               (max 2MB, JPG/PNG/GIF)                       │
│                                                             │
│  Website: [https://www.example.com]                        │
│                                                             │
│  Description: ┌─────────────────────────────────────────┐   │
│               │ Brief description of your company...    │   │
│               │                                         │   │
│               └─────────────────────────────────────────┘   │
│                                                             │
│  [Update Company Information] (Blue Button)                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 交互特性

### 🔄 状态指示
- **加载状态**: 按钮显示 "Updating..." 并禁用
- **成功状态**: 弹出成功提示 "Profile updated successfully!"
- **错误状态**: 红色错误消息框显示具体错误

### 📸 文件上传体验
```
上传前：[Choose File...] 按钮

上传后：
┌─────────────────┐
│  [👤]          │  ← 头像预览 (圆形)
│  John A.        │
└─────────────────┘
[Change Avatar]

公司Logo预览：
┌─────────────────┐
│  [🏢]          │  ← Logo预览 (方形)
│  Company Inc.   │
└─────────────────┘
[Change Logo]
```

### ⚠️ 表单验证
- **必填字段**: 姓名、邮箱、公司名称标记 * 号
- **邮箱格式**: 自动验证邮箱格式
- **密码长度**: 新密码至少6位字符
- **文件大小**: 图片文件最大2MB限制

## 🎨 样式设计

### 颜色方案
- **主要按钮**: 蓝色 (#2563eb) - 更新资料
- **成功按钮**: 绿色 (#16a34a) - 修改密码
- **次要按钮**: 灰色 (#6b7280) - 取消/返回
- **错误提示**: 红色 (#dc2626)
- **成功提示**: 绿色 (#059669)

### 响应式布局
- **桌面端**: 个人信息部分采用 2 列布局
- **平板端**: 自适应为单列布局
- **移动端**: 垂直堆叠所有元素

### 间距和尺寸
- **卡片内边距**: 24px (p-6)
- **表单元素间距**: 16px (space-y-4)
- **头像预览**: 64x64px (w-16 h-16)
- **Logo预览**: 64x64px (w-16 h-16)

## 🔗 导航集成

### 头部导航新增
```
原有: [+ Create Sigma] [Logout]
新增: [+ Create Sigma] [Profile] [Logout]
```

### 标签页导航
```
[Surveys] [Question Banks] [Profile] ← 新增
```

## 📱 移动端适配

### 手机端布局调整
```
┌─────────────────────────┐
│    Profile Settings     │
├─────────────────────────┤
│ [Personal] [Company]    │
├─────────────────────────┤
│                         │
│  Name: [John Admin]     │
│                         │
│  Email: [admin@...]     │
│                         │
│  Avatar: [Choose...]    │
│                         │
│  [Update Profile]       │
│                         │
│  Current Pwd: [***]     │
│                         │
│  New Pwd: [***]         │
│                         │
│  [Change Password]      │
│                         │
└─────────────────────────┘
```

## ✨ 用户体验亮点

1. **即时预览**: 上传图片后立即显示预览
2. **智能验证**: 实时表单验证反馈
3. **友好提示**: 清晰的操作指导文本
4. **加载反馈**: 操作过程中的视觉反馈
5. **错误恢复**: 错误后的快速重试机制
6. **数据保护**: 敏感信息的安全处理

这个设计确保了管理员能够轻松、直观地管理个人信息和公司信息，提供了现代化的用户体验。