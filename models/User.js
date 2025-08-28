const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	password: {
		type: String,
		select: false, // 默认不返回密码字段
	},
	avatarUrl: {
		type: String,
		trim: true,
	},
	role: {
		type: String,
		enum: ['student', 'teacher', 'admin', 'superAdmin', 'user'],
		default: 'user',
	},
	companyId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Company',
	},
	studentId: {
		type: String,
		sparse: true, // Allows null values but ensures uniqueness when present
		trim: true,
	},
	department: {
		type: String,
		trim: true,
	},
	class: {
		type: String,
		trim: true,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	lastLoginAt: {
		type: Date,
	},
	mustChangePassword: {
		type: Boolean,
		default: false,
	},
	// Stripe subscription fields
	stripeCustomerId: {
		type: String,
		default: null,
	},
	stripeSubscriptionId: {
		type: String,
		default: null,
	},
	subscriptionTier: {
		type: String,
		enum: ['free', 'basic', 'pro'],
		default: 'free',
	},
	subscriptionStatus: {
		type: String,
		enum: [
			null,
			'active',
			'canceled',
			'incomplete',
			'incomplete_expired',
			'past_due',
			'trialing',
			'unpaid',
		],
		default: null,
	},
	subscriptionCurrentPeriodEnd: {
		type: Date,
		default: null,
	},
	subscriptionCancelAtPeriodEnd: {
		type: Boolean,
		default: false,
	},
});

// Virtual to check if user has active subscription
userSchema.virtual('hasActiveSubscription').get(function () {
	return this.subscriptionStatus === 'active' || this.subscriptionStatus === 'trialing';
});

// Virtual to check if user has paid subscription
userSchema.virtual('hasPaidSubscription').get(function () {
	return this.hasActiveSubscription && this.subscriptionTier !== 'free';
});

// Method to check if user can access feature based on subscription
userSchema.methods.canAccessFeature = function (feature) {
	const SUBSCRIPTION_FEATURES = {
		free: {
			maxSurveys: 3,
			maxQuestionsPerSurvey: 10,
			maxInvitees: 10,
			csvImport: false,
			imageQuestions: false,
			advancedAnalytics: false,
			randomQuestions: false,
			fullQuestionBank: false,
			templates: 1,
		},
		basic: {
			maxSurveys: 10,
			maxQuestionsPerSurvey: 20,
			maxInvitees: 30,
			csvImport: false,
			imageQuestions: false,
			advancedAnalytics: false,
			randomQuestions: false,
			fullQuestionBank: false,
			templates: 3,
		},
		pro: {
			maxSurveys: -1, // unlimited
			maxQuestionsPerSurvey: -1, // unlimited
			maxInvitees: -1, // unlimited
			csvImport: true,
			imageQuestions: true,
			advancedAnalytics: true,
			randomQuestions: true,
			fullQuestionBank: true,
			templates: -1, // unlimited
		},
	};

	// Default to free plan if no subscription tier set
	const userTier = this.subscriptionTier || 'free';
	const plan = SUBSCRIPTION_FEATURES[userTier];
	if (!plan) return false;

	return plan[feature] === true || plan[feature] === -1;
};

// Method to check if user has reached limit for a feature
userSchema.methods.hasReachedLimit = function (feature, currentCount) {
	const SUBSCRIPTION_FEATURES = {
		free: {
			maxSurveys: 3,
			maxQuestionsPerSurvey: 10,
			maxInvitees: 10,
			templates: 1,
		},
		basic: {
			maxSurveys: 10,
			maxQuestionsPerSurvey: 20,
			maxInvitees: 30,
			templates: 3,
		},
		pro: {
			maxSurveys: -1, // unlimited
			maxQuestionsPerSurvey: -1, // unlimited
			maxInvitees: -1, // unlimited
			templates: -1, // unlimited
		},
	};

	// Default to free plan if no subscription tier set
	const userTier = this.subscriptionTier || 'free';
	const plan = SUBSCRIPTION_FEATURES[userTier];
	if (!plan) return true;

	const limit = plan[feature];
	if (limit === -1) return false; // unlimited

	return currentCount >= limit;
};

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ stripeCustomerId: 1 });
userSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model('User', userSchema);
