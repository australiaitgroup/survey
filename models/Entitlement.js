const mongoose = require('mongoose');

const entitlementSchema = new mongoose.Schema({
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
	accessType: {
		type: String,
		enum: ['free', 'purchased', 'subscription'],
		required: true,
	},
	status: {
		type: String,
		enum: ['active', 'expired', 'cancelled'],
		default: 'active',
	},
	// Payment information (for paid access)
	stripePaymentIntentId: {
		type: String,
		sparse: true,
	},
	stripeSubscriptionId: {
		type: String,
		sparse: true,
	},
	purchasePrice: {
		type: Number,
		min: 0,
	},
	currency: {
		type: String,
		default: 'USD',
	},
	// Dates
	grantedAt: {
		type: Date,
		default: Date.now,
	},
	expiresAt: {
		type: Date,
		default: null, // null means no expiration
	},
	// Metadata
	grantedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	metadata: {
		type: mongoose.Schema.Types.Mixed,
		default: {},
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Compound index for unique entitlement per company per bank
entitlementSchema.index({ companyId: 1, bankId: 1 }, { unique: true });
entitlementSchema.index({ status: 1, expiresAt: 1 });
entitlementSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });
entitlementSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });

// Pre-save middleware
entitlementSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Static method to check if company has access to a bank
entitlementSchema.statics.hasAccess = async function (companyId, bankId) {
	const entitlement = await this.findOne({
		companyId,
		bankId,
		status: 'active',
		$or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
	});

	return !!entitlement;
};

// Static method to grant free access
entitlementSchema.statics.grantFreeAccess = async function (companyId, bankId, userId) {
	// Use findOneAndUpdate with upsert for idempotency
	return await this.findOneAndUpdate(
		{ companyId, bankId },
		{
			$set: {
				accessType: 'free',
				status: 'active',
				grantedAt: new Date(),
				grantedBy: userId,
				updatedAt: new Date(),
			},
			$setOnInsert: {
				createdAt: new Date(),
			},
		},
		{
			upsert: true,
			new: true,
			runValidators: true,
		}
	);
};

// Instance method to check if entitlement is valid
entitlementSchema.methods.isValid = function () {
	if (this.status !== 'active') {
		return false;
	}

	if (this.expiresAt && this.expiresAt < new Date()) {
		return false;
	}

	return true;
};

const Entitlement = mongoose.model('Entitlement', entitlementSchema);

module.exports = Entitlement;
