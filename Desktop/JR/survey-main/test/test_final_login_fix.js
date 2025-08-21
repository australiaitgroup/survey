const axios = require('axios');
const colors = require('colors');

async function testFinalLoginFix() {
	console.log('🎯 Final Login Fix Verification...'.cyan.bold);
	console.log('================================='.cyan);

	let passed = 0;
	let failed = 0;

	// Test 1: Wrong credentials should return 401, not 500
	try {
		console.log('\n❌ Test 1: Wrong credentials (should return 401)'.yellow);
		const response = await axios.post(
			'http://localhost:8080/api/admin/login',
			{
				username: 'wrong@example.com',
				password: 'wrongpassword',
			},
			{ validateStatus: () => true }
		);

		if (response.status === 401) {
			console.log('✅ Correct 401 response for wrong credentials'.green);
			console.log(`   Error message: ${response.data.error}`.gray);
			passed++;
		} else if (response.status === 500) {
			console.log('❌ Still getting 500 error!'.red);
			console.log(`   Response: ${JSON.stringify(response.data)}`.red);
			failed++;
		} else {
			console.log(`❌ Unexpected status: ${response.status}`.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Request failed completely'.red);
		console.log(`   Error: ${error.message}`.red);
		failed++;
	}

	// Test 2: Register and login with correct credentials
	try {
		console.log('\n✅ Test 2: Register new user and login'.yellow);

		const testUser = {
			name: 'Final Test User',
			email: `finaltest${Date.now()}@example.com`,
			password: 'finaltest123',
			companyName: 'Final Test Company',
		};

		// Register
		const registerResponse = await axios.post(
			'http://localhost:8080/api/admin/register',
			testUser,
			{
				validateStatus: () => true,
			}
		);

		if (registerResponse.status === 201 && registerResponse.data.success) {
			console.log('   ✓ Registration successful'.gray);

			// Login with registered user
			const loginResponse = await axios.post(
				'http://localhost:8080/api/admin/login',
				{
					username: testUser.email,
					password: testUser.password,
				},
				{ validateStatus: () => true }
			);

			if (loginResponse.status === 200 && loginResponse.data.success) {
				console.log('✅ Login successful with correct credentials'.green);
				console.log(`   User: ${loginResponse.data.user.name}`.gray);
				console.log(`   Token received: ${loginResponse.data.token ? 'Yes' : 'No'}`.gray);
				passed++;

				// Test 3: Verify profile with the token
				const token = loginResponse.data.token;
				const profileResponse = await axios.get('http://localhost:8080/api/admin/profile', {
					headers: { Authorization: `Bearer ${token}` },
					validateStatus: () => true,
				});

				if (profileResponse.status === 200 && profileResponse.data.user) {
					const profile = profileResponse.data.user;
					if (profile.name === testUser.name && profile.email === testUser.email) {
						console.log('✅ Profile data matches registered user'.green);
						console.log(`   Profile name: ${profile.name}`.gray);
						console.log(`   Profile email: ${profile.email}`.gray);
						passed++;
					} else {
						console.log('❌ Profile data does not match'.red);
						console.log(`   Expected: ${testUser.name} / ${testUser.email}`.red);
						console.log(`   Got: ${profile.name} / ${profile.email}`.red);
						failed++;
					}
				} else {
					console.log('❌ Profile loading failed'.red);
					failed++;
				}
			} else {
				console.log('❌ Login failed with correct credentials'.red);
				console.log(`   Status: ${loginResponse.status}`.red);
				console.log(`   Response: ${JSON.stringify(loginResponse.data)}`.red);
				failed++;
			}
		} else {
			console.log('❌ Registration failed'.red);
			console.log(`   Status: ${registerResponse.status}`.red);
			console.log(`   Response: ${JSON.stringify(registerResponse.data)}`.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Registration/Login test failed'.red);
		console.log(`   Error: ${error.message}`.red);
		failed++;
	}

	// Summary
	console.log('\n🏆 Final Test Results'.cyan.bold);
	console.log('===================='.cyan);
	console.log(`✅ Passed: ${passed}`.green);
	console.log(`❌ Failed: ${failed}`.red);
	console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`.cyan);

	if (failed === 0) {
		console.log('\n🎉 All issues fixed! Login system is working perfectly!'.green.bold);
		console.log('\n📋 Confirmed fixes:'.green);
		console.log('   ✅ No more 500 Internal Server Error'.green);
		console.log('   ✅ Wrong credentials return 401 with error message'.green);
		console.log('   ✅ Correct credentials login successfully'.green);
		console.log('   ✅ Profile displays registered user information'.green);
		console.log('   ✅ Frontend proxy working correctly'.green);
	} else {
		console.log('\n⚠️  Some issues remain. Please check the failed tests above.'.yellow.bold);
	}

	console.log('\n🌐 Browser Testing:'.cyan.bold);
	console.log('=================='.cyan);
	console.log('1. Open: http://localhost:8080/admin/login'.gray);
	console.log('2. Try wrong credentials - should see error message'.gray);
	console.log('3. Register new user - should work smoothly'.gray);
	console.log('4. Login with registered user - should succeed'.gray);
	console.log('5. Check Profile Settings - should show your info'.gray);

	return { passed, failed };
}

if (require.main === module) {
	testFinalLoginFix().catch(console.error);
}
