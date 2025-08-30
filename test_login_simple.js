const axios = require('axios');

async function testSimpleLogin() {
	try {
		console.log('Testing simple login...\n');

		const response = await axios.post('http://localhost:3000/api/sa/login', {
			username: 'superadmin@system.com',
			password: 'superadmin123'
		});

		console.log('✅ Login successful!');
		console.log('Response:', response.data);

	} catch (error) {
		console.log('❌ Login failed:');
		console.log('Status:', error.response?.status);
		console.log('Error:', error.response?.data);
	}
}

testSimpleLogin();
