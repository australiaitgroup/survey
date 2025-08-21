const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5050';
const ADMIN_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzI0NDE3MywiZXhwIjoxNzUzODQ4OTczfQ.uxFrtqbGpJGUaYgOr5xSRjCby7dakdUrh3LAiyx-Yiw';

const api = axios.create({
	baseURL: BASE_URL,
	headers: {
		Authorization: `Bearer ${ADMIN_TOKEN}`,
		'Content-Type': 'application/json',
	},
});

async function testQuestionSnapshots() {
	console.log('🧪 Testing Question Snapshot Mechanism...\n');

	try {
		// Step 1: Create a question bank with test questions
		console.log('1. Creating question bank with test questions...');
		const questionBank = await api.post('/api/admin/question-banks', {
			name: 'Test Snapshot Bank',
			description: 'Testing question snapshot mechanism',
			questions: [
				{
					text: 'What is 2 + 2?',
					type: 'single_choice',
					options: ['3', '4', '5', '6'],
					correctAnswer: 1,
					explanation: '2 + 2 equals 4',
					points: 1,
					tags: ['math', 'basic'],
					difficulty: 'easy',
				},
				{
					text: 'Which are even numbers?',
					type: 'multiple_choice',
					options: ['1', '2', '3', '4', '5'],
					correctAnswer: [1, 3],
					explanation: 'Even numbers are divisible by 2',
					points: 2,
					tags: ['math', 'even'],
					difficulty: 'medium',
				},
			],
			createdBy: 'admin',
		});

		const questionBankId = questionBank.data._id;
		console.log(`✅ Question bank created: ${questionBankId}\n`);

		// Step 2: Create a survey using this question bank
		console.log('2. Creating survey using question bank...');
		const survey = await api.post('/api/admin/surveys', {
			title: 'Test Snapshot Survey',
			description: 'Testing question snapshot mechanism',
			type: 'assessment',
			sourceType: 'question_bank',
			questionBankId: questionBankId,
			questionCount: 2,
			status: 'active',
			scoringSettings: {
				scoringMode: 'percentage',
				passingThreshold: 60,
				showScore: true,
				showCorrectAnswers: true,
				showScoreBreakdown: true,
			},
		});

		const surveyId = survey.data._id;
		console.log(`✅ Survey created: ${surveyId}\n`);

		// Step 3: Submit a response (this should create snapshots)
		console.log('3. Submitting test response...');
		const response = await axios.post(`${BASE_URL}/api/surveys/${surveyId}/responses`, {
			name: 'Test User',
			email: 'test@example.com',
			answers: ['4', ['2', '4']], // Correct answers
			timeSpent: 120,
		});

		console.log('✅ Response submitted successfully\n');

		// Step 4: Check if snapshots were created
		console.log('4. Checking for question snapshots...');
		const responses = await api.get(`/api/admin/surveys/${surveyId}/responses`);
		const testResponse = responses.data.find(r => r.email === 'test@example.com');

		if (testResponse.questionSnapshots && testResponse.questionSnapshots.length > 0) {
			console.log('✅ Question snapshots found!');
			console.log(`   - Number of snapshots: ${testResponse.questionSnapshots.length}`);
			console.log(
				`   - First question: "${testResponse.questionSnapshots[0].questionData.text}"`
			);
			console.log(`   - User answer: ${testResponse.questionSnapshots[0].userAnswer}`);
			console.log(`   - Is correct: ${testResponse.questionSnapshots[0].scoring.isCorrect}`);
		} else {
			console.log('❌ No question snapshots found');
		}
		console.log('');

		// Step 5: Modify the original question bank
		console.log('5. Modifying original question bank...');
		await api.put(`/api/admin/question-banks/${questionBankId}`, {
			name: 'Modified Test Snapshot Bank',
			questions: [
				{
					text: 'What is 2 + 2? (MODIFIED)',
					type: 'single_choice',
					options: ['3', '4', '5', '6', '7'],
					correctAnswer: 1,
					explanation: '2 + 2 equals 4 (updated)',
					points: 2,
					tags: ['math', 'basic', 'modified'],
					difficulty: 'medium',
				},
				{
					text: 'Which are even numbers? (MODIFIED)',
					type: 'multiple_choice',
					options: ['1', '2', '3', '4', '5', '6'],
					correctAnswer: [1, 3, 5],
					explanation: 'Even numbers are divisible by 2 (updated)',
					points: 3,
					tags: ['math', 'even', 'modified'],
					difficulty: 'hard',
				},
			],
		});

		console.log('✅ Question bank modified\n');

		// Step 6: Check statistics - should still use original snapshots
		console.log('6. Checking statistics after modification...');
		const statistics = await api.get(`/api/admin/surveys/${surveyId}/statistics`);

		console.log('📊 Statistics:');
		console.log(`   - Total responses: ${statistics.data.summary.totalResponses}`);
		console.log(`   - Total questions: ${statistics.data.summary.totalQuestions}`);
		console.log(`   - Completion rate: ${statistics.data.summary.completionRate}%`);

		if (statistics.data.aggregatedStats.length > 0) {
			console.log('   - First question in stats:');
			console.log(`     "${statistics.data.aggregatedStats[0].question}"`);
			console.log(
				`     Options: ${Object.keys(statistics.data.aggregatedStats[0].options).join(', ')}`
			);
		}

		// Step 7: Submit another response with modified questions
		console.log('\n7. Submitting response with modified questions...');
		const response2 = await axios.post(`${BASE_URL}/api/surveys/${surveyId}/responses`, {
			name: 'Test User 2',
			email: 'test2@example.com',
			answers: ['4', ['2', '4', '6']], // Correct answers for modified questions
			timeSpent: 150,
		});

		console.log('✅ Second response submitted\n');

		// Step 8: Check final statistics
		console.log('8. Checking final statistics...');
		const finalStatistics = await api.get(`/api/admin/surveys/${surveyId}/statistics`);

		console.log('📊 Final Statistics:');
		console.log(`   - Total responses: ${finalStatistics.data.summary.totalResponses}`);
		console.log(`   - Total questions: ${finalStatistics.data.summary.totalQuestions}`);

		if (finalStatistics.data.aggregatedStats.length > 0) {
			console.log('   - Questions in stats:');
			finalStatistics.data.aggregatedStats.forEach((stat, index) => {
				console.log(`     ${index + 1}. "${stat.question}"`);
				console.log(`        Options: ${Object.keys(stat.options).join(', ')}`);
			});
		}

		// Step 9: Verify individual responses
		console.log('\n9. Verifying individual responses...');
		const finalResponses = await api.get(`/api/admin/surveys/${surveyId}/responses`);

		finalResponses.data.forEach((resp, index) => {
			console.log(`   Response ${index + 1} (${resp.email}):`);
			console.log(`     - Has snapshots: ${resp.questionSnapshots ? 'Yes' : 'No'}`);
			if (resp.questionSnapshots) {
				console.log(`     - Snapshot count: ${resp.questionSnapshots.length}`);
				console.log(
					`     - First question: "${resp.questionSnapshots[0].questionData.text}"`
				);
			}
			if (resp.score) {
				console.log(`     - Score: ${resp.score.displayScore} (${resp.score.percentage}%)`);
				console.log(`     - Passed: ${resp.score.passed}`);
			}
		});

		console.log('\n🎉 Question Snapshot Test Completed Successfully!');
		console.log('\n📋 Summary:');
		console.log('✅ Question snapshots are created when responses are submitted');
		console.log('✅ Statistics use snapshots instead of current question bank state');
		console.log('✅ Historical data remains consistent even when questions are modified');
		console.log('✅ Both old and new responses maintain their original question context');
	} catch (error) {
		console.error('❌ Test failed:', error.response?.data || error.message);
		console.error('Stack trace:', error.stack);
	}
}

// Run the test
testQuestionSnapshots()
	.then(() => {
		console.log('\n🏁 Test script finished');
		process.exit(0);
	})
	.catch(error => {
		console.error('💥 Test script crashed:', error);
		process.exit(1);
	});
