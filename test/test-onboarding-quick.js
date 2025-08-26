const mongoose = require('mongoose');
const Survey = require('../models/Survey');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function testOnboardingQuick() {
	try {
		console.log('🔌 Connecting to MongoDB...');
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB');

		// Create a simple onboarding survey with questions
		console.log('\n📝 Creating Test Onboarding Survey with Questions...');
		const onboardingSurvey = new Survey({
			title: 'Quick Test Onboarding',
			description: 'This is a quick test to verify questions display',
			type: 'onboarding',
			slug: 'quick-test-onboarding',
			status: 'active',
			createdBy: 'test@company.com',
			questions: [
				{
					text: 'What is your name?',
					type: 'single_choice',
					options: ['John', 'Jane', 'Bob', 'Alice'],
					correctAnswer: 0,
					points: 10,
				},
				{
					text: 'Which department do you work in?',
					type: 'single_choice',
					options: ['Engineering', 'Sales', 'Marketing', 'HR'],
					correctAnswer: 0,
					points: 10,
				},
				{
					text: 'What are your main responsibilities?',
					type: 'multiple_choice',
					options: ['Coding', 'Testing', 'Documentation', 'Meetings'],
					correctAnswer: [0, 1, 2],
					points: 15,
				}
			],
		});

		await onboardingSurvey.save();
		console.log('✅ Test Onboarding Survey created successfully');
		console.log(`   - ID: ${onboardingSurvey._id}`);
		console.log(`   - Slug: ${onboardingSurvey.slug}`);
		console.log(`   - Type: ${onboardingSurvey.type}`);
		console.log(`   - Questions: ${onboardingSurvey.questions.length}`);

		console.log('\n🎯 Testing Instructions:');
		console.log('1. Start your backend server (npm start)');
		console.log('2. Start your frontend server (npm run dev)');
		console.log('3. Navigate to: http://localhost:5173/onboarding/quick-test-onboarding');
		console.log('4. Enter your name and email');
		console.log('5. Click "Start Onboarding"');
		console.log('6. Verify that questions are displayed');

		console.log('\n🔗 Test URLs:');
		console.log(`   - Non-tenant: /onboarding/quick-test-onboarding`);
		console.log(`   - Multi-tenant: /yourcompany/onboarding/quick-test-onboarding`);

		console.log('\n🧪 Backend API Test:');
		console.log(`   - GET /api/onboarding/quick-test-onboarding`);
		console.log(`   - POST /api/onboarding/quick-test-onboarding/start`);

		console.log('\n🧹 Remember to clean up this test survey after testing!');

	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		await mongoose.disconnect();
		console.log('🔌 Disconnected from MongoDB');
	}
}

// Run the test
testOnboardingQuick();
