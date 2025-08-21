# 题目快照系统 (Question Snapshot System)

## 🎯 问题背景

在传统的测评系统中，统计功能直接依赖于题库中的题目数据。这导致了以下严重问题：

1. **数据不一致性**: 当题库中的题目被修改（题干、选项、正确答案等）时，历史答题记录的统计会发生变化
2. **数据丢失**: 当题目被删除时，历史记录中的引用失效，可能导致系统报错
3. **统计失真**: 无法准确反映用户答题时的真实情况

## ✅ 解决方案：题目快照机制

### 核心思想

在用户提交答题时，将完整的题目信息作为快照保存到答题记录中，实现统计与题库的解耦。

### 数据结构设计

#### 1. Response 模型增强

```javascript
// 新增字段：questionSnapshots
questionSnapshots: [
	{
		questionId: ObjectId, // 原题 ID（可选，用于向后兼容）
		questionIndex: Number, // 题目在测评中的索引
		questionData: {
			// 完整的题目数据快照
			text: String, // 题目文本
			type: String, // 题目类型
			options: [String], // 选项（选择题）
			correctAnswer: Mixed, // 正确答案
			explanation: String, // 解释
			points: Number, // 分值
			tags: [String], // 标签
			difficulty: String, // 难度
		},
		userAnswer: Mixed, // 用户答案
		scoring: {
			// 该题评分信息
			isCorrect: Boolean, // 是否正确
			pointsAwarded: Number, // 获得分值
			maxPoints: Number, // 最大分值
		},
	},
];
```

#### 2. 快照创建方法

```javascript
// Response 模型方法
responseSchema.methods.createQuestionSnapshots = function (questions, userAnswers) {
	this.questionSnapshots = questions.map((question, index) => {
		const userAnswer = userAnswers[index] || null;

		// 创建题目数据快照
		const questionSnapshot = {
			questionId: question._id || null,
			questionIndex: index,
			questionData: {
				text: question.text,
				type: question.type,
				options: question.options || [],
				correctAnswer: question.correctAnswer,
				explanation: question.explanation || null,
				points: question.points || 1,
				tags: question.tags || [],
				difficulty: question.difficulty || 'medium',
			},
			userAnswer: userAnswer,
			scoring: {
				isCorrect: false,
				pointsAwarded: 0,
				maxPoints: question.points || 1,
			},
		};

		// 计算该题评分
		if (question.correctAnswer !== undefined && question.correctAnswer !== null) {
			// 根据题目类型计算正确性
			let isCorrect = false;

			if (question.type === 'single_choice') {
				const correctOption = question.options[question.correctAnswer];
				isCorrect = userAnswer === correctOption;
			} else if (question.type === 'multiple_choice') {
				const correctOptions = Array.isArray(question.correctAnswer)
					? question.correctAnswer.map(idx => question.options[idx])
					: [question.options[question.correctAnswer]];
				const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

				isCorrect =
					correctOptions.length === userAnswerArray.length &&
					correctOptions.every(opt => userAnswerArray.includes(opt));
			} else if (question.type === 'short_text') {
				isCorrect = userAnswer === question.correctAnswer;
			}

			questionSnapshot.scoring.isCorrect = isCorrect;
			questionSnapshot.scoring.pointsAwarded = isCorrect ? question.points || 1 : 0;
		}

		return questionSnapshot;
	});
};
```

### 实现流程

#### 1. 答题提交时创建快照

```javascript
// services/surveyService.js
async function saveSurveyResponse(data) {
	// ... 获取 survey 和 questions

	// 准备用户答案数组
	const userAnswersArray = [];

	// 处理答案格式
	if (Array.isArray(data.answers)) {
		data.answers.forEach((answer, index) => {
			userAnswersArray[index] = answer;
			// ... 处理答案
		});
	}

	// 创建或更新响应
	let response;
	if (existingResponse) {
		// 更新现有响应
		response = existingResponse;
	} else {
		// 创建新响应
		response = new ResponseModel({ ...data, answers: processedAnswers });
	}

	// 创建题目快照
	if (questionsToProcess.length > 0) {
		response.createQuestionSnapshots(questionsToProcess, userAnswersArray);
	}

	// 计算总分
	if (survey.requiresAnswers) {
		response.calculateScore(survey);
	}

	await response.save();
	return response.toObject();
}
```

#### 2. 统计时优先使用快照

```javascript
// routes/admin.js - 统计接口
router.get('/surveys/:surveyId/statistics', async (req, res) => {
	const responses = await Response.find({ surveyId }).lean();

	// 检查是否有快照数据
	const responsesWithSnapshots = responses.filter(
		r => r.questionSnapshots && r.questionSnapshots.length > 0
	);

	let questions = [];
	let useSnapshots = false;

	if (responsesWithSnapshots.length > 0) {
		// 使用快照数据
		const firstResponseWithSnapshots = responsesWithSnapshots[0];
		questions = firstResponseWithSnapshots.questionSnapshots
			.sort((a, b) => a.questionIndex - b.questionIndex)
			.map(snapshot => snapshot.questionData);
		useSnapshots = true;
	} else {
		// 回退到传统方法
		questions = await getQuestionsFromSurvey(survey);
	}

	// 计算统计时使用快照数据
	const stats = questions.map((q, questionIndex) => {
		const counts = {};
		// ... 初始化计数

		responses.forEach(r => {
			if (useSnapshots && r.questionSnapshots) {
				// 使用快照数据
				const snapshot = r.questionSnapshots.find(s => s.questionIndex === questionIndex);
				if (snapshot && snapshot.userAnswer) {
					// 直接使用快照中的用户答案
					if (Array.isArray(snapshot.userAnswer)) {
						snapshot.userAnswer.forEach(answer => {
							if (counts.hasOwnProperty(answer)) {
								counts[answer] += 1;
							}
						});
					} else {
						if (counts.hasOwnProperty(snapshot.userAnswer)) {
							counts[snapshot.userAnswer] += 1;
						}
					}
				}
			} else {
				// 传统方法处理答案
				// ... 原有的答案处理逻辑
			}
		});

		return { question: q.text, options: counts };
	});

	// ... 返回统计结果
});
```

### 优势分析

#### 1. 数据一致性

- ✅ 历史答题记录不受题库修改影响
- ✅ 统计结果始终反映用户答题时的真实情况
- ✅ 即使题目被删除，历史数据仍然完整

#### 2. 向后兼容

- ✅ 支持现有的答题记录（无快照的旧数据）
- ✅ 自动回退到传统统计方法
- ✅ 平滑迁移，无需数据迁移

#### 3. 性能优化

- ✅ 统计时无需查询题库
- ✅ 减少数据库查询次数
- ✅ 提高统计接口响应速度

#### 4. 数据完整性

- ✅ 保存完整的题目上下文
- ✅ 包含用户答案和评分信息
- ✅ 支持详细的答题分析

### 测试验证

运行测试脚本验证快照机制：

```bash
node test/test_question_snapshots.js
```

测试步骤：

1. 创建题库和测评
2. 提交答题（创建快照）
3. 修改题库题目
4. 验证统计仍使用原始快照
5. 提交新答题（使用修改后的题目）
6. 验证新旧数据共存

### 部署说明

#### 1. 数据库迁移

- 无需数据迁移，新字段为可选
- 现有答题记录继续使用传统方法
- 新答题记录自动创建快照

#### 2. 代码部署

- 部署新的 Response 模型
- 部署更新的统计接口
- 部署修改的答题提交逻辑

#### 3. 监控要点

- 监控快照创建成功率
- 监控统计接口性能
- 监控数据库存储增长

### 总结

题目快照机制成功解决了测评系统中统计与题库版本绑定的问题，确保了：

1. **数据一致性**: 历史数据不受题库修改影响
2. **系统稳定性**: 即使题目被删除也不会影响统计
3. **向后兼容**: 平滑支持现有数据
4. **性能优化**: 减少数据库查询，提高响应速度

这一机制为测评系统提供了可靠的数据基础，确保了统计结果的准确性和一致性。
