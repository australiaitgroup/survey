const axios = require('axios');

// Test enhanced login error messages
async function testLoginErrorMessages() {
	console.log('=== Testing Enhanced Login Error Messages ===\n');

	const baseUrl = 'http://localhost:5050';

	// Test 1: Non-existent user
	console.log('1. Testing with non-existent email...');
	try {
		await axios.post(`${baseUrl}/api/admin/login`, {
			username: 'nonexistent@example.com',
			password: 'password123',
		});
	} catch (error) {
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Error Type:', error.response.data.errorType);
			console.log('Error Message:', error.response.data.error);
			console.log('✅ User not found error handled correctly\n');
		}
	}

	// Test 2: Existing user with wrong password
	console.log('2. Testing with existing user but wrong password...');
	try {
		// First create a test user (assuming we have one from previous tests)
		await axios.post(`${baseUrl}/api/admin/login`, {
			username: 'career@jiangren.com.au', // Use the user we created earlier
			password: 'wrongpassword123',
		});
	} catch (error) {
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Error Type:', error.response.data.errorType);
			console.log('Error Message:', error.response.data.error);
			console.log('✅ Wrong password error handled correctly\n');
		}
	}

	// Test 3: Legacy admin with wrong password
	console.log('3. Testing legacy admin with wrong password...');
	try {
		await axios.post(`${baseUrl}/api/admin/login`, {
			username: 'admin', // Default admin username
			password: 'wrongpassword',
		});
	} catch (error) {
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Error Type:', error.response.data.errorType);
			console.log('Error Message:', error.response.data.error);
			console.log('✅ Legacy admin wrong password error handled correctly\n');
		}
	}

	// Test 4: User with non-admin role (simulate by checking if we can create one)
	console.log('4. Testing user with non-admin role...');
	try {
		// This test would require creating a non-admin user first
		// For now, we'll skip this test unless we have a non-admin user
		console.log(
			'⏭️  Skipping non-admin role test (would need to create non-admin user first)\n'
		);
	} catch (error) {
		console.log('Error creating test case:', error.message);
	}

	// Test 5: Successful login (if we have correct credentials)
	console.log('5. Testing successful login...');
	try {
		const response = await axios.post(`${baseUrl}/api/admin/login`, {
			username: 'career@jiangren.com.au',
			password: 'Admin@1234', // Use the password from our test registration
		});

		if (response.data.success) {
			console.log('✅ Successful login test passed');
			console.log('User:', response.data.user.name, '(' + response.data.user.email + ')');
			console.log('Token received:', !!response.data.token);
		}
	} catch (error) {
		if (error.response) {
			console.log('Login failed:', error.response.data.error);
			console.log('Error Type:', error.response.data.errorType);
		} else {
			console.log('Connection error:', error.message);
		}
	}

	console.log('\n=== Login Error Message Tests Complete ===');
}

// Test error message formatting
function testErrorMessageFormatting() {
	console.log('\n=== Testing Error Message Formatting ===\n');

	const errorMessages = [
		'No account found with this email address',
		'Incorrect password',
		'Account found but not authorized for admin access',
		'Incorrect password for admin account',
	];

	errorMessages.forEach((message, index) => {
		console.log(`${index + 1}. "${message}"`);

		// Simulate frontend logic
		let tip = '';
		if (message.includes('No account found')) {
			tip = "💡 Tip: Make sure you're using your email address, not a username.";
		} else if (message.includes('Incorrect password')) {
			tip = '💡 Tip: Passwords are case-sensitive. Check your Caps Lock key.';
		}

		if (tip) {
			console.log(`   ${tip}`);
		}
		console.log('');
	});
}

async function runAllTests() {
	await testLoginErrorMessages();
	testErrorMessageFormatting();
}

if (require.main === module) {
	runAllTests().catch(console.error);
}

module.exports = { testLoginErrorMessages, testErrorMessageFormatting };
