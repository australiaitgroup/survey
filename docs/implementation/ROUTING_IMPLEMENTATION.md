# 管理员页面路由实现

## 功能概述

实现了基于 React Router 的管理员页面标签页切换，URL 会随着标签页变化，支持：

- 直接访问特定标签页
- 浏览器前进后退导航
- 书签保存特定页面

## 路由配置

### 1. 主路由配置 (`client/src/main.tsx`)

```tsx
<Routes>
	<Route path="/" element={<TakeSurvey />} />
	<Route path="/admin" element={<Admin />} />
	<Route path="/admin/surveys" element={<Admin />} />
	<Route path="/admin/question-banks" element={<Admin />} />
	<Route path="/admin/survey/:id" element={<Admin />} />
	<Route path="/survey/:slug" element={<TakeSurvey />} />
	<Route path="/assessment/:slug" element={<StudentAssessment />} />
	<Route path="/legacy" element={<Survey />} />
</Routes>
```

### 2. 路由映射

| URL                     | 功能       | 标签页         |
| ----------------------- | ---------- | -------------- |
| `/admin`                | 管理员首页 | Survey List    |
| `/admin/surveys`        | 调查列表   | Survey List    |
| `/admin/question-banks` | 题库管理   | Question Banks |
| `/admin/survey/:id`     | 调查详情   | Details        |

## 实现细节

### 1. 路由监听 (`client/src/Admin.tsx`)

```tsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const Admin: React.FC = () => {
	const { id: surveyIdFromUrl } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();

	// 根据路由设置标签页
	useEffect(() => {
		if (!loggedIn) return;

		const path = location.pathname;
		if (path === '/admin' || path === '/admin/surveys') {
			setTab('list');
			setSelectedSurvey(null);
		} else if (path === '/admin/question-banks') {
			setTab('question-banks');
			setSelectedSurvey(null);
		} else if (path.startsWith('/admin/survey/')) {
			// 这个会在上面的 useEffect 中处理
			return;
		}
	}, [location.pathname, loggedIn]);
};
```

### 2. 标签页导航

```tsx
const renderTabs = () => (
	<div className="flex space-x-4 mb-6 border-b border-gray-200">
		<button
			className={`py-2 px-4 font-semibold border-b-2 transition-colors ${
				tab === 'list'
					? 'border-blue-600 text-blue-700'
					: 'border-transparent text-gray-500 hover:text-blue-600'
			}`}
			onClick={() => navigate('/admin/surveys')}
		>
			Survey List
		</button>
		<button
			className={`py-2 px-4 font-semibold border-b-2 transition-colors ${
				tab === 'question-banks'
					? 'border-blue-600 text-blue-700'
					: 'border-transparent text-gray-500 hover:text-blue-600'
			}`}
			onClick={() => navigate('/admin/question-banks')}
		>
			Question Banks
		</button>
		{selectedSurvey && (
			<button
				className={`py-2 px-4 font-semibold border-b-2 transition-colors ${
					tab === 'detail'
						? 'border-blue-600 text-blue-700'
						: 'border-transparent text-gray-500 hover:text-blue-600'
				}`}
				onClick={() => navigate(`/admin/survey/${selectedSurvey._id}`)}
			>
				Details
			</button>
		)}
	</div>
);
```

### 3. 导航函数更新

```tsx
// 返回列表页
const handleBackToList = () => {
	setSelectedSurvey(null);
	setTab('list');
	navigate('/admin/surveys');
};

// 点击 survey 时的处理函数
const handleSurveyClick = (survey: Survey) => {
	setSelectedSurvey(survey);
	setTab('detail');
	navigate(`/admin/survey/${survey._id}`);
};

// 登出
const logout = async () => {
	await axios.get('/api/admin/logout');
	setLoggedIn(false);
	setSurveys([]);
	setTab('list');
	setSelectedSurvey(null);
	navigate('/admin/surveys');
};
```

## 使用方式

### 1. 直接访问

- 调查列表：`http://localhost:5178/admin/surveys`
- 题库管理：`http://localhost:5178/admin/question-banks`
- 调查详情：`http://localhost:5178/admin/survey/{surveyId}`

### 2. 标签页切换

- 点击 "Survey List" → 导航到 `/admin/surveys`
- 点击 "Question Banks" → 导航到 `/admin/question-banks`
- 点击 "Details" → 导航到 `/admin/survey/{id}`

### 3. 浏览器导航

- 支持浏览器前进/后退按钮
- 支持书签保存特定页面
- 支持右键"在新标签页打开"

## 测试验证

### 自动化测试

```bash
node test_routing.js
```

### 手动测试步骤

1. 打开 `http://localhost:5178/admin`
2. 使用 `admin/password` 登录
3. 点击 "Survey List" 标签页 - URL 应变为 `/admin/surveys`
4. 点击 "Question Banks" 标签页 - URL 应变为 `/admin/question-banks`
5. 点击任意调查 - URL 应变为 `/admin/survey/{id}`
6. 使用浏览器前进/后退按钮测试导航

## 优势

1. **SEO 友好** - 每个页面都有唯一的 URL
2. **用户体验** - 支持书签和浏览器导航
3. **可分享** - 可以直接分享特定页面的链接
4. **状态保持** - 刷新页面不会丢失当前标签页
5. **历史记录** - 浏览器历史记录正常工作

## 注意事项

1. **登录状态** - 所有路由都需要登录状态
2. **权限控制** - 确保用户有访问相应页面的权限
3. **错误处理** - 无效的调查 ID 会重定向到列表页
4. **性能优化** - 路由变化时只更新必要的组件
