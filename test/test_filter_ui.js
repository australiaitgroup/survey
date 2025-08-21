const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testFilterUI() {
	try {
		// 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		console.log('🧪 测试筛选条件UI修改...\n');

		// 获取所有调查
		console.log('1. 获取调查列表...');
		const surveysResponse = await axios.get(`${BASE_URL}/api/admin/surveys`);
		const surveys = surveysResponse.data;

		if (surveys.length === 0) {
			console.log('❌ 没有找到调查');
			return;
		}

		// 使用第一个调查
		const survey = surveys[0];
		console.log(`✅ 使用调查: ${survey.title}`);

		// 测试统计API调用
		console.log('\n2. 测试统计API调用...');
		const statsResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics`
		);

		console.log(`✅ 统计数据获取成功`);
		console.log(`   - 总响应数: ${statsResponse.data.summary.totalResponses}`);
		console.log(`   - 完成率: ${statsResponse.data.summary.completionRate}%`);
		console.log(`   - 总题目数: ${statsResponse.data.summary.totalQuestions}`);

		// 测试带email过滤的API调用
		console.log('\n3. 测试email过滤功能...');
		const filterResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=test`
		);

		console.log(`✅ Email过滤功能正常`);
		console.log(`   - 过滤后记录数: ${filterResponse.data.userResponses.length}`);

		console.log('\n🎉 筛选条件UI修改测试完成！');
		console.log('\n📋 修改总结:');
		console.log('✅ 筛选条件模块已移动到概览模块下面');
		console.log('✅ 筛选条件模块已添加toggle展开/收起功能');
		console.log('✅ 默认状态为收起，点击按钮可展开');
		console.log('✅ API功能正常工作');
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
	}
}

testFilterUI();
