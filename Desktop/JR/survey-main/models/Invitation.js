const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
	surveyId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Survey',
		required: true,
	},
	invitationCode: {
		type: String,
		unique: true,
		required: true,
		default: () => crypto.randomBytes(16).toString('hex'),
	},
	distributionMode: {
		type: String,
		enum: ['open', 'targeted', 'link'],
		required: true,
	},
	targetUsers: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],
	targetEmails: [String], // For users not in the system
	maxResponses: {
		type: Number,
		default: null, // null means unlimited
	},
	currentResponses: {
		type: Number,
		default: 0,
	},
	expiresAt: {
		type: Date,
		default: null, // null means never expires
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: false, // Allow null for legacy admin users
	},
	// Track who has accessed the invitation
	accessLog: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
			email: String,
			accessedAt: {
				type: Date,
				default: Date.now,
			},
			ipAddress: String,
		},
	],
	// Track completed responses
	completedBy: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
			email: String,
			completedAt: {
				type: Date,
				default: Date.now,
			},
		},
	],
});

// Index for efficient queries
invitationSchema.index({ invitationCode: 1 });
invitationSchema.index({ surveyId: 1 });
invitationSchema.index({ expiresAt: 1 });

// Check if invitation is valid
invitationSchema.methods.isValid = function () {
	if (!this.isActive) return false;
	if (this.expiresAt && this.expiresAt < new Date()) return false;
	if (this.maxResponses && this.currentResponses >= this.maxResponses) return false;
	return true;
};

// Check if user has access to this invitation
invitationSchema.methods.canAccess = function (userId, email) {
	if (this.distributionMode === 'open') return true;

	if (this.distributionMode === 'targeted') {
		if (userId && this.targetUsers.includes(userId)) return true;
		if (email && this.targetEmails.includes(email)) return true;
		return false;
	}

	if (this.distributionMode === 'link') return true;

	return false;
};

module.exports = mongoose.model('Invitation', invitationSchema);
