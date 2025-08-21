const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

async function testSurveyTypeRestrictions() {
	console.log('🧪 Testing Survey Type Restrictions...\n');

	try {
		// 1. Login as admin
		console.log('1. Logging in as admin...');
		const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
			username: 'admin',
			password: 'password',
		});

		if (loginResponse.data.success) {
			console.log('✅ Login successful');
		} else {
			console.log('❌ Login failed');
			return;
		}

		// 2. Test creating a survey with type 'survey' - should only allow manual source
		console.log('\n2. Testing survey type restrictions...');

		// Test 1: Create survey with type 'survey' and manual source (should work)
		console.log('   Test 1: Creating survey with type "survey" and manual source...');
		try {
			const surveyData1 = {
				title: 'Test Survey - Manual',
				description: 'Test survey with manual questions',
				type: 'survey',
				sourceType: 'manual',
				questions: [
					{
						text: 'What is your favorite color?',
						options: ['Red', 'Blue', 'Green', 'Yellow'],
					},
				],
			};

			const response1 = await axios.post(`${BASE_URL}/api/admin/surveys`, surveyData1);
			console.log('   ✅ Survey created successfully with manual source');
			console.log(`   Survey ID: ${response1.data.survey._id}`);
		} catch (error) {
			console.log(
				'   ❌ Failed to create survey with manual source:',
				error.response?.data?.message || error.message
			);
		}

		// Test 2: Try to create survey with type 'survey' and question bank source (should fail)
		console.log(
			'\n   Test 2: Attempting to create survey with type "survey" and question bank source...'
		);
		try {
			const surveyData2 = {
				title: 'Test Survey - Question Bank (Should Fail)',
				description: 'This should fail because survey type cannot use question banks',
				type: 'survey',
				sourceType: 'question_bank',
				questionBankId: 'some-question-bank-id',
				questionCount: 5,
			};

			const response2 = await axios.post(`${BASE_URL}/api/admin/surveys`, surveyData2);
			console.log('   ❌ Survey was created when it should have failed');
		} catch (error) {
			console.log('   ✅ Correctly rejected survey with question bank source');
			console.log(`   Error: ${error.response?.data?.message || error.message}`);
		}

		// Test 3: Create assessment with question bank source (should work)
		console.log('\n   Test 3: Creating assessment with question bank source...');
		try {
			const surveyData3 = {
				title: 'Test Assessment - Question Bank',
				description: 'Test assessment with question bank',
				type: 'assessment',
				sourceType: 'question_bank',
				questionBankId: 'some-question-bank-id',
				questionCount: 5,
				maxAttempts: 1,
				scoringSettings: {
					scoringMode: 'percentage',
					totalPoints: 100,
					passingThreshold: 70,
					showScore: true,
					showCorrectAnswers: true,
					showScoreBreakdown: true,
					customScoringRules: {
						useCustomPoints: false,
						defaultQuestionPoints: 10,
					},
				},
			};

			const response3 = await axios.post(`${BASE_URL}/api/admin/surveys`, surveyData3);
			console.log('   ✅ Assessment created successfully with question bank source');
			console.log(`   Assessment ID: ${response3.data.survey._id}`);
		} catch (error) {
			console.log(
				'   ❌ Failed to create assessment with question bank source:',
				error.response?.data?.message || error.message
			);
		}

		console.log('\n🎉 Survey type restrictions test completed!');
		console.log('\nExpected behavior:');
		console.log('- Survey type should only allow manual question creation');
		console.log(
			'- Assessment/Quiz/IQ types should allow both manual and question bank sources'
		);
		console.log('- Frontend should disable question bank option when survey type is selected');
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
}

// Run the test
testSurveyTypeRestrictions();
