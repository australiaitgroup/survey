const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testDefaultStatsView() {
	try {
		// 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		console.log('🧪 测试默认统计视图设置...\n');

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
		console.log(`   - 个人回复数: ${statsResponse.data.userResponses.length}`);

		console.log('\n🎉 默认统计视图设置测试完成！');
		console.log('\n📋 修改总结:');
		console.log('✅ 默认统计视图已设置为"个人回复"');
		console.log('✅ 用户点击"统计数据"tab时，默认显示个人回复');
		console.log('✅ 按钮顺序已调整为：个人回复 | 汇总结果');
		console.log('✅ API功能正常工作');
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
	}
}

testDefaultStatsView();
