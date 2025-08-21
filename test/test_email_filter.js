const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testEmailFilter() {
	console.log('🧪 开始测试Email查询功能...\n');

	try {
		// 1. 设置认证token
		console.log('1. 设置认证token...');
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;
		console.log('✅ 认证token设置成功\n');

		// 2. 创建测试调查
		console.log('2. 创建测试调查...');
		const surveyData = {
			title: 'Email查询功能测试',
			description: '用于测试email查询功能的调查',
			type: 'survey',
		};
		const createSurveyResponse = await axios.post(`${BASE_URL}/api/admin/surveys`, surveyData);
		const survey = createSurveyResponse.data;
		console.log(`✅ 调查创建成功: ${survey.title} (ID: ${survey._id})\n`);

		// 3. 添加测试问题
		console.log('3. 添加测试问题...');
		const questionData = {
			text: '您最喜欢的颜色是什么？',
			options: ['红色', '蓝色', '绿色', '黄色', '其他'],
		};
		await axios.put(`${BASE_URL}/api/admin/surveys/${survey._id}/questions`, questionData);
		console.log('✅ 问题添加成功\n');

		// 4. 模拟提交多个不同email的答案
		console.log('4. 模拟提交多个不同email的答案...');
		const testEmails = [
			'test1@example.com',
			'test2@example.com',
			'user123@gmail.com',
			'admin@company.com',
			'another@test.org',
		];

		for (let i = 0; i < testEmails.length; i++) {
			const responseData = {
				name: `测试用户${i + 1}`,
				email: testEmails[i],
				surveyId: survey._id,
				answers: { 0: i % 5 }, // 不同的答案
				timeSpent: 60 + i * 10,
			};
			await axios.post(`${BASE_URL}/api/surveys/${survey._id}/responses`, responseData);
			console.log(`✅ 提交答案: ${testEmails[i]}`);
		}
		console.log('✅ 所有答案提交成功\n');

		// 5. 测试不同的email查询
		console.log('5. 测试不同的email查询...\n');

		// 测试完整email查询
		console.log('5.1 测试完整email查询 (test1@example.com)...');
		const fullEmailResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=test1@example.com`
		);
		console.log(`查询结果: ${fullEmailResponse.data.userResponses.length} 条记录`);
		fullEmailResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 测试部分email查询
		console.log('\n5.2 测试部分email查询 (test)...');
		const partialEmailResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=test`
		);
		console.log(`查询结果: ${partialEmailResponse.data.userResponses.length} 条记录`);
		partialEmailResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 测试域名查询
		console.log('\n5.3 测试域名查询 (example.com)...');
		const domainResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=example.com`
		);
		console.log(`查询结果: ${domainResponse.data.userResponses.length} 条记录`);
		domainResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 测试不存在的email
		console.log('\n5.4 测试不存在的email (nonexistent@test.com)...');
		const nonExistentResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics?email=nonexistent@test.com`
		);
		console.log(`查询结果: ${nonExistentResponse.data.userResponses.length} 条记录`);

		// 测试空email查询（应该返回所有记录）
		console.log('\n5.5 测试空email查询（返回所有记录）...');
		const allResponse = await axios.get(
			`${BASE_URL}/api/admin/surveys/${survey._id}/statistics`
		);
		console.log(`查询结果: ${allResponse.data.userResponses.length} 条记录`);
		allResponse.data.userResponses.forEach((resp, index) => {
			console.log(`  ${index + 1}. ${resp.name} (${resp.email})`);
		});

		// 6. 验证查询逻辑
		console.log('\n6. 验证查询逻辑...');
		let allTestsPassed = true;

		// 验证完整email查询
		if (fullEmailResponse.data.userResponses.length !== 1) {
			console.log('❌ 完整email查询失败：应该返回1条记录');
			allTestsPassed = false;
		} else if (fullEmailResponse.data.userResponses[0].email !== 'test1@example.com') {
			console.log('❌ 完整email查询失败：返回了错误的email');
			allTestsPassed = false;
		} else {
			console.log('✅ 完整email查询正常');
		}

		// 验证部分email查询
		const expectedPartialResults = testEmails.filter(email => email.includes('test'));
		if (partialEmailResponse.data.userResponses.length !== expectedPartialResults.length) {
			console.log(
				`❌ 部分email查询失败：期望${expectedPartialResults.length}条记录，实际${partialEmailResponse.data.userResponses.length}条`
			);
			allTestsPassed = false;
		} else {
			console.log('✅ 部分email查询正常');
		}

		// 验证域名查询
		const expectedDomainResults = testEmails.filter(email => email.includes('example.com'));
		if (domainResponse.data.userResponses.length !== expectedDomainResults.length) {
			console.log(
				`❌ 域名查询失败：期望${expectedDomainResults.length}条记录，实际${domainResponse.data.userResponses.length}条`
			);
			allTestsPassed = false;
		} else {
			console.log('✅ 域名查询正常');
		}

		// 验证不存在的email查询
		if (nonExistentResponse.data.userResponses.length !== 0) {
			console.log('❌ 不存在email查询失败：应该返回0条记录');
			allTestsPassed = false;
		} else {
			console.log('✅ 不存在email查询正常');
		}

		// 验证空email查询
		if (allResponse.data.userResponses.length !== testEmails.length) {
			console.log(
				`❌ 空email查询失败：期望${testEmails.length}条记录，实际${allResponse.data.userResponses.length}条`
			);
			allTestsPassed = false;
		} else {
			console.log('✅ 空email查询正常');
		}

		// 7. 测试结果
		console.log('\n7. 测试结果...');
		if (allTestsPassed) {
			console.log('🎉 所有Email查询测试通过！');
			console.log('\n📋 功能验证总结:');
			console.log('✅ 完整email精确查询 - 正常');
			console.log('✅ 部分email模糊查询 - 正常');
			console.log('✅ 域名查询 - 正常');
			console.log('✅ 不存在email查询 - 正常');
			console.log('✅ 空email查询（返回全部） - 正常');
		} else {
			console.log('❌ 部分Email查询测试失败');
		}
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
	}
}

// 运行测试
testEmailFilter();
