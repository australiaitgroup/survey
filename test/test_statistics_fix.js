const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

async function testStatisticsFix() {
	console.log('🧪 开始测试统计功能修复...\n');

	try {
		// 1. 登录管理员
		console.log('1. 登录管理员...');
		await axios.post(`${BASE_URL}/api/admin/login`, {
			username: ADMIN_USERNAME,
			password: ADMIN_PASSWORD,
		});
		console.log('✅ 登录成功\n');

		// 2. 创建测试调查
		console.log('2. 创建测试调查...');
		const surveyData = {
			title: '统计功能测试',
			description: '用于测试统计功能修复的调查',
		};
		const createSurveyResponse = await axios.post(`${BASE_URL}/api/admin/surveys`, surveyData);
		const survey = createSurveyResponse.data;
		console.log(`✅ 调查创建成功: ${survey.title} (ID: ${survey._id})\n`);

		// 3. 添加测试问题
		console.log('3. 添加测试问题...');
		const questionData = {
			text: '您最喜欢的编程语言是什么？',
			options: ['JavaScript', 'Python', 'Java', 'C++', '其他'],
			correctAnswers: ['JavaScript', 'Python'], // 多个正确答案
		};
		const addQuestionResponse = await axios.put(
			`${BASE_URL}/api/admin/surveys/${survey._id}/questions`,
			questionData
		);
		console.log('✅ 问题添加成功\n');

		// 4. 模拟提交答案（直接调用API）
		console.log('4. 模拟提交答案...');
		const mockResponses = [
			{
				name: '张三',
				email: 'zhangsan@test.com',
				answers: ['JavaScript'], // 单选答案
			},
			{
				name: '李四',
				email: 'lisi@test.com',
				answers: ['Python'], // 单选答案
			},
			{
				name: '王五',
				email: 'wangwu@test.com',
				answers: ['JavaScript', 'Python'], // 多选答案
			},
		];

		for (const response of mockResponses) {
			await axios.post(`${BASE_URL}/api/surveys/${survey._id}/responses`, {
				...response,
				surveyId: survey._id,
				timeSpent: 120,
			});
		}
		console.log('✅ 答案提交成功\n');

		// 5. 获取统计数据
		console.log('5. 获取统计数据...');
		const statsResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics`
		);
		const stats = statsResponse.data;
		console.log('✅ 统计数据获取成功\n');

		// 6. 验证统计数据
		console.log('6. 验证统计数据...');
		console.log(`总响应数: ${stats.summary.totalResponses}`);
		console.log(`完成率: ${stats.summary.completionRate}%`);
		console.log(`问题数: ${stats.summary.totalQuestions}`);

		// 验证聚合统计
		if (stats.aggregatedStats && stats.aggregatedStats.length > 0) {
			const questionStats = stats.aggregatedStats[0];
			console.log(`\n问题: ${questionStats.question}`);
			console.log('选项统计:');
			Object.entries(questionStats.options).forEach(([option, count]) => {
				console.log(`  ${option}: ${count} 次`);
			});
		}

		// 验证个人响应
		if (stats.userResponses && stats.userResponses.length > 0) {
			console.log('\n个人响应:');
			stats.userResponses.forEach((user, index) => {
				console.log(`\n用户 ${index + 1}: ${user.name} (${user.email})`);
				Object.entries(user.answers).forEach(([question, answer]) => {
					console.log(`  问题: ${question}`);
					console.log(`  答案: ${answer}`);
				});
			});
		}

		// 7. 验证数据正确性
		console.log('\n7. 验证数据正确性...');
		let isValid = true;

		// 检查总响应数
		if (stats.summary.totalResponses !== 3) {
			console.log('❌ 总响应数不正确');
			isValid = false;
		}

		// 检查个人响应数
		if (stats.userResponses.length !== 3) {
			console.log('❌ 个人响应数不正确');
			isValid = false;
		}

		// 检查答案内容
		const expectedAnswers = ['JavaScript', 'Python', 'JavaScript, Python'];
		const actualAnswers = stats.userResponses.map(u => Object.values(u.answers)[0]);

		for (let i = 0; i < expectedAnswers.length; i++) {
			if (actualAnswers[i] !== expectedAnswers[i]) {
				console.log(
					`❌ 答案不匹配: 期望 "${expectedAnswers[i]}"，实际 "${actualAnswers[i]}"`
				);
				isValid = false;
			}
		}

		if (isValid) {
			console.log('✅ 所有数据验证通过！\n');
		} else {
			console.log('❌ 数据验证失败！\n');
		}

		// 8. 清理测试数据
		console.log('8. 清理测试数据...');
		await axios.delete(`${BASE_URL}/api/admin/surveys/${survey._id}`);
		console.log('✅ 测试调查已删除\n');

		console.log('🎉 统计功能修复测试完成！');
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
	}
}

// 运行测试
testStatisticsFix().catch(console.error);
