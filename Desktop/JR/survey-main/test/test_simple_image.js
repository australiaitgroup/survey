const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testSimpleImage() {
	console.log('🧪 开始简单图片测试...\n');

	try {
		// 1. 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		// 2. 创建简单测试调查
		console.log('2. 创建简单测试调查...');
		const surveyData = {
			title: 'Simple Image Test',
			description: 'Testing basic image functionality',
			slug: 'simple-image-test',
			type: 'assessment',
			status: 'active',
			questions: [
				{
					text: 'What do you see in the image?',
					imageUrl: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Test+Image',
					type: 'single_choice',
					options: [
						{
							text: 'A blue rectangle',
							imageUrl: 'https://via.placeholder.com/100x100/10B981/FFFFFF?text=A',
						},
						{
							text: 'A red circle',
							imageUrl: 'https://via.placeholder.com/100x100/EF4444/FFFFFF?text=B',
						},
					],
					correctAnswer: 0,
					points: 5,
				},
			],
		};

		console.log('发送的数据:', JSON.stringify(surveyData, null, 2));

		const createResponse = await axios.post(`${BASE_URL}/api/admin/surveys`, surveyData);
		const survey = createResponse.data;
		console.log(`✅ 测试调查创建成功: ${survey.title}`);

		// 3. 验证数据
		const surveyResponse = await axios.get(`${BASE_URL}/api/admin/surveys/${survey._id}`);
		const surveyData2 = surveyResponse.data;

		console.log('\n📊 验证数据:');
		console.log(`问题数量: ${surveyData2.questions.length}`);
		surveyData2.questions.forEach((q, index) => {
			console.log(`问题 ${index + 1}:`);
			console.log(`  - 文本: ${q.text}`);
			console.log(`  - 图片: ${q.imageUrl ? '✅' : '❌'}`);
			console.log(`  - 选项数量: ${q.options ? q.options.length : 0}`);
			if (q.options) {
				q.options.forEach((opt, optIndex) => {
					if (typeof opt === 'object') {
						console.log(
							`    选项 ${optIndex + 1}: ${opt.text} - 图片: ${opt.imageUrl ? '✅' : '❌'}`
						);
					} else {
						console.log(`    选项 ${optIndex + 1}: ${opt} - 图片: ❌`);
					}
				});
			}
		});

		// 4. 清理
		await axios.delete(`${BASE_URL}/api/admin/surveys/${survey._id}`);
		console.log('\n✅ 测试完成');
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
		if (error.response?.data?.message) {
			console.error('详细错误:', error.response.data.message);
		}
	}
}

testSimpleImage();
