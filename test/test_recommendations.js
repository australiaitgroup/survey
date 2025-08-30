// Test script for Public Bank Recommendations Feature
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Company = require('../models/Company');
const PublicBank = require('../models/PublicBank');
const Entitlement = require('../models/Entitlement');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5051/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function testRecommendationsFeature() {
	console.log('🧪 Starting Public Bank Recommendations Feature Tests\n');

	let authToken;
	let testUser;
	let testCompany;
	let testBanks = [];

	try {
		// Connect to MongoDB
		await mongoose.connect(MONGODB_URI);
		console.log('✓ Connected to MongoDB');

		// Clean up any existing test data
		console.log('\n--- Cleaning up existing test data ---');
		await User.deleteMany({ email: { $regex: /test.*@recommendations\.test/ } });
		await Company.deleteMany({ name: { $regex: /Test.*Recommendations/ } });
		await PublicBank.deleteMany({ title: { $regex: /Test.*Recommendation.*Bank/ } });
		console.log('✓ Cleaned up existing test data');

		// Create test company
		console.log('\n--- Creating test company ---');
		testCompany = new Company({
			name: 'Test Company Recommendations',
			slug: 'test-company-recommendations',
			subscriptionTier: 'free',
		});
		await testCompany.save();
		console.log('✓ Created test company:', testCompany.name);

		// Create test user
		console.log('\n--- Creating test user ---');
		const bcrypt = require('bcrypt');
		const hashedPassword = await bcrypt.hash('password123', 10);

		testUser = new User({
			email: 'testuser@recommendations.test',
			password: hashedPassword,
			firstName: 'Test',
			lastName: 'User',
			companyId: testCompany._id,
			role: 'admin',
			isActive: true,
		});
		await testUser.save();
		console.log('✓ Created test user:', testUser.email);

		// Create multiple test banks for recommendations
		console.log('\n--- Creating test banks for recommendations ---');
		const bankData = [
			{
				title: 'Test Recommendation Bank 1 - JavaScript',
				description: 'A comprehensive JavaScript question bank',
				type: 'free',
				tags: ['javascript', 'programming', 'web'],
			},
			{
				title: 'Test Recommendation Bank 2 - Python',
				description: 'Python programming fundamentals',
				type: 'free',
				tags: ['python', 'programming', 'backend'],
			},
			{
				title: 'Test Recommendation Bank 3 - React',
				description: 'React framework questions',
				type: 'paid',
				priceOneTime: 19.99,
				tags: ['react', 'javascript', 'frontend'],
			},
			{
				title: 'Test Recommendation Bank 4 - Node.js',
				description: 'Server-side JavaScript with Node.js',
				type: 'paid',
				priceOneTime: 24.99,
				tags: ['nodejs', 'javascript', 'backend'],
			},
			{
				title: 'Test Recommendation Bank 5 - Database',
				description: 'Database design and SQL questions',
				type: 'free',
				tags: ['database', 'sql', 'data'],
			}
		];

		for (const data of bankData) {
			const bank = new PublicBank({
				...data,
				currency: 'USD',
				questions: [
					{
						text: `What is ${data.title.split(' ')[3]}?`,
						type: 'multiple_choice',
						options: ['Option A', 'Option B', 'Option C', 'Option D'],
						correctAnswer: 'Option A',
						points: 10,
						difficulty: 'easy',
					}
				],
				questionCount: 1,
				isActive: true,
				isPublished: true,
				createdBy: 'system@test.com',
			});
			await bank.save();
			testBanks.push(bank);
		}
		console.log(`✓ Created ${testBanks.length} test banks for recommendations`);

		// Test 1: Login to get auth token
		console.log('\n--- Test 1: User Login ---');
		try {
			const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
				email: 'testuser@recommendations.test',
				password: 'password123',
			});

			authToken = loginResponse.data.token;
			console.log('✓ User login successful');
		} catch (error) {
			console.error('✗ User login failed:', error.response?.data || error.message);
			throw error;
		}

		// Test 2: Get recommendations (first call)
		console.log('\n--- Test 2: Get Initial Recommendations ---');
		let firstRecommendations = [];
		try {
			const response = await axios.get(
				`${API_BASE_URL}/public-banks/recommendations?limit=3`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			firstRecommendations = response.data.recommendations;
			console.log('✓ Got recommendations:', firstRecommendations.length);

			if (firstRecommendations.length > 0) {
				console.log('  First recommendation:', firstRecommendations[0].title);
				console.log('  Total available:', response.data.total);
			}
		} catch (error) {
			console.error('✗ Failed to get recommendations:', error.response?.data || error.message);
			throw error;
		}

		// Test 3: Get recommendations again (should be different due to randomization)
		console.log('\n--- Test 3: Get Random Recommendations (Second Call) ---');
		let secondRecommendations = [];
		try {
			const response = await axios.get(
				`${API_BASE_URL}/public-banks/recommendations?limit=3`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			secondRecommendations = response.data.recommendations;
			console.log('✓ Got second set of recommendations:', secondRecommendations.length);

			if (secondRecommendations.length > 0) {
				console.log('  First recommendation:', secondRecommendations[0].title);
			}

			// Check if recommendations are different (randomized)
			const firstIds = firstRecommendations.map(b => b._id).sort();
			const secondIds = secondRecommendations.map(b => b._id).sort();
			const areDifferent = JSON.stringify(firstIds) !== JSON.stringify(secondIds);

			if (areDifferent) {
				console.log('✓ Recommendations are randomized (different results)');
			} else {
				console.log('⚠️  Recommendations are the same (might be random chance with small dataset)');
			}
		} catch (error) {
			console.error('✗ Failed to get second recommendations:', error.response?.data || error.message);
			throw error;
		}

		// Test 4: Purchase one bank and verify it's excluded from recommendations
		console.log('\n--- Test 4: Test Exclusion of Owned Banks ---');
		if (firstRecommendations.length > 0) {
			const bankToPurchase = firstRecommendations.find(b => b.type === 'FREE');

			if (bankToPurchase) {
				// Purchase the free bank
				try {
					await axios.post(
						`${API_BASE_URL}/public-banks/${bankToPurchase._id}/purchase-free`,
						{},
						{
							headers: {
								Authorization: `Bearer ${authToken}`,
							},
						}
					);
					console.log('✓ Purchased bank:', bankToPurchase.title);

					// Get recommendations again
					const response = await axios.get(
						`${API_BASE_URL}/public-banks/recommendations?limit=4`,
						{
							headers: {
								Authorization: `Bearer ${authToken}`,
							},
						}
					);

					const newRecommendations = response.data.recommendations;
					const purchasedBankInRecommendations = newRecommendations.find(
						b => b._id === bankToPurchase._id
					);

					if (!purchasedBankInRecommendations) {
						console.log('✓ Purchased bank correctly excluded from recommendations');
					} else {
						console.log('✗ Purchased bank still appears in recommendations');
					}
				} catch (error) {
					console.error('✗ Failed to test exclusion:', error.response?.data || error.message);
				}
			}
		}

		// Test 5: Test different limit parameters
		console.log('\n--- Test 5: Test Different Limit Parameters ---');
		try {
			// Test limit=1
			const response1 = await axios.get(
				`${API_BASE_URL}/public-banks/recommendations?limit=1`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);
			console.log('✓ Limit=1 returned:', response1.data.recommendations.length, 'recommendations');

			// Test limit=10 (should be capped at available banks)
			const response10 = await axios.get(
				`${API_BASE_URL}/public-banks/recommendations?limit=10`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);
			console.log('✓ Limit=10 returned:', response10.data.recommendations.length, 'recommendations');

			// Test no limit (should default to 3)
			const responseDefault = await axios.get(
				`${API_BASE_URL}/public-banks/recommendations`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);
			console.log('✓ Default limit returned:', responseDefault.data.recommendations.length, 'recommendations');
		} catch (error) {
			console.error('✗ Failed to test limit parameters:', error.response?.data || error.message);
		}

		// Test 6: Test recommendation data structure
		console.log('\n--- Test 6: Verify Recommendation Data Structure ---');
		if (firstRecommendations.length > 0) {
			const recommendation = firstRecommendations[0];
			const requiredFields = ['_id', 'title', 'description', 'tags', 'questionCount', 'type', 'entitlement'];

			let allFieldsPresent = true;
			for (const field of requiredFields) {
				if (!(field in recommendation)) {
					console.log(`✗ Missing field: ${field}`);
					allFieldsPresent = false;
				}
			}

			if (allFieldsPresent) {
				console.log('✓ All required fields present in recommendation data');
				console.log('  Fields:', Object.keys(recommendation).join(', '));
			}
		}

		console.log('\n🎉 All recommendation tests completed successfully!');

	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		throw error;
	} finally {
		// Clean up test data
		console.log('\n--- Cleaning up test data ---');
		try {
			if (testUser) await User.findByIdAndDelete(testUser._id);
			if (testCompany) await Company.findByIdAndDelete(testCompany._id);
			for (const bank of testBanks) {
				await PublicBank.findByIdAndDelete(bank._id);
			}
			await Entitlement.deleteMany({ companyId: testCompany?._id });
			console.log('✓ Cleaned up test data');
		} catch (cleanupError) {
			console.error('⚠️  Cleanup error:', cleanupError.message);
		}

		// Close MongoDB connection
		await mongoose.connection.close();
		console.log('✓ Disconnected from MongoDB');
	}
}

// Run the test if this file is executed directly
if (require.main === module) {
	testRecommendationsFeature()
		.then(() => {
			console.log('\n✅ Recommendation test suite completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Recommendation test suite failed:', error.message);
			process.exit(1);
		});
}

module.exports = { testRecommendationsFeature };
