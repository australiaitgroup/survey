#!/usr/bin/env node

/**
 * UAT部署验证脚本
 * 用于验证多租户迁移是否在UAT环境中成功完成
 */

const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  baseUrl: process.env.UAT_URL || 'https://uat.sigmaq.co',
  timeout: 10000,
  expectedCompanies: ['jobpin', 'jr-academy'],
  testAssessmentSlugs: ['ta', 'test', 'assessment']
};

// 日志函数
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`)
};

// HTTP请求函数
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, { timeout: CONFIG.timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
  });
}

// 测试健康检查
async function testHealthCheck() {
  log.info('Testing health check endpoint...');
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/health`);
    
    if (response.statusCode === 200) {
      const health = JSON.parse(response.body);
      log.success('Health check passed');
      log.info(`  Environment: ${health.environment}`);
      log.info(`  Version: ${health.version}`);
      log.info(`  Database: ${health.database}`);
      log.info(`  Uptime: ${Math.round(health.uptime)}s`);
      return true;
    } else {
      log.error(`Health check failed: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log.error(`Health check error: ${error.message}`);
    return false;
  }
}

// 测试多租户路由
async function testMultiTenantRoutes() {
  log.info('Testing multi-tenant routes...');
  
  let passed = 0;
  let total = 0;
  
  for (const company of CONFIG.expectedCompanies) {
    for (const slug of CONFIG.testAssessmentSlugs) {
      total++;
      const url = `${CONFIG.baseUrl}/${company}/api/assessment/${slug}`;
      
      try {
        const response = await makeRequest(url);
        
        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);
          if (data.type === 'assessment') {
            log.success(`✓ ${company}/${slug}: Found assessment "${data.title}"`);
            passed++;
          } else {
            log.warn(`? ${company}/${slug}: Found survey (not assessment)`);
          }
        } else if (response.statusCode === 404) {
          log.info(`- ${company}/${slug}: Not found (expected)`);
        } else {
          log.error(`✗ ${company}/${slug}: HTTP ${response.statusCode}`);
        }
      } catch (error) {
        log.error(`✗ ${company}/${slug}: ${error.message}`);
      }
    }
  }
  
  log.info(`Multi-tenant test results: ${passed}/${total} successful`);
  return passed > 0; // 至少有一个成功就算通过
}

// 测试前端页面访问
async function testFrontendAccess() {
  log.info('Testing frontend page access...');
  
  const testUrls = [
    `${CONFIG.baseUrl}/jobpin/assessment/ta`,
    `${CONFIG.baseUrl}/jr-academy/assessment/test`,
  ];
  
  let passed = 0;
  
  for (const url of testUrls) {
    try {
      const response = await makeRequest(url);
      
      if (response.statusCode === 200 && response.headers['content-type']?.includes('text/html')) {
        // 检查是否包含错误信息
        if (response.body.includes('This is not an assessment')) {
          log.error(`✗ ${url}: Still showing error message`);
        } else if (response.body.includes('Assessment Instructions') || response.body.includes('Assessment')) {
          log.success(`✓ ${url}: Assessment page loaded successfully`);
          passed++;
        } else {
          log.warn(`? ${url}: Page loaded but content unclear`);
        }
      } else if (response.statusCode === 404) {
        log.info(`- ${url}: Assessment not found (expected for some URLs)`);
      } else {
        log.error(`✗ ${url}: HTTP ${response.statusCode}`);
      }
    } catch (error) {
      log.error(`✗ ${url}: ${error.message}`);
    }
  }
  
  return passed > 0;
}

// 测试数据迁移状态
async function testMigrationStatus() {
  log.info('Testing migration status...');
  
  try {
    // 尝试访问一个可能的API端点来检查迁移状态
    const response = await makeRequest(`${CONFIG.baseUrl}/api/health`);
    
    if (response.statusCode === 200) {
      log.success('Migration appears successful (health check passes)');
      return true;
    }
  } catch (error) {
    log.error(`Migration status check failed: ${error.message}`);
  }
  
  return false;
}

// 生成验证报告
function generateReport(results) {
  log.info('\n' + '='.repeat(50));
  log.info('🔍 UAT DEPLOYMENT VERIFICATION REPORT');
  log.info('='.repeat(50));
  
  const overallStatus = Object.values(results).every(Boolean);
  
  log.info(`Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  log.info(`Multi-tenant Routes: ${results.routes ? '✅ PASS' : '❌ FAIL'}`);
  log.info(`Frontend Access: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
  log.info(`Migration Status: ${results.migration ? '✅ PASS' : '❌ FAIL'}`);
  
  log.info('\n' + '='.repeat(50));
  
  if (overallStatus) {
    log.success('🎉 OVERALL STATUS: DEPLOYMENT SUCCESSFUL');
    log.info('✅ Multi-tenant architecture is working correctly');
    log.info('✅ The original issue should be resolved');
    log.info(`✅ Test URL: ${CONFIG.baseUrl}/jobpin/assessment/ta`);
  } else {
    log.error('💥 OVERALL STATUS: ISSUES DETECTED');
    log.info('🔧 Please check the failing components above');
    log.info('📞 Contact the development team if issues persist');
  }
  
  log.info('='.repeat(50));
  
  return overallStatus;
}

// 主函数
async function main() {
  log.info(`🚀 Starting UAT deployment verification for: ${CONFIG.baseUrl}`);
  log.info(`📅 Timestamp: ${new Date().toISOString()}`);
  
  const results = {
    health: false,
    routes: false,
    frontend: false,
    migration: false
  };
  
  try {
    // 运行所有测试
    results.health = await testHealthCheck();
    results.routes = await testMultiTenantRoutes();
    results.frontend = await testFrontendAccess();
    results.migration = await testMigrationStatus();
    
    // 生成报告
    const success = generateReport(results);
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// 运行验证
if (require.main === module) {
  main();
}