#!/usr/bin/env node

/**
 * Survey Multi-Tenant Migration Script
 * 
 * This script helps migrate existing surveys to the multi-tenant architecture.
 * It provides several options for handling legacy data.
 */

const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const Company = require('../models/Company');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');
}

async function analyzeData() {
  const totalSurveys = await Survey.countDocuments();
  const surveysWithCompanyId = await Survey.countDocuments({ companyId: { $exists: true, $ne: null } });
  const surveysWithoutCompanyId = totalSurveys - surveysWithCompanyId;
  
  console.log('\n📊 数据分析:');
  console.log(`总survey数量: ${totalSurveys}`);
  console.log(`已分配公司的: ${surveysWithCompanyId}`);  
  console.log(`未分配公司的: ${surveysWithoutCompanyId}`);
  
  return { totalSurveys, surveysWithCompanyId, surveysWithoutCompanyId };
}

async function listCompanies() {
  const companies = await Company.find({}, { _id: 1, slug: 1, name: 1 }).lean();
  console.log('\n🏢 可用公司:');
  companies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.slug} - ${company.name} (${company._id})`);
  });
  return companies;
}

async function createDefaultCompany() {
  // 检查是否已有默认公司
  let defaultCompany = await Company.findOne({ slug: 'default' });
  
  if (!defaultCompany) {
    console.log('\n🏗️ 创建默认公司用于旧数据...');
    defaultCompany = new Company({
      name: 'Default Company',
      slug: 'default',
      description: 'Default company for legacy surveys',
      isActive: true
    });
    await defaultCompany.save();
    console.log('✅ 已创建默认公司:', defaultCompany.slug);
  } else {
    console.log('✅ 默认公司已存在:', defaultCompany.slug);
  }
  
  return defaultCompany;
}

async function migrateToDefaultCompany() {
  console.log('\n🔄 将所有未分配的survey迁移到默认公司...');
  
  const defaultCompany = await createDefaultCompany();
  
  const result = await Survey.updateMany(
    { companyId: { $exists: false } },
    { $set: { companyId: defaultCompany._id } }
  );
  
  console.log(`✅ 已迁移 ${result.modifiedCount} 个survey到默认公司`);
  return result;
}

async function interactiveMigration() {
  console.log('\n🎯 交互式迁移 - 手动分配survey到公司');
  
  const companies = await listCompanies();
  const surveysWithoutCompany = await Survey.find(
    { companyId: { $exists: false } },
    { _id: 1, title: 1, slug: 1, type: 1, createdAt: 1 }
  ).limit(10).lean();
  
  if (surveysWithoutCompany.length === 0) {
    console.log('✅ 没有需要迁移的survey');
    return;
  }
  
  console.log(`\n发现 ${surveysWithoutCompany.length} 个未分配的survey (显示前10个):`);
  
  for (const survey of surveysWithoutCompany) {
    console.log(`\n📝 Survey: "${survey.title}"`);
    console.log(`   Slug: ${survey.slug || 'N/A'}`);
    console.log(`   Type: ${survey.type}`);
    console.log(`   Created: ${survey.createdAt}`);
    
    console.log('\n选择公司:');
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
    });
    console.log('s. 跳过此survey');
    console.log('q. 退出');
    
    const answer = await new Promise(resolve => {
      rl.question('请选择 (1-n/s/q): ', resolve);
    });
    
    if (answer.toLowerCase() === 'q') {
      console.log('退出迁移');
      break;
    }
    
    if (answer.toLowerCase() === 's') {
      console.log('跳过此survey');
      continue;
    }
    
    const companyIndex = parseInt(answer) - 1;
    if (companyIndex >= 0 && companyIndex < companies.length) {
      const selectedCompany = companies[companyIndex];
      await Survey.updateOne(
        { _id: survey._id },
        { $set: { companyId: selectedCompany._id } }
      );
      console.log(`✅ Survey "${survey.title}" 已分配给 ${selectedCompany.name}`);
    } else {
      console.log('❌ 无效选择，跳过此survey');
    }
  }
}

async function handleSlugConflicts() {
  console.log('\n🔍 检查slug冲突...');
  
  const surveys = await Survey.find({}, { slug: 1, title: 1, companyId: 1, type: 1 }).lean();
  const slugMap = new Map();
  
  surveys.forEach(survey => {
    if (survey.slug) {
      if (!slugMap.has(survey.slug)) {
        slugMap.set(survey.slug, []);
      }
      slugMap.get(survey.slug).push(survey);
    }
  });
  
  const conflicts = Array.from(slugMap.entries()).filter(([slug, surveys]) => surveys.length > 1);
  
  if (conflicts.length === 0) {
    console.log('✅ 没有slug冲突');
    return;
  }
  
  console.log(`⚠️ 发现 ${conflicts.length} 个slug冲突:`);
  
  for (const [slug, conflictingSurveys] of conflicts) {
    console.log(`\nSlug: "${slug}" (${conflictingSurveys.length} 个survey):`);
    
    const sameCompany = conflictingSurveys.filter(s => s.companyId).every(s => 
      s.companyId?.toString() === conflictingSurveys.find(x => x.companyId)?.companyId?.toString()
    );
    
    conflictingSurveys.forEach((survey, index) => {
      const companyInfo = survey.companyId ? `Company: ${survey.companyId}` : '无公司';
      console.log(`  ${index + 1}. "${survey.title}" [${survey.type}] (${companyInfo})`);
    });
    
    if (sameCompany) {
      console.log('  ⚠️ 同一公司内有重复slug，需要重命名');
      
      for (let i = 1; i < conflictingSurveys.length; i++) {
        const survey = conflictingSurveys[i];
        const newSlug = `${slug}-${i}`;
        await Survey.updateOne(
          { _id: survey._id },
          { $set: { slug: newSlug } }
        );
        console.log(`  ✅ 已重命名: "${survey.title}" -> slug: "${newSlug}"`);
      }
    } else {
      console.log('  ✅ 不同公司间的重复slug，这是允许的');
    }
  }
}

async function showMenu() {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Survey多租户迁移工具');
  console.log('='.repeat(50));
  console.log('1. 查看数据分析');
  console.log('2. 将所有未分配survey迁移到默认公司');
  console.log('3. 交互式迁移 (手动分配)');
  console.log('4. 处理slug冲突');
  console.log('5. 列出公司');
  console.log('0. 退出');
  
  const choice = await new Promise(resolve => {
    rl.question('\n请选择操作 (0-5): ', resolve);
  });
  
  switch (choice) {
    case '1':
      await analyzeData();
      break;
    case '2':
      await migrateToDefaultCompany();
      break;
    case '3':
      await interactiveMigration();
      break;
    case '4':
      await handleSlugConflicts();
      break;
    case '5':
      await listCompanies();
      break;
    case '0':
      console.log('👋 退出迁移工具');
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('❌ 无效选择');
  }
  
  // 继续显示菜单
  await showMenu();
}

async function main() {
  try {
    await connectDB();
    await analyzeData();
    await showMenu();
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  analyzeData,
  migrateToDefaultCompany,
  handleSlugConflicts,
  createDefaultCompany
};