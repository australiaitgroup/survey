const mongoose = require('mongoose');

const resalePolicySchema = new mongoose.Schema({
	// Policy Identification
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
	
	// Resale Configuration
	isEnabled: {
		type: Boolean,
		default: false,
	},
	resalePrice: {
		type: Number,
		required: true,
		min: 0,
	},
	currency: {
		type: String,
		default: 'USD',
		uppercase: true,
	},
	
	// Pricing Strategy
	pricingType: {
		type: String,
		enum: ['fixed', 'percentage', 'markup'],
		default: 'fixed',
	},
	percentageOfOriginal: {
		type: Number,
		min: 0,
		max: 1000, // Allow up to 1000% markup
	},
	markupAmount: {
		type: Number,
		min: 0,
	},
	
	// Restrictions
	minPrice: {
		type: Number,
		min: 0,
	},
	maxPrice: {
		type: Number,
		min: 0,
	},
	
	// Availability
	isActive: {
		type: Boolean,
		default: true,
	},
	startDate: {
		type: Date,
		default: Date.now,
	},
	endDate: {
		type: Date,
	},
	
	// Usage Tracking
	salesCount: {
		type: Number,
		default: 0,
	},
	totalRevenue: {
		type: Number,
		default: 0,
	},
	lastSaleAt: {
		type: Date,
	},
	
	// Metadata
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	updatedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
	
	// Notes and Comments
	notes: {
		type: String,
		trim: true,
		maxlength: 500,
	},
	internalNotes: {
		type: String,
		trim: true,
		maxlength: 1000,
	},
});

// Compound indexes for efficient queries
resalePolicySchema.index({ companyId: 1, bankId: 1 }, { unique: true });
resalePolicySchema.index({ companyId: 1, isEnabled: 1 });
resalePolicySchema.index({ bankId: 1, isEnabled: 1 });
resalePolicySchema.index({ isActive: 1, isEnabled: 1 });

// Pre-save middleware
resalePolicySchema.pre('save', function(next) {
	this.updatedAt = new Date();
	
	// Calculate resale price based on pricing type
	if (this.pricingType === 'percentage' && this.percentageOfOriginal) {
		// Will need to populate original price from PublicBank
		// This calculation should be done in the route handler
	} else if (this.pricingType === 'markup' && this.markupAmount) {
		// Will need to populate original price from PublicBank
		// This calculation should be done in the route handler
	}
	
	// Validate price constraints
	if (this.minPrice && this.resalePrice < this.minPrice) {
		this.resalePrice = this.minPrice;
	}
	
	if (this.maxPrice && this.resalePrice > this.maxPrice) {
		this.resalePrice = this.maxPrice;
	}
	
	next();
});

// Virtual for effective status
resalePolicySchema.virtual('isEffective').get(function() {
	const now = new Date();
	return this.isActive && 
		   this.isEnabled &&
		   this.startDate <= now &&
		   (!this.endDate || this.endDate >= now);
});

// Virtual for pricing display
resalePolicySchema.virtual('displayPrice').get(function() {
	return `${this.currency} ${this.resalePrice}`;
});

// Static method to find effective policies for company
resalePolicySchema.statics.findEffectiveForCompany = function(companyId) {
	const now = new Date();
	return this.find({
		companyId,
		isActive: true,
		isEnabled: true,
		startDate: { $lte: now },
		$or: [
			{ endDate: { $exists: false } },
			{ endDate: null },
			{ endDate: { $gte: now } }
		]
	}).populate('bankId');
};

// Static method to get resale price for company and bank
resalePolicySchema.statics.getResalePrice = async function(companyId, bankId) {
	const policy = await this.findOne({
		companyId,
		bankId,
		isActive: true,
		isEnabled: true,
		startDate: { $lte: new Date() },
		$or: [
			{ endDate: { $exists: false } },
			{ endDate: null },
			{ endDate: { $gte: new Date() } }
		]
	});
	
	return policy ? policy.resalePrice : null;
};

// Instance method to record sale
resalePolicySchema.methods.recordSale = function(amount) {
	this.salesCount += 1;
	this.totalRevenue += amount;
	this.lastSaleAt = new Date();
	return this.save();
};

// Instance method to calculate price from original
resalePolicySchema.methods.calculatePriceFromOriginal = function(originalPrice) {
	switch (this.pricingType) {
		case 'percentage':
			if (this.percentageOfOriginal) {
				return Math.round(originalPrice * (this.percentageOfOriginal / 100) * 100) / 100;
			}
			break;
		case 'markup':
			if (this.markupAmount) {
				return originalPrice + this.markupAmount;
			}
			break;
		case 'fixed':
		default:
			return this.resalePrice;
	}
	return this.resalePrice;
};

// Instance method to update pricing
resalePolicySchema.methods.updatePricing = function(originalPrice) {
	const calculatedPrice = this.calculatePriceFromOriginal(originalPrice);
	
	// Apply constraints
	if (this.minPrice && calculatedPrice < this.minPrice) {
		this.resalePrice = this.minPrice;
	} else if (this.maxPrice && calculatedPrice > this.maxPrice) {
		this.resalePrice = this.maxPrice;
	} else {
		this.resalePrice = calculatedPrice;
	}
	
	return this;
};

// Ensure virtual fields are included in JSON output
resalePolicySchema.set('toJSON', {
	virtuals: true,
});

const ResalePolicy = mongoose.model('ResalePolicy', resalePolicySchema);

module.exports = ResalePolicy;