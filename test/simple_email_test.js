const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function simpleEmailTest() {
	try {
		// 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		// 获取所有调查
		console.log('获取所有调查...');
		const surveysResponse = await axios.get(`${BASE_URL}/api/admin/surveys`);
		const surveys = surveysResponse.data;

		if (surveys.length === 0) {
			console.log('没有找到调查，请先创建一些调查和答案');
			return;
		}

		// 使用第一个调查进行测试
		const survey = surveys[0];
		console.log(`使用调查: ${survey.title} (ID: ${survey._id})`);

		// 测试email查询
		console.log('\n测试email查询...');
		const emailQuery = 'test1@example.com';
		const statsResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=${emailQuery}`
		);

		console.log(`查询email: ${emailQuery}`);
		console.log(`返回记录数: ${statsResponse.data.userResponses.length}`);
		console.log('返回的记录:');
		statsResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});
	} catch (error) {
		console.error('测试失败:', error.response?.data || error.message);
	}
}

simpleEmailTest();
