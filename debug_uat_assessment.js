#!/usr/bin/env node

/**
 * UAT Assessment Debug Tool
 * 专门用于排查UAT环境assessment问题的工具
 */

const axios = require('axios');

// UAT配置
const UAT_BASE_URL = 'https://uat.sigmaq.co';
const TEST_CASES = [
    { company: 'jobpin', slug: 'ta' },
    { company: 'jr-academy', slug: 'sdd' },
    { company: 'jr-academy', slug: 'test' },
    { company: 'jobpin', slug: 'test' }
];

async function debugUATAssessment() {
    console.log('🔍 UAT Assessment Debug Tool');
    console.log('============================\n');

    // 1. 检查服务器健康状态
    console.log('🏥 Checking server health...');
    try {
        const healthResponse = await axios.get(`${UAT_BASE_URL}/api/health`);
        console.log('✅ Server is healthy');
        console.log(`   Environment: ${healthResponse.data.environment}`);
        console.log(`   Version: ${healthResponse.data.version}`);
        console.log(`   Database: ${healthResponse.data.database}`);
        console.log(`   Uptime: ${Math.round(healthResponse.data.uptime)}s`);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return;
    }

    // 2. 检查debug端点是否启用
    console.log('\n🔧 Checking debug endpoint...');
    try {
        const debugResponse = await axios.get(`${UAT_BASE_URL}/api/debug/system-status`);
        console.log('✅ Debug endpoint available');
        console.log(`   Debug enabled: ${debugResponse.data.environment.ASSESSMENT_DEBUG}`);
        console.log(`   Total companies: ${debugResponse.data.database.companies.length}`);
        console.log(`   Legacy surveys: ${debugResponse.data.database.totalLegacySurveys}`);
        
        console.log('\n📊 Company survey breakdown:');
        debugResponse.data.database.companies.forEach(company => {
            const surveys = company.surveys;
            console.log(`   • ${company.name} (${company.slug}): ${surveys.totalSurveys} total, ${surveys.assessments} assessments`);
        });

        if (debugResponse.data.database.legacySurveys.length > 0) {
            console.log('\n🗂️  Legacy surveys:');
            debugResponse.data.database.legacySurveys.forEach(survey => {
                console.log(`   • ${survey.title} (${survey.slug}): ${survey.type}`);
            });
        }

    } catch (error) {
        if (error.response?.status === 404) {
            console.log('⚠️  Debug endpoint not available (ASSESSMENT_DEBUG not enabled)');
        } else {
            console.log('❌ Debug endpoint failed:', error.message);
        }
    }

    // 3. 测试各个assessment端点
    console.log('\n🧪 Testing assessment endpoints...');
    for (const testCase of TEST_CASES) {
        const url = `${UAT_BASE_URL}/${testCase.company}/api/assessment/${testCase.slug}`;
        
        try {
            console.log(`\n📋 Testing: ${testCase.company}/${testCase.slug}`);
            console.log(`   URL: ${url}`);
            
            const response = await axios.get(url);
            
            console.log('   ✅ Success!');
            console.log(`   Survey ID: ${response.data._id}`);
            console.log(`   Title: ${response.data.title}`);
            console.log(`   Type: ${response.data.type}`);
            console.log(`   Status: ${response.data.status}`);
            console.log(`   Company ID: ${response.data.companyId || 'null'}`);
            
            // 检查debug headers
            const debugHeaders = {};
            Object.keys(response.headers).forEach(key => {
                if (key.startsWith('x-debug-')) {
                    debugHeaders[key] = response.headers[key];
                }
            });
            
            if (Object.keys(debugHeaders).length > 0) {
                console.log('   🔍 Debug headers:');
                Object.entries(debugHeaders).forEach(([key, value]) => {
                    console.log(`     ${key}: ${value}`);
                });
            }

            // 测试start端点
            console.log('   🚀 Testing /start endpoint...');
            try {
                const startResponse = await axios.post(`${url}/start`, {
                    name: 'Debug Test User',
                    email: 'debug@test.com'
                });
                console.log('   ✅ Start endpoint works');
                console.log(`   Response ID: ${startResponse.data.responseId}`);
                console.log(`   Questions: ${startResponse.data.totalQuestions}`);
            } catch (startError) {
                console.log(`   ❌ Start endpoint failed: ${startError.response?.status} ${startError.response?.data?.message || startError.message}`);
            }

        } catch (error) {
            console.log('   ❌ Failed!');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
            
            if (error.response?.data?.errorType) {
                console.log(`   Error Type: ${error.response.data.errorType}`);
            }
        }
    }

    // 4. 检查前端页面
    console.log('\n🌐 Testing frontend access...');
    const frontendUrls = [
        `${UAT_BASE_URL}/jobpin/assessment/ta`,
        `${UAT_BASE_URL}/jr-academy/assessment/sdd`
    ];

    for (const url of frontendUrls) {
        try {
            console.log(`\n📄 Testing frontend: ${url}`);
            const response = await axios.get(url, {
                headers: { 'Accept': 'text/html' }
            });
            
            if (response.status === 200 && response.headers['content-type']?.includes('text/html')) {
                if (response.data.includes('This is not an assessment')) {
                    console.log('   ⚠️  Page loaded but shows error message');
                } else if (response.data.includes('Assessment') || response.data.includes('assessment')) {
                    console.log('   ✅ Page loaded successfully');
                } else {
                    console.log('   ❓ Page loaded but content unclear');
                }
            } else {
                console.log(`   ❌ Unexpected response: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Frontend test failed: ${error.response?.status} ${error.message}`);
        }
    }

    console.log('\n🏁 UAT Debug completed');
    console.log('\n💡 Next steps if issues found:');
    console.log('1. Enable debug mode: Set ASSESSMENT_DEBUG=true in UAT environment');
    console.log('2. Check server logs for detailed debug output');
    console.log('3. Verify database migration completed successfully');
    console.log('4. Check if multi-tenant middleware is working correctly');
}

// 运行debug工具
debugUATAssessment().catch(console.error);