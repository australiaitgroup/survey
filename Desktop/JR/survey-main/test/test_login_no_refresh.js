const axios = require('axios');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:8080';

async function testLoginNoRefresh() {
	console.log('🔧 Testing Login Refresh Fix...'.cyan.bold);
	console.log('================================'.cyan);

	let passed = 0;
	let failed = 0;

	// Test 1: Ensure wrong login doesn't cause redirect/refresh
	try {
		console.log('\n❌ Test 1: Wrong login credentials (should not redirect)'.yellow);

		// Create axios instance similar to frontend
		const testApi = axios.create({
			baseURL: `${BASE_URL}/api`,
			headers: { 'Content-Type': 'application/json' },
			validateStatus: () => true, // Don't throw on 4xx/5xx status
		});

		const response = await testApi.post('/admin/login', {
			username: 'wrong@example.com',
			password: 'wrongpassword',
		});

		if (response.status === 401) {
			console.log('✅ Received 401 status as expected'.green);
			console.log(`   Response data: ${JSON.stringify(response.data)}`.gray);

			if (response.data.error) {
				console.log('✅ Error message present in response'.green);
				passed++;
			} else {
				console.log('❌ No error message in response'.red);
				failed++;
			}
		} else {
			console.log(`❌ Unexpected status: ${response.status}`.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Request failed unexpectedly'.red);
		console.log(`   Error: ${error.message}`.red);
		failed++;
	}

	// Test 2: Test protected endpoint without token (should still redirect)
	try {
		console.log(
			'\n🔐 Test 2: Protected endpoint without token (should handle properly)'.yellow
		);

		const testApi = axios.create({
			baseURL: `${BASE_URL}/api`,
			headers: { 'Content-Type': 'application/json' },
			validateStatus: () => true,
		});

		const response = await testApi.get('/admin/profile');

		if (response.status === 401) {
			console.log('✅ Protected endpoint correctly returns 401'.green);
			passed++;
		} else {
			console.log(`❌ Unexpected status for protected endpoint: ${response.status}`.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Protected endpoint test failed'.red);
		console.log(`   Error: ${error.message}`.red);
		failed++;
	}

	// Test 3: Simulate successful login
	try {
		console.log('\n✅ Test 3: Successful login flow'.yellow);

		// Create a test user first
		const testEmail = `loginnorefresh${Date.now()}@example.com`;
		const testPassword = 'testpassword123';

		const testApi = axios.create({
			baseURL: `${BASE_URL}/api`,
			headers: { 'Content-Type': 'application/json' },
			validateStatus: () => true,
		});

		// Register user
		const registerResponse = await testApi.post('/admin/register', {
			name: 'No Refresh Test User',
			email: testEmail,
			password: testPassword,
			companyName: 'Test Company',
		});

		if (registerResponse.data.success) {
			console.log('   ✓ Test user created'.gray);

			// Now test login
			const loginResponse = await testApi.post('/admin/login', {
				username: testEmail,
				password: testPassword,
			});

			if (loginResponse.data.success && loginResponse.data.token) {
				console.log('✅ Successful login returns token correctly'.green);
				console.log(`   Token length: ${loginResponse.data.token.length}`.gray);
				passed++;
			} else {
				console.log('❌ Successful login failed'.red);
				failed++;
			}
		} else {
			console.log('❌ Failed to create test user'.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Successful login test failed'.red);
		console.log(`   Error: ${error.message}`.red);
		failed++;
	}

	// Summary
	console.log('\n📊 Login Refresh Fix Test Summary'.cyan.bold);
	console.log('=================================='.cyan);
	console.log(`✅ Passed: ${passed}`.green);
	console.log(`❌ Failed: ${failed}`.red);
	console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`.cyan);

	if (failed === 0) {
		console.log('\n🎉 All tests passed! Login refresh issue should be fixed.'.green.bold);
	} else {
		console.log('\n⚠️  Some tests failed. Please check the implementation.'.yellow.bold);
	}

	console.log('\n📋 Manual Testing Instructions:'.cyan.bold);
	console.log('================================'.cyan);
	console.log('1. Open http://localhost:8080/admin/login in browser'.gray);
	console.log('2. Open Developer Tools (F12) -> Network tab'.gray);
	console.log('3. Enter wrong credentials: wrong@example.com / wrongpassword'.gray);
	console.log('4. Click "Sign in"'.gray);
	console.log('5. Verify:'.gray);
	console.log('   ✅ No page reload in Network tab'.green);
	console.log('   ✅ Form fields remain filled'.green);
	console.log('   ✅ Error message appears'.green);
	console.log('   ✅ Can retry immediately without re-entering username'.green);

	return { passed, failed };
}

// Run the test
if (require.main === module) {
	testLoginNoRefresh().catch(console.error);
}

module.exports = { testLoginNoRefresh };
