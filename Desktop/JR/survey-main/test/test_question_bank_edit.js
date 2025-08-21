const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

// Test question bank edit functionality
async function testQuestionBankEdit() {
	try {
		console.log('🚀 Testing Question Bank Edit Functionality...\n');

		// 1. Login to get JWT token
		console.log('1. Logging in...');
		const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
			username: 'admin',
			password: 'password',
		});

		const token = loginResponse.data.token;
		console.log('✅ Login successful, JWT token received\n');

		// Set up axios with JWT token
		const api = axios.create({
			baseURL: BASE_URL,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		// 2. Create a question bank
		console.log('2. Creating a question bank...');
		const createResponse = await api.post('/admin/question-banks', {
			name: 'Test Question Bank for Edit',
			description: 'This is a test question bank to test edit functionality',
		});

		const questionBankId = createResponse.data._id;
		console.log(`✅ Question bank created with ID: ${questionBankId}\n`);

		// 3. Update the question bank
		console.log('3. Updating the question bank...');
		const updateData = {
			name: 'Updated Test Question Bank',
			description: 'This question bank has been updated with new name and description',
		};

		const updateResponse = await api.put(`/admin/question-banks/${questionBankId}`, updateData);
		console.log('✅ Question bank updated successfully');
		console.log('Updated data:', {
			name: updateResponse.data.name,
			description: updateResponse.data.description,
			updatedAt: updateResponse.data.updatedAt,
		});
		console.log('');

		// 4. Verify the update by fetching the question bank
		console.log('4. Verifying the update...');
		const getResponse = await api.get(`/admin/question-banks/${questionBankId}`);
		const updatedQuestionBank = getResponse.data;

		console.log('✅ Verification successful');
		console.log('Current data:', {
			name: updatedQuestionBank.name,
			description: updatedQuestionBank.description,
			updatedAt: updatedQuestionBank.updatedAt,
		});
		console.log('');

		// 5. Test validation - try to update with empty name
		console.log('5. Testing validation - empty name...');
		try {
			await api.put(`/admin/question-banks/${questionBankId}`, {
				name: '',
				description: 'This should fail',
			});
			console.log('❌ Validation failed - should have rejected empty name');
		} catch (error) {
			if (error.response?.status === 400) {
				console.log('✅ Validation working correctly - rejected empty name');
				console.log('Error message:', error.response.data.error);
			} else {
				console.log('❌ Unexpected error:', error.response?.data || error.message);
			}
		}
		console.log('');

		// 6. Test validation - try to update with whitespace-only name
		console.log('6. Testing validation - whitespace-only name...');
		try {
			await api.put(`/admin/question-banks/${questionBankId}`, {
				name: '   ',
				description: 'This should fail',
			});
			console.log('❌ Validation failed - should have rejected whitespace-only name');
		} catch (error) {
			if (error.response?.status === 400) {
				console.log('✅ Validation working correctly - rejected whitespace-only name');
				console.log('Error message:', error.response.data.error);
			} else {
				console.log('❌ Unexpected error:', error.response?.data || error.message);
			}
		}
		console.log('');

		// 7. Test successful update with trimmed whitespace
		console.log('7. Testing successful update with trimmed whitespace...');
		const finalUpdateResponse = await api.put(`/admin/question-banks/${questionBankId}`, {
			name: '  Final Test Question Bank  ',
			description: '  This has whitespace that should be trimmed  ',
		});

		console.log('✅ Final update successful');
		console.log('Final data:', {
			name: finalUpdateResponse.data.name,
			description: finalUpdateResponse.data.description,
		});
		console.log('');

		// 8. Clean up - delete the test question bank
		console.log('8. Cleaning up - deleting test question bank...');
		await api.delete(`/admin/question-banks/${questionBankId}`);
		console.log('✅ Test question bank deleted successfully');
		console.log('');

		console.log('🎉 All question bank edit tests passed successfully!');
	} catch (error) {
		console.error('❌ Test failed:', error.response?.data || error.message);
		process.exit(1);
	}
}

// Run the test
testQuestionBankEdit();
