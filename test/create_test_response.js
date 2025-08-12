const mongoose = require('mongoose');
const Response = require('../models/Response');
const Survey = require('../models/Survey');
const User = require('../models/User');

async function createTestResponse() {
	try {
		// Connect to MongoDB
		await mongoose.connect('mongodb://localhost:27017/survey_app');
		console.log('Connected to MongoDB');

		// Find or create a survey
		let survey = await Survey.findOne();
		if (!survey) {
			// Create a test user first
			let user = await User.findOne();
			if (!user) {
				user = new User({
					name: 'Test User',
					email: 'test@example.com',
					password: 'hashedpassword',
					role: 'admin'
				});
				await user.save();
				console.log('Created test user');
			}

			survey = new Survey({
				title: 'Test Assessment',
				type: 'assessment',
				description: 'A test assessment for candidate detail view',
				createdBy: user._id,
				questions: [
					{
						text: 'What is 2 + 2?',
						type: 'single_choice',
						options: [
							{ text: '3', imageUrl: null },
							{ text: '4', imageUrl: null },
							{ text: '5', imageUrl: null },
							{ text: '6', imageUrl: null }
						],
						correctAnswer: 1,
						points: 10,
						difficulty: 'easy',
						tags: ['math']
					},
					{
						text: 'What is the capital of France?',
						type: 'single_choice',
						options: [
							{ text: 'London', imageUrl: null },
							{ text: 'Berlin', imageUrl: null },
							{ text: 'Paris', imageUrl: null },
							{ text: 'Madrid', imageUrl: null }
						],
						correctAnswer: 2,
						points: 10,
						difficulty: 'medium',
						tags: ['geography']
					}
				],
				status: 'active',
				requiresAnswers: true
			});
			await survey.save();
			console.log('Created test survey');
		}

		// Create a test response
		const testResponse = new Response({
			name: 'John Doe',
			email: 'john.doe@example.com',
			surveyId: survey._id,
			answers: new Map([
				['0', '4'],
				['1', 'Paris']
			]),
			questionSnapshots: [
				{
					questionId: survey.questions[0]._id,
					questionIndex: 0,
					questionData: {
						text: 'What is 2 + 2?',
						type: 'single_choice',
						options: ['3', '4', '5', '6'],
						correctAnswer: 1,
						points: 10,
						difficulty: 'easy',
						tags: ['math']
					},
					userAnswer: '4',
					scoring: {
						isCorrect: true,
						pointsAwarded: 10,
						maxPoints: 10
					},
					durationInSeconds: 15
				},
				{
					questionId: survey.questions[1]._id,
					questionIndex: 1,
					questionData: {
						text: 'What is the capital of France?',
						type: 'single_choice',
						options: ['London', 'Berlin', 'Paris', 'Madrid'],
						correctAnswer: 2,
						points: 10,
						difficulty: 'medium',
						tags: ['geography']
					},
					userAnswer: 'Paris',
					scoring: {
						isCorrect: true,
						pointsAwarded: 10,
						maxPoints: 10
					},
					durationInSeconds: 8
				}
			],
			score: {
				totalPoints: 20,
				correctAnswers: 2,
				wrongAnswers: 0,
				percentage: 100,
				passed: true,
				scoringMode: 'percentage',
				maxPossiblePoints: 20,
				displayScore: 100,
				scoringDetails: {
					questionScores: [
						{
							questionIndex: 0,
							pointsAwarded: 10,
							maxPoints: 10,
							isCorrect: true
						},
						{
							questionIndex: 1,
							pointsAwarded: 10,
							maxPoints: 10,
							isCorrect: true
						}
					]
				}
			},
			timeSpent: 23,
			isAutoSubmit: false,
			metadata: {
				userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
				ipAddress: '192.168.1.100',
				deviceType: 'desktop'
			},
			createdAt: new Date()
		});

		await testResponse.save();
		console.log('Created test response with ID:', testResponse._id);
		console.log('Survey ID:', survey._id);
		
		console.log('\n✅ Test data created successfully!');
		console.log('You can now test the candidate detail view with response ID:', testResponse._id);

	} catch (error) {
		console.error('Failed to create test data:', error.message);
	} finally {
		await mongoose.disconnect();
		console.log('Disconnected from MongoDB');
	}
}

// Run the script
createTestResponse();