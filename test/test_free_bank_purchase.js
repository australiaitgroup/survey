// Test script for Free Question Bank Purchase Flow
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Company = require('../models/Company');
const PublicBank = require('../models/PublicBank');
const BankPurchase = require('../models/BankPurchase');
const Entitlement = require('../models/Entitlement');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5051/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function testFreeBankPurchaseFlow() {
	console.log('🧪 Starting Free Question Bank Purchase Flow Tests\n');
	
	let authToken;
	let testUser;
	let testCompany;
	let freeBank;
	let paidBank;

	try {
		// Connect to MongoDB
		await mongoose.connect(MONGODB_URI);
		console.log('✓ Connected to MongoDB');

		// Clean up any existing test data
		console.log('\n--- Cleaning up existing test data ---');
		await User.deleteMany({ email: { $regex: /test.*@freepurchase\.test/ } });
		await Company.deleteMany({ name: { $regex: /Test.*Free Purchase/ } });
		await PublicBank.deleteMany({ title: { $regex: /Test.*Free.*Bank/ } });
		await BankPurchase.deleteMany({ notes: { $regex: /Test free purchase/ } });
		console.log('✓ Cleaned up existing test data');

		// Create test company
		console.log('\n--- Creating test company ---');
		testCompany = new Company({
			name: 'Test Company Free Purchase',
			slug: 'test-company-free-purchase',
			subscriptionTier: 'free',
		});
		await testCompany.save();
		console.log('✓ Created test company:', testCompany.name);

		// Create test user
		console.log('\n--- Creating test user ---');
		const bcrypt = require('bcrypt');
		const hashedPassword = await bcrypt.hash('password123', 10);
		
		testUser = new User({
			email: 'testuser@freepurchase.test',
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
			title: 'Test Free Question Bank',
			description: 'A test free question bank for purchase flow testing',
			type: 'free',
			tags: ['test', 'free', 'javascript'],
			questions: [
				{
					text: 'What is JavaScript?',
					type: 'multiple_choice',
					options: ['A language', 'A framework', 'A library', 'A database'],
					correctAnswer: 'A language',
					points: 10,
					difficulty: 'easy',
				},
				{
					text: 'Explain closures in JavaScript',
					type: 'text',
					points: 20,
					difficulty: 'medium',
				}
			],
			questionCount: 2,
			isActive: true,
			isPublished: true,
			createdBy: 'system@test.com',
		});
		await freeBank.save();
		console.log('✓ Created free test bank:', freeBank.title);

		// Create paid test bank
		console.log('\n--- Creating paid test bank ---');
		paidBank = new PublicBank({
			title: 'Test Paid Question Bank',
			description: 'A test paid question bank for purchase flow testing',
			type: 'paid',
			priceOneTime: 29.99,
			currency: 'USD',
			tags: ['test', 'paid', 'advanced'],
			questions: [
				{
					text: 'Advanced JavaScript concepts',
					type: 'text',
					points: 30,
					difficulty: 'hard',
				}
			],
			questionCount: 1,
			isActive: true,
			isPublished: true,
			createdBy: 'system@test.com',
		});
		await paidBank.save();
		console.log('✓ Created paid test bank:', paidBank.title);

		// Test 1: Login to get auth token
		console.log('\n--- Test 1: User Login ---');
		try {
			const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
				email: 'testuser@freepurchase.test',
				password: 'password123',
			});
			
			authToken = loginResponse.data.token;
			console.log('✓ User login successful');
		} catch (error) {
			console.error('✗ User login failed:', error.response?.data || error.message);
			throw error;
		}

		// Test 2: Initiate free bank purchase
		console.log('\n--- Test 2: Initiate Free Bank Purchase ---');
		try {
			const purchaseResponse = await axios.post(
				`${API_BASE_URL}/public-banks/${freeBank._id}/purchase`,
				{},
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			if (purchaseResponse.data.success && purchaseResponse.data.checkoutUrl) {
				console.log('✓ Free bank purchase initiated, redirecting to checkout');
				console.log('  Checkout URL:', purchaseResponse.data.checkoutUrl);
			} else {
				throw new Error('Purchase initiation failed');
			}
		} catch (error) {
			console.error('✗ Free bank purchase initiation failed:', error.response?.data || error.message);
			throw error;
		}

		// Test 3: Process free bank purchase
		console.log('\n--- Test 3: Process Free Bank Purchase ---');
		try {
			const processPurchaseResponse = await axios.post(
				`${API_BASE_URL}/public-banks/${freeBank._id}/purchase-free`,
				{},
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			const responseData = processPurchaseResponse.data;
			if (responseData.success) {
				console.log('✓ Free bank purchase processed successfully');
				console.log('  Order ID:', responseData.order.id);
				console.log('  Order Amount:', responseData.order.amount);
				console.log('  Order Status:', responseData.order.status);
				console.log('  Entitlement Type:', responseData.entitlement.accessType);
			} else {
				throw new Error('Purchase processing failed');
			}
		} catch (error) {
			console.error('✗ Free bank purchase processing failed:', error.response?.data || error.message);
			throw error;
		}

		// Test 4: Verify order was created in database
		console.log('\n--- Test 4: Verify Order in Database ---');
		const order = await BankPurchase.findOne({
			companyId: testCompany._id,
			bankId: freeBank._id,
			paymentMethod: 'free',
		});

		if (order) {
			console.log('✓ Order found in database');
			console.log('  Amount:', order.amount);
			console.log('  Status:', order.status);
			console.log('  Payment Method:', order.paymentMethod);
		} else {
			throw new Error('Order not found in database');
		}

		// Test 5: Verify entitlement was created
		console.log('\n--- Test 5: Verify Entitlement in Database ---');
		const entitlement = await Entitlement.findOne({
			companyId: testCompany._id,
			bankId: freeBank._id,
		});

		if (entitlement) {
			console.log('✓ Entitlement found in database');
			console.log('  Access Type:', entitlement.accessType);
			console.log('  Status:', entitlement.status);
		} else {
			throw new Error('Entitlement not found in database');
		}

		// Test 6: Verify access check
		console.log('\n--- Test 6: Verify Access Check ---');
		const hasAccess = await Entitlement.hasAccess(testCompany._id, freeBank._id);
		if (hasAccess) {
			console.log('✓ Company has access to free bank');
		} else {
			throw new Error('Company does not have access to free bank');
		}

		// Test 7: Test duplicate purchase prevention
		console.log('\n--- Test 7: Test Duplicate Purchase Prevention ---');
		try {
			await axios.post(
				`${API_BASE_URL}/public-banks/${freeBank._id}/purchase-free`,
				{},
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);
			throw new Error('Duplicate purchase should have been prevented');
		} catch (error) {
			if (error.response?.status === 400 && error.response.data.error.includes('already have access')) {
				console.log('✓ Duplicate purchase correctly prevented');
			} else {
				throw error;
			}
		}

		// Test 8: Verify marketplace shows bank as owned
		console.log('\n--- Test 8: Verify Marketplace Shows Bank as Owned ---');
		try {
			const marketplaceResponse = await axios.get(
				`${API_BASE_URL}/public-banks`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			const freeBankInMarketplace = marketplaceResponse.data.banks.find(
				b => b._id === freeBank._id.toString()
			);

			if (freeBankInMarketplace && freeBankInMarketplace.entitlement === 'Owned') {
				console.log('✓ Free bank shows as owned in marketplace');
			} else {
				throw new Error('Free bank does not show as owned in marketplace');
			}
		} catch (error) {
			console.error('✗ Marketplace verification failed:', error.response?.data || error.message);
			throw error;
		}

		// Test 9: Test analytics tracking
		console.log('\n--- Test 9: Test Analytics Tracking ---');
		try {
			const analyticsResponse = await axios.get(
				`${API_BASE_URL}/public-banks/analytics/purchases`,
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				}
			);

			const analytics = analyticsResponse.data;
			if (analytics.summary.freePurchases > 0) {
				console.log('✓ Analytics tracking working');
				console.log('  Total Purchases:', analytics.summary.totalPurchases);
				console.log('  Free Purchases:', analytics.summary.freePurchases);
				console.log('  Free Percentage:', analytics.summary.freePercentage + '%');
			} else {
				throw new Error('Analytics not tracking free purchases');
			}
		} catch (error) {
			console.error('✗ Analytics verification failed:', error.response?.data || error.message);
			throw error;
		}

		console.log('\n🎉 All tests passed successfully!');

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
			if (paidBank) await PublicBank.findByIdAndDelete(paidBank._id);
			await BankPurchase.deleteMany({ 
				$or: [
					{ companyId: testCompany?._id },
					{ notes: { $regex: /Test free purchase/ } }
				]
			});
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
	testFreeBankPurchaseFlow()
		.then(() => {
			console.log('\n✅ Test suite completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Test suite failed:', error.message);
			process.exit(1);
		});
}

module.exports = { testFreeBankPurchaseFlow };