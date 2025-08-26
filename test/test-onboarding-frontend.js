const mongoose = require('mongoose');
const Survey = require('../models/Survey');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function testOnboardingFrontend() {
	try {
		console.log('🔌 Connecting to MongoDB...');
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB');

		// Create a simple onboarding survey for frontend testing
		console.log('\n📝 Creating Onboarding Survey for Frontend Testing...');
		const onboardingSurvey = new Survey({
			title: 'Frontend Test Onboarding',
			description: 'This is a test onboarding survey to verify the frontend functionality',
			type: 'onboarding',
			slug: 'frontend-test-onboarding',

			// Basic settings
			timeLimit: 30,
			maxAttempts: 2,
			instructions: 'Complete this test onboarding to verify frontend functionality',
			navigationMode: 'step-by-step',
			sourceType: 'manual',

			// Questions
			questions: [
				{
					text: 'What is the primary purpose of this onboarding?',
					description: 'Select the best answer from the options below.',
					type: 'single_choice',
					options: [
						'To test the frontend',
						'To learn something new',
						'To waste time',
						'To confuse users',
					],
					correctAnswer: 0,
					explanation: 'This onboarding is designed to test the frontend functionality.',
					points: 10,
				},
				{
					text: 'Which of the following are important for onboarding?',
					description: 'Select all that apply.',
					type: 'multiple_choice',
					options: [
						'Clear instructions',
						'Progressive learning',
						'Time tracking',
						'Progress monitoring',
					],
					correctAnswer: [0, 1, 2, 3],
					explanation: 'All of these elements are important for effective onboarding.',
					points: 15,
				},
			],

			status: 'active',
			createdBy: 'test@company.com',
		});

		await onboardingSurvey.save();
		console.log('✅ Frontend Test Onboarding Survey created successfully');
		console.log(`   - ID: ${onboardingSurvey._id}`);
		console.log(`   - Slug: ${onboardingSurvey.slug}`);
		console.log(`   - Type: ${onboardingSurvey.type}`);
		console.log(`   - Questions: ${onboardingSurvey.questions.length}`);
		console.log(`   - Time Limit: ${onboardingSurvey.timeLimit} minutes`);
		console.log(`   - Max Attempts: ${onboardingSurvey.maxAttempts}`);

		console.log('\n🎯 Frontend Testing Instructions:');
		console.log('1. Start your frontend server (npm run dev)');
		console.log('2. Navigate to: http://localhost:5173/onboarding/frontend-test-onboarding');
		console.log('3. Test the following features:');
		console.log('   - Instructions page display');
		console.log('   - Name/email form');
		console.log('   - Question navigation');
		console.log('   - Answer submission');
		console.log('   - Progress tracking');
		console.log('   - Results display');

		console.log('\n🔗 Test URLs:');
		console.log(`   - Non-tenant: /onboarding/frontend-test-onboarding`);
		console.log(`   - Multi-tenant: /yourcompany/onboarding/frontend-test-onboarding`);

		console.log('\n🧹 Remember to clean up this test survey after testing!');
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		await mongoose.disconnect();
		console.log('🔌 Disconnected from MongoDB');
	}
}

// Run the test
testOnboardingFrontend();
