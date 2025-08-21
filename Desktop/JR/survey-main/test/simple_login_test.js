const axios = require('axios');

async function testLogin() {
	console.log('Testing Backend Login...');

	try {
		// Test 1: Try to access health endpoint
		console.log('\n1. Testing health endpoint...');
		const healthResponse = await axios.get('http://localhost:8080/api/admin/check-auth', {
			validateStatus: () => true,
		});
		console.log(`Health status: ${healthResponse.status}`);

		// Test 2: Try registration
		console.log('\n2. Testing registration...');
		const testUser = {
			name: 'Simple Test User',
			email: `simple${Date.now()}@example.com`,
			password: 'testpassword123',
			companyName: 'Test Company',
		};

		const registerResponse = await axios.post(
			'http://localhost:8080/api/admin/register',
			testUser,
			{
				validateStatus: () => true,
			}
		);
		console.log(`Registration status: ${registerResponse.status}`);
		console.log('Registration response:', registerResponse.data);

		if (registerResponse.status === 201) {
			// Test 3: Try login with registered user
			console.log('\n3. Testing login...');
			const loginResponse = await axios.post(
				'http://localhost:8080/api/admin/login',
				{
					username: testUser.email,
					password: testUser.password,
				},
				{
					validateStatus: () => true,
				}
			);

			console.log(`Login status: ${loginResponse.status}`);
			console.log('Login response:', loginResponse.data);

			if (loginResponse.status === 500) {
				console.log('\n❌ 500 Error detected! This indicates a backend code issue.');
				console.log('Check the backend logs for the actual error.');
			}
		}
	} catch (error) {
		console.error('Request error:', error.message);
		if (error.response) {
			console.error('Response status:', error.response.status);
			console.error('Response data:', error.response.data);
		}
	}
}

testLogin();
