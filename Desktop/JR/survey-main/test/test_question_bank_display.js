const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzUwODc5MiwiZXhwIjoxNzU0MTEzNTkyfQ.AhS8CHSFi-KqBmmD7LnHw529UVgdEQnCj9P7Ua1NoxE';

async function testQuestionBankDisplay() {
	console.log('🧪 Testing Question Bank Display Feature...\\n');

	try {
		// 1. 获取所有 surveys
		console.log('1. Fetching all surveys...');
		const surveysResponse = await axios.get(`${BASE_URL}/api/admin/surveys`, {
			headers: { Authorization: `Bearer ${TOKEN}` },
		});

		if (surveysResponse.data) {
			console.log(`✅ Found ${surveysResponse.data.length} surveys`);

			// 2. 查找使用 Question Bank 的 survey
			const questionBankSurveys = surveysResponse.data.filter(
				survey => survey.sourceType === 'question_bank'
			);

			console.log(`📋 Found ${questionBankSurveys.length} surveys using Question Bank`);

			// 3. 检查特定的 survey (6884d5228d6ed60daed2391e)
			const targetSurvey = surveysResponse.data.find(
				survey => survey._id === '6884d5228d6ed60daed2391e'
			);

			if (targetSurvey) {
				console.log('\\n🎯 Target Survey Details:');
				console.log(`   Title: ${targetSurvey.title}`);
				console.log(`   Source Type: ${targetSurvey.sourceType}`);
				console.log(`   Question Count: ${targetSurvey.questionCount}`);
				console.log(`   Question Bank ID: ${targetSurvey.questionBankId}`);

				// 4. 检查 Question Bank 是否存在
				if (targetSurvey.questionBankId) {
					console.log('\\n🔍 Checking Question Bank existence...');
					try {
						const questionBankResponse = await axios.get(
							`${BASE_URL}/api/admin/question-banks/${targetSurvey.questionBankId}`,
							{
								headers: { Authorization: `Bearer ${TOKEN}` },
							}
						);

						if (questionBankResponse.data) {
							console.log('✅ Question Bank found:');
							console.log(`   Name: ${questionBankResponse.data.name}`);
							console.log(`   Description: ${questionBankResponse.data.description}`);
							console.log(
								`   Questions Count: ${questionBankResponse.data.questions?.length || 0}`
							);
						}
					} catch (error) {
						console.log(
							'❌ Question Bank not found or error:',
							error.response?.data || error.message
						);
					}
				}

				if (
					targetSurvey.questionBankId &&
					typeof targetSurvey.questionBankId === 'object'
				) {
					console.log(
						`   Question Bank: ${targetSurvey.questionBankId.name || 'No name'}`
					);
					console.log(`   Question Bank ID: ${targetSurvey.questionBankId._id}`);
					console.log(
						`   Question Bank Description: ${targetSurvey.questionBankId.description || 'No description'}`
					);
				} else {
					console.log('   ❌ Question Bank ID is not populated (should be an object)');
				}
			} else {
				console.log('❌ Target survey not found');
			}
		}
	} catch (error) {
		console.error('❌ Error:', error.response?.data || error.message);
	}
}

testQuestionBankDisplay();
