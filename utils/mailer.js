const nodemailer = require('nodemailer');

// 本地开发建议用 163/QQ/Gmail 测试账号，或 Mailtrap/Smtp4dev 等本地 SMTP 服务
// 下面以 163 邮箱为例（可根据实际情况修改）

const transporter = nodemailer.createTransport({
	host: 'smtp.163.com', // 例如 smtp.qq.com、smtp.gmail.com
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: process.env.MAIL_USER || 'your_email@163.com', // 邮箱账号
		pass: process.env.MAIL_PASS || 'your_email_password', // 邮箱授权码
	},
});

/**
 * 发送邮件
 * @param {Object} options
 * @param {string} options.to 收件人邮箱
 * @param {string} options.subject 邮件主题
 * @param {string} options.html 邮件内容（支持 HTML）
 * @param {string} [options.text] 纯文本内容
 * @returns {Promise}
 */
function sendMail({ to, subject, html, text }) {
	// 临时禁用邮件发送用于测试
	console.log('📧 邮件发送模拟（已禁用实际发送）:');
	console.log(`收件人: ${to}`);
	console.log(`主题: ${subject}`);
	console.log(`内容: ${html.substring(0, 100)}...`);

	// 返回成功的Promise
	return Promise.resolve({
		messageId: 'fake-' + Date.now(),
		response: '250 OK: Message accepted for delivery',
	});

	// 原始发送代码（已注释）
	/*
	return transporter.sendMail({
		from: process.env.MAIL_FROM || '测评系统 <your_email@163.com>',
		to,
		subject,
		html,
		text,
	});
	*/
}

module.exports = { sendMail };
