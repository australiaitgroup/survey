const express = require('express');
const { 
	authenticateUser, 
	requireSuperAdmin, 
	allowCrossTenantAccess,
	attachAuditContext 
} = require('../middlewares/rbacGuards');
const { audit, auditCompanySuspend, auditImpersonate } = require('../utils/audit');
const { asyncHandler } = require('../middlewares/asyncHandler');
const User = require('../models/User');
const Company = require('../models/Company');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateUser);
router.use(requireSuperAdmin);
router.use(allowCrossTenantAccess);
router.use(attachAuditContext);

/**
 * @route   GET /sa/companies
 * @desc    Get all companies (cross-tenant)
 * @access  SuperAdmin only
 */
router.get('/companies', asyncHandler(async (req, res) => {
	const { page = 1, limit = 50, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
	
	// Build query
	const query = {};
	
	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ slug: { $regex: search, $options: 'i' } },
			{ contactEmail: { $regex: search, $options: 'i' } },
		];
	}
	
	if (status) {
		query.isActive = status === 'active';
	}
	
	// Execute query
	const skip = (page - 1) * limit;
	const companies = await Company.find(query)
		.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
		.limit(parseInt(limit))
		.skip(skip)
		.lean();
	
	const total = await Company.countDocuments(query);
	
	// Get user counts for each company
	const companyIds = companies.map(c => c._id);
	const userCounts = await User.aggregate([
		{ $match: { companyId: { $in: companyIds } } },
		{ $group: { _id: '$companyId', count: { $sum: 1 } } },
	]);
	
	const userCountMap = userCounts.reduce((acc, item) => {
		acc[item._id.toString()] = item.count;
		return acc;
	}, {});
	
	// Enrich companies with user counts
	const enrichedCompanies = companies.map(company => ({
		...company,
		userCount: userCountMap[company._id.toString()] || 0,
	}));
	
	res.json({
		success: true,
		data: enrichedCompanies,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			pages: Math.ceil(total / limit),
		},
	});
}));

/**
 * @route   GET /sa/companies/:id
 * @desc    Get company details (cross-tenant)
 * @access  SuperAdmin only
 */
router.get('/companies/:id', asyncHandler(async (req, res) => {
	const company = await Company.findById(req.params.id).lean();
	
	if (!company) {
		return res.status(404).json({
			success: false,
			error: 'Company not found',
		});
	}
	
	// Get additional stats
	const [userCount, surveyCount, responseCount] = await Promise.all([
		User.countDocuments({ companyId: company._id }),
		Survey.countDocuments({ companyId: company._id }),
		Response.countDocuments({ companyId: company._id }),
	]);
	
	res.json({
		success: true,
		data: {
			...company,
			stats: {
				userCount,
				surveyCount,
				responseCount,
			},
		},
	});
}));

/**
 * @route   PUT /sa/companies/:id/suspend
 * @desc    Suspend a company
 * @access  SuperAdmin only
 */
router.put('/companies/:id/suspend', asyncHandler(async (req, res) => {
	const { reason } = req.body;
	
	if (!reason) {
		return res.status(400).json({
			success: false,
			error: 'Suspension reason is required',
		});
	}
	
	const company = await Company.findById(req.params.id);
	
	if (!company) {
		return res.status(404).json({
			success: false,
			error: 'Company not found',
		});
	}
	
	// Update company status
	company.isActive = false;
	company.suspensionReason = reason;
	company.suspendedAt = new Date();
	company.suspendedBy = req.user.id;
	
	await company.save();
	
	// Audit log
	await auditCompanySuspend(
		req.auditContext.actor,
		company._id.toString(),
		company.name,
		reason,
		req
	);
	
	res.json({
		success: true,
		message: 'Company suspended successfully',
		data: company,
	});
}));

/**
 * @route   PUT /sa/companies/:id/activate
 * @desc    Activate a suspended company
 * @access  SuperAdmin only
 */
router.put('/companies/:id/activate', asyncHandler(async (req, res) => {
	const company = await Company.findById(req.params.id);
	
	if (!company) {
		return res.status(404).json({
			success: false,
			error: 'Company not found',
		});
	}
	
	// Update company status
	company.isActive = true;
	company.suspensionReason = undefined;
	company.suspendedAt = undefined;
	company.suspendedBy = undefined;
	
	await company.save();
	
	// Audit log
	await audit(
		req.auditContext.actor,
		'company_activate',
		'company',
		company._id.toString(),
		{
			targetName: company.name,
			companyId: company._id.toString(),
		},
		req
	);
	
	res.json({
		success: true,
		message: 'Company activated successfully',
		data: company,
	});
}));

/**
 * @route   GET /sa/users
 * @desc    Get all users across all companies
 * @access  SuperAdmin only
 */
router.get('/users', asyncHandler(async (req, res) => {
	const { 
		page = 1, 
		limit = 50, 
		search, 
		role, 
		companyId, 
		isActive,
		sortBy = 'createdAt', 
		sortOrder = 'desc' 
	} = req.query;
	
	// Build query
	const query = {};
	
	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ email: { $regex: search, $options: 'i' } },
		];
	}
	
	if (role) {
		query.role = role;
	}
	
	if (companyId) {
		query.companyId = companyId;
	}
	
	if (isActive !== undefined) {
		query.isActive = isActive === 'true';
	}
	
	// Execute query
	const skip = (page - 1) * limit;
	const users = await User.find(query)
		.populate('companyId', 'name slug')
		.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
		.limit(parseInt(limit))
		.skip(skip)
		.select('-password')
		.lean();
	
	const total = await User.countDocuments(query);
	
	res.json({
		success: true,
		data: users,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			pages: Math.ceil(total / limit),
		},
	});
}));

/**
 * @route   POST /sa/users/:id/impersonate
 * @desc    Generate impersonation token for a user
 * @access  SuperAdmin only
 */
router.post('/users/:id/impersonate', asyncHandler(async (req, res) => {
	const targetUser = await User.findById(req.params.id).populate('companyId');
	
	if (!targetUser) {
		return res.status(404).json({
			success: false,
			error: 'User not found',
		});
	}
	
	// Generate impersonation token (shorter expiry for security)
	const jwt = require('jsonwebtoken');
	const { JWT_SECRET } = require('../middlewares/jwtAuth');
	
	const impersonationToken = jwt.sign(
		{
			id: targetUser._id,
			email: targetUser.email,
			role: targetUser.role,
			impersonatedBy: req.user.id,
			isImpersonation: true,
		},
		JWT_SECRET,
		{ expiresIn: '1h' } // Shorter expiry for impersonation
	);
	
	// Audit log
	await auditImpersonate(
		req.auditContext.actor,
		targetUser._id.toString(),
		targetUser.email,
		targetUser.name,
		req
	);
	
	res.json({
		success: true,
		message: 'Impersonation token generated',
		data: {
			token: impersonationToken,
			user: {
				id: targetUser._id,
				name: targetUser.name,
				email: targetUser.email,
				role: targetUser.role,
				company: targetUser.companyId,
			},
			expiresIn: '1h',
		},
	});
}));

/**
 * @route   GET /sa/audit-logs
 * @desc    Get audit logs across all companies
 * @access  SuperAdmin only
 */
router.get('/audit-logs', asyncHandler(async (req, res) => {
	const { 
		page = 1, 
		limit = 50, 
		action, 
		companyId, 
		userId, 
		startDate, 
		endDate,
		sortBy = 'createdAt',
		sortOrder = 'desc'
	} = req.query;
	
	// Build query
	const query = {};
	
	if (action) {
		query.action = action;
	}
	
	if (companyId) {
		query.companyId = companyId;
	}
	
	if (userId) {
		query['actor.userId'] = userId;
	}
	
	if (startDate || endDate) {
		query.createdAt = {};
		if (startDate) {
			query.createdAt.$gte = new Date(startDate);
		}
		if (endDate) {
			query.createdAt.$lte = new Date(endDate);
		}
	}
	
	// Execute query
	const skip = (page - 1) * limit;
	const logs = await AuditLog.find(query)
		.populate('actor.userId', 'name email role')
		.populate('companyId', 'name slug')
		.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
		.limit(parseInt(limit))
		.skip(skip)
		.lean();
	
	const total = await AuditLog.countDocuments(query);
	
	res.json({
		success: true,
		data: logs,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			pages: Math.ceil(total / limit),
		},
	});
}));

/**
 * @route   GET /sa/stats
 * @desc    Get system-wide statistics
 * @access  SuperAdmin only
 */
router.get('/stats', asyncHandler(async (req, res) => {
	const [
		totalCompanies,
		activeCompanies,
		totalUsers,
		activeUsers,
		totalSurveys,
		totalResponses,
		recentAuditLogs,
	] = await Promise.all([
		Company.countDocuments(),
		Company.countDocuments({ isActive: true }),
		User.countDocuments(),
		User.countDocuments({ isActive: true }),
		Survey.countDocuments(),
		Response.countDocuments(),
		AuditLog.find()
			.sort({ createdAt: -1 })
			.limit(10)
			.populate('actor.userId', 'name email')
			.populate('companyId', 'name')
			.lean(),
	]);
	
	// Get user role distribution
	const roleDistribution = await User.aggregate([
		{ $group: { _id: '$role', count: { $sum: 1 } } },
		{ $sort: { count: -1 } },
	]);
	
	// Get company size distribution
	const companySizeDistribution = await Company.aggregate([
		{ $group: { _id: '$size', count: { $sum: 1 } } },
		{ $sort: { count: -1 } },
	]);
	
	res.json({
		success: true,
		data: {
			overview: {
				totalCompanies,
				activeCompanies,
				suspendedCompanies: totalCompanies - activeCompanies,
				totalUsers,
				activeUsers,
				inactiveUsers: totalUsers - activeUsers,
				totalSurveys,
				totalResponses,
			},
			distributions: {
				userRoles: roleDistribution,
				companySizes: companySizeDistribution,
			},
			recentActivity: recentAuditLogs,
		},
	});
}));

module.exports = router;