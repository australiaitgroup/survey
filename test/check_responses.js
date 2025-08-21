const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function checkResponses() {
	try {
		// 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		// 获取所有调查
		console.log('获取所有调查...');
		const surveysResponse = await axios.get(`${BASE_URL}/api/admin/surveys`);
		const surveys = surveysResponse.data;

		if (surveys.length === 0) {
			console.log('没有找到调查');
			return;
		}

		// 检查每个调查的响应
		for (const survey of surveys) {
			console.log(`\n检查调查: ${survey.title} (ID: ${survey._id})`);

			// 获取统计信息（不包含过滤）
			const statsResponse = await axios.get(
				`${BASE_URL}/api/admin/surveys/${survey._id}/statistics`
			);

			console.log(`总响应数: ${statsResponse.data.summary.totalResponses}`);

			if (statsResponse.data.userResponses.length > 0) {
				console.log('响应记录:');
				statsResponse.data.userResponses.forEach((resp, index) => {
					console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
				});

				// 测试email查询
				const firstEmail = statsResponse.data.userResponses[0].email;
				console.log(`\n测试查询email: ${firstEmail}`);

				const filteredResponse = await axios.get(
					`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=${firstEmail}`
				);

				console.log(`过滤后记录数: ${filteredResponse.data.userResponses.length}`);
				if (filteredResponse.data.userResponses.length !== 1) {
					console.log('❌ Email过滤失败！');
				} else {
					console.log('✅ Email过滤正常');
				}

				break; // 只检查第一个有响应的调查
			} else {
				console.log('没有响应记录');
			}
		}
	} catch (error) {
		console.error('检查失败:', error.response?.data || error.message);
	}
}

checkResponses();
