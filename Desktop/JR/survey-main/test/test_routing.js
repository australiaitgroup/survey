const axios = require('axios');

const BASE_URL = 'http://localhost:5178';

async function testRouting() {
	console.log('🧪 Testing Admin Routing...\n');

	try {
		// 测试不同的路由
		const routes = ['/admin', '/admin/surveys', '/admin/question-banks'];

		for (const route of routes) {
			console.log(`Testing route: ${route}`);
			try {
				const response = await axios.get(`${BASE_URL}${route}`);
				console.log(`✅ ${route} - Status: ${response.status}`);
			} catch (error) {
				console.log(`❌ ${route} - Error: ${error.message}`);
			}
		}

		console.log('\n🎉 Routing test completed!');
		console.log('\n📝 Manual Testing Instructions:');
		console.log('1. Open http://localhost:5178/admin in your browser');
		console.log('2. Login with admin/password');
		console.log('3. Click on "Survey List" tab - URL should change to /admin/surveys');
		console.log(
			'4. Click on "Question Banks" tab - URL should change to /admin/question-banks'
		);
		console.log('5. Click on a survey - URL should change to /admin/survey/{id}');
		console.log('6. Use browser back/forward buttons to test navigation');
	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
	}
}

async function main() {
	console.log('🚀 Starting Admin Routing Test\n');
	await testRouting();
}

main().catch(console.error);
