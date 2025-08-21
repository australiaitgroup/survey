# i18n 国际化实现指南

## Internationalization (i18n) Implementation Guide

本项目已成功集成 react-i18next 国际化支持，支持中英文切换。

---

## 🎯 已完成的功能 | Completed Features

### ✅ 1. 核心配置 | Core Configuration

- ✅ 安装 react-i18next 及相关依赖
- ✅ 配置 i18n 初始化文件 (`src/i18n/index.ts`)
- ✅ 集成到主应用 (`main.tsx`)

### ✅ 2. 翻译资源文件 | Translation Resources

- ✅ 英文翻译文件 (`public/locales/en/`)
- ✅ 中文翻译文件 (`public/locales/zh/`)
- ✅ 按功能模块组织翻译文件：
    - `translation.json` - 通用翻译
    - `admin.json` - 管理后台
    - `survey.json` - 问卷调研
    - `question.json` - 题目相关

### ✅ 3. 组件实现 | Component Implementation

- ✅ 语言切换组件 (`LanguageSwitcher`)
- ✅ 管理后台头部组件国际化 (`AdminHeader`)
- ✅ 问卷表单组件国际化 (`SurveyForm`)
- ✅ TypeScript 类型支持

---

## 🚀 使用方法 | Usage Guide

### 1. 在组件中使用翻译

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent: React.FC = () => {
  // 使用默认命名空间
  const { t } = useTranslation();

  // 使用特定命名空间
  const { t: tAdmin } = useTranslation('admin');

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button>{tAdmin('buttons.save')}</button>
    </div>
  );
};
```

### 2. 带参数的翻译

```typescript
const { t } = useTranslation('admin');

// 简单插值
const title = t('dashboard.title', { companyName: 'MyCompany' });

// 复数形式
const itemCount = t('survey.itemCount', {
	count: surveys.length,
	defaultValue: '{{count}} survey',
	defaultValue_plural: '{{count}} surveys',
});
```

### 3. 语言切换

```typescript
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();

// 切换到中文
i18n.changeLanguage('zh');

// 切换到英文
i18n.changeLanguage('en');
```

---

## 📁 文件结构 | File Structure

```
client/
├── public/
│   └── locales/
│       ├── en/
│       │   ├── translation.json
│       │   ├── admin.json
│       │   ├── survey.json
│       │   └── question.json
│       └── zh/
│           ├── translation.json
│           ├── admin.json
│           ├── survey.json
│           └── question.json
├── src/
│   ├── i18n/
│   │   └── index.ts
│   ├── components/
│   │   └── common/
│   │       └── LanguageSwitcher.tsx
│   └── types/
│       └── i18next.d.ts
```

---

## 🎨 组件示例 | Component Examples

### 语言切换器

```typescript
import LanguageSwitcher from './components/common/LanguageSwitcher';

<LanguageSwitcher className="my-4" />
```

### 管理后台头部

管理后台头部已集成：

- 公司名称动态显示
- 语言切换器
- 按钮文本国际化

---

## 🔧 添加新翻译 | Adding New Translations

### 1. 添加新的翻译 Key

在 `public/locales/en/translation.json`:

```json
{
	"myNewSection": {
		"title": "My New Feature",
		"description": "This is a new feature"
	}
}
```

在 `public/locales/zh/translation.json`:

```json
{
	"myNewSection": {
		"title": "我的新功能",
		"description": "这是一个新功能"
	}
}
```

### 2. 在组件中使用

```typescript
const { t } = useTranslation();

<h2>{t('myNewSection.title')}</h2>
<p>{t('myNewSection.description')}</p>
```

---

## 🛠 待完善的组件 | Components To Be Updated

以下组件仍需要集成 i18n 支持：

### 高优先级 | High Priority

- [ ] `StudentAssessment.tsx` - 学生测评界面
- [ ] `SurveyDetailView.tsx` - 问卷详情页面（部分已完成）
- [ ] 登录/注册表单组件
- [ ] 问卷创建/编辑模态框

### 中优先级 | Medium Priority

- [ ] 问题编辑组件
- [ ] 统计数据显示组件
- [ ] 邀请用户组件
- [ ] 问卷列表组件

### 低优先级 | Low Priority

- [ ] 错误页面
- [ ] 加载状态组件
- [ ] 个人资料页面

---

## 🏆 最佳实践 | Best Practices

### 1. 翻译 Key 命名规范

- 使用嵌套结构：`section.subsection.key`
- 语义明确：`buttons.save` 而不是 `btn1`
- 一致性：统一使用 camelCase

### 2. 命名空间使用

- `translation` - 通用文案
- `admin` - 管理后台专用
- `survey` - 问卷相关
- `question` - 题目相关

### 3. 动态内容处理

- 使用插值：`{{variable}}`
- 避免字符串拼接
- 支持复数形式

### 4. 类型安全

- 使用 TypeScript 声明文件
- 确保翻译 key 的类型检查

---

## 🔍 调试 | Debugging

### 开发模式调试

i18n 配置中已开启开发模式调试：

```typescript
debug: process.env.NODE_ENV === 'development';
```

### 检查翻译文件加载

在浏览器控制台查看是否有加载错误：

- 检查 `/locales/en/translation.json` 是否可访问
- 检查网络请求是否成功

### 语言检测

当前语言检测顺序：

1. localStorage 存储的语言设置
2. 浏览器语言设置
3. HTML 标签的 lang 属性

---

## 📝 注意事项 | Notes

1. **缓存问题**：翻译文件更新后，可能需要清除浏览器缓存
2. **构建优化**：生产环境会自动优化翻译文件加载
3. **SEO 友好**：支持搜索引擎多语言内容识别
4. **无障碍支持**：语言切换按钮包含 aria-label

---

## 🚀 下一步计划 | Next Steps

1. 完善剩余组件的国际化支持
2. 添加更多语言支持（如需要）
3. 实现服务端渲染的 i18n 支持
4. 添加翻译管理工具
5. 集成自动化翻译验证

---

_此项目的国际化实现遵循最佳实践，为用户提供流畅的多语言体验。_
