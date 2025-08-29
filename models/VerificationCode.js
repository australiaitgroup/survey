const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	code: {
		type: String,
		required: true,
		length: 6,
	},
	type: {
		type: String,
		enum: ['email_verification', 'password_reset'],
		default: 'email_verification',
	},
	attempts: {
		type: Number,
		default: 0,
		max: 5, // Maximum 5 attempts
	},
	isUsed: {
		type: Boolean,
		default: false,
	},
	expiresAt: {
		type: Date,
		required: true,
		default: () => new Date(Date.now() + 5 * 60 * 1000), // Expires after 5 minutes
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Create compound index to ensure one email can only have one valid verification code at a time
verificationCodeSchema.index({ email: 1, type: 1, isUsed: 1 });

// Create TTL index to automatically delete expired verification codes
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate 6-digit verification code
verificationCodeSchema.statics.generateCode = function() {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create or update verification code
verificationCodeSchema.statics.createOrUpdateCode = async function(email, type = 'email_verification') {
	// Delete previous unused verification codes for this email
	await this.deleteMany({ email, type, isUsed: false });
	
	// Generate new verification code
	const code = this.generateCode();
	
	// Create new verification code record
	const verificationCode = new this({
		email,
		code,
		type,
	});
	
	await verificationCode.save();
	return verificationCode;
};

// Static method to verify verification code (marks as used)
verificationCodeSchema.statics.verifyCode = async function(email, code, type = 'email_verification') {
	// First, find any verification code for this email (regardless of the code value)
	const anyVerificationCode = await this.findOne({
		email,
		type,
		isUsed: false,
		expiresAt: { $gte: new Date() },
	});

	if (!anyVerificationCode) {
		// No verification code exists or all are expired
		return { success: false, message: 'No valid verification code found. Please request a new one.' };
	}

	// Check attempt count first
	if (anyVerificationCode.attempts >= 5) {
		return { success: false, message: 'Too many attempts, please request a new code' };
	}

	// Now check if the provided code matches
	if (anyVerificationCode.code !== code) {
		// Wrong code, increase attempt count
		anyVerificationCode.attempts += 1;
		await anyVerificationCode.save();
		return { success: false, message: 'Invalid verification code' };
	}

	// Verification successful, mark as used
	anyVerificationCode.isUsed = true;
	await anyVerificationCode.save();

	return { success: true, message: 'Verification successful' };
};

// Static method to verify verification code without marking as used (for intermediate verification)
verificationCodeSchema.statics.checkCode = async function(email, code, type = 'email_verification') {
	// First, find any verification code for this email (regardless of the code value)
	const anyVerificationCode = await this.findOne({
		email,
		type,
		isUsed: false,
		expiresAt: { $gte: new Date() },
	});

	if (!anyVerificationCode) {
		// No verification code exists or all are expired
		return { success: false, message: 'No valid verification code found. Please request a new one.' };
	}

	// Check attempt count first
	if (anyVerificationCode.attempts >= 5) {
		return { success: false, message: 'Too many attempts, please request a new code' };
	}

	// Now check if the provided code matches
	if (anyVerificationCode.code !== code) {
		// Wrong code, increase attempt count
		anyVerificationCode.attempts += 1;
		await anyVerificationCode.save();
		return { success: false, message: 'Invalid verification code' };
	}

	// Verification successful, but don't mark as used yet
	return { success: true, message: 'Verification successful', codeId: anyVerificationCode._id };
};

// Static method to check email verification code sending frequency
verificationCodeSchema.statics.canSendCode = async function(email, type = 'email_verification', intervalMinutes = 1) {
	const recentCode = await this.findOne({
		email,
		type,
		createdAt: { $gte: new Date(Date.now() - intervalMinutes * 60 * 1000) }
	});

	return !recentCode;
};

// Get next available time to send verification code
verificationCodeSchema.statics.getNextSendTime = async function(email, type = 'email_verification', intervalMinutes = 1) {
	const recentCode = await this.findOne({
		email,
		type,
		createdAt: { $gte: new Date(Date.now() - intervalMinutes * 60 * 1000) }
	}).sort({ createdAt: -1 });

	if (!recentCode) {
		return null; // Can send immediately
	}

	return new Date(recentCode.createdAt.getTime() + intervalMinutes * 60 * 1000);
};

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);