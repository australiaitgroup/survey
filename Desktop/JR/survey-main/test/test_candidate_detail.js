const mongoose = require('mongoose');
const Response = require('../models/Response');
const Survey = require('../models/Survey');
const User = require('../models/User');

async function testCandidateDetail() {
	try {
		// Connect to MongoDB
		await mongoose.connect('mongodb://localhost:27017/survey_app');
		console.log('Connected to MongoDB');

		// Find a response with populated data
		const response = await Response.findOne().populate('surveyId').lean().limit(1);

		if (!response) {
			console.log('No responses found in database');
			return;
		}

		console.log('\n=== Candidate Detail Test ===');
		console.log('Response ID:', response._id);
		console.log('Candidate Name:', response.name);
		console.log('Candidate Email:', response.email);

		if (response.surveyId) {
			console.log('\nSurvey Info:');
			console.log('- Title:', response.surveyId.title);
			console.log('- Type:', response.surveyId.type);
		}

		// Calculate statistics
		let totalQuestions = 0;
		let answeredQuestions = 0;

		if (response.questionSnapshots && response.questionSnapshots.length > 0) {
			totalQuestions = response.questionSnapshots.length;
			answeredQuestions = response.questionSnapshots.filter(
				s => s.userAnswer !== null && s.userAnswer !== undefined
			).length;

			console.log('\nQuestion Snapshots:');
			console.log('- Total Questions:', totalQuestions);
			console.log('- Answered:', answeredQuestions);
			console.log(
				'- Completion Rate:',
				((answeredQuestions / totalQuestions) * 100).toFixed(2) + '%'
			);

			// Time statistics
			const durations = response.questionSnapshots
				.filter(s => s.durationInSeconds > 0)
				.map(s => s.durationInSeconds);

			if (durations.length > 0) {
				console.log('\nTime Statistics:');
				console.log('- Fastest Question:', Math.min(...durations), 'seconds');
				console.log('- Slowest Question:', Math.max(...durations), 'seconds');
				console.log(
					'- Average Time:',
					(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
					'seconds'
				);
			}
		}

		if (response.score) {
			console.log('\nScore Information:');
			console.log('- Total Points:', response.score.totalPoints);
			console.log('- Max Possible:', response.score.maxPossiblePoints);
			console.log('- Percentage:', response.score.percentage + '%');
			console.log('- Passed:', response.score.passed ? 'Yes' : 'No');
		}

		if (response.timeSpent) {
			console.log(
				'\nTotal Time Spent:',
				Math.floor(response.timeSpent / 60),
				'minutes',
				response.timeSpent % 60,
				'seconds'
			);
		}

		if (response.metadata) {
			console.log('\nDevice Information:');
			if (response.metadata.ipAddress) {
				console.log('- IP Address:', response.metadata.ipAddress);
			}
			if (response.metadata.deviceType) {
				console.log('- Device Type:', response.metadata.deviceType);
			}
		}

		console.log('\n✅ Test completed successfully');
	} catch (error) {
		console.error('Test failed:', error.message);
	} finally {
		await mongoose.disconnect();
		console.log('Disconnected from MongoDB');
	}
}

// Run the test
testCandidateDetail();
