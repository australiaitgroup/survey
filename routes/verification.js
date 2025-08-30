const express = require('express');
const rateLimit = require('express-rate-limit');
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationCode } = require('../utils/mailer');

const router = express.Router();

// Rate limiting for verification code sending: max 5 requests per IP per minute
const sendCodeLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 5, // Max 5 requests per IP per window
	message: {
		success: false,
		error: 'Too many requests, please try again later',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Rate limiting for verification code verification: max 10 requests per IP per minute
const verifyCodeLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10, // Max 10 requests per IP per window
	message: {
		success: false,
		error: 'Too many verification attempts, please try again later',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * @route   POST /api/verification/send-code
 * @desc    Send email verification code
 * @access  Public
 */
router.post('/send-code', sendCodeLimiter, async (req, res) => {
	try {
		const { email, name, language = 'en' } = req.body;

		// Validate email format
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({
				success: false,
				error: 'Please enter a valid email address',
			});
		}

		const normalizedEmail = email.toLowerCase().trim();

		// Check if email is already registered
		const User = require('../models/User');
		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: 'An account with this email address already exists',
				errorType: 'email_already_registered',
			});
		}

		// Check sending frequency (1 minute interval)
		const canSend = await VerificationCode.canSendCode(normalizedEmail);
		if (!canSend) {
			const nextSendTime = await VerificationCode.getNextSendTime(normalizedEmail);
			const remainingSeconds = Math.ceil((nextSendTime - new Date()) / 1000);

			return res.status(429).json({
				success: false,
				error: `Please wait ${remainingSeconds} seconds before sending again`,
				remainingSeconds: remainingSeconds,
			});
		}

		// Create verification code
		const verificationCode = await VerificationCode.createOrUpdateCode(normalizedEmail);

		// Send email
		try {
			await sendVerificationCode({
				to: normalizedEmail,
				code: verificationCode.code,
				name: name,
				language: language,
			});

			res.json({
				success: true,
				message: 'Verification code sent to your email',
				expiresIn: 300, // 5 minutes
			});
		} catch (emailError) {
	
			// If email sending fails, delete the created verification code
			await VerificationCode.findByIdAndDelete(verificationCode._id);

			res.status(500).json({
				success: false,
				error: 'Email sending failed, please try again later',
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			error: 'Server error, please try again later',
		});
	}
});

/**
 * @route   POST /api/verification/verify-code
 * @desc    Verify email verification code
 * @access  Public
 */
router.post('/verify-code', verifyCodeLimiter, async (req, res) => {
	try {
		const { email, code } = req.body;

		// Validate input
		if (!email || !code) {
			return res.status(400).json({
				success: false,
				error: 'Email and verification code cannot be empty',
			});
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({
				success: false,
				error: 'Please enter a valid email address',
			});
		}

		if (!/^\d{6}$/.test(code)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid verification code format',
			});
		}

		const normalizedEmail = email.toLowerCase().trim();

		// Check verification code (don't mark as used yet)
		const result = await VerificationCode.checkCode(normalizedEmail, code);

		if (result.success) {
			res.json({
				success: true,
				message: 'Verification successful',
			});
		} else {
			res.status(400).json({
				success: false,
				error: result.message,
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			error: 'Server error, please try again later',
		});
	}
});

/**
 * @route   GET /api/verification/check-status/:email
 * @desc    Check email verification status
 * @access  Public
 */
router.get('/check-status/:email', async (req, res) => {
	try {
		const email = req.params.email.toLowerCase().trim();

		// Validate email format
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({
				success: false,
				error: 'Please enter a valid email address',
			});
		}

		// Check for unused verification codes
		const activeCode = await VerificationCode.findOne({
			email: email,
			isUsed: false,
			expiresAt: { $gte: new Date() },
		});

		// Check next send time
		const nextSendTime = await VerificationCode.getNextSendTime(email);
		const canSendNow = !nextSendTime || nextSendTime <= new Date();
		const remainingSeconds = canSendNow ? 0 : Math.ceil((nextSendTime - new Date()) / 1000);

		res.json({
			success: true,
			data: {
				hasActiveCode: !!activeCode,
				canSendCode: canSendNow,
				remainingSeconds: remainingSeconds,
				expiresAt: activeCode ? activeCode.expiresAt : null,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: 'Server error, please try again later',
		});
	}
});

module.exports = router;
