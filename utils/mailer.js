const nodemailer = require('nodemailer');
const emailTemplateManager = require('./EmailTemplateManager');

// For local development, recommend using test accounts like 163/QQ/Gmail or local SMTP services like Mailtrap/Smtp4dev
// Gmail configuration example below (modify as needed)

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST || 'smtp.gmail.com',
	port: process.env.EMAIL_PORT || 587,
	secure: process.env.EMAIL_PORT == 465, // true for port 465, false for other ports
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

/**
 * Send email
 * @param {Object} options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject
 * @param {string} options.html Email content (supports HTML)
 * @param {string} [options.text] Plain text content
 * @param {string} [options.language] Language for error messages ('en' | 'zh')
 * @returns {Promise}
 */
function sendMail({ to, subject, html, text, language = 'en' }) {
	// If email configuration is incomplete, return error
	if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
		const errorMessages = {
			en: 'Email configuration incomplete. Please configure EMAIL_USER and EMAIL_PASS in .env file',
			zh: '邮件配置不完整，请在 .env 文件中配置 EMAIL_USER 和 EMAIL_PASS'
		};
		const error = new Error(errorMessages[language] || errorMessages.en);
		error.code = 'EMAIL_CONFIG_MISSING';
		return Promise.reject(error);
	}

	// Send actual email
	return transporter.sendMail({
		from: process.env.EMAIL_FROM || `SigmaQ <${process.env.EMAIL_USER}>`,
		to,
		subject,
		html,
		text,
	});
}

/**
 * Send verification code email
 * @param {Object} options
 * @param {string} options.to Recipient email address
 * @param {string} options.code Verification code
 * @param {string} [options.name] User name
 * @param {string} [options.language] Language ('en' | 'zh')
 * @returns {Promise}
 */
async function sendVerificationCode({ to, code, name, language = 'en' }) {
	// Multi-language text configuration
	const translations = {
		en: {
			subject: 'Email Verification Code - SigmaQ',
			title: 'SigmaQ Email Verification',
			greeting: name ? `Hello, ${name}!` : 'Hello!',
			message:
				'Thank you for registering with SigmaQ Survey Platform. To protect your account security, please use the following verification code to complete your email verification:',
			codeLabel: 'Verification Code',
			warningTitle: 'Important Reminder:',
			warningItems: [
				'This verification code will expire in <strong>5 minutes</strong>',
				'Maximum 5 attempts allowed',
				'Please do not share this code with others',
			],
			disclaimer:
				'If you did not register for a SigmaQ account, please ignore this email. Someone may have entered your email address by mistake.',
			footerText: 'This email was sent automatically by SigmaQ system. Please do not reply.',
			footerLinks: ['Help Center', 'Contact Support', 'Privacy Policy'],
			textMessage: `Thank you for registering with SigmaQ Survey Platform. Your verification code is: ${code}\n\nImportant reminders:\n- This verification code will expire in 5 minutes\n- Maximum 5 attempts allowed\n- Please do not share this code with others\n\nIf you did not register for a SigmaQ account, please ignore this email.\n\n---\nSigmaQ Survey Platform\nThis email was sent automatically by the system. Please do not reply.`,
		},
		zh: {
			subject: '邮箱验证码 - SigmaQ',
			title: 'SigmaQ 邮箱验证',
			greeting: name ? `您好，${name}！` : '您好！',
			message:
				'感谢您注册 SigmaQ 调研平台。为了保护您的账户安全，请使用以下验证码完成邮箱验证：',
			codeLabel: '验证码',
			warningTitle: '重要提醒：',
			warningItems: [
				'此验证码将在 <strong>5分钟</strong> 后失效',
				'验证码最多可尝试 5 次',
				'请勿将验证码泄露给他人',
			],
			disclaimer:
				'如果您没有注册 SigmaQ 账户，请忽略此邮件。这可能是有人误输入了您的邮箱地址。',
			footerText: '此邮件由 SigmaQ 系统自动发送，请勿回复。',
			footerLinks: ['帮助中心', '联系客服', '隐私政策'],
			textMessage: `感谢您注册 SigmaQ 调研平台。您的验证码是：${code}\n\n重要提醒：\n- 此验证码将在 5分钟 后失效\n- 验证码最多可尝试 5 次\n- 请勿将验证码泄露给他人\n\n如果您没有注册 SigmaQ 账户，请忽略此邮件。\n\n---\nSigmaQ 调研平台\n此邮件由系统自动发送，请勿回复。`,
		},
	};

	const t = translations[language] || translations['en'];

	try {
		// Clear template cache to ensure latest version
		emailTemplateManager.clearCache();
		
		// Use template system
		const html = await emailTemplateManager.renderTemplate('verification-code', {
			subject: t.subject,
			title: t.title,
			greeting: t.greeting,
			message: t.message,
			codeLabel: t.codeLabel,
			code: code,
			warningTitle: t.warningTitle,
			warningItems: t.warningItems,
			disclaimer: t.disclaimer,
			footerText: t.footerText,
			footerLinks: t.footerLinks
		});

		return sendMail({ to, subject: t.subject, html, text: t.textMessage, language });
	} catch (error) {
		// Fallback to basic email if template fails
		const fallbackHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #667eea;">${t.title}</h1>
				<p>${t.greeting}</p>
				<p>${t.message}</p>
				<div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
					<h2 style="color: #667eea; font-family: monospace; letter-spacing: 4px;">${code}</h2>
				</div>
				<p style="color: #856404;"><strong>⚠️ ${t.warningTitle}</strong></p>
				<ul style="color: #856404;">${t.warningItems.map(item => `<li>${item}</li>`).join('')}</ul>
				<p>${t.disclaimer}</p>
			</div>
		`;
		return sendMail({ to, subject: t.subject, html: fallbackHtml, text: t.textMessage, language });
	}
}

module.exports = { sendMail, sendVerificationCode };
