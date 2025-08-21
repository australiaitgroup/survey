const axios = require('axios');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:8080';

async function testLoginErrorHandling() {
	console.log('🔐 Testing Login Error Handling...'.cyan.bold);
	console.log('==================================='.cyan);

	let passed = 0;
	let failed = 0;

	// Test 1: Login with wrong credentials
	try {
		console.log('\n❌ Test 1: Login with wrong credentials'.yellow);
		const response = await axios.post(`${BASE_URL}/api/admin/login`, {
			username: 'wronguser@example.com',
			password: 'wrongpassword',
		});

		// Should not reach here
		console.log('❌ Login should have failed but succeeded'.red);
		failed++;
	} catch (error) {
		if (error.response?.status === 401) {
			console.log('✅ Wrong credentials correctly rejected'.green);
			console.log(`   Status: ${error.response.status}`.gray);
			console.log(`   Error: ${error.response.data.error}`.gray);
			passed++;
		} else {
			console.log('❌ Unexpected error response'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Test 2: Login with missing data
	try {
		console.log('\n❌ Test 2: Login with missing data'.yellow);
		const response = await axios.post(`${BASE_URL}/api/admin/login`, {
			username: '', // Empty username
			password: '', // Empty password
		});

		// Should not reach here
		console.log('❌ Empty login should have failed but succeeded'.red);
		failed++;
	} catch (error) {
		if (error.response?.status === 401) {
			console.log('✅ Empty credentials correctly rejected'.green);
			console.log(`   Status: ${error.response.status}`.gray);
			console.log(`   Error: ${error.response.data.error}`.gray);
			passed++;
		} else {
			console.log('❌ Unexpected error response'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Test 3: Create a test user and then test correct login
	try {
		console.log('\n✅ Test 3: Create test user and login correctly'.yellow);

		// First register a user
		const testEmail = `logintest${Date.now()}@example.com`;
		const testPassword = 'testpassword123';

		const registerResponse = await axios.post(`${BASE_URL}/api/admin/register`, {
			name: 'Login Test User',
			email: testEmail,
			password: testPassword,
			companyName: 'Test Company',
		});

		if (registerResponse.data.success) {
			console.log('   ✓ Test user created successfully'.gray);

			// Now test login with correct credentials
			const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
				username: testEmail,
				password: testPassword,
			});

			if (loginResponse.data.success && loginResponse.data.token) {
				console.log('✅ Correct login successful'.green);
				console.log(`   User: ${loginResponse.data.user.name}`.gray);
				console.log(`   Token received: ${loginResponse.data.token ? 'Yes' : 'No'}`.gray);
				passed++;
			} else {
				console.log('❌ Login with correct credentials failed'.red);
				failed++;
			}
		} else {
			console.log('❌ Failed to create test user'.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Test user creation or login failed'.red);
		console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
		failed++;
	}

	// Summary
	console.log('\n📊 Login Error Handling Test Summary'.cyan.bold);
	console.log('====================================='.cyan);
	console.log(`✅ Passed: ${passed}`.green);
	console.log(`❌ Failed: ${failed}`.red);
	console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`.cyan);

	if (failed === 0) {
		console.log('\n🎉 All login error handling tests passed!'.green.bold);
	} else {
		console.log('\n⚠️  Some tests failed. Check the login error handling.'.yellow.bold);
	}

	console.log('\n📋 Frontend Behavior After Fix:'.cyan.bold);
	console.log('================================'.cyan);
	console.log('✅ Form fields should NOT be cleared on login error'.green);
	console.log('✅ Error message should be displayed clearly'.green);
	console.log('✅ User can retry login without re-entering credentials'.green);
	console.log('✅ Form fields should only be cleared on successful login'.green);

	return { passed, failed };
}

// Run the test
if (require.main === module) {
	testLoginErrorHandling().catch(console.error);
}

module.exports = { testLoginErrorHandling };
