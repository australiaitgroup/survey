const express = require('express');
const mongoose = require('mongoose');
const {
	authenticateUser,
	requireSuperAdmin,
	allowCrossTenantAccess,
	attachAuditContext
} = require('../middlewares/rbacGuards');
const { audit, auditCompanySuspend, auditImpersonate } = require('../utils/audit');
const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');
const Company = require('../models/Company');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const AuditLog = require('../models/AuditLog');
const PublicBank = require('../models/PublicBank');
const QuestionBank = require('../models/QuestionBank');
const BankPurchase = require('../models/BankPurchase');
const ResalePolicy = require('../models/ResalePolicy');

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

	// Get additional stats using company users -> surveys -> responses linkage
	// 1) Users in the company
	const companyUsers = await User.find({ companyId: company._id }).select('_id').lean();
	const userIdStrings = companyUsers.map(u => u._id.toString());
	const userCount = companyUsers.length;

	// 2) Surveys created by company users (Survey.createdBy stores user id as string)
	const surveysByCompanyUsers = await Survey.find({ createdBy: { $in: userIdStrings } }).select('_id').lean();
	const surveyIds = surveysByCompanyUsers.map(s => s._id);
	const surveyCount = surveysByCompanyUsers.length;

	// 3) Responses submitted to those surveys
	const responseCount = await Response.countDocuments({ surveyId: { $in: surveyIds } });

	// 4) Question banks created by company users
	const questionBankCount = await QuestionBank.countDocuments({ createdBy: { $in: userIdStrings } });

	// 5) Purchased public banks (distinct bank count) for the company
	const activePurchaseMatch = {
		companyId: company._id,
		status: 'completed',
		isActive: true,
		$or: [
			{ expiresAt: { $exists: false } },
			{ expiresAt: null },
			{ expiresAt: { $gt: new Date() } },
		],
	};
	const purchasedBankIds = await BankPurchase.distinct('bankId', activePurchaseMatch);
	const purchasedBanks = purchasedBankIds.length;

	res.json({
		success: true,
		data: {
			...company,
			stats: {
				userCount,
				surveyCount,
				responseCount,
				questionBankCount,
			},
			purchasedBanks,
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

/**
 * @route   GET /sa/public-banks
 * @desc    Get all public banks
 * @access  SuperAdmin only
 */
router.get('/public-banks', asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 50,
		search,
		type,
		isActive,
		sortBy = 'createdAt',
		sortOrder = 'desc'
	} = req.query;

	// Build query
	const query = {};

	if (search) {
		query.$or = [
			{ title: { $regex: search, $options: 'i' } },
			{ description: { $regex: search, $options: 'i' } },
			{ tags: { $in: [new RegExp(search, 'i')] } },
		];
	}

	if (type) {
		query.type = type;
	}

	if (isActive !== undefined) {
		query.isActive = isActive === 'true';
	}

	// Execute query
	const skip = (page - 1) * limit;
	const banks = await PublicBank.find(query)
		.populate('createdBy', 'name email')
		.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
		.limit(parseInt(limit))
		.skip(skip)
		.lean();

	const total = await PublicBank.countDocuments(query);

	// Get usage counts for each bank
	const bankIds = banks.map(b => b._id);
	const usageCounts = await BankPurchase.aggregate([
		{ $match: { bankId: { $in: bankIds }, status: 'completed' } },
		{ $group: { _id: '$bankId', count: { $sum: 1 } } },
	]);

	const usageCountMap = usageCounts.reduce((acc, item) => {
		acc[item._id.toString()] = item.count;
		return acc;
	}, {});

	// Enrich banks with usage counts
	const enrichedBanks = banks.map(bank => ({
		...bank,
		usageCount: usageCountMap[bank._id.toString()] || 0,
	}));

	res.json({
		success: true,
		data: enrichedBanks,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			pages: Math.ceil(total / limit),
		},
	});
}));

/**
 * @route   POST /sa/public-banks
 * @desc    Create a new public bank
 * @access  SuperAdmin only
 */
router.post('/public-banks', asyncHandler(async (req, res) => {
	const {
		title,
		description,
		type,
		priceOneTime,
		tags,
		locales,
		isActive = true,
	} = req.body;

	// Validation
	if (!title || !description) {
		return res.status(400).json({
			success: false,
			error: 'Title and description are required',
		});
	}

	// Create bank
	const bank = new PublicBank({
		title,
		description,
		type: type || 'free',
		priceOneTime: type === 'paid' ? priceOneTime || 0 : 0,
		tags: tags || [],
		locales: locales || ['en'],
		isActive,
		createdBy: req.user.id,
	});

	await bank.save();

	// Audit log
	await audit(
		req.auditContext.actor,
		'public_bank_create',
		'bank',
		bank._id.toString(),
		{
			targetName: bank.title,
			type: bank.type,
			price: bank.priceOneTime,
		},
		req
	);

	res.status(201).json({
		success: true,
		message: 'Public bank created successfully',
		data: bank,
	});
}));

/**
 * @route   PUT /sa/public-banks/:id
 * @desc    Update a public bank
 * @access  SuperAdmin only
 */
router.put('/public-banks/:id', asyncHandler(async (req, res) => {
	const {
		title,
		description,
		type,
		priceOneTime,
		tags,
		locales,
		isActive,
	} = req.body;

	const bank = await PublicBank.findById(req.params.id);

	if (!bank) {
		return res.status(404).json({
			success: false,
			error: 'Public bank not found',
		});
	}

	// Store old values for audit
	const oldValues = {
		title: bank.title,
		type: bank.type,
		priceOneTime: bank.priceOneTime,
		isActive: bank.isActive,
	};

	// Update fields
	if (title) bank.title = title;
	if (description) bank.description = description;
	if (type) bank.type = type;
	if (priceOneTime !== undefined) bank.priceOneTime = priceOneTime;
	if (tags) bank.tags = tags;
	if (locales) bank.locales = locales;
	if (isActive !== undefined) bank.isActive = isActive;
	bank.updatedBy = req.user.id;

	await bank.save();

	// Audit log
	await audit(
		req.auditContext.actor,
		'public_bank_update',
		'bank',
		bank._id.toString(),
		{
			targetName: bank.title,
			oldValues,
			newValues: {
				title: bank.title,
				type: bank.type,
				priceOneTime: bank.priceOneTime,
				isActive: bank.isActive,
			},
		},
		req
	);

	res.json({
		success: true,
		message: 'Public bank updated successfully',
		data: bank,
	});
}));

/**
 * @route   GET /sa/public-banks/:id/usage
 * @desc    Get usage statistics for a public bank
 * @access  SuperAdmin only
 */
router.get('/public-banks/:id/usage', asyncHandler(async (req, res) => {
	const bankId = req.params.id;

	const [
		companiesCount,
		linkedSurveysCount,
		purchases,
		totalRevenue,
	] = await Promise.all([
		BankPurchase.distinct('companyId', { bankId, status: 'completed' }),
		Survey.countDocuments({ 'questionBanks.bankId': bankId }),
		BankPurchase.find({ bankId })
			.populate('companyId', 'name slug')
			.populate('purchasedBy', 'name email')
			.sort({ purchasedAt: -1 })
			.limit(50)
			.lean(),
		BankPurchase.aggregate([
			{ $match: { bankId: mongoose.Types.ObjectId(bankId), status: 'completed' } },
			{ $group: { _id: null, total: { $sum: '$amount' } } },
		]),
	]);

	res.json({
		success: true,
		data: {
			companiesCount: companiesCount.length,
			linkedSurveysCount,
			totalRevenue: totalRevenue[0]?.total || 0,
			recentPurchases: purchases,
		},
	});
}));

/**
 * @route   GET /sa/purchases
 * @desc    Get all purchases and subscriptions
 * @access  SuperAdmin only
 */
router.get('/purchases', asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 50,
		companyId,
		bankId,
		type,
		status,
		startDate,
		endDate,
		sortBy = 'purchasedAt',
		sortOrder = 'desc'
	} = req.query;

	// Build query
	const query = {};

	if (companyId) {
		query.companyId = companyId;
	}

	if (bankId) {
		query.bankId = bankId;
	}

	if (type) {
		query.type = type;
	}

	if (status) {
		query.status = status;
	}

	if (startDate || endDate) {
		query.purchasedAt = {};
		if (startDate) {
			query.purchasedAt.$gte = new Date(startDate);
		}
		if (endDate) {
			query.purchasedAt.$lte = new Date(endDate);
		}
	}

	// Execute query
	const skip = (page - 1) * limit;
	const purchases = await BankPurchase.find(query)
		.populate('companyId', 'name slug')
		.populate('bankId', 'title type')
		.populate('purchasedBy', 'name email')
		.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
		.limit(parseInt(limit))
		.skip(skip)
		.lean();

	const total = await BankPurchase.countDocuments(query);

	res.json({
		success: true,
		data: purchases,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			pages: Math.ceil(total / limit),
		},
	});
}));

/**
 * @route   GET /sa/purchases/export
 * @desc    Export purchases as CSV
 * @access  SuperAdmin only
 */
router.get('/purchases/export', asyncHandler(async (req, res) => {
	const {
		companyId,
		bankId,
		type,
		status,
		startDate,
		endDate,
	} = req.query;

	// Build query (same as above)
	const query = {};
	if (companyId) query.companyId = companyId;
	if (bankId) query.bankId = bankId;
	if (type) query.type = type;
	if (status) query.status = status;
	if (startDate || endDate) {
		query.purchasedAt = {};
		if (startDate) query.purchasedAt.$gte = new Date(startDate);
		if (endDate) query.purchasedAt.$lte = new Date(endDate);
	}

	const purchases = await BankPurchase.find(query)
		.populate('companyId', 'name slug')
		.populate('bankId', 'title type')
		.populate('purchasedBy', 'name email')
		.sort({ purchasedAt: -1 })
		.lean();

	// Generate CSV
	const csvHeaders = [
		'Purchase ID',
		'Company',
		'Bank Title',
		'Type',
		'Status',
		'Amount',
		'Currency',
		'Purchased By',
		'Purchase Date',
		'Transaction ID',
	];

	const csvRows = purchases.map(purchase => [
		purchase._id,
		purchase.companyId?.name || 'N/A',
		purchase.bankId?.title || 'N/A',
		purchase.type,
		purchase.status,
		purchase.amount,
		purchase.currency,
		purchase.purchasedBy?.email || 'N/A',
		purchase.purchasedAt.toISOString(),
		purchase.transactionId || 'N/A',
	]);

	const csvContent = [csvHeaders, ...csvRows]
		.map(row => row.map(field => `"${field}"`).join(','))
		.join('\n');

	// Audit log
	await audit(
		req.auditContext.actor,
		'data_export',
		'system',
		'purchases',
		{
			recordCount: purchases.length,
			filters: query,
		},
		req
	);

	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', 'attachment; filename="purchases-export.csv"');
	res.send(csvContent);
}));

/**
 * @route   GET /sa/resale-policies
 * @desc    Get resale policies
 * @access  SuperAdmin only
 */
router.get('/resale-policies', asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 50,
		companyId,
		bankId,
		isEnabled,
		sortBy = 'createdAt',
		sortOrder = 'desc'
	} = req.query;

	// Build query
	const query = {};

	if (companyId) {
		query.companyId = companyId;
	}

	if (bankId) {
		query.bankId = bankId;
	}

	if (isEnabled !== undefined) {
		query.isEnabled = isEnabled === 'true';
	}

	// Execute query
	const skip = (page - 1) * limit;
	const policies = await ResalePolicy.find(query)
		.populate('companyId', 'name slug')
		.populate('bankId', 'title type priceOneTime')
		.populate('createdBy', 'name email')
		.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
		.limit(parseInt(limit))
		.skip(skip)
		.lean();

	const total = await ResalePolicy.countDocuments(query);

	res.json({
		success: true,
		data: policies,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			pages: Math.ceil(total / limit),
		},
	});
}));

/**
 * @route   PATCH /sa/resale-policies/:id
 * @desc    Update resale policy
 * @access  SuperAdmin only
 */
router.patch('/resale-policies/:id', asyncHandler(async (req, res) => {
	const { isEnabled, resalePrice } = req.body;

	const policy = await ResalePolicy.findById(req.params.id)
		.populate('companyId', 'name')
		.populate('bankId', 'title');

	if (!policy) {
		return res.status(404).json({
			success: false,
			error: 'Resale policy not found',
		});
	}

	// Store old values for audit
	const oldValues = {
		isEnabled: policy.isEnabled,
		resalePrice: policy.resalePrice,
	};

	// Update fields
	if (isEnabled !== undefined) policy.isEnabled = isEnabled;
	if (resalePrice !== undefined) policy.resalePrice = resalePrice;
	policy.updatedBy = req.user.id;

	await policy.save();

	// Audit log
	await audit(
		req.auditContext.actor,
		'resale_policy_update',
		'policy',
		policy._id.toString(),
		{
			targetName: `${policy.companyId?.name} - ${policy.bankId?.title}`,
			oldValues,
			newValues: {
				isEnabled: policy.isEnabled,
				resalePrice: policy.resalePrice,
			},
		},
		req
	);

	res.json({
		success: true,
		message: 'Resale policy updated successfully',
		data: policy,
	});
}));

// ===========================================
// PUBLIC BANK QUESTION MANAGEMENT ROUTES
// ===========================================

/**
 * @route   GET /sa/public-banks/:id/questions
 * @desc    Get questions for a public bank
 * @access  SuperAdmin only
 */
router.get('/public-banks/:id/questions', asyncHandler(async (req, res) => {
	const { page = 1, limit = 50, search, difficulty, tags, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
	const bankId = req.params.id;

	const bank = await PublicBank.findById(bankId).lean();
	if (!bank) {
		return res.status(404).json({
			success: false,
			error: 'Public bank not found',
		});
	}

	let questions = bank.questions || [];

	// Apply filters
	if (search) {
		const searchRegex = new RegExp(search, 'i');
		questions = questions.filter(q =>
			searchRegex.test(q.text) ||
			searchRegex.test(q.description) ||
			(q.tags && q.tags.some(tag => searchRegex.test(tag)))
		);
	}

	if (difficulty) {
		questions = questions.filter(q => q.difficulty === difficulty);
	}

	if (tags) {
		const tagArray = tags.split(',').map(t => t.trim());
		questions = questions.filter(q =>
			q.tags && q.tags.some(tag => tagArray.includes(tag))
		);
	}

	// Sort questions
	questions.sort((a, b) => {
		let aVal, bVal;
		switch (sortBy) {
			case 'text':
				aVal = a.text;
				bVal = b.text;
				break;
			case 'difficulty':
				aVal = a.difficulty;
				bVal = b.difficulty;
				break;
			case 'points':
				aVal = a.points || 1;
				bVal = b.points || 1;
				break;
			default:
				aVal = a._id;
				bVal = b._id;
		}

		if (sortOrder === 'desc') {
			return bVal > aVal ? 1 : -1;
		}
		return aVal > bVal ? 1 : -1;
	});

	// Apply pagination
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + parseInt(limit);
	const paginatedQuestions = questions.slice(startIndex, endIndex);

	res.json({
		success: true,
		data: paginatedQuestions,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total: questions.length,
			pages: Math.ceil(questions.length / limit),
		},
	});
}));

/**
 * @route   POST /sa/public-banks/:id/questions
 * @desc    Add a new question to a public bank
 * @access  SuperAdmin only
 */
router.post('/public-banks/:id/questions', asyncHandler(async (req, res) => {
	const bankId = req.params.id;
	const {
		text,
		description,
		type,
		options,
		correctAnswer,
		explanation,
		descriptionImage,
		points,
		tags,
		difficulty
	} = req.body;

	// Validate required fields
	if (!text || !type) {
		return res.status(400).json({
			success: false,
			error: 'Question text and type are required',
		});
	}

	const bank = await PublicBank.findById(bankId);
	if (!bank) {
		return res.status(404).json({
			success: false,
			error: 'Public bank not found',
		});
	}

	// Create new question
	const newQuestion = {
		text,
		description: description || '',
		type,
		options: options || [],
		correctAnswer,
		explanation: explanation || null,
		descriptionImage: descriptionImage || null,
		points: points || 1,
		tags: tags || [],
		difficulty: difficulty || 'medium',
	};

	// Add to bank
	bank.questions.push(newQuestion);
	await bank.save();

	// Audit log
	await audit(
		'public_bank_question_add',
		'PublicBank',
		bank._id.toString(),
		{
			targetName: `${bank.title} - Question: ${text.substring(0, 50)}...`,
			newValues: newQuestion,
		},
		req
	);

	res.status(201).json({
		success: true,
		message: 'Question added successfully',
		data: {
			bank,
			question: bank.questions[bank.questions.length - 1],
		},
	});
}));

/**
 * @route   PUT /sa/public-banks/:id/questions/:questionIndex
 * @desc    Update a question in a public bank
 * @access  SuperAdmin only
 */
router.put('/public-banks/:id/questions/:questionIndex', asyncHandler(async (req, res) => {
	const bankId = req.params.id;
	const questionIndex = parseInt(req.params.questionIndex);
	const {
		text,
		description,
		type,
		options,
		correctAnswer,
		explanation,
		descriptionImage,
		points,
		tags,
		difficulty
	} = req.body;

	const bank = await PublicBank.findById(bankId);
	if (!bank) {
		return res.status(404).json({
			success: false,
			error: 'Public bank not found',
		});
	}

	if (questionIndex < 0 || questionIndex >= bank.questions.length) {
		return res.status(404).json({
			success: false,
			error: 'Question not found',
		});
	}

	const oldQuestion = { ...bank.questions[questionIndex].toObject() };

	// Update question
	const updatedQuestion = {
		text: text || bank.questions[questionIndex].text,
		description: description !== undefined ? description : bank.questions[questionIndex].description,
		type: type || bank.questions[questionIndex].type,
		options: options !== undefined ? options : bank.questions[questionIndex].options,
		correctAnswer: correctAnswer !== undefined ? correctAnswer : bank.questions[questionIndex].correctAnswer,
		explanation: explanation !== undefined ? explanation : bank.questions[questionIndex].explanation,
		descriptionImage: descriptionImage !== undefined ? descriptionImage : bank.questions[questionIndex].descriptionImage,
		points: points !== undefined ? points : bank.questions[questionIndex].points,
		tags: tags !== undefined ? tags : bank.questions[questionIndex].tags,
		difficulty: difficulty || bank.questions[questionIndex].difficulty,
	};

	bank.questions[questionIndex] = updatedQuestion;
	await bank.save();

	// Audit log
	await audit(
		'public_bank_question_update',
		'PublicBank',
		bank._id.toString(),
		{
			targetName: `${bank.title} - Question: ${text?.substring(0, 50) || oldQuestion.text.substring(0, 50)}...`,
			oldValues: oldQuestion,
			newValues: updatedQuestion,
		},
		req
	);

	res.json({
		success: true,
		message: 'Question updated successfully',
		data: {
			bank,
			question: bank.questions[questionIndex],
		},
	});
}));

/**
 * @route   DELETE /sa/public-banks/:id/questions/:questionIndex
 * @desc    Delete a question from a public bank
 * @access  SuperAdmin only
 */
router.delete('/public-banks/:id/questions/:questionIndex', asyncHandler(async (req, res) => {
	const bankId = req.params.id;
	const questionIndex = parseInt(req.params.questionIndex);

	const bank = await PublicBank.findById(bankId);
	if (!bank) {
		return res.status(404).json({
			success: false,
			error: 'Public bank not found',
		});
	}

	if (questionIndex < 0 || questionIndex >= bank.questions.length) {
		return res.status(404).json({
			success: false,
			error: 'Question not found',
		});
	}

	const deletedQuestion = bank.questions[questionIndex];

	// Remove question
	bank.questions.splice(questionIndex, 1);
	await bank.save();

	// Audit log
	await audit(
		'public_bank_question_delete',
		'PublicBank',
		bank._id.toString(),
		{
			targetName: `${bank.title} - Question: ${deletedQuestion.text.substring(0, 50)}...`,
			oldValues: deletedQuestion.toObject(),
		},
		req
	);

	res.json({
		success: true,
		message: 'Question deleted successfully',
		data: { bank },
	});
}));

/**
 * @route   POST /sa/public-banks/:id/questions/:questionIndex/duplicate
 * @desc    Duplicate a question in a public bank
 * @access  SuperAdmin only
 */
router.post('/public-banks/:id/questions/:questionIndex/duplicate', asyncHandler(async (req, res) => {
	const bankId = req.params.id;
	const questionIndex = parseInt(req.params.questionIndex);

	const bank = await PublicBank.findById(bankId);
	if (!bank) {
		return res.status(404).json({
			success: false,
			error: 'Public bank not found',
		});
	}

	if (questionIndex < 0 || questionIndex >= bank.questions.length) {
		return res.status(404).json({
			success: false,
			error: 'Question not found',
		});
	}

	const originalQuestion = bank.questions[questionIndex];
	const duplicatedQuestion = {
		...originalQuestion.toObject(),
		text: `${originalQuestion.text} (Copy)`,
	};

	// Remove _id to create new question
	delete duplicatedQuestion._id;

	// Add to bank
	bank.questions.push(duplicatedQuestion);
	await bank.save();

	// Audit log
	await audit(
		'public_bank_question_duplicate',
		'PublicBank',
		bank._id.toString(),
		{
			targetName: `${bank.title} - Question: ${originalQuestion.text.substring(0, 50)}...`,
			newValues: duplicatedQuestion,
		},
		req
	);

	res.status(201).json({
		success: true,
		message: 'Question duplicated successfully',
		data: {
			bank,
			question: bank.questions[bank.questions.length - 1],
		},
	});
}));

/**
 * @route   POST /sa/public-banks/:id/import-csv
 * @desc    Import questions from CSV file
 * @access  SuperAdmin only
 */
router.post('/public-banks/:id/import-csv', asyncHandler(async (req, res) => {
	const multer = require('multer');
	const csv = require('csv-parser');
	const fs = require('fs');
	const path = require('path');

	// Set up multer for file upload
	const upload = multer({ dest: 'uploads/' });

	upload.single('csvFile')(req, res, async (err) => {
		if (err) {
			return res.status(400).json({
				success: false,
				error: 'File upload failed',
			});
		}

		const bankId = req.params.id;
		const bank = await PublicBank.findById(bankId);

		if (!bank) {
			return res.status(404).json({
				success: false,
				error: 'Public bank not found',
			});
		}

		if (!req.file) {
			return res.status(400).json({
				success: false,
				error: 'No CSV file provided',
			});
		}

		const results = [];
		const errors = [];
		const warnings = [];
		let imported = 0;

		try {
			await new Promise((resolve, reject) => {
				fs.createReadStream(req.file.path)
					.pipe(csv())
					.on('data', (data) => {
						results.push(data);
					})
					.on('end', resolve)
					.on('error', reject);
			});

			// Process each row
			for (const [index, row] of results.entries()) {
				try {
					const lineNum = index + 2; // +2 because CSV is 1-indexed and has header

					// Validate required fields
					if (!row.question || !row.question.trim()) {
						errors.push(`Line ${lineNum}: Question text is required`);
						continue;
					}

					// Parse question type
					const type = row.type?.toLowerCase() || 'single_choice';
					if (!['single_choice', 'multiple_choice', 'short_text'].includes(type)) {
						errors.push(`Line ${lineNum}: Invalid question type "${row.type}"`);
						continue;
					}

					// Parse options
					let options = [];
					if (type !== 'short_text') {
						const optionsStr = row.options || '';
						if (optionsStr.trim()) {
							// Handle quoted comma-separated values
							if (optionsStr.startsWith('"') && optionsStr.endsWith('"')) {
								options = optionsStr.slice(1, -1).split('","').map(opt => opt.trim());
							} else {
								options = optionsStr.split(',').map(opt => opt.trim());
							}
						}

						if (options.length < 2) {
							errors.push(`Line ${lineNum}: At least 2 options required for choice questions`);
							continue;
						}
					}

					// Parse correct answer
					let correctAnswer = null;
					if (row.correct_answer && row.correct_answer.trim()) {
						if (type === 'short_text') {
							correctAnswer = row.correct_answer.trim();
						} else if (type === 'single_choice') {
							const answerIndex = parseInt(row.correct_answer) - 1;
							if (answerIndex >= 0 && answerIndex < options.length) {
								correctAnswer = answerIndex;
							} else {
								warnings.push(`Line ${lineNum}: Invalid correct answer index for single choice`);
							}
						} else if (type === 'multiple_choice') {
							const answerIndices = row.correct_answer.split(',').map(a => parseInt(a.trim()) - 1);
							if (answerIndices.every(idx => idx >= 0 && idx < options.length)) {
								correctAnswer = answerIndices;
							} else {
								warnings.push(`Line ${lineNum}: Invalid correct answer indices for multiple choice`);
							}
						}
					}

					// Parse tags
					let tags = [];
					if (row.tags && row.tags.trim()) {
						// Handle quoted comma-separated tags
						if (row.tags.startsWith('"') && row.tags.endsWith('"')) {
							tags = row.tags.slice(1, -1).split(',').map(tag => tag.trim());
						} else {
							tags = row.tags.split(',').map(tag => tag.trim());
						}
					}

					// Parse points
					const points = row.points ? parseInt(row.points) : 1;
					if (isNaN(points) || points < 0) {
						warnings.push(`Line ${lineNum}: Invalid points value, using default (1)`);
					}

					// Parse difficulty
					const difficulty = row.difficulty?.toLowerCase() || 'medium';
					if (!['easy', 'medium', 'hard'].includes(difficulty)) {
						warnings.push(`Line ${lineNum}: Invalid difficulty "${row.difficulty}", using default (medium)`);
					}

					// Create question object
					const question = {
						text: row.question.trim(),
						description: row.description?.trim() || '',
						type,
						options,
						correctAnswer,
						explanation: row.explanation?.trim() || null,
						points: isNaN(points) ? 1 : points,
						tags,
						difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
					};

					bank.questions.push(question);
					imported++;

				} catch (error) {
					errors.push(`Line ${index + 2}: ${error.message}`);
				}
			}

			// Save the bank with new questions
			await bank.save();

			// Clean up uploaded file
			fs.unlinkSync(req.file.path);

			// Audit log
			await audit(
				'public_bank_csv_import',
				'PublicBank',
				bank._id.toString(),
				{
					targetName: `${bank.title} - CSV Import`,
					newValues: {
						imported,
						totalQuestions: bank.questions.length,
						warnings: warnings.length,
						errors: errors.length,
					},
				},
				req
			);

			res.json({
				success: true,
				message: `Successfully imported ${imported} questions`,
				imported,
				warnings,
				errors,
				questionBank: bank,
			});

		} catch (error) {
			// Clean up uploaded file
			if (req.file && fs.existsSync(req.file.path)) {
				fs.unlinkSync(req.file.path);
			}

			console.error('CSV import error:', error);
			res.status(500).json({
				success: false,
				error: 'Failed to process CSV file',
				details: error.message,
			});
		}
	});
}));

/**
 * @route   GET /sa/public-banks/:id/export-csv
 * @desc    Export questions to CSV file
 * @access  SuperAdmin only
 */
router.get('/public-banks/:id/export-csv', asyncHandler(async (req, res) => {
	const bankId = req.params.id;

	const bank = await PublicBank.findById(bankId).lean();
	if (!bank) {
		return res.status(404).json({
			success: false,
			error: 'Public bank not found',
		});
	}

	// CSV headers
	const headers = [
		'question',
		'description',
		'type',
		'options',
		'correct_answer',
		'explanation',
		'points',
		'tags',
		'difficulty'
	];

	// Convert questions to CSV format
	const csvRows = [headers.join(',')];

	bank.questions.forEach((q, index) => {
		const row = [
			`"${q.text.replace(/"/g, '""')}"`, // Escape quotes
			`"${(q.description || '').replace(/"/g, '""')}"`,
			q.type,
			q.options && q.options.length > 0 ? `"${q.options.join(',')}"` : '',
			q.correctAnswer !== null && q.correctAnswer !== undefined ?
				(Array.isArray(q.correctAnswer) ?
					q.correctAnswer.map(idx => idx + 1).join(',') :
					q.correctAnswer + 1) : '',
			`"${(q.explanation || '').replace(/"/g, '""')}"`,
			q.points || 1,
			q.tags && q.tags.length > 0 ? `"${q.tags.join(',')}"` : '',
			q.difficulty || 'medium'
		];
		csvRows.push(row.join(','));
	});

	const csvContent = csvRows.join('\n');
	const filename = `${bank.title.replace(/[^a-zA-Z0-9]/g, '_')}_questions.csv`;

	// Audit log
	await audit(
		'public_bank_csv_export',
		'PublicBank',
		bank._id.toString(),
		{
			targetName: `${bank.title} - CSV Export`,
			newValues: {
				questionCount: bank.questions.length,
				filename,
			},
		},
		req
	);

	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
	res.send(csvContent);
}));

module.exports = router;
