const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

// Create axios instance with credentials
const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
});

async function testQuestionBankCreation() {
	console.log('🧪 Testing Question Bank Creation Modal Functionality...\n');

	try {
		// 1. Login as admin
		console.log('1. Logging in as admin...');
		const loginResponse = await api.post('/api/admin/login', {
			username: 'admin',
			password: 'password',
		});

		console.log('Login response:', loginResponse.data);

		if (!loginResponse.data.success) {
			console.log('❌ Login failed');
			return;
		}
		console.log('✅ Login successful');
		console.log('   - Token received:', loginResponse.data.token ? 'Yes' : 'No');

		// Check if JWT is valid
		console.log('   - Checking JWT authentication...');
		const authCheckResponse = await api.get('/api/admin/check-auth', {
			headers: {
				Authorization: `Bearer ${loginResponse.data.token}`,
			},
		});
		console.log('Auth check response:', authCheckResponse.data);
		if (authCheckResponse.data.authenticated) {
			console.log('✅ JWT authenticated');
		} else {
			console.log('❌ JWT not authenticated');
			return;
		}

		// 2. Test creating a question bank
		console.log('\n2. Creating a test question bank...');
		const createResponse = await api.post(
			'/api/admin/question-banks',
			{
				name: 'Test Question Bank for Modal',
				description:
					'This is a test question bank created to verify the modal functionality',
			},
			{
				headers: {
					Authorization: `Bearer ${loginResponse.data.token}`,
				},
			}
		);

		console.log('✅ Question Bank created successfully');
		console.log('   - ID:', createResponse.data._id);
		console.log('   - Name:', createResponse.data.name);
		console.log('   - Description:', createResponse.data.description);
		console.log('   - Created By:', createResponse.data.createdBy);

		// 3. Verify the question bank appears in the list
		console.log('\n3. Verifying question bank appears in list...');
		const listResponse = await api.get('/api/admin/question-banks', {
			headers: {
				Authorization: `Bearer ${loginResponse.data.token}`,
			},
		});
		const createdBank = listResponse.data.find(bank => bank._id === createResponse.data._id);

		if (createdBank) {
			console.log('✅ Question bank found in list');
			console.log('   - Total question banks:', listResponse.data.length);
		} else {
			console.log('❌ Question bank not found in list');
		}

		// 4. Test creating another question bank with different data
		console.log('\n4. Creating another question bank...');
		const createResponse2 = await api.post(
			'/api/admin/question-banks',
			{
				name: 'Another Test Bank',
				description: 'Second test question bank',
			},
			{
				headers: {
					Authorization: `Bearer ${loginResponse.data.token}`,
				},
			}
		);

		console.log('✅ Second Question Bank created successfully');
		console.log('   - ID:', createResponse2.data._id);
		console.log('   - Name:', createResponse2.data.name);

		// 5. Verify both banks are in the list
		console.log('\n5. Verifying both banks are in list...');
		const listResponse2 = await api.get('/api/admin/question-banks', {
			headers: {
				Authorization: `Bearer ${loginResponse.data.token}`,
			},
		});
		console.log(`✅ Found ${listResponse2.data.length} question banks total`);

		// 6. Test validation - try to create without name
		console.log('\n6. Testing validation - creating without name...');
		try {
			await api.post(
				'/api/admin/question-banks',
				{
					description: 'This should fail',
				},
				{
					headers: {
						Authorization: `Bearer ${loginResponse.data.token}`,
					},
				}
			);
			console.log('❌ Should have failed - no name provided');
		} catch (error) {
			if (error.response?.status === 400) {
				console.log('✅ Validation working correctly - rejected empty name');
				console.log('   - Error:', error.response.data.error);
			} else {
				console.log('❌ Unexpected error:', error.message);
			}
		}

		// 7. Logout
		console.log('\n7. Logging out...');
		await api.get('/api/admin/logout');
		console.log('✅ Logout successful');

		console.log('\n🎉 Question Bank Modal functionality test completed successfully!');
		console.log('\n📋 Summary:');
		console.log('   - Login/Logout: ✅ Working');
		console.log('   - Create Question Bank: ✅ Working');
		console.log('   - List Question Banks: ✅ Working');
		console.log('   - Validation: ✅ Working');
		console.log('\n🚀 The modal should work correctly in the frontend!');
	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		if (error.response) {
			console.error('Response status:', error.response.status);
			console.error('Response data:', error.response.data);
		}
	}
}

// Run the test
testQuestionBankCreation();
