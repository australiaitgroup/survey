const AuditLog = require('../models/AuditLog');

/**
 * Audit helper function to log high-risk actions
 * @param {Object} actor - The user performing the action
 * @param {string} action - The action being performed
 * @param {string} targetType - Type of target (user, company, subscription, etc.)
 * @param {string} targetId - ID of the target
 * @param {Object} payload - Additional data/context
 * @param {Object} req - Express request object (optional, for context)
 * @returns {Promise<Object>} The created audit log entry
 */
async function audit(actor, action, targetType, targetId, payload = {}, req = null) {
	try {
		// Validate required parameters
		if (!actor || !actor.id) {
			throw new Error('Actor information is required for audit logging');
		}

		if (!action) {
			throw new Error('Action is required for audit logging');
		}

		if (!targetType || !targetId) {
			throw new Error('Target type and ID are required for audit logging');
		}

		// Extract request information if available
		let requestInfo = {};
		if (req) {
			requestInfo = {
				ip: req.ip || req.connection?.remoteAddress || 'unknown',
				userAgent: req.get('User-Agent') || 'unknown',
				method: req.method || 'unknown',
				url: req.originalUrl || req.url || 'unknown',
			};
		}

		// Create audit log entry
		const auditEntry = {
			actor: {
				userId: actor.id,
				email: actor.email || 'unknown',
				role: actor.role || 'user',
				name: actor.name || 'Unknown User',
			},
			action,
			target: {
				type: targetType,
				id: targetId,
				name: payload.targetName || null,
			},
			companyId: actor.companyId || payload.companyId || null,
			payload: {
				...payload,
				// Remove targetName from payload since it's in target.name
				targetName: undefined,
			},
			requestInfo,
			result: payload.result || 'success',
		};

		// Add error information if present
		if (payload.error) {
			auditEntry.error = {
				message: payload.error.message || payload.error,
				code: payload.error.code || null,
			};
			auditEntry.result = 'failure';
		}

		// Save to database
		const auditLog = new AuditLog(auditEntry);
		await auditLog.save();

		console.log(`[AUDIT] ${action} by ${actor.email} on ${targetType}:${targetId}`, {
			companyId: auditEntry.companyId,
			result: auditEntry.result,
		});

		return auditLog;
	} catch (error) {
		console.error('[AUDIT ERROR] Failed to create audit log:', error.message);
		console.error('Audit parameters:', {
			actor: actor ? { id: actor.id, email: actor.email, role: actor.role } : 'missing',
			action,
			targetType,
			targetId,
			hasPayload: !!payload,
		});

		// Don't throw error to prevent disrupting the main operation
		// But we should still log the failure
		try {
			// Try to create a minimal audit log about the audit failure
			const errorAuditEntry = new AuditLog({
				actor: {
					userId: actor?.id || 'system',
					email: actor?.email || 'system',
					role: actor?.role || 'system',
					name: actor?.name || 'System',
				},
				action: 'audit_failure',
				target: {
					type: 'system',
					id: 'audit_system',
				},
				payload: {
					originalAction: action,
					originalTargetType: targetType,
					originalTargetId: targetId,
					errorMessage: error.message,
				},
				result: 'failure',
				error: {
					message: error.message,
					code: 'AUDIT_LOG_CREATION_FAILED',
				},
			});

			await errorAuditEntry.save();
		} catch (secondaryError) {
			console.error('[AUDIT ERROR] Failed to log audit failure:', secondaryError.message);
		}

		return null;
	}
}

/**
 * Convenience function for logging pricing changes
 */
async function auditPricingChange(actor, targetId, oldPrice, newPrice, req = null) {
	return audit(
		actor,
		'pricing_change',
		'pricing',
		targetId,
		{
			oldPrice,
			newPrice,
			change: newPrice - oldPrice,
		},
		req
	);
}

/**
 * Convenience function for logging bank deactivation
 */
async function auditBankDeactivate(actor, bankId, bankName, reason, req = null) {
	return audit(
		actor,
		'bank_deactivate',
		'bank',
		bankId,
		{
			targetName: bankName,
			reason,
		},
		req
	);
}

/**
 * Convenience function for logging company suspension
 */
async function auditCompanySuspend(actor, companyId, companyName, reason, req = null) {
	return audit(
		actor,
		'company_suspend',
		'company',
		companyId,
		{
			targetName: companyName,
			reason,
			companyId, // Include in payload for cross-reference
		},
		req
	);
}

/**
 * Convenience function for logging user impersonation
 */
async function auditImpersonate(actor, targetUserId, targetUserEmail, targetUserName, req = null) {
	return audit(
		actor,
		'impersonate',
		'user',
		targetUserId,
		{
			targetName: targetUserName,
			targetEmail: targetUserEmail,
		},
		req
	);
}

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Object>} Paginated audit logs
 */
async function getAuditLogs(filters = {}, options = {}) {
	try {
		const query = AuditLog.find(filters);

		// Apply options
		if (options.limit) {
			query.limit(parseInt(options.limit));
		}

		if (options.skip) {
			query.skip(parseInt(options.skip));
		}

		if (options.sort) {
			query.sort(options.sort);
		} else {
			query.sort({ createdAt: -1 }); // Default: newest first
		}

		// Populate actor information
		query.populate('actor.userId', 'name email role');

		const logs = await query.exec();
		const total = await AuditLog.countDocuments(filters);

		return {
			logs,
			total,
			page: Math.floor((options.skip || 0) / (options.limit || 50)) + 1,
			limit: options.limit || 50,
			totalPages: Math.ceil(total / (options.limit || 50)),
		};
	} catch (error) {
		console.error('[AUDIT] Failed to retrieve audit logs:', error.message);
		throw error;
	}
}

module.exports = {
	audit,
	auditPricingChange,
	auditBankDeactivate,
	auditCompanySuspend,
	auditImpersonate,
	getAuditLogs,
};
