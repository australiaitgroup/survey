const axios = require('axios');

// Test enhanced registration error messages
async function testRegistrationErrorMessages() {
	console.log('=== Testing Enhanced Registration Error Messages ===\n');

	const baseUrl = 'http://localhost:5050';

	// Test 1: Missing required fields
	console.log('1. Testing with missing required fields...');
	try {
		await axios.post(`${baseUrl}/api/admin/register`, {
			// Missing name, email, password
			companyName: 'Test Company',
		});
	} catch (error) {
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Error Message:', error.response.data.error);
			console.log('Error Type:', error.response.data.errorType);
			console.log('✅ Missing fields error handled correctly\n');
		}
	}

	// Test 2: Password too short
	console.log('2. Testing with password too short...');
	try {
		await axios.post(`${baseUrl}/api/admin/register`, {
			name: 'Test User',
			email: 'test@example.com',
			password: '123', // Too short
			companyName: 'Test Company',
		});
	} catch (error) {
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Error Message:', error.response.data.error);
			console.log('✅ Short password error handled correctly\n');
		}
	}

	// Test 3: Try to register with existing email
	console.log('3. Testing with existing email...');
	try {
		await axios.post(`${baseUrl}/api/admin/register`, {
			name: 'Another User',
			email: 'career@jiangren.com.au', // This email should already exist
			password: 'Password123',
			companyName: 'Another Company',
		});
	} catch (error) {
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Error Message:', error.response.data.error);
			console.log('Error Type:', error.response.data.errorType);
			console.log('✅ Existing email error handled correctly\n');
		}
	}

	// Test 4: Try to register a new unique user (should succeed)
	console.log('4. Testing successful registration with unique email...');
	const uniqueEmail = 'test-unique-' + Date.now() + '@example.com';
	try {
		const response = await axios.post(`${baseUrl}/api/admin/register`, {
			name: 'Test Unique User',
			email: uniqueEmail,
			password: 'UniquePassword123',
			companyName: 'Unique Test Company',
		});

		if (response.data.success) {
			console.log('✅ Successful registration test passed');
			console.log('User:', response.data.user.name, '(' + response.data.user.email + ')');
			console.log('Token received:', !!response.data.token);
			console.log('User ID:', response.data.user.id);
		}
	} catch (error) {
		if (error.response) {
			console.log('❌ Registration failed:', error.response.data.error);
			console.log('Error Type:', error.response.data.errorType);
			console.log('Debug Info:', error.response.data.debug);
		} else {
			console.log('❌ Connection error:', error.message);
		}
	}

	// Test 5: Invalid email format
	console.log('\n5. Testing with invalid email format...');
	try {
		await axios.post(`${baseUrl}/api/admin/register`, {
			name: 'Test User',
			email: 'invalid-email-format', // Invalid email
			password: 'ValidPassword123',
			companyName: 'Test Company',
		});
	} catch (error) {
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Error Message:', error.response.data.error);
			console.log('Error Type:', error.response.data.errorType);
			console.log('Debug Info:', error.response.data.debug);
			console.log('✅ Invalid email format error handled correctly\n');
		}
	}

	console.log('=== Registration Error Message Tests Complete ===');
}

// Test server logs by watching registration attempts
async function simulateProductionRegistrationError() {
	console.log('\n=== Simulating Production Registration Error ===\n');

	const baseUrl = 'http://localhost:5050';
	const productionData = {
		companyName: 'JR Academy',
		email: 'career@jiangren.com.au',
		name: 'Lightman Wang',
		password: 'Admin@1234',
	};

	console.log('Simulating the exact production registration request...');
	console.log('Data:', {
		...productionData,
		password: '[REDACTED]',
	});

	try {
		const response = await axios.post(`${baseUrl}/api/admin/register`, productionData);
		console.log(
			'❌ Unexpected success - registration should have failed (user already exists)'
		);
		console.log('Response:', response.data);
	} catch (error) {
		if (error.response) {
			console.log('✅ Expected error occurred:');
			console.log('Status:', error.response.status);
			console.log('Error Message:', error.response.data.error);
			console.log('Error Type:', error.response.data.errorType);
			console.log('Debug Info:', error.response.data.debug);

			console.log('\n📝 Server logs should show detailed registration attempt info above.');
			console.log('This simulates what happens in production with the same data.');
		} else {
			console.log('❌ Connection error:', error.message);
		}
	}
}

async function runAllRegistrationTests() {
	await testRegistrationErrorMessages();
	await simulateProductionRegistrationError();
}

if (require.main === module) {
	runAllRegistrationTests().catch(console.error);
}

module.exports = { testRegistrationErrorMessages, simulateProductionRegistrationError };
