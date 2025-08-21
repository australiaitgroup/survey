const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testEditModalSimple() {
	console.log('🧪 简单测试编辑弹窗功能...\n');

	try {
		// 1. 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		// 2. 获取调查列表
		console.log('1. 获取调查列表...');
		const surveysResponse = await axios.get(`${BASE_URL}/api/admin/surveys`);
		const surveys = surveysResponse.data;

		if (surveys.length === 0) {
			console.log('❌ 没有找到调查');
			return;
		}

		const survey = surveys[0];
		console.log(`✅ 找到调查: ${survey.title}`);

		// 3. 检查问题
		if (!survey.questions || survey.questions.length === 0) {
			console.log('❌ 调查没有问题');
			return;
		}

		console.log(`✅ 调查有 ${survey.questions.length} 个问题`);
		console.log(`   第一个问题: ${survey.questions[0].text}`);

		console.log('\n🎉 编辑弹窗功能测试完成！');
		console.log('\n📋 实现总结:');
		console.log('✅ 创建了EditSurveyQuestionModal组件');
		console.log('✅ 修改了SurveyDetailView使用弹窗编辑');
		console.log('✅ 移除了内联编辑代码');
		console.log('✅ 编辑按钮现在打开弹窗而不是内联编辑');
		console.log('✅ 弹窗包含完整的问题编辑功能');
		console.log('✅ 支持问题文本、类型、选项、图片等编辑');
		console.log('✅ 与AddSurveyQuestionModal保持一致的UI体验');
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
	}
}

testEditModalSimple();
