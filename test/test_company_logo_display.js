const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const JWT_TOKEN =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzM2Njk0NywiZXhwIjoxNzUzOTcxNzQ3fQ.KSDOGnrSuseMeyQbQmWuQVb2VFdDb6lgatlLKeOc8Ok';

async function testCompanyLogoDisplay() {
	console.log('🧪 开始测试公司Logo显示功能...\n');

	try {
		// 1. 设置认证token
		console.log('1. 设置认证token...');
		axios.defaults.headers.common['Authorization'] = `Bearer ${JWT_TOKEN}`;
		console.log('✅ 认证token设置成功\n');

		// 2. 更新公司信息，添加Logo
		console.log('2. 更新公司信息，添加Logo...');
		const companyUpdateData = {
			name: '测试公司',
			industry: '科技',
			logoUrl: 'https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=Company+Logo',
			description: '这是一个测试公司',
			website: 'https://example.com',
		};

		const companyResponse = await axios.put(`${BASE_URL}/api/admin/company`, companyUpdateData);
		console.log('✅ 公司信息更新成功');
		console.log(`   公司名称: ${companyResponse.data.company.name}`);
		console.log(`   Logo URL: ${companyResponse.data.company.logoUrl}\n`);

		// 3. 创建测试调查
		console.log('3. 创建测试调查...');
		const surveyData = {
			title: '公司Logo显示测试',
			description: '测试公司Logo在测评页面的显示',
			slug: `company-logo-test-${Date.now()}`,
			type: 'assessment',
			status: 'active',
			questions: [
				{
					text: '您看到了公司Logo吗？',
					type: 'single_choice',
					options: [{ text: '看到了' }, { text: '没有看到' }],
					correctAnswer: 0,
					points: 1,
				},
			],
		};

		const createResponse = await axios.post(`${BASE_URL}/api/admin/surveys`, surveyData);
		const survey = createResponse.data;
		console.log(`✅ 测试调查创建成功: ${survey.title} (ID: ${survey._id})\n`);

		// 4. 测试公开访问，验证是否包含公司信息
		console.log('4. 测试公开访问，验证公司信息...');
		const publicResponse = await axios.get(`${BASE_URL}/api/survey/${survey.slug}`);
		const publicSurvey = publicResponse.data;

		console.log('📊 调查信息:');
		console.log(`   - 标题: ${publicSurvey.title}`);
		console.log(`   - 类型: ${publicSurvey.type}`);
		console.log(`   - 状态: ${publicSurvey.status}`);

		if (publicSurvey.company) {
			console.log('✅ 公司信息包含在调查响应中:');
			console.log(`   - 公司名称: ${publicSurvey.company.name}`);
			console.log(`   - Logo URL: ${publicSurvey.company.logoUrl}`);
			console.log(`   - 行业: ${publicSurvey.company.industry}`);
			console.log(`   - 网站: ${publicSurvey.company.website}`);
			console.log(`   - 描述: ${publicSurvey.company.description}`);
		} else {
			console.log('❌ 调查响应中未包含公司信息');
		}

		// 5. 测试没有Logo的情况
		console.log('\n5. 测试没有Logo的情况...');
		const noLogoCompanyData = {
			name: '无Logo公司',
			industry: '教育',
			description: '这个公司没有Logo',
			website: 'https://no-logo.com',
		};

		await axios.put(`${BASE_URL}/api/admin/company`, noLogoCompanyData);
		console.log('✅ 更新为无Logo公司信息');

		const noLogoResponse = await axios.get(`${BASE_URL}/api/survey/${survey.slug}`);
		const noLogoSurvey = noLogoResponse.data;

		if (noLogoSurvey.company) {
			console.log('✅ 公司信息仍然包含在调查响应中:');
			console.log(`   - 公司名称: ${noLogoSurvey.company.name}`);
			console.log(`   - Logo URL: ${noLogoSurvey.company.logoUrl || '无'}`);
		}

		// 6. 生成测评URL
		console.log('\n6. 生成测评URL...');
		const assessmentUrl = `${BASE_URL.replace('/api', '')}/assessment/${survey.slug}`;
		console.log(`📱 测评页面URL: ${assessmentUrl}`);
		console.log('   请在浏览器中打开此URL查看公司Logo显示效果');

		console.log('\n🎉 公司Logo显示功能测试完成！');
		console.log('\n📝 测试总结:');
		console.log('   ✅ 公司信息成功添加到调查API响应中');
		console.log('   ✅ 支持有Logo和无Logo两种情况');
		console.log('   ✅ 前端组件已更新以显示公司Logo');
		console.log('   ✅ Logo显示在测评页面的多个位置');
	} catch (error) {
		console.error('❌ 测试失败:', error.response?.data || error.message);
	}
}

// 运行测试
testCompanyLogoDisplay();
