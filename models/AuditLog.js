const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
	// Actor information
	actor: {
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		role: {
			type: String,
			required: true,
			enum: ['student', 'teacher', 'admin', 'superAdmin', 'user'],
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
	},

	// Action performed
	action: {
		type: String,
		required: true,
		enum: [
			'pricing_change',
			'bank_deactivate',
			'company_suspend',
			'company_activate',
			'impersonate',
			'user_create',
			'user_delete',
			'user_role_change',
			'subscription_change',
			'data_export',
			'settings_change',
			'public_bank_create',
			'public_bank_update',
			'public_bank_delete',
			'resale_policy_update',
			'pii_view',
			'audit_failure',
		],
		index: true,
	},

	// Target information
	target: {
		type: {
			type: String,
			required: true,
			enum: ['user', 'company', 'subscription', 'pricing', 'bank', 'system'],
		},
		id: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			trim: true,
		},
	},

	// Company context (for tenant scoping)
	companyId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Company',
		index: true,
	},

	// Additional payload/metadata
	payload: {
		type: mongoose.Schema.Types.Mixed,
		default: {},
	},

	// Request metadata
	requestInfo: {
		ip: {
			type: String,
			trim: true,
		},
		userAgent: {
			type: String,
			trim: true,
		},
		method: {
			type: String,
			trim: true,
		},
		url: {
			type: String,
			trim: true,
		},
	},

	// Result of the action
	result: {
		type: String,
		enum: ['success', 'failure', 'partial'],
		default: 'success',
	},

	// Error information (if applicable)
	error: {
		message: {
			type: String,
			trim: true,
		},
		code: {
			type: String,
			trim: true,
		},
	},

	// Timestamps
	createdAt: {
		type: Date,
		default: Date.now,
		index: true,
	},
});

// Compound indexes for efficient queries
auditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'target.type': 1, 'target.id': 1, createdAt: -1 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedDate').get(function () {
	return this.createdAt.toISOString();
});

// Ensure virtual fields are included in JSON output
auditLogSchema.set('toJSON', {
	virtuals: true,
});

// Static method to find logs by company
auditLogSchema.statics.findByCompany = function (companyId, options = {}) {
	const query = this.find({ companyId });
	
	if (options.limit) {
		query.limit(options.limit);
	}
	
	if (options.skip) {
		query.skip(options.skip);
	}
	
	if (options.action) {
		query.where('action', options.action);
	}
	
	if (options.startDate) {
		query.where('createdAt').gte(options.startDate);
	}
	
	if (options.endDate) {
		query.where('createdAt').lte(options.endDate);
	}
	
	return query.sort({ createdAt: -1 }).populate('actor.userId', 'name email role');
};

// Static method to find logs by user
auditLogSchema.statics.findByUser = function (userId, options = {}) {
	const query = this.find({ 'actor.userId': userId });
	
	if (options.limit) {
		query.limit(options.limit);
	}
	
	if (options.skip) {
		query.skip(options.skip);
	}
	
	return query.sort({ createdAt: -1 });
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;