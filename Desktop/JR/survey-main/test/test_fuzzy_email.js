const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testFuzzyEmail() {
	try {
		// 设置认证token
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;

		// 获取所有调查
		console.log('获取所有调查...');
		const surveysResponse = await axios.get(`${BASE_URL}/api/admin/surveys`);
		const surveys = surveysResponse.data;

		if (surveys.length === 0) {
			console.log('没有找到调查');
			return;
		}

		// 使用第一个调查
		const survey = surveys[0];
		console.log(`使用调查: ${survey.title} (ID: ${survey._id})`);

		// 获取所有响应
		const statsResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics`
		);

		console.log(`总响应数: ${statsResponse.data.summary.totalResponses}`);
		console.log('所有响应:');
		statsResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 测试不同的email查询
		console.log('\n=== 测试Email查询功能 ===');

		// 1. 测试完整email查询
		const fullEmail = 'lightmanwang@gmail.com';
		console.log(`\n1. 完整email查询: ${fullEmail}`);
		const fullResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=${fullEmail}`
		);
		console.log(`结果: ${fullResponse.data.userResponses.length} 条记录`);
		fullResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 2. 测试部分email查询
		const partialEmail = 'lightmanwang';
		console.log(`\n2. 部分email查询: ${partialEmail}`);
		const partialResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=${partialEmail}`
		);
		console.log(`结果: ${partialResponse.data.userResponses.length} 条记录`);
		partialResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 3. 测试域名查询
		const domainEmail = 'gmail.com';
		console.log(`\n3. 域名查询: ${domainEmail}`);
		const domainResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=${domainEmail}`
		);
		console.log(`结果: ${domainResponse.data.userResponses.length} 条记录`);
		domainResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 4. 测试不存在的email
		const nonExistentEmail = 'nonexistent@test.com';
		console.log(`\n4. 不存在email查询: ${nonExistentEmail}`);
		const nonExistentResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=${nonExistentEmail}`
		);
		console.log(`结果: ${nonExistentResponse.data.userResponses.length} 条记录`);

		// 5. 测试空email查询
		console.log(`\n5. 空email查询（返回全部）`);
		const emptyResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics`
		);
		console.log(`结果: ${emptyResponse.data.userResponses.length} 条记录`);

		// 验证结果
		console.log('\n=== 验证结果 ===');
		let allTestsPassed = true;

		// 验证完整email查询
		if (fullResponse.data.userResponses.length !== 1) {
			console.log('❌ 完整email查询失败');
			allTestsPassed = false;
		} else {
			console.log('✅ 完整email查询正常');
		}

		// 验证部分email查询
		const expectedPartial = statsResponse.data.userResponses.filter(resp =>
			resp.email.includes(partialEmail)
		);
		if (partialResponse.data.userResponses.length !== expectedPartial.length) {
			console.log('❌ 部分email查询失败');
			allTestsPassed = false;
		} else {
			console.log('✅ 部分email查询正常');
		}

		// 验证域名查询
		const expectedDomain = statsResponse.data.userResponses.filter(resp =>
			resp.email.includes(domainEmail)
		);
		if (domainResponse.data.userResponses.length !== expectedDomain.length) {
			console.log('❌ 域名查询失败');
			allTestsPassed = false;
		} else {
			console.log('✅ 域名查询正常');
		}

		// 验证不存在email查询
		if (nonExistentResponse.data.userResponses.length !== 0) {
			console.log('❌ 不存在email查询失败');
			allTestsPassed = false;
		} else {
			console.log('✅ 不存在email查询正常');
		}

		// 验证空email查询
		if (emptyResponse.data.userResponses.length !== statsResponse.data.userResponses.length) {
			console.log('❌ 空email查询失败');
			allTestsPassed = false;
		} else {
			console.log('✅ 空email查询正常');
		}

		console.log('\n=== 最终结果 ===');
		if (allTestsPassed) {
			console.log('🎉 所有Email查询测试通过！');
		} else {
			console.log('❌ 部分Email查询测试失败');
		}
	} catch (error) {
		console.error('测试失败:', error.response?.data || error.message);
	}
}

testFuzzyEmail();
