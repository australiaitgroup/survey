const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('./jwtAuth');
const { HTTP_STATUS } = require('../shared/constants');

/**
 * Enhanced JWT authentication middleware that populates user data
 */
const authenticateUser = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(HTTP_STATUS.UNAUTHORIZED).json({
				error: 'No token provided',
				code: 'NO_TOKEN',
			});
		}

		const token = authHeader.split(' ')[1];
		const payload = jwt.verify(token, JWT_SECRET);

		// For legacy admin token (id: 'admin'), create a mock user object
		if (payload.id === 'admin') {
			req.user = {
				id: 'admin',
				email: payload.username,
				role: 'admin',
				name: 'Legacy Admin',
				companyId: null,
			};
			return next();
		}

		// For database users, fetch full user data
		const user = await User.findById(payload.id).populate('companyId');
		if (!user || !user.isActive) {
			return res.status(HTTP_STATUS.UNAUTHORIZED).json({
				error: 'User not found or inactive',
				code: 'USER_NOT_FOUND',
			});
		}

		// Attach user to request
		req.user = {
			id: user._id.toString(),
			email: user.email,
			role: user.role,
			name: user.name,
			companyId: user.companyId?._id?.toString() || null,
			company: user.companyId || null,
		};

		next();
	} catch (error) {
		console.error('Authentication failed:', error.message);
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({
			error: 'Invalid or expired token',
			code: 'INVALID_TOKEN',
		});
	}
};

/**
 * Company scoping middleware - ensures queries are scoped to user's company
 * unless user is superAdmin accessing via /sa/* routes
 */
const enforceCompanyScoping = (req, res, next) => {
	// Skip for superAdmin on /sa/* routes
	if (req.user.role === 'superAdmin' && req.path.startsWith('/sa/')) {
		req.isCrossTenantRequest = true;
		return next();
	}

	// For regular users and admins, enforce company scoping
	if (!req.user.companyId && req.user.role !== 'superAdmin') {
		return res.status(HTTP_STATUS.FORBIDDEN).json({
			error: 'User must be associated with a company',
			code: 'NO_COMPANY_ASSOCIATION',
		});
	}

	// Add company filter to query parameters
	req.companyFilter = { companyId: req.user.companyId };
	req.isCrossTenantRequest = false;

	next();
};

/**
 * Role-based authorization middleware
 */
const requireRole = (...allowedRoles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(HTTP_STATUS.UNAUTHORIZED).json({
				error: 'Authentication required',
				code: 'NOT_AUTHENTICATED',
			});
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(HTTP_STATUS.FORBIDDEN).json({
				error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
				code: 'INSUFFICIENT_ROLE',
			});
		}

		next();
	};
};

/**
 * SuperAdmin-only middleware
 */
const requireSuperAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({
			error: 'Authentication required',
			code: 'NOT_AUTHENTICATED',
		});
	}

	if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
		return res.status(HTTP_STATUS.FORBIDDEN).json({
			error: 'SuperAdmin access required',
			code: 'SUPER_ADMIN_REQUIRED',
		});
	}

	next();
};

/**
 * Admin or SuperAdmin middleware
 */
const requireAdminOrSuperAdmin = requireRole('admin', 'superAdmin');

/**
 * Cross-tenant access guard - only allows superAdmin on /sa/* routes
 */
const allowCrossTenantAccess = (req, res, next) => {
	// Check if this is a cross-tenant request (/sa/* routes)
	if (req.path.startsWith('/sa/')) {
		if (req.user.role !== 'superAdmin') {
			return res.status(HTTP_STATUS.FORBIDDEN).json({
				error: 'SuperAdmin role required for cross-tenant access',
				code: 'CROSS_TENANT_ACCESS_DENIED',
			});
		}
		req.isCrossTenantRequest = true;
	} else {
		req.isCrossTenantRequest = false;
	}

	next();
};

/**
 * Middleware to add company scoping to database queries
 */
const applyScopingToQuery = (queryObject, req) => {
	if (req.isCrossTenantRequest) {
		// SuperAdmin cross-tenant request - no scoping
		return queryObject;
	}

	// Apply company scoping
	if (req.user.companyId) {
		return {
			...queryObject,
			companyId: req.user.companyId,
		};
	}

	return queryObject;
};

/**
 * Middleware to add company scoping to aggregation pipelines
 */
const applyScopingToPipeline = (pipeline, req) => {
	if (req.isCrossTenantRequest) {
		// SuperAdmin cross-tenant request - no scoping
		return pipeline;
	}

	// Apply company scoping by adding $match stage at the beginning
	if (req.user.companyId) {
		return [{ $match: { companyId: req.user.companyId } }, ...pipeline];
	}

	return pipeline;
};

/**
 * Helper function to check if user can access specific resource
 */
const canAccessResource = (req, resourceCompanyId) => {
	// SuperAdmin can access anything on cross-tenant requests
	if (req.user.role === 'superAdmin' && req.isCrossTenantRequest) {
		return true;
	}

	// Regular users can only access resources from their company
	return req.user.companyId === resourceCompanyId?.toString();
};

/**
 * Middleware to validate resource access
 */
const validateResourceAccess = getResourceCompanyId => {
	return async (req, res, next) => {
		try {
			const resourceCompanyId = await getResourceCompanyId(req);

			if (!canAccessResource(req, resourceCompanyId)) {
				return res.status(HTTP_STATUS.FORBIDDEN).json({
					error: 'Access denied to this resource',
					code: 'RESOURCE_ACCESS_DENIED',
				});
			}

			next();
		} catch (error) {
			console.error('Resource access validation failed:', error.message);
			return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
				error: 'Failed to validate resource access',
				code: 'RESOURCE_VALIDATION_ERROR',
			});
		}
	};
};

/**
 * Audit-aware middleware - attaches audit context to request
 */
const attachAuditContext = (req, res, next) => {
	req.auditContext = {
		actor: {
			id: req.user.id,
			email: req.user.email,
			role: req.user.role,
			name: req.user.name,
			companyId: req.user.companyId,
		},
		request: req,
	};

	next();
};

module.exports = {
	authenticateUser,
	enforceCompanyScoping,
	requireRole,
	requireSuperAdmin,
	requireAdminOrSuperAdmin,
	allowCrossTenantAccess,
	applyScopingToQuery,
	applyScopingToPipeline,
	canAccessResource,
	validateResourceAccess,
	attachAuditContext,
};
