const axios = require('axios');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:8080';

async function testProfileDisplay() {
	console.log('👤 Testing Profile Display After Registration...'.cyan.bold);
	console.log('==============================================='.cyan);

	let passed = 0;
	let failed = 0;
	let token = null;
	let testUser = null;

	// Test 1: Register a new user
	try {
		console.log('\n📝 Test 1: Register new user'.yellow);

		testUser = {
			name: 'Profile Test User',
			email: `profiletest${Date.now()}@example.com`,
			password: 'testpassword123',
			companyName: 'Profile Test Company',
		};

		const response = await axios.post(`${BASE_URL}/api/admin/register`, testUser);

		if (response.data.success && response.data.token) {
			console.log('✅ Registration successful'.green);
			console.log(`   User ID: ${response.data.user.id}`.gray);
			console.log(`   Name: ${response.data.user.name}`.gray);
			console.log(`   Email: ${response.data.user.email}`.gray);
			token = response.data.token;
			passed++;
		} else {
			console.log('❌ Registration failed'.red);
			failed++;
		}
	} catch (error) {
		console.log('❌ Registration failed'.red);
		console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
		failed++;
	}

	// Test 2: Load profile data using the token
	if (token) {
		try {
			console.log('\n👤 Test 2: Load profile data'.yellow);

			const response = await axios.get(`${BASE_URL}/api/admin/profile`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			console.log('Profile response:', JSON.stringify(response.data, null, 2));

			if (response.data.user) {
				const profileUser = response.data.user;

				// Check if name matches
				if (profileUser.name === testUser.name) {
					console.log('✅ Profile name matches registration'.green);
					console.log(`   Expected: ${testUser.name}`.gray);
					console.log(`   Actual: ${profileUser.name}`.gray);
					passed++;
				} else {
					console.log('❌ Profile name does not match registration'.red);
					console.log(`   Expected: ${testUser.name}`.red);
					console.log(`   Actual: ${profileUser.name}`.red);
					failed++;
				}

				// Check if email matches
				if (profileUser.email === testUser.email) {
					console.log('✅ Profile email matches registration'.green);
					console.log(`   Expected: ${testUser.email}`.gray);
					console.log(`   Actual: ${profileUser.email}`.gray);
					passed++;
				} else {
					console.log('❌ Profile email does not match registration'.red);
					console.log(`   Expected: ${testUser.email}`.red);
					console.log(`   Actual: ${profileUser.email}`.red);
					failed++;
				}
			} else {
				console.log('❌ No user data in profile response'.red);
				failed++;
			}
		} catch (error) {
			console.log('❌ Profile loading failed'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Test 3: Test with a different user to ensure proper isolation
	if (token) {
		try {
			console.log('\n👥 Test 3: Create second user and check isolation'.yellow);

			const testUser2 = {
				name: 'Second Profile Test User',
				email: `profiletest2${Date.now()}@example.com`,
				password: 'testpassword456',
				companyName: 'Second Test Company',
			};

			const registerResponse = await axios.post(`${BASE_URL}/api/admin/register`, testUser2);

			if (registerResponse.data.success && registerResponse.data.token) {
				const token2 = registerResponse.data.token;

				// Load profile with second user's token
				const profileResponse = await axios.get(`${BASE_URL}/api/admin/profile`, {
					headers: {
						Authorization: `Bearer ${token2}`,
					},
				});

				if (
					profileResponse.data.user.name === testUser2.name &&
					profileResponse.data.user.email === testUser2.email
				) {
					console.log('✅ Second user profile correctly isolated'.green);
					console.log(`   Name: ${profileResponse.data.user.name}`.gray);
					console.log(`   Email: ${profileResponse.data.user.email}`.gray);
					passed++;
				} else {
					console.log('❌ User profiles not properly isolated'.red);
					console.log(`   Expected: ${testUser2.name} / ${testUser2.email}`.red);
					console.log(
						`   Actual: ${profileResponse.data.user.name} / ${profileResponse.data.user.email}`
							.red
					);
					failed++;
				}
			} else {
				console.log('❌ Second user registration failed'.red);
				failed++;
			}
		} catch (error) {
			console.log('❌ User isolation test failed'.red);
			console.log(`   Error: ${error.response?.data?.error || error.message}`.red);
			failed++;
		}
	}

	// Summary
	console.log('\n📊 Profile Display Test Summary'.cyan.bold);
	console.log('================================'.cyan);
	console.log(`✅ Passed: ${passed}`.green);
	console.log(`❌ Failed: ${failed}`.red);
	console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`.cyan);

	if (failed === 0) {
		console.log(
			'\n🎉 All tests passed! Profile display should be working correctly.'.green.bold
		);
	} else {
		console.log(
			'\n⚠️  Some tests failed. Profile display may need additional fixes.'.yellow.bold
		);
	}

	console.log('\n📋 Manual Testing Steps:'.cyan.bold);
	console.log('========================'.cyan);
	console.log('1. Register a new user at http://localhost:8080/admin/register'.gray);
	console.log('2. Complete onboarding if prompted'.gray);
	console.log(
		'3. Go to Profile Settings (click profile icon or navigate to /admin/profile)'.gray
	);
	console.log('4. Check Profile Details section:'.gray);
	console.log('   ✅ Name field should show the name you registered with'.green);
	console.log('   ✅ Email field should show the email you registered with'.green);
	console.log('   ✅ Avatar URL field should be empty (optional)'.green);

	return { passed, failed };
}

// Run the test
if (require.main === module) {
	testProfileDisplay().catch(console.error);
}

module.exports = { testProfileDisplay };
