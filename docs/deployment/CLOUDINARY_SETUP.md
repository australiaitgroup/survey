# Cloudinary 图片上传集成指南

## 📋 概述

本项目已集成 Cloudinary 图片上传功能，支持在题目和选项中上传图片。系统现在支持两种上传方式：

- **后端上传**（原有方式）
- **Cloudinary 上传**（新增方式）

## ⚙️ 配置 Cloudinary

### 1. 获取 Cloudinary 凭据

1. 访问 [Cloudinary 控制台](https://cloudinary.com/console)
2. 创建账户或登录现有账户
3. 在控制台主页获取以下信息：
    - **Cloud Name** - 您的云存储名称
    - **Upload Preset** - 需要创建一个无签名的上传预设

### 2. 创建 Upload Preset

1. 在 Cloudinary 控制台中，点击 **Settings** → **Upload**
2. 滚动到 **Upload presets** 部分
3. 点击 **Add upload preset**
4. 配置预设：
    - **Preset name**: 给预设命名（如 `survey-images`）
    - **Signing Mode**: 选择 **Unsigned** ⚠️ 重要
    - **Folder**: 可选，设置上传文件夹（如 `survey-app/`）
    - **Allowed formats**: 设置允许的图片格式
    - **Transformation**: 可选，设置图片处理选项
5. 保存预设

### 3. 配置环境变量

复制 `/client/.env.example` 文件为 `/client/.env`：

```bash
cp client/.env.example client/.env
```

编辑 `/client/.env` 文件，填入您的 Cloudinary 信息：

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-actual-upload-preset
```

## 🚀 使用方法

### 在代码中使用

系统已自动配置 Survey 问题编辑器使用 Cloudinary 上传。您也可以在其他组件中使用：

```tsx
import ImageUpload from '../components/common/ImageUpload';

// 使用 Cloudinary 上传
<ImageUpload
	imageUrl={imageUrl}
	onImageUpload={(url) => setImageUrl(url)}
	onImageRemove={() => setImageUrl(null)}
	uploadMethod="cloudinary"
	placeholder="上传图片"
/>

// 使用后端上传（原有方式）
<ImageUpload
	imageUrl={imageUrl}
	onImageUpload={(url) => setImageUrl(url)}
	onImageRemove={() => setImageUrl(null)}
	uploadMethod="backend"
	placeholder="上传图片"
/>
```

### 自定义 Cloudinary 配置

```tsx
<ImageUpload
	imageUrl={imageUrl}
	onImageUpload={url => setImageUrl(url)}
	onImageRemove={() => setImageUrl(null)}
	uploadMethod="cloudinary"
	cloudinaryConfig={{
		maxFileSize: 5 * 1024 * 1024, // 5MB
		allowedFormats: ['jpg', 'png', 'webp'],
	}}
/>
```

## 📁 文件结构

新增的文件和修改：

```
client/src/
├── utils/
│   └── cloudinaryUpload.ts          # Cloudinary 上传工具函数
├── components/
│   └── common/
│       └── ImageUpload.tsx          # 增强的图片上传组件（支持双模式）
└── .env.example                     # 环境变量示例
```

## 🔧 功能特性

### ImageUpload 组件特性

- ✅ 支持文件拖拽上传
- ✅ 支持点击选择文件
- ✅ 支持粘贴上传（Ctrl+V）
- ✅ 支持 URL 粘贴
- ✅ 图片预览和删除
- ✅ 文件类型和大小验证
- ✅ 上传进度显示
- ✅ 错误处理和用户友好提示

### Cloudinary 上传特性

- ✅ 无签名上传（安全）
- ✅ 自动图片优化
- ✅ CDN 加速访问
- ✅ 支持多种图片格式
- ✅ 文件大小限制配置
- ✅ 详细错误信息

## 🎯 集成位置

Cloudinary 上传已集成到以下位置：

1. **Survey 问题编辑器**
    - 题干图片上传 ✅
    - 选项图片上传 ✅

2. **未来扩展**
    - Question Bank 问题编辑器（可扩展）
    - 其他需要图片上传的组件

## 🛠️ 故障排除

### 常见问题

**1. 上传失败 - "Upload preset not found"**

- 检查 `VITE_CLOUDINARY_UPLOAD_PRESET` 是否正确
- 确认预设在 Cloudinary 控制台中存在
- 确认预设的 Signing Mode 设置为 "Unsigned"

**2. 上传失败 - "Invalid cloud name"**

- 检查 `VITE_CLOUDINARY_CLOUD_NAME` 是否正确
- 确认云名称与 Cloudinary 控制台中显示的完全一致

**3. 环境变量不生效**

- 确认 `.env` 文件位于 `/client` 目录下
- 重启开发服务器
- 检查变量名前缀必须是 `VITE_`

**4. 图片显示问题**

- 检查 Cloudinary 账户配额是否已用完
- 检查返回的 URL 是否有效
- 确认图片格式在允许范围内

### 开发调试

启用 Cloudinary 上传调试：

```javascript
// 在浏览器开发者工具中查看网络请求
// 上传请求将发送到:
// https://api.cloudinary.com/v1_1/{cloud-name}/image/upload
```

## 📞 支持

如有问题，请检查：

1. [Cloudinary 官方文档](https://cloudinary.com/documentation)
2. [Upload Preset 配置指南](https://cloudinary.com/documentation/upload_presets)
3. 项目的 GitHub Issues

---

_最后更新: 2025-01-24_
