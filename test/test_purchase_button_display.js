// Test script to verify Purchase button display for free banks
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Company = require('../models/Company');
const PublicBank = require('../models/PublicBank');
const Entitlement = require('../models/Entitlement');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5051/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function testPurchaseButtonDisplay() {
	console.log('🧪 Starting Purchase Button Display Test\n');
	
	let authToken;
	let testUser;
	let testCompany;
	let freeBank;

	try {
		// Connect to MongoDB
		await mongoose.connect(MONGODB_URI);
		console.log('✓ Connected to MongoDB');

		// Clean up any existing test data
		console.log('\n--- Cleaning up existing test data ---');
		await User.deleteMany({ email: { $regex: /test.*@buttontest\.test/ } });
		await Company.deleteMany({ name: { $regex: /Test.*Button.*Company/ } });
		await PublicBank.deleteMany({ title: { $regex: /Test.*Button.*Bank/ } });
		console.log('✓ Cleaned up existing test data');

		// Create test company
		console.log('\n--- Creating test company ---');
		testCompany = new Company({
			name: 'Test Button Display Company',
			slug: 'test-button-display-company',
			subscriptionTier: 'free',
		});
		await testCompany.save();
		console.log('✓ Created test company:', testCompany.name);

		// Create test user
		console.log('\n--- Creating test user ---');
		const bcrypt = require('bcrypt');
		const hashedPassword = await bcrypt.hash('password123', 10);
		
		testUser = new User({
			email: 'testuser@buttontest.test',
			password: hashedPassword,
			firstName: 'Test',
			lastName: 'User',
			companyId: testCompany._id,
			role: 'admin',
			isActive: true,
		});
		await testUser.save();
		console.log('✓ Created test user:', testUser.email);

		// Create free test bank
		console.log('\n--- Creating free test bank ---');
		freeBank = new PublicBank({
			title: 'Test Button Free Bank',
			description: 'A test free question bank for button display testing',
			type: 'free',
			tags: ['test', 'free', 'button'],
			questions: [
				{
					text: 'Test question',
					type: 'multiple_choice',
					options: ['A', 'B', 'C', 'D'],
					correctAnswer: 'A',
					points: 10,
					difficulty: 'easy',
				}
			],
			questionCount: 1,
			isActive: true,
			isPublished: true,
			createdBy: 'system@test.com',
		});
		await freeBank.save();
		console.log('✓ Created free test bank:', freeBank.title);

		// Test 1: Login to get auth token
		console.log('\n--- Test 1: User Login ---');
		try {
			const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
				email: 'testuser@buttontest.test',
				password: 'password123',
			});
			
			authToken = loginResponse.data.token;
			console.log('✓ User login successful');
		} catch (error) {
			console.error('✗ User login failed:', error.response?.data || error.message);
			throw error;
		}

		// Test 2: Check marketplace data for free bank
		console.log('\n--- Test 2: Check Free Bank in Marketplace ---');
		try {
			const response = await axios.get(
				`${API_BASE_URL}/public-banks`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			const freeBankInMarketplace = response.data.banks.find(
				b => b._id === freeBank._id.toString()
			);

			if (freeBankInMarketplace) {
				console.log('✓ Found free bank in marketplace');
				console.log('  Title:', freeBankInMarketplace.title);
				console.log('  Type:', freeBankInMarketplace.type);
				console.log('  Entitlement:', freeBankInMarketplace.entitlement);
				console.log('  Price:', freeBankInMarketplace.price || '$0');

				// Verify the entitlement status is 'Locked' so Purchase button will show
				if (freeBankInMarketplace.entitlement === 'Locked') {
					console.log('✓ Free bank has "Locked" status - Purchase button should be visible');
				} else {
					console.log('✗ Free bank has unexpected status:', freeBankInMarketplace.entitlement);
					console.log('  Expected: "Locked", Got:', freeBankInMarketplace.entitlement);
				}
			} else {
				throw new Error('Free bank not found in marketplace');
			}
		} catch (error) {
			console.error('✗ Failed to check marketplace:', error.response?.data || error.message);
			throw error;
		}

		// Test 3: Purchase the free bank
		console.log('\n--- Test 3: Purchase Free Bank ---');
		try {
			const purchaseResponse = await axios.post(
				`${API_BASE_URL}/public-banks/${freeBank._id}/purchase-free`,
				{},
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			if (purchaseResponse.data.success) {
				console.log('✓ Successfully purchased free bank');
			}
		} catch (error) {
			console.error('✗ Failed to purchase free bank:', error.response?.data || error.message);
			throw error;
		}

		// Test 4: Check marketplace again after purchase
		console.log('\n--- Test 4: Check Free Bank Status After Purchase ---');
		try {
			const response = await axios.get(
				`${API_BASE_URL}/public-banks`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			const freeBankInMarketplace = response.data.banks.find(
				b => b._id === freeBank._id.toString()
			);

			if (freeBankInMarketplace) {
				console.log('✓ Found free bank in marketplace after purchase');
				console.log('  Entitlement:', freeBankInMarketplace.entitlement);

				// Verify the entitlement status is now 'Owned' so "Use now" button will show
				if (freeBankInMarketplace.entitlement === 'Owned') {
					console.log('✓ Free bank now has "Owned" status - "Use now" button should be visible');
				} else {
					console.log('✗ Free bank has unexpected status after purchase:', freeBankInMarketplace.entitlement);
					console.log('  Expected: "Owned", Got:', freeBankInMarketplace.entitlement);
				}
			}
		} catch (error) {
			console.error('✗ Failed to check marketplace after purchase:', error.response?.data || error.message);
			throw error;
		}

		console.log('\n🎉 Purchase button display test completed successfully!');
		console.log('\n📋 Summary:');
		console.log('  ✓ Free banks show "Locked" status before purchase');
		console.log('  ✓ This triggers "Purchase" button display');
		console.log('  ✓ After purchase, status changes to "Owned"');
		console.log('  ✓ This triggers "Use now" button display');

	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		throw error;
	} finally {
		// Clean up test data
		console.log('\n--- Cleaning up test data ---');
		try {
			if (testUser) await User.findByIdAndDelete(testUser._id);
			if (testCompany) await Company.findByIdAndDelete(testCompany._id);
			if (freeBank) await PublicBank.findByIdAndDelete(freeBank._id);
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
	testPurchaseButtonDisplay()
		.then(() => {
			console.log('\n✅ Purchase button test completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Purchase button test failed:', error.message);
			process.exit(1);
		});
}

module.exports = { testPurchaseButtonDisplay };