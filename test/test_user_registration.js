const axios = require('axios');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:8080'; // Docker frontend proxy
const TEST_USER = {
	name: 'Test User',
	email: `test${Date.now()}@example.com`, // Make email unique for each test run
	password: 'testpassword123',
	confirmPassword: 'testpassword123',
	companyName: 'Test Company',
};

// Test functions
async function testUserRegistration() {
	console.log('🧪 Starting User Registration Test...'.cyan.bold);
	console.log('====================================='.cyan);

	let passed = 0;
	let failed = 0;
	let token = null;

	// Test 1: Register new user
	try {
		console.log('\n📝 Test 1: Register new user'.yellow);
		const response = await axios.post(`${BASE_URL}/api/admin/register`, {
			name: TEST_USER.name,
			email: TEST_USER.email,
			password: TEST_USER.password,
			companyName: TEST_USER.companyName,
		});

		if (response.data.success && response.data.token) {
			console.log('✅ Registration successful'.green);
			console.log(`   User ID: ${response.data.user.id}`.gray);
			console.log(`   Name: ${response.data.user.name}`.gray);
			console.log(`   Email: ${response.data.user.email}`.gray);
			token = response.data.token;
			passed++;
		} else {
			console.log('❌ Registration failed - no success flag or token'.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Registration failed'.red);
		console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
		failed++;
	}

	// Test 2: Verify authentication with token
	if (token) {
		try {
			console.log('\n🔐 Test 2: Verify authentication'.yellow);
			const response = await axios.get(`${BASE_URL}/api/admin/check-auth`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data.success && response.data.authenticated) {
				console.log('✅ Authentication verification successful'.green);
				console.log(`   User authenticated: ${response.data.authenticated}`.gray);
				passed++;
			} else {
				console.log('❌ Authentication verification failed'.red);
				failed++;
			}
		} catch (error) {
			console.log('❌ Authentication verification failed'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Test 3: Try to register same email again (should fail)
	try {
		console.log('\n🚫 Test 3: Duplicate email registration (should fail)'.yellow);
		const response = await axios.post(`${BASE_URL}/api/admin/register`, {
			name: 'Another User',
			email: TEST_USER.email, // Same email
			password: 'anotherpassword123',
			companyName: 'Another Company',
		});

		// If we reach here, the test failed because duplicate should be rejected
		console.log('❌ Duplicate registration should have failed but succeeded'.red);
		failed++;
	} catch (error) {
		if (
			error.response?.status === 400 &&
			error.response?.data?.error?.includes('already exists')
		) {
			console.log('✅ Duplicate email correctly rejected'.green);
			console.log(`   Error message: ${error.response.data.error}`.gray);
			passed++;
		} else {
			console.log('❌ Unexpected error for duplicate registration'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Test 4: Try registration with invalid data
	try {
		console.log('\n🚫 Test 4: Invalid registration data (should fail)'.yellow);
		const response = await axios.post(`${BASE_URL}/api/admin/register`, {
			name: '', // Empty name
			email: 'invalid-email', // Invalid email
			password: '123', // Too short password
		});

		console.log('❌ Invalid registration should have failed but succeeded'.red);
		failed++;
	} catch (error) {
		if (error.response?.status === 400) {
			console.log('✅ Invalid registration data correctly rejected'.green);
			console.log(`   Error message: ${error.response.data.error}`.gray);
			passed++;
		} else {
			console.log('❌ Unexpected error for invalid registration'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Test 5: Login with registered user
	if (token) {
		try {
			console.log('\n🔓 Test 5: Login with registered user'.yellow);
			const response = await axios.post(`${BASE_URL}/api/admin/login`, {
				username: TEST_USER.email,
				password: TEST_USER.password,
			});

			if (response.data.success && response.data.token) {
				console.log('✅ Login successful'.green);
				console.log(`   User: ${response.data.user.name}`.gray);
				console.log(`   Email: ${response.data.user.email}`.gray);
				passed++;
			} else {
				console.log('❌ Login failed - no success flag or token'.red);
				failed++;
			}
		} catch (error) {
			console.log('❌ Login failed'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Test 6: Login with wrong password (should fail)
	try {
		console.log('\n🚫 Test 6: Login with wrong password (should fail)'.yellow);
		const response = await axios.post(`${BASE_URL}/api/admin/login`, {
			username: TEST_USER.email,
			password: 'wrongpassword',
		});

		console.log('❌ Login with wrong password should have failed but succeeded'.red);
		failed++;
	} catch (error) {
		if (
			error.response?.status === 401 &&
			error.response?.data?.error?.includes('Invalid credentials')
		) {
			console.log('✅ Wrong password correctly rejected'.green);
			console.log(`   Error message: ${error.response.data.error}`.gray);
			passed++;
		} else {
			console.log('❌ Unexpected error for wrong password'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Clean up - delete test user (optional, depends on your needs)
	if (token) {
		try {
			console.log(
				'\n🧹 Cleanup: Note - Test user remains in database for manual verification'.gray
			);
			console.log(`   Email: ${TEST_USER.email}`.gray);
			console.log(`   You can manually delete this user if needed`.gray);
		} catch (error) {
			console.log('   Cleanup note logged'.gray);
		}
	}

	// Summary
	console.log('\n📊 Test Summary'.cyan.bold);
	console.log('==============='.cyan);
	console.log(`✅ Passed: ${passed}`.green);
	console.log(`❌ Failed: ${failed}`.red);
	console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`.cyan);

	if (failed === 0) {
		console.log('\n🎉 All tests passed! User registration is working correctly.'.green.bold);
	} else {
		console.log(
			'\n⚠️  Some tests failed. Please check the registration implementation.'.yellow.bold
		);
	}

	return { passed, failed };
}

// Validation tests for frontend form validation
function testFormValidation() {
	console.log('\n🔍 Frontend Form Validation Tests'.cyan.bold);
	console.log('=================================='.cyan);

	const validationTests = [
		{
			name: 'Password mismatch validation',
			data: { password: 'password123', confirmPassword: 'different123' },
			expectedError: 'Passwords do not match',
		},
		{
			name: 'Short password validation',
			data: { password: '123', confirmPassword: '123' },
			expectedError: 'Password must be at least 8 characters long',
		},
		{
			name: 'Empty required fields',
			data: { name: '', email: '', password: '' },
			expectedError: 'Required fields validation',
		},
	];

	console.log('📝 Form validation rules to verify:');
	validationTests.forEach((test, index) => {
		console.log(`   ${index + 1}. ${test.name}`.yellow);
		console.log(`      Expected: ${test.expectedError}`.gray);
	});

	console.log('\n💡 These validations are implemented in RegisterForm.tsx:'.gray);
	console.log('   - Password length check (min 8 characters)'.gray);
	console.log('   - Password confirmation match'.gray);
	console.log('   - Required field validation (HTML5 + React)'.gray);
}

// Main execution
async function runTests() {
	console.log('🚀 User Registration Test Suite'.rainbow.bold);
	console.log('================================'.rainbow);
	console.log(`Target URL: ${BASE_URL}`.cyan);
	console.log(`Test User Email: ${TEST_USER.email}`.cyan);
	console.log();

	// Check if server is running
	try {
		await axios.get(`${BASE_URL}/api/admin/check-auth`);
		console.log('✅ Server is running'.green);
	} catch (error) {
		// 401 is expected for check-auth without token, so check if it's a connection error
		if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
			console.log('❌ Server is not running or not accessible'.red);
			console.log(`   Please make sure the server is running on ${BASE_URL}`.yellow);
			console.log('   Run: docker-compose up or npm start'.yellow);
			return;
		} else if (error.response?.status === 401) {
			console.log(
				'✅ Server is running (401 response expected for unauthenticated request)'.green
			);
		} else {
			console.log('✅ Server is running'.green);
		}
	}

	// Run backend API tests
	const results = await testUserRegistration();

	// Show frontend validation info
	testFormValidation();

	console.log('\n📋 Manual Testing Checklist:'.cyan.bold);
	console.log('============================'.cyan);
	console.log('1. ✅ Open browser to http://localhost:8080/admin'.gray);
	console.log('2. ✅ Click "Register" or "Create Account"'.gray);
	console.log('3. ✅ Test form validation (empty fields, password mismatch)'.gray);
	console.log('4. ✅ Register a new user with valid data'.gray);
	console.log('5. ✅ Verify redirect to admin dashboard after registration'.gray);
	console.log('6. ✅ Test logout and login with registered credentials'.gray);

	return results;
}

// Check if this script is run directly
if (require.main === module) {
	runTests().catch(console.error);
}

module.exports = { testUserRegistration, runTests };
