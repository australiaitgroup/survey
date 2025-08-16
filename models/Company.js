const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
	// Basic Information
	name: {
		type: String,
		required: true,
		trim: true,
	},
	// URL slug for multi-tenant routing (e.g., /company1/assessment/...)
	slug: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
		match: /^[a-z0-9-]+$/,
	},
	website: {
		type: String,
		trim: true,
	},
	industry: {
		type: String,
		trim: true,
	},
	size: {
		type: String,
		enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
	},
	foundedYear: {
		type: Number,
		min: 1800,
		max: new Date().getFullYear(),
	},
	description: {
		type: String,
		trim: true,
		maxlength: 1000,
	},

	// Contact Information
	contactEmail: {
		type: String,
		trim: true,
		lowercase: true,
	},
	contactPhone: {
		type: String,
		trim: true,
	},

	// Address
	address: {
		street: {
			type: String,
			trim: true,
		},
		city: {
			type: String,
			trim: true,
		},
		state: {
			type: String,
			trim: true,
		},
		country: {
			type: String,
			trim: true,
		},
		postalCode: {
			type: String,
			trim: true,
		},
	},

	// Logo
	logoUrl: {
		type: String,
		trim: true,
	},

	// Subscription Information
	subscriptionTier: {
		type: String,
		enum: ['free', 'basic', 'pro', 'enterprise'],
		default: 'free',
	},
	subscriptionStatus: {
		type: String,
		enum: ['active', 'inactive', 'trial', 'expired'],
		default: 'active',
	},

	// Onboarding
	isOnboardingCompleted: {
		type: Boolean,
		default: false,
	},
	onboardingStep: {
		type: Number,
		default: 1,
		min: 1,
		max: 5,
	},

	// Onboarding preferences
	themeColor: {
		type: String,
		default: '#3B82F6',
		trim: true,
	},
	customLogoEnabled: {
		type: Boolean,
		default: false,
	},
	defaultLanguage: {
		type: String,
		default: 'en',
		trim: true,
	},
	autoNotifyCandidate: {
		type: Boolean,
		default: true,
	},

	// Settings
	settings: {
		timezone: {
			type: String,
			default: 'UTC',
		},
		language: {
			type: String,
			default: 'en',
		},
		dateFormat: {
			type: String,
			default: 'MM/DD/YYYY',
		},
		emailNotifications: {
			type: Boolean,
			default: true,
		},
	},

	// Suspension fields
	suspensionReason: {
		type: String,
		trim: true,
	},
	suspendedAt: {
		type: Date,
	},
	suspendedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},

	// Metadata
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
});

// Update the updatedAt timestamp before saving
companySchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Virtual for full address
companySchema.virtual('fullAddress').get(function () {
	const parts = [];
	if (this.address.street) parts.push(this.address.street);
	if (this.address.city) parts.push(this.address.city);
	if (this.address.state) parts.push(this.address.state);
	if (this.address.country) parts.push(this.address.country);
	if (this.address.postalCode) parts.push(this.address.postalCode);
	return parts.join(', ');
});

// Ensure virtual fields are included in JSON output
companySchema.set('toJSON', {
	virtuals: true,
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
