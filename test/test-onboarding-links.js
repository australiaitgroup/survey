const mongoose = require('mongoose');
const Survey = require('../models/Survey');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function testOnboardingLinks() {
	try {
		console.log('🔌 Connecting to MongoDB...');
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB');

		// Create a test onboarding survey
		console.log('\n📝 Creating Test Onboarding Survey...');
		const onboardingSurvey = new Survey({
			title: 'Test Employee Onboarding',
			description: 'This is a test onboarding survey to verify link generation',
			type: 'onboarding',
			slug: 'test-employee-onboarding',
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
			],
		});

		await onboardingSurvey.save();
		console.log('✅ Test Onboarding Survey created successfully');
		console.log(`   - ID: ${onboardingSurvey._id}`);
		console.log(`   - Slug: ${onboardingSurvey.slug}`);
		console.log(`   - Type: ${onboardingSurvey.type}`);

		// Test URL generation functions
		console.log('\n🔗 Testing URL Generation...');

		const companySlug = 'testcompany';
		const baseUrl = 'http://localhost:5173';

		// Test non-tenant URLs
		const nonTenantOnboardingUrl = `${baseUrl}/onboarding/${onboardingSurvey.slug}`;
		const nonTenantAssessmentUrl = `${baseUrl}/assessment/${onboardingSurvey.slug}`;
		const nonTenantSurveyUrl = `${baseUrl}/survey/${onboardingSurvey.slug}`;

		// Test multi-tenant URLs
		const tenantOnboardingUrl = `${baseUrl}/${companySlug}/onboarding/${onboardingSurvey.slug}`;
		const tenantAssessmentUrl = `${baseUrl}/${companySlug}/assessment/${onboardingSurvey.slug}`;
		const tenantSurveyUrl = `${baseUrl}/${companySlug}/survey/${onboardingSurvey.slug}`;

		console.log('📱 Non-tenant URLs:');
		console.log(`   - Onboarding: ${nonTenantOnboardingUrl}`);
		console.log(`   - Assessment: ${nonTenantAssessmentUrl}`);
		console.log(`   - Survey: ${nonTenantSurveyUrl}`);

		console.log('\n🏢 Multi-tenant URLs:');
		console.log(`   - Onboarding: ${tenantOnboardingUrl}`);
		console.log(`   - Assessment: ${tenantAssessmentUrl}`);
		console.log(`   - Survey: ${tenantSurveyUrl}`);

		console.log('\n🎯 Frontend Testing Instructions:');
		console.log('1. Start your frontend server (npm run dev)');
		console.log('2. Go to Admin panel and find this onboarding survey');
		console.log('3. Verify the following in SurveyDetailView:');
		console.log('   - Survey type shows as "Onboarding" with purple badge');
		console.log('   - Employee Onboarding URL is displayed');
		console.log('   - Copy URL button works');
		console.log('   - Open button opens in new tab');
		console.log('   - QR code shows correct onboarding URL');
		console.log('4. Test the actual onboarding flow:');
		console.log(`   - Navigate to: ${nonTenantOnboardingUrl}`);
		console.log(`   - Or: ${tenantOnboardingUrl}`);

		console.log('\n🧹 Remember to clean up this test survey after testing!');
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		await mongoose.disconnect();
		console.log('🔌 Disconnected from MongoDB');
	}
}

// Run the test
testOnboardingLinks();
