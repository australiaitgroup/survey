const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

// Create axios instance with credentials
const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
});

async function testQuestionUpdate() {
	console.log('🧪 Testing Question Update...\n');

	try {
		// 1. Login as admin
		console.log('1. Logging in as admin...');
		const loginResponse = await api.post('/api/admin/login', {
			username: 'admin',
			password: 'password',
		});

		if (!loginResponse.data.success) {
			console.log('❌ Login failed');
			return;
		}
		console.log('✅ Login successful');

		const token = loginResponse.data.token;

		// 2. Get surveys to find one with questions
		console.log('\n2. Getting surveys...');
		const surveysResponse = await api.get('/api/admin/surveys', {
			headers: { Authorization: `Bearer ${token}` },
		});

		const survey = surveysResponse.data.find(s => s.questions && s.questions.length > 0);
		if (!survey) {
			console.log('❌ No survey with questions found');
			return;
		}

		console.log('✅ Found survey with questions');
		console.log('   - Survey ID:', survey._id);
		console.log('   - Questions count:', survey.questions.length);
		console.log('   - First question:', survey.questions[0]);

		// 3. Test updating the first question
		console.log('\n3. Testing question update...');
		const questionIndex = 0;
		const originalQuestion = survey.questions[questionIndex];

		const updateData = {
			text: originalQuestion.text + ' (Updated)',
			options: [...originalQuestion.options, 'New Option'],
			correctAnswer: originalQuestion.correctAnswer,
			points: originalQuestion.points || 1,
		};

		console.log('   - Update data:', updateData);

		const updateResponse = await api.put(
			`/api/admin/surveys/${survey._id}/questions/${questionIndex}`,
			updateData,
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		console.log('✅ Question updated successfully');
		console.log('   - Updated question:', updateResponse.data.questions[questionIndex]);

		// 4. Test with invalid data to see what causes 400 error
		console.log('\n4. Testing with invalid data...');
		try {
			const invalidData = {
				text: '', // Empty text should cause error
				options: ['Option 1', 'Option 2'],
				correctAnswer: 0,
				points: 1,
			};

			await api.put(
				`/api/admin/surveys/${survey._id}/questions/${questionIndex}`,
				invalidData,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
		} catch (error) {
			console.log('✅ Expected error caught');
			console.log('   - Status:', error.response?.status);
			console.log('   - Error:', error.response?.data?.error);
		}

		console.log('\n🎉 Question update test completed!');
	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		if (error.response) {
			console.error('Response status:', error.response.status);
			console.error('Response data:', error.response.data);
		}
	}
}

// Run the test
testQuestionUpdate();
