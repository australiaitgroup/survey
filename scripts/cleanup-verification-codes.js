#!/usr/bin/env node

/**
 * 清理过期的验证码脚本
 * 虽然MongoDB的TTL索引会自动清理过期文档，但这个脚本可以作为备选清理机制
 */

const mongoose = require('mongoose');
require('colors');

// MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function cleanupVerificationCodes() {
	try {
		console.log('🔗 正在连接到MongoDB...'.blue);
		await mongoose.connect(MONGODB_URI);
		console.log('✅ MongoDB连接成功'.green);

		// 导入验证码模型
		const VerificationCode = require('../models/VerificationCode');

		// 查找并删除过期的验证码
		const now = new Date();
		const result = await VerificationCode.deleteMany({
			expiresAt: { $lt: now }
		});

		console.log(`🧹 清理完成: 删除了 ${result.deletedCount} 个过期的验证码`.green);

		// 可选：清理尝试次数过多的验证码
		const failedResult = await VerificationCode.deleteMany({
			attempts: { $gte: 5 },
			isUsed: false
		});

		if (failedResult.deletedCount > 0) {
			console.log(`🧹 清理完成: 删除了 ${failedResult.deletedCount} 个尝试次数过多的验证码`.green);
		}

		// 显示剩余的验证码统计
		const remainingCount = await VerificationCode.countDocuments();
		const activeCount = await VerificationCode.countDocuments({
			isUsed: false,
			expiresAt: { $gte: now },
			attempts: { $lt: 5 }
		});

		console.log(`📊 统计信息:`.cyan);
		console.log(`   总验证码数量: ${remainingCount}`.cyan);
		console.log(`   活跃验证码数量: ${activeCount}`.cyan);

	} catch (error) {
		console.error('❌ 清理过程中发生错误:'.red, error.message);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
		console.log('🔌 MongoDB连接已断开'.blue);
	}
}

// 如果直接运行此脚本
if (require.main === module) {
	cleanupVerificationCodes()
		.then(() => {
			console.log('✨ 验证码清理任务完成'.green);
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 清理任务失败:'.red, error.message);
			process.exit(1);
		});
}

module.exports = cleanupVerificationCodes;