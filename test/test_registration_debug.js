const axios = require('axios');

// Test the registration endpoint with the exact same data that's failing in production
async function testRegistration() {
	const registrationData = {
		companyName: 'JR Academy',
		email: 'career@jiangren.com.au',
		name: 'Lightman Wang',
		password: 'Admin@1234',
	};

	try {
		console.log('Testing registration with data:', registrationData);

		const response = await axios.post(
			'http://localhost:5050/api/admin/register',
			registrationData,
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		console.log('Registration successful!');
		console.log('Status:', response.status);
		console.log('Response:', response.data);
	} catch (error) {
		console.error('Registration failed!');
		if (error.response) {
			console.error('Status:', error.response.status);
			console.error('Response:', error.response.data);
		} else {
			console.error('Error:', error.message);
		}
	}
}

// Also test if the email already exists
async function testExistingUser() {
	console.log('\n--- Testing with existing user check ---');

	try {
		const response = await axios.post('http://localhost:5050/api/admin/register', {
			companyName: 'JR Academy',
			email: 'career@jiangren.com.au',
			name: 'Lightman Wang',
			password: 'Admin@1234',
		});

		console.log('Second registration attempt - should fail if user exists');
		console.log('Response:', response.data);
	} catch (error) {
		if (error.response && error.response.status === 400) {
			console.log('Expected error - user already exists:', error.response.data);
		} else {
			console.error(
				'Unexpected error:',
				error.response ? error.response.data : error.message
			);
		}
	}
}

async function runTests() {
	console.log('Starting registration debug tests...\n');

	// Test 1: Initial registration
	await testRegistration();

	// Test 2: Try to register same user again
	await testExistingUser();
}

if (require.main === module) {
	runTests();
}

module.exports = { testRegistration, testExistingUser };
