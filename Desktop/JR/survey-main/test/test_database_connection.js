const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

async function testDatabaseConnection() {
	console.log('Testing database connection...\n');

	const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';
	console.log('MongoDB URI:', MONGODB_URI);

	try {
		// Test connection
		console.log('Connecting to MongoDB...');
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB successfully!');

		// Test User model
		console.log('\nTesting User model...');
		const userCount = await User.countDocuments();
		console.log('Current user count:', userCount);

		// Test Company model
		console.log('\nTesting Company model...');
		const companyCount = await Company.countDocuments();
		console.log('Current company count:', companyCount);

		// Test creating a test user (we'll delete it after)
		console.log('\nTesting user creation...');
		const testUser = new User({
			name: 'Test User',
			email: 'test-temp-user@example.com',
			password: 'hashedpassword123',
			role: 'admin',
		});

		console.log('Validating user data...');
		await testUser.validate();
		console.log('✅ User validation passed');

		console.log('Saving test user...');
		await testUser.save();
		console.log('✅ Test user saved with ID:', testUser._id);

		// Clean up test user
		console.log('Cleaning up test user...');
		await User.findByIdAndDelete(testUser._id);
		console.log('✅ Test user deleted');

		// Test creating a test company
		console.log('\nTesting company creation...');
		const testCompany = new Company({
			name: 'Test Company',
		});

		console.log('Validating company data...');
		await testCompany.validate();
		console.log('✅ Company validation passed');

		console.log('Saving test company...');
		await testCompany.save();
		console.log('✅ Test company saved with ID:', testCompany._id);

		// Clean up test company
		console.log('Cleaning up test company...');
		await Company.findByIdAndDelete(testCompany._id);
		console.log('✅ Test company deleted');

		console.log('\n🎉 All database tests passed!');
		return true;
	} catch (error) {
		console.error('\n❌ Database test failed:', error);
		console.error('Error details:', {
			message: error.message,
			name: error.name,
			code: error.code,
			stack: error.stack,
		});
		return false;
	} finally {
		// Close connection
		if (mongoose.connection.readyState === 1) {
			await mongoose.connection.close();
			console.log('\n📦 Database connection closed');
		}
	}
}

// Test specific user registration scenario
async function testUserRegistrationScenario() {
	console.log('\n=== Testing User Registration Scenario ===\n');

	const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

	try {
		await mongoose.connect(MONGODB_URI);
		console.log('Connected to database for registration test');

		const testData = {
			name: 'Lightman Wang',
			email: 'career@jiangren.com.au',
			password: 'hashedpasswordexample', // This would be the bcrypt hash
			role: 'admin',
			companyName: 'JR Academy',
		};

		console.log('Testing with registration data:', {
			...testData,
			password: '[REDACTED]',
		});

		// Check if user already exists
		console.log('\nChecking for existing user...');
		const existingUser = await User.findOne({ email: testData.email.toLowerCase() });
		if (existingUser) {
			console.log('⚠️  User already exists:', {
				id: existingUser._id,
				name: existingUser.name,
				email: existingUser.email,
				role: existingUser.role,
			});
			console.log('This explains the production registration error!');
			return false;
		} else {
			console.log('✅ No existing user found - registration should work');
		}

		// Test creating company
		console.log('\nTesting company creation...');
		const testCompany = new Company({
			name: testData.companyName,
		});
		await testCompany.save();
		console.log('✅ Company created successfully');

		// Test creating user
		console.log('\nTesting user creation...');
		const testUser = new User({
			name: testData.name,
			email: testData.email.toLowerCase(),
			password: testData.password,
			role: testData.role,
			companyId: testCompany._id,
		});
		await testUser.save();
		console.log('✅ User created successfully');

		// Cleanup
		await User.findByIdAndDelete(testUser._id);
		await Company.findByIdAndDelete(testCompany._id);
		console.log('✅ Test data cleaned up');

		return true;
	} catch (error) {
		console.error('❌ Registration scenario test failed:', error);
		console.error('Error details:', {
			message: error.message,
			name: error.name,
			code: error.code,
		});
		return false;
	} finally {
		if (mongoose.connection.readyState === 1) {
			await mongoose.connection.close();
		}
	}
}

async function runDatabaseTests() {
	console.log('=== Database Connection & Model Tests ===\n');

	const connectionTest = await testDatabaseConnection();
	const registrationTest = await testUserRegistrationScenario();

	console.log('\n=== Test Results ===');
	console.log('Database connection & models:', connectionTest ? '✅ PASS' : '❌ FAIL');
	console.log('Registration scenario:', registrationTest ? '✅ PASS' : '❌ FAIL');

	if (connectionTest && registrationTest) {
		console.log('\n🎉 All database tests passed!');
	} else {
		console.log('\n⚠️  Some database tests failed. Check the error details above.');
	}
}

if (require.main === module) {
	runDatabaseTests();
}

module.exports = { testDatabaseConnection, testUserRegistrationScenario };
