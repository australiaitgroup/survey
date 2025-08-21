# 测评系统作答时间统计功能实现

## 📋 功能概述

本功能实现了测评系统中每道题的作答时间统计与展示，包括：

- 答题阶段记录每道题的作答时间
- 在个人评测结果页展示每题的作答时长
- 在管理端展示用户每道题的作答时间
- 对超过90秒的题目添加红色警告提示

## 🔧 实现细节

### 1. 数据库模型更新

#### Response模型 (models/Response.js)

在 `questionSnapshots` 中添加了 `durationInSeconds` 字段：

```javascript
questionSnapshots: [
	{
		// ... 其他字段
		durationInSeconds: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
];
```

### 2. 前端答题逻辑 (client/src/components/StudentAssessment.tsx)

#### 新增状态管理

```typescript
interface QuestionTiming {
	startTime: number;
	endTime?: number;
	duration?: number;
}

// 问题计时跟踪
const [questionTimings, setQuestionTimings] = useState<Record<string, QuestionTiming>>({});
const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number | null>(null);
```

#### 时间记录逻辑

1. **开始答题时**：记录第一道题的开始时间

```typescript
const startAssessment = () => {
	// ... 其他逻辑
	if (survey?.questions && survey.questions.length > 0) {
		const firstQuestionId = survey.questions[0]._id;
		const startTime = Date.now();
		setCurrentQuestionStartTime(startTime);
		setQuestionTimings(prev => ({
			...prev,
			[firstQuestionId]: { startTime },
		}));
	}
};
```

2. **切换题目时**：记录当前题结束时间，开始下一题计时

```typescript
const nextQuestion = () => {
	// 记录当前题结束时间
	const currentQuestion = survey.questions[currentQuestionIndex];
	if (currentQuestion && currentQuestionStartTime) {
		const endTime = Date.now();
		const duration = Math.round((endTime - currentQuestionStartTime) / 1000);

		setQuestionTimings(prev => ({
			...prev,
			[currentQuestion._id]: {
				...prev[currentQuestion._id],
				endTime,
				duration,
			},
		}));
	}

	// 开始下一题计时
	// ...
};
```

3. **提交时**：处理最后一题的时间并准备数据

```typescript
const handleSubmit = async () => {
	// 处理最后一题的时间
	let finalQuestionTimings = { ...questionTimings };
	// ...

	// 准备每道题的作答时间数据
	const answerDurations: Record<string, number> = {};
	Object.keys(finalQuestionTimings).forEach(questionId => {
		const timing = finalQuestionTimings[questionId];
		if (timing.duration !== undefined) {
			answerDurations[questionId] = timing.duration;
		}
	});

	// 包含在API请求中
	const responseData: ResponseCreateRequest = {
		// ... 其他字段
		answerDurations,
	};
};
```

### 3. API类型定义更新 (client/src/types/api.ts)

```typescript
export interface ResponseCreateRequest {
	// ... 其他字段
	// Answer durations for each question (questionId -> duration in seconds)
	answerDurations?: Record<string, number>;
}
```

### 4. 后端API处理 (routes/responses.js)

新增 `/api/responses` 路由处理作答时间：

```javascript
router.post(
	'/responses',
	asyncHandler(async (req, res) => {
		const { answerDurations = {} } = req.body;

		// 创建包含作答时间的questionSnapshots
		const questionSnapshots = survey.questions.map((question, index) => {
			const duration = answerDurations[question._id] || 0;

			return {
				// ... 其他字段
				durationInSeconds: duration,
			};
		});

		// 保存到数据库
		// ...
	})
);
```

### 5. 结果展示更新

#### 学生端结果页面 (StudentAssessment.tsx)

在详细结果中显示每道题的作答时间：

```tsx
<div className="flex justify-between items-start mb-2">
	<div className="font-medium text-gray-800">
		Question {index + 1}: {result.questionText}
	</div>
	{result.durationInSeconds !== undefined && (
		<div className="flex items-center text-sm text-gray-500 ml-4">
			<svg className="w-4 h-4 mr-1" /* 时钟图标 */ />
			<span className={result.durationInSeconds > 90 ? 'text-red-500 font-medium' : ''}>
				用时: {result.durationInSeconds}秒
			</span>
			{result.durationInSeconds > 90 && (
				<svg className="w-4 h-4 ml-1 text-red-500" /* 警告图标 */ />
			)}
		</div>
	)}
</div>
```

#### 管理端统计页面 (SurveyDetailView.tsx)

在用户回答详情中显示每道题的作答时间：

```tsx
{
	response.questionSnapshots.map((snapshot, qIdx) => (
		<div key={snapshot.questionIndex} className="border-l-4 border-blue-200 pl-3">
			<div className="flex justify-between items-start mb-1">
				<div className="font-medium text-gray-700 text-sm">
					Q{snapshot.questionIndex + 1}: {snapshot.questionData.text}
				</div>
				{snapshot.durationInSeconds !== undefined && (
					<div className="flex items-center text-xs text-gray-500 ml-2">
						<svg className="w-3 h-3 mr-1" /* 时钟图标 */ />
						<span
							className={
								snapshot.durationInSeconds > 90 ? 'text-red-500 font-medium' : ''
							}
						>
							{snapshot.durationInSeconds}s
						</span>
						{snapshot.durationInSeconds > 90 && (
							<svg className="w-3 h-3 ml-1 text-red-500" /* 警告图标 */ />
						)}
					</div>
				)}
			</div>
			{/* 答案和评分信息 */}
		</div>
	));
}
```

## 🎨 UI/UX 特性

### 1. 时间显示样式

- **正常时间**：灰色文字显示
- **超时警告**：超过90秒的题目用红色字体显示
- **警告图标**：超时题目显示红色警告图标

### 2. 图标设计

- **时钟图标**：表示时间信息
- **警告图标**：表示超时警告

### 3. 响应式布局

- 在大屏幕上时间信息显示在右侧
- 在小屏幕上自动换行显示

## 🔄 数据流程

```
1. 用户开始答题
   ↓
2. 记录第一题开始时间 (Date.now())
   ↓
3. 用户点击"下一题"
   ↓
4. 记录当前题结束时间，计算duration
   ↓
5. 开始下一题计时
   ↓
6. 重复步骤3-5直到最后一题
   ↓
7. 提交时处理最后一题时间
   ↓
8. 将answerDurations发送到后端
   ↓
9. 后端保存到questionSnapshots.durationInSeconds
   ↓
10. 前端/管理端展示作答时间
```

## 🧪 测试场景

### 场景1：正常答题流程

1. 开始答题，验证第一题计时开始
2. 答完一题点击下一题，验证时间记录
3. 继续答题直到完成
4. 提交后查看结果，验证时间显示

### 场景2：前后翻页

1. 答题过程中点击"上一题"
2. 验证时间累计计算正确
3. 重新回到题目时重新开始计时

### 场景3：超时警告

1. 在某道题停留超过90秒
2. 验证结果中显示红色警告
3. 管理端也应显示警告标识

### 场景4：自动提交

1. 测试时间到自动提交的场景
2. 验证最后一题的时间被正确记录

## 📊 数据统计价值

### 对教师/管理员的价值

1. **识别难题**：作答时间长的题目可能过于困难
2. **发现问题**：某些学生在特定题目上花费过多时间
3. **优化测评**：根据时间数据优化题目设计
4. **检测异常**：发现可能的作弊或技术问题

### 对学生的价值

1. **自我评估**：了解自己的答题速度
2. **时间管理**：学习合理分配答题时间
3. **反思改进**：分析哪些类型题目需要更多练习

## 🚀 未来扩展

### 可能的增强功能

1. **平均时间对比**：显示题目的平均作答时间
2. **时间分析图表**：可视化时间分布
3. **时间预警**：答题过程中的实时时间提醒
4. **时间排行**：显示最快/最慢答题记录
5. **时间趋势**：分析学生答题速度的变化趋势

## ✅ 实现状态

- ✅ 数据库模型更新
- ✅ 前端时间记录逻辑
- ✅ API数据传输
- ✅ 后端数据处理
- ✅ 学生端结果展示
- ✅ 管理端统计展示
- ✅ 超时警告功能
- ✅ 响应式UI设计

**总结**：作答时间统计功能已完整实现，可以准确记录和展示每道题的作答时间，并提供超时警告功能。
