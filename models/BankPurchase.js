const mongoose = require('mongoose');

const bankPurchaseSchema = new mongoose.Schema({
	// Purchase Information
	companyId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Company',
		required: true,
	},
	bankId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'PublicBank',
		required: true,
	},

	// Transaction Details
	type: {
		type: String,
		enum: ['oneTime', 'subscription'],
		default: 'oneTime',
		required: true,
	},
	status: {
		type: String,
		enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
		default: 'pending',
		required: true,
	},

	// Pricing
	amount: {
		type: Number,
		required: true,
		min: 0,
	},
	currency: {
		type: String,
		default: 'USD',
		uppercase: true,
	},
	isResale: {
		type: Boolean,
		default: false,
	},
	originalPrice: {
		type: Number,
		min: 0,
	},
	resalePrice: {
		type: Number,
		min: 0,
	},

	// Payment Information
	paymentMethod: {
		type: String,
		enum: ['stripe', 'paypal', 'manual', 'free'],
		default: 'stripe',
	},
	transactionId: {
		type: String,
		trim: true,
	},
	stripeSessionId: {
		type: String,
		trim: true,
	},
	stripeSubscriptionId: {
		type: String,
		trim: true,
	},

	// Subscription Details (for subscription type)
	subscriptionStatus: {
		type: String,
		enum: ['active', 'cancelled', 'past_due', 'unpaid', 'incomplete'],
	},
	currentPeriodStart: {
		type: Date,
	},
	currentPeriodEnd: {
		type: Date,
	},
	cancelAtPeriodEnd: {
		type: Boolean,
		default: false,
	},

	// Usage Tracking
	usageCount: {
		type: Number,
		default: 0,
	},
	lastUsedAt: {
		type: Date,
	},

	// Access Control
	isActive: {
		type: Boolean,
		default: true,
	},
	expiresAt: {
		type: Date,
	},

	// Metadata
	purchasedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	purchasedAt: {
		type: Date,
		default: Date.now,
	},
	notes: {
		type: String,
		trim: true,
		maxlength: 500,
	},

	// Audit Trail
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Compound indexes for efficient queries
bankPurchaseSchema.index({ companyId: 1, bankId: 1 });
bankPurchaseSchema.index({ companyId: 1, status: 1 });
bankPurchaseSchema.index({ bankId: 1, status: 1 });
bankPurchaseSchema.index({ type: 1, status: 1 });
bankPurchaseSchema.index({ purchasedAt: -1 });
bankPurchaseSchema.index({ stripeSubscriptionId: 1 });

// Pre-save middleware
bankPurchaseSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Virtual for active subscription
bankPurchaseSchema.virtual('isActiveSubscription').get(function () {
	return (
		this.type === 'subscription' &&
		this.subscriptionStatus === 'active' &&
		this.isActive &&
		(!this.expiresAt || this.expiresAt > new Date())
	);
});

// Virtual for access granted
bankPurchaseSchema.virtual('hasAccess').get(function () {
	if (!this.isActive || this.status !== 'completed') {
		return false;
	}

	if (this.expiresAt && this.expiresAt <= new Date()) {
		return false;
	}

	if (this.type === 'subscription') {
		return this.isActiveSubscription;
	}

	return true;
});

// Static method to find active purchases for company
bankPurchaseSchema.statics.findActiveForCompany = function (companyId) {
	return this.find({
		companyId,
		status: 'completed',
		isActive: true,
		$or: [
			{ expiresAt: { $exists: false } },
			{ expiresAt: null },
			{ expiresAt: { $gt: new Date() } },
		],
	}).populate('bankId');
};

// Static method to check if company has access to bank
bankPurchaseSchema.statics.hasAccess = async function (companyId, bankId) {
	const purchase = await this.findOne({
		companyId,
		bankId,
		status: 'completed',
		isActive: true,
		$or: [
			{ expiresAt: { $exists: false } },
			{ expiresAt: null },
			{ expiresAt: { $gt: new Date() } },
		],
	});

	return !!purchase;
};

// Instance method to increment usage
bankPurchaseSchema.methods.incrementUsage = function () {
	this.usageCount += 1;
	this.lastUsedAt = new Date();
	return this.save();
};

// Instance method to cancel subscription
bankPurchaseSchema.methods.cancelSubscription = function () {
	if (this.type === 'subscription') {
		this.cancelAtPeriodEnd = true;
		this.subscriptionStatus = 'cancelled';
		return this.save();
	}
	throw new Error('Not a subscription purchase');
};

// Ensure virtual fields are included in JSON output
bankPurchaseSchema.set('toJSON', {
	virtuals: true,
});

const BankPurchase = mongoose.model('BankPurchase', bankPurchaseSchema);

module.exports = BankPurchase;
