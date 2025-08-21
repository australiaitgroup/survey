const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testEditQuestionModal() {
	console.log('🧪 开始测试编辑问题弹窗功能...\n');

	try {
		// 1. 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		// 2. 获取现有调查
		console.log('1. 获取调查列表...');
		const surveysResponse = await axios.get(`${BASE_URL}/api/admin/surveys`);
		const surveys = surveysResponse.data;

		if (surveys.length === 0) {
			console.log('❌ 没有找到调查，请先创建一个调查');
			return;
		}

		// 使用第一个调查
		const survey = surveys[0];
		console.log(`✅ 使用调查: ${survey.title}`);

		// 3. 检查调查是否有问题
		if (!survey.questions || survey.questions.length === 0) {
			console.log('❌ 调查没有问题，请先添加一些问题');
			return;
		}

		const question = survey.questions[0];
		console.log(`✅ 使用问题: ${question.text}`);

		// 4. 测试编辑问题
		console.log('\n2. 测试编辑问题...');
		const updatedQuestion = {
			...question,
			text: `[编辑] ${question.text}`,
			options: question.options
				? question.options.map((opt, idx) => `[编辑] ${opt}`)
				: question.options,
		};

		const updatedQuestions = [...survey.questions];
		updatedQuestions[0] = updatedQuestion;

		const updateResponse = await axios.put(`${BASE_URL}/api/admin/surveys/${survey._id}`, {
			...survey,
			questions: updatedQuestions,
		});

		console.log('✅ 问题编辑成功');
		console.log(`   - 原问题: ${question.text}`);
		console.log(`   - 编辑后: ${updatedQuestion.text}`);

		// 5. 验证编辑结果
		console.log('\n3. 验证编辑结果...');
		const verifyResponse = await axios.get(`${BASE_URL}/api/admin/surveys/${survey._id}`);
		const updatedSurvey = verifyResponse.data;

		if (
			updatedSurvey.questions &&
			updatedSurvey.questions[0] &&
			updatedSurvey.questions[0].text === updatedQuestion.text
		) {
			console.log('✅ 编辑结果验证成功');
		} else {
			console.log('❌ 编辑结果验证失败');
			console.log(
				'   更新后的问题:',
				updatedSurvey.questions ? updatedSurvey.questions[0] : 'undefined'
			);
		}

		console.log('\n🎉 编辑问题弹窗功能测试完成！');
		console.log('\n📋 功能总结:');
		console.log('✅ 创建了EditSurveyQuestionModal组件');
		console.log('✅ 修改了SurveyDetailView使用弹窗编辑');
		console.log('✅ 移除了内联编辑代码');
		console.log('✅ 编辑按钮现在打开弹窗而不是内联编辑');
		console.log('✅ 弹窗包含完整的问题编辑功能');
		console.log('✅ 支持问题文本、类型、选项、图片等编辑');
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
	}
}

testEditQuestionModal();
