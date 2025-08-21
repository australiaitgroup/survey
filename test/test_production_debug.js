const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

// Production debugging script
async function debugProductionEnvironment() {
	console.log('=== Production Environment Debug ===\n');

	// 1. Check environment variables
	console.log('1. Environment Variables:');
	console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
	console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
	console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
	console.log('PORT:', process.env.PORT || 'undefined');

	// 2. Test MongoDB connection
	console.log('\n2. MongoDB Connection Test:');
	const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';
	console.log('Attempting to connect to:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

	try {
		await mongoose.connect(MONGODB_URI);
		console.log('✅ MongoDB connection successful');

		// Test basic operations
		const userCount = await User.countDocuments();
		const companyCount = await Company.countDocuments();
		console.log('Current users in database:', userCount);
		console.log('Current companies in database:', companyCount);
	} catch (error) {
		console.error('❌ MongoDB connection failed:', error.message);
		return;
	}

	// 3. Test bcrypt functionality
	console.log('\n3. Bcrypt Test:');
	try {
		const testPassword = 'Admin@1234';
		const startTime = Date.now();
		const hashedPassword = await bcrypt.hash(testPassword, 12);
		const hashTime = Date.now() - startTime;
		console.log('✅ Bcrypt hash successful');
		console.log('Hash time:', hashTime + 'ms');

		const compareResult = await bcrypt.compare(testPassword, hashedPassword);
		console.log('✅ Bcrypt compare successful:', compareResult);
	} catch (error) {
		console.error('❌ Bcrypt test failed:', error.message);
	}

	// 4. Test JWT functionality
	console.log('\n4. JWT Test:');
	try {
		const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
		const testPayload = { id: 'test', email: 'test@example.com', role: 'admin' };
		const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1m' });
		const decoded = jwt.verify(token, JWT_SECRET);
		console.log('✅ JWT sign/verify successful');
	} catch (error) {
		console.error('❌ JWT test failed:', error.message);
	}

	// 5. Test full registration flow
	console.log('\n5. Full Registration Flow Test:');
	await testFullRegistrationFlow();

	// 6. Check for existing user that might be causing the issue
	console.log('\n6. Check for Existing User:');
	try {
		const existingUser = await User.findOne({ email: 'career@jiangren.com.au' });
		if (existingUser) {
			console.log('⚠️  User already exists:', {
				id: existingUser._id,
				name: existingUser.name,
				email: existingUser.email,
				role: existingUser.role,
				createdAt: existingUser.createdAt,
			});
			console.log('This could be the cause of the registration error!');
		} else {
			console.log('✅ No existing user found with that email');
		}
	} catch (error) {
		console.error('❌ Error checking for existing user:', error.message);
	}

	// Close connection
	await mongoose.connection.close();
	console.log('\n📦 Database connection closed');
}

async function testFullRegistrationFlow() {
	try {
		const testData = {
			name: 'Test Production User',
			email: 'test-production-' + Date.now() + '@example.com',
			password: 'TestPassword123',
			companyName: 'Test Production Company',
		};

		console.log('Testing full registration with:', {
			...testData,
			password: '[REDACTED]',
		});

		// Hash password
		const hashedPassword = await bcrypt.hash(testData.password, 12);

		// Create company
		const company = new Company({
			name: testData.companyName,
		});
		await company.save();
		console.log('✅ Company created');

		// Create user
		const user = new User({
			name: testData.name,
			email: testData.email.toLowerCase(),
			password: hashedPassword,
			role: 'admin',
			companyId: company._id,
		});
		await user.save();
		console.log('✅ User created');

		// Generate JWT
		const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
		const token = jwt.sign(
			{
				id: user._id,
				email: user.email,
				role: user.role,
			},
			JWT_SECRET,
			{ expiresIn: '7d' }
		);
		console.log('✅ JWT token generated');

		// Cleanup
		await User.findByIdAndDelete(user._id);
		await Company.findByIdAndDelete(company._id);
		console.log('✅ Test data cleaned up');

		console.log('✅ Full registration flow test passed!');
	} catch (error) {
		console.error('❌ Full registration flow test failed:', error);
		console.error('Error details:', {
			message: error.message,
			name: error.name,
			code: error.code,
			stack: error.stack,
		});
	}
}

// Simple registration endpoint test
async function testRegistrationEndpoint(baseUrl = 'http://localhost:5050') {
	console.log('\n=== Registration Endpoint Test ===');
	console.log('Testing against:', baseUrl);

	const axios = require('axios');
	const testData = {
		companyName: 'Debug Test Company',
		email: 'debug-test-' + Date.now() + '@example.com',
		name: 'Debug Test User',
		password: 'DebugTest123',
	};

	try {
		const response = await axios.post(`${baseUrl}/api/admin/register`, testData, {
			headers: { 'Content-Type': 'application/json' },
			timeout: 30000, // 30 second timeout
		});

		console.log('✅ Registration endpoint test passed!');
		console.log('Status:', response.status);
		console.log('Response keys:', Object.keys(response.data));
	} catch (error) {
		console.error('❌ Registration endpoint test failed!');
		if (error.response) {
			console.error('Status:', error.response.status);
			console.error('Response:', error.response.data);
		} else if (error.code === 'ECONNREFUSED') {
			console.error('Connection refused - server not running?');
		} else if (error.code === 'ETIMEDOUT') {
			console.error('Request timed out - server overloaded?');
		} else {
			console.error('Error:', error.message);
		}
	}
}

if (require.main === module) {
	debugProductionEnvironment().catch(console.error);
}

module.exports = {
	debugProductionEnvironment,
	testFullRegistrationFlow,
	testRegistrationEndpoint,
};
