const mongoose = require('mongoose');
const { QUESTION_TYPE } = require('../shared/constants');

const publicBankSchema = new mongoose.Schema({
	// Basic Information
	title: {
		type: String,
		required: true,
		trim: true,
		maxlength: 200,
	},
	description: {
		type: String,
		required: true,
		trim: true,
		maxlength: 1000,
	},
	
	// Type and Pricing
	type: {
		type: String,
		enum: ['free', 'paid'],
		default: 'free',
		required: true,
	},
	priceOneTime: {
		type: Number,
		min: 0,
		default: 0,
	},
	currency: {
		type: String,
		default: 'USD',
		uppercase: true,
	},
	
	// Content
	questions: [
		{
			text: {
				type: String,
				required: true,
			},
			// Description field for markdown context/scenario
			description: {
				type: String,
				default: '',
			},
			type: {
				type: String,
				enum: [
					QUESTION_TYPE.SINGLE_CHOICE,
					QUESTION_TYPE.MULTIPLE_CHOICE,
					QUESTION_TYPE.SHORT_TEXT,
				],
				default: QUESTION_TYPE.SINGLE_CHOICE,
			},
			options: {
				type: [String],
				required: function () {
					return this.type !== QUESTION_TYPE.SHORT_TEXT;
				},
				validate: {
					validator: function (options) {
						// For short_text questions, options are not required
						if (this.type === QUESTION_TYPE.SHORT_TEXT) {
							return true;
						}
						return options && options.length >= 2;
					},
					message: 'At least 2 options are required for choice questions',
				},
			},
			// Correct answer(s) for scoring
			correctAnswer: {
				type: mongoose.Schema.Types.Mixed, // Can be Number, [Number], or String
				required: function () {
					return this.type !== QUESTION_TYPE.SHORT_TEXT;
				},
				validate: {
					validator: function (value) {
						if (this.type === QUESTION_TYPE.SHORT_TEXT) {
							// For short_text questions, correct answer is optional
							// but should be a string if provided
							return (
								value === null || value === undefined || typeof value === 'string'
							);
						}

						if (this.type === QUESTION_TYPE.SINGLE_CHOICE) {
							return (
								typeof value === 'number' &&
								value >= 0 &&
								value < this.options.length
							);
						}

						if (this.type === QUESTION_TYPE.MULTIPLE_CHOICE) {
							return (
								Array.isArray(value) &&
								value.length > 0 &&
								value.every(
									idx =>
										typeof idx === 'number' &&
										idx >= 0 &&
										idx < this.options.length
								)
							);
						}

						return false;
					},
					message: 'Invalid correct answer for question type',
				},
			},
			// Optional: explanation for the correct answer
			explanation: {
				type: String,
				default: null,
			},
			// Optional: description image URL (embedded in question text)
			descriptionImage: {
				type: String,
				default: null,
			},
			// Points for scoring
			points: {
				type: Number,
				default: 1,
			},
			// Optional: tags for filtering
			tags: [
				{
					type: String,
					trim: true,
				},
			],
			// Optional: difficulty level
			difficulty: {
				type: String,
				enum: ['easy', 'medium', 'hard'],
				default: 'medium',
			},
		},
	],
	questionCount: {
		type: Number,
		default: 0,
	},
	
	// Categorization
	tags: [{
		type: String,
		trim: true,
		lowercase: true,
	}],
	category: {
		type: String,
		trim: true,
	},
	difficulty: {
		type: String,
		enum: ['beginner', 'intermediate', 'advanced', 'expert'],
		default: 'intermediate',
	},
	
	// Localization
	locales: [{
		type: String,
		default: ['en'],
	}],
	
	// Status and Visibility
	isActive: {
		type: Boolean,
		default: true,
	},
	isPublished: {
		type: Boolean,
		default: false,
	},
	
	// Usage Statistics
	purchaseCount: {
		type: Number,
		default: 0,
	},
	usageCount: {
		type: Number,
		default: 0,
	},
	
	// Resale Configuration
	allowResale: {
		type: Boolean,
		default: false,
	},
	defaultResalePrice: {
		type: Number,
		min: 0,
		default: null,
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
	
	// SEO and Display
	slug: {
		type: String,
		unique: true,
		sparse: true,
		trim: true,
		lowercase: true,
	},
	thumbnailUrl: {
		type: String,
		trim: true,
	},
	previewQuestions: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Question',
	}],
});

// Indexes for efficient queries
publicBankSchema.index({ type: 1, isActive: 1 });
publicBankSchema.index({ tags: 1 });
publicBankSchema.index({ category: 1 });
publicBankSchema.index({ createdAt: -1 });
publicBankSchema.index({ purchaseCount: -1 });
publicBankSchema.index({ usageCount: -1 });

// Pre-save middleware to update timestamps and generate slug
publicBankSchema.pre('save', function(next) {
	this.updatedAt = new Date();
	
	// Generate slug if not provided
	if (!this.slug && this.title) {
		const baseSlug = this.title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
		
		this.slug = baseSlug;
	}
	
	// Update question count
	if (this.questions) {
		this.questionCount = this.questions.length;
	}
	
	next();
});

// Virtual for display price
publicBankSchema.virtual('displayPrice').get(function() {
	if (this.type === 'free') {
		return 'Free';
	}
	return `${this.currency} ${this.priceOneTime}`;
});

// Static method to find published banks
publicBankSchema.statics.findPublished = function(filters = {}) {
	return this.find({
		...filters,
		isActive: true,
		isPublished: true,
	});
};

// Static method to get usage statistics
publicBankSchema.statics.getUsageStats = function(bankId) {
	return Promise.all([
		// Count companies that purchased this bank
		mongoose.model('BankPurchase').countDocuments({ bankId }),
		// Count surveys using this bank
		mongoose.model('Survey').countDocuments({ 
			'questionBanks.bankId': bankId 
		}),
	]);
};

// Instance method to increment usage
publicBankSchema.methods.incrementUsage = function() {
	this.usageCount += 1;
	return this.save();
};

// Instance method to increment purchase count
publicBankSchema.methods.incrementPurchaseCount = function() {
	this.purchaseCount += 1;
	return this.save();
};

// Ensure virtual fields are included in JSON output
publicBankSchema.set('toJSON', {
	virtuals: true,
});

const PublicBank = mongoose.model('PublicBank', publicBankSchema);

module.exports = PublicBank;