const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

// 创建 axios 实例以保持会话
const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true, // 重要：保持会话
});

async function testQuestionBankCreation() {
	console.log('🧪 Testing Question Bank Creation...\n');

	try {
		// 1. 登录
		console.log('1. Logging in...');
		const loginResponse = await api.post(`/api/admin/login`, {
			username: 'admin',
			password: 'password',
		});

		if (!loginResponse.data.success) {
			console.log('❌ Login failed');
			return;
		}
		console.log('✅ Login successful');

		// 2. 创建题库
		console.log('\n2. Creating Question Bank...');
		const createResponse = await api.post(`/api/admin/question-banks`, {
			name: 'Test Question Bank',
			description: 'This is a test question bank',
		});

		console.log('✅ Question Bank created successfully');
		console.log('   - ID:', createResponse.data._id);
		console.log('   - Name:', createResponse.data.name);
		console.log('   - Created By:', createResponse.data.createdBy);

		// 3. 获取题库列表
		console.log('\n3. Fetching Question Banks...');
		const listResponse = await api.get(`/api/admin/question-banks`);
		console.log(`✅ Found ${listResponse.data.length} question banks`);

		// 4. 登出
		console.log('\n4. Logging out...');
		await api.get(`/api/admin/logout`);
		console.log('✅ Logout successful');

		console.log('\n🎉 Question Bank creation test passed!');
	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		if (error.response) {
			console.error('Response status:', error.response.status);
			console.error('Response data:', error.response.data);
		}
	}
}

async function main() {
	console.log('🚀 Starting Question Bank Creation Test\n');
	await testQuestionBankCreation();
}

main().catch(console.error);
