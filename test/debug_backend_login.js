const axios = require('axios');

async function debugBackendLogin() {
	console.log('🔍 Debugging Backend Login Issue...'.cyan);
	console.log('==================================='.cyan);

	// First, let's register a user to have something to login with
	try {
		console.log('\n1. Creating test user for login debugging...'.yellow);

		const testUser = {
			name: 'Debug Test User',
			email: `debug${Date.now()}@example.com`,
			password: 'debugpassword123',
			companyName: 'Debug Company',
		};

		console.log(`   Registering: ${testUser.email}`);

		// Try registration first to create a user
		const registerResponse = await axios.post(
			'http://localhost:8080/api/admin/register',
			testUser,
			{
				timeout: 10000,
				validateStatus: () => true, // Accept all status codes
			}
		);

		console.log(`   Registration status: ${registerResponse.status}`);
		console.log(`   Registration response:`, JSON.stringify(registerResponse.data, null, 2));

		if (registerResponse.status === 201 && registerResponse.data.success) {
			console.log('✅ User registration successful'.green);

			// Now try to login with the registered user
			console.log('\n2. Testing login with registered user...'.yellow);

			const loginData = {
				username: testUser.email,
				password: testUser.password,
			};

			console.log(`   Login data:`, JSON.stringify(loginData, null, 2));

			const loginResponse = await axios.post(
				'http://localhost:8080/api/admin/login',
				loginData,
				{
					timeout: 10000,
					validateStatus: () => true, // Accept all status codes
				}
			);

			console.log(`   Login status: ${loginResponse.status}`);
			console.log(`   Login response:`, JSON.stringify(loginResponse.data, null, 2));

			if (loginResponse.status === 200) {
				console.log('✅ Login successful!'.green);
			} else if (loginResponse.status === 500) {
				console.log('❌ 500 Internal Server Error detected'.red);
				console.log('   This suggests a backend code issue, not a network problem'.red);
			} else {
				console.log(`❌ Unexpected login status: ${loginResponse.status}`.red);
			}
		} else {
			console.log('❌ User registration failed, cannot test login'.red);
		}
	} catch (error) {
		console.log('❌ Request failed'.red);

		if (error.code === 'ECONNREFUSED') {
			console.log('   Connection refused - backend not accessible'.red);
		} else if (error.response) {
			console.log(`   HTTP ${error.response.status}: ${error.response.statusText}`.red);
			console.log(`   Response data:`, error.response.data);
		} else {
			console.log(`   Error: ${error.message}`.red);
		}
	}

	// Test basic backend health
	console.log('\n3. Testing backend health endpoint...'.yellow);
	try {
		const healthResponse = await axios.get('http://localhost:8080/api/admin/check-auth', {
			timeout: 5000,
			validateStatus: () => true,
		});

		console.log(`   Health check status: ${healthResponse.status}`);
		if (healthResponse.status === 401) {
			console.log(
				'✅ Backend is responding (401 is expected for unauthenticated check-auth)'.green
			);
		} else {
			console.log(`   Health response:`, JSON.stringify(healthResponse.data, null, 2));
		}
	} catch (error) {
		console.log('❌ Backend health check failed'.red);
		console.log(`   Error: ${error.message}`.red);
	}
}

// Add colors support
const colors = {
	cyan: '\x1b[36m%s\x1b[0m',
	yellow: '\x1b[33m%s\x1b[0m',
	green: '\x1b[32m%s\x1b[0m',
	red: '\x1b[31m%s\x1b[0m',
};

// Simple color function
global.console.log = (function (originalLog) {
	return function (...args) {
		let message = args[0];
		if (typeof message === 'string') {
			if (message.includes('.cyan')) {
				message = message.replace('.cyan', '');
				return originalLog(colors.cyan, message);
			} else if (message.includes('.yellow')) {
				message = message.replace('.yellow', '');
				return originalLog(colors.yellow, message);
			} else if (message.includes('.green')) {
				message = message.replace('.green', '');
				return originalLog(colors.green, message);
			} else if (message.includes('.red')) {
				message = message.replace('.red', '');
				return originalLog(colors.red, message);
			}
		}
		return originalLog.apply(console, args);
	};
})(console.log);

if (require.main === module) {
	debugBackendLogin().catch(console.error);
}
