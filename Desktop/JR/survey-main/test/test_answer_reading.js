// 模拟数据库中的响应数据
const mockResponses = [
	{
		_id: '686a61dfed5faa8e0cef4236',
		name: 'Tet',
		email: 'lightmanwang@gmail.com',
		surveyId: '686a5885bc9caf2373d95ef4',
		answers: { 0: 1, 1: 1 },
	},
	{
		_id: '686a63d6ed5faa8e0cef4263',
		name: 'Tet',
		email: 'yanbowang217@gmail.com',
		surveyId: '686a5885bc9caf2373d95ef4',
		answers: { 0: 2, 1: 1 },
	},
];

// 模拟调查问题
const mockSurvey = {
	questions: [
		{
			text: 'Sample question - please replace with your content',
			options: ['Option A', 'Option B', 'Option C', 'Option D'],
		},
		{
			text: '1+1',
			options: ['2', '3', '4'],
		},
	],
};

console.log('=== 测试答案读取逻辑 ===\n');

mockResponses.forEach((response, responseIndex) => {
	console.log(`响应 ${responseIndex + 1}: ${response.name} (${response.email})`);
	console.log(`原始答案:`, response.answers);

	mockSurvey.questions.forEach((question, questionIndex) => {
		// 模拟统计代码中的答案读取逻辑
		let ans = null;

		if (typeof response.answers === 'object' && response.answers !== null) {
			ans = response.answers[questionIndex.toString()];
			if (ans === undefined || ans === null) {
				ans = response.answers[question._id];
			}
			if (ans === undefined || ans === null) {
				ans = response.answers[question.text];
			}
		}

		console.log(`  问题 ${questionIndex}: "${question.text}"`);
		console.log(`    读取到的答案: ${ans} (类型: ${typeof ans})`);

		if (ans !== undefined && ans !== null) {
			if (typeof ans === 'number' || (typeof ans === 'string' && /^\d+$/.test(ans))) {
				const idx = typeof ans === 'number' ? ans : parseInt(ans, 10);
				if (idx >= 0 && idx < question.options.length) {
					const selectedOption = question.options[idx];
					console.log(`    解析结果: 选择了 "${selectedOption}" (索引 ${idx})`);
				} else {
					console.log(
						`    错误: 索引 ${idx} 超出范围 (0-${question.options.length - 1})`
					);
				}
			} else {
				console.log(`    错误: 答案格式不支持`);
			}
		} else {
			console.log(`    错误: 未找到答案`);
		}
		console.log('');
	});
	console.log('---\n');
});
