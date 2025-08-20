const express = require('express');
const mongoose = require('mongoose');
const {
	authenticateUser,
	requireSuperAdmin,
	allowCrossTenantAccess,
	attachAuditContext,
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
 * @route   GET /sa/stats
 * @desc    Super admin dashboard statistics with recent growth
 * @access  SuperAdmin only
 */
router.get(
	'/stats',
	asyncHandler(async (req, res) => {
		const now = new Date();
		const since7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const [
			totalCompanies,
			activeCompanies,
			totalSurveys,
			totalResponses,
			companiesLast7d,
			surveysLast7d,
			responsesLast7d,
		] = await Promise.all([
			Company.countDocuments({}),
			Company.countDocuments({ isActive: true }),
			Survey.countDocuments({}),
			Response.countDocuments({}),
			Company.countDocuments({ createdAt: { $gte: since7Days } }),
			Survey.countDocuments({ createdAt: { $gte: since7Days } }),
			Response.countDocuments({ createdAt: { $gte: since7Days } }),
		]);

		// Recent items lists
		const [recentCompanies, recentSurveys, recentResponses] = await Promise.all([
			Company.find({}).sort({ createdAt: -1 }).limit(10).select('name slug createdAt').lean(),
			Survey.find({})
				.sort({ createdAt: -1 })
				.limit(10)
				.select('title companyId createdAt')
				.lean(),
			Response.find({}).sort({ createdAt: -1 }).limit(10).select('surveyId createdAt').lean(),
		]);

		res.json({
			success: true,
			data: {
				overview: {
					totalCompanies,
					activeCompanies,
					totalSurveys,
					totalResponses,
					growth7d: {
						companies: companiesLast7d,
						surveys: surveysLast7d,
						responses: responsesLast7d,
					},
				},
				recent: {
					companies: recentCompanies,
					surveys: recentSurveys,
					responses: recentResponses,
				},
			},
		});
	})
);

/**
 * @route   GET /sa/companies
 * @desc    Get all companies (cross-tenant)
 * @access  SuperAdmin only
 */
router.get(
	'/companies',
	asyncHandler(async (req, res) => {
		const {
			page = 1,
			limit = 50,
			search,
			status,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;

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
	})
);

/**
 * @route   GET /sa/companies/:id
 * @desc    Get company details (cross-tenant)
 * @access  SuperAdmin only
 */
router.get(
	'/companies/:id',
	asyncHandler(async (req, res) => {
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
		const surveysByCompanyUsers = await Survey.find({ createdBy: { $in: userIdStrings } })
			.select('_id')
			.lean();
		const surveyIds = surveysByCompanyUsers.map(s => s._id);
		const surveyCount = surveysByCompanyUsers.length;

		// 3) Responses submitted to those surveys
		const responseCount = await Response.countDocuments({ surveyId: { $in: surveyIds } });

		// 4) Question banks created by company users
		const questionBankCount = await QuestionBank.countDocuments({
			createdBy: { $in: userIdStrings },
		});

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
	})
);

/**
 * @route   GET /sa/companies/:id/users
 * @desc    Get users for a specific company
 * @access  SuperAdmin only
 */
router.get(
	'/companies/:id/users',
	asyncHandler(async (req, res) => {
		const companyId = req.params.id;
		const {
			page = 1,
			limit = 50,
			search,
			role,
			isActive,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;

		// Validate company exists
		const company = await Company.findById(companyId).lean();
		if (!company) {
			return res.status(404).json({
				success: false,
				error: 'Company not found',
			});
		}

		// Build query - ensure companyId is ObjectId
		const query = { companyId: mongoose.Types.ObjectId(companyId) };

		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
			];
		}

		if (role) {
			query.role = role;
		}

		if (isActive !== undefined) {
			query.isActive = isActive === 'true';
		}

		// Debug logging
		console.log(`[DEBUG] Searching for users with query:`, JSON.stringify(query));

		// Execute query
		const skip = (page - 1) * limit;
		const users = await User.find(query)
			.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
			.limit(parseInt(limit))
			.skip(skip)
			.select('-password')
			.lean();

		const total = await User.countDocuments(query);

		console.log(
			`[DEBUG] Found ${total} users for company ${companyId}:`,
			users.map(u => ({
				_id: u._id,
				name: u.name,
				email: u.email,
				role: u.role,
				companyId: u.companyId,
			}))
		);

		res.json({
			success: true,
			data: users,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / limit),
			},
			company: {
				_id: company._id,
				name: company.name,
				slug: company.slug,
			},
		});
	})
);

/**
 * @route   PUT /sa/companies/:id
 * @desc    Update company information
 * @access  SuperAdmin only
 */
router.put(
	'/companies/:id',
	asyncHandler(async (req, res) => {
		const companyId = req.params.id;
		const updateData = req.body;

		// Find the company
		const company = await Company.findById(companyId);
		if (!company) {
			return res.status(404).json({
				success: false,
				error: 'Company not found',
			});
		}

		// Store old values for audit
		const oldValues = { ...company.toObject() };

		// Update allowed fields
		const allowedFields = [
			'name',
			'slug',
			'phone',
			'website',
			'address',
			'description',
			'maxUsers',
			'planType',
		];

		allowedFields.forEach(field => {
			if (updateData[field] !== undefined) {
				company[field] = updateData[field];
			}
		});

		// Save the company
		await company.save();

		// Audit log
		await audit(
			req.auditContext.actor,
			'company_update',
			'company',
			company._id.toString(),
			{
				targetName: company.name,
				oldValues,
				newValues: company.toObject(),
			},
			req
		);

		res.json({
			success: true,
			message: 'Company updated successfully',
			data: company,
		});
	})
);

/**
 * @route   PUT /sa/companies/:id/status
 * @desc    Update company status
 * @access  SuperAdmin only
 */
router.put(
	'/companies/:id/status',
	asyncHandler(async (req, res) => {
		const companyId = req.params.id;
		const { status } = req.body;

		// Validate status
		const validStatuses = ['active', 'suspended', 'pending', 'inactive'];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
			});
		}

		// Find the company
		const company = await Company.findById(companyId);
		if (!company) {
			return res.status(404).json({
				success: false,
				error: 'Company not found',
			});
		}

		const oldStatus = company.isActive ? 'active' : 'inactive';

		// Update status
		company.isActive = status === 'active';
		if (status === 'suspended') {
			company.suspendedAt = new Date();
			company.suspendedBy = req.user.id;
			company.suspensionReason = req.body.reason || 'Status changed by super admin';
		} else if (status === 'active') {
			company.suspendedAt = undefined;
			company.suspendedBy = undefined;
			company.suspensionReason = undefined;
		}

		await company.save();

		// Audit log
		await audit(
			req.auditContext.actor,
			'company_status_change',
			'company',
			company._id.toString(),
			{
				targetName: company.name,
				oldStatus,
				newStatus: status,
			},
			req
		);

		res.json({
			success: true,
			message: `Company status updated to ${status}`,
			data: company,
		});
	})
);

/**
 * @route   PUT /sa/companies/:id/suspend
 * @desc    Suspend a company
 * @access  SuperAdmin only
 */
router.put(
	'/companies/:id/suspend',
	asyncHandler(async (req, res) => {
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
	})
);

/**
 * @route   PUT /sa/companies/:id/activate
 * @desc    Activate a suspended company
 * @access  SuperAdmin only
 */
router.put(
	'/companies/:id/activate',
	asyncHandler(async (req, res) => {
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
	})
);

/**
 * @route   GET /sa/users
 * @desc    Get all users across all companies
 * @access  SuperAdmin only
 */
router.get(
	'/users',
	asyncHandler(async (req, res) => {
		const {
			page = 1,
			limit = 50,
			search,
			role,
			companyId,
			isActive,
			sortBy = 'createdAt',
			sortOrder = 'desc',
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
	})
);

/**
 * @route   POST /sa/users/:id/impersonate
 * @desc    Generate impersonation token for a user
 * @access  SuperAdmin only
 */
router.post(
	'/users/:id/impersonate',
	asyncHandler(async (req, res) => {
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
	})
);

/**
 * @route   GET /sa/audit-logs
 * @desc    Get audit logs across all companies
 * @access  SuperAdmin only
 */
router.get(
	'/audit-logs',
	asyncHandler(async (req, res) => {
		const {
			page = 1,
			limit = 50,
			action,
			companyId,
			userId,
			startDate,
			endDate,
			sortBy = 'createdAt',
			sortOrder = 'desc',
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
	})
);

/**
 * @route   GET /sa/stats
 * @desc    Get system-wide statistics
 * @access  SuperAdmin only
 */
router.get(
	'/stats',
	asyncHandler(async (req, res) => {
		const daysParam = parseInt(req.query.days || '14', 10);
		const days = Number.isNaN(daysParam) ? 14 : Math.max(1, Math.min(daysParam, 90));
		const startDate = new Date();
		startDate.setHours(0, 0, 0, 0);
		startDate.setDate(startDate.getDate() - (days - 1));

		const [
			totalCompanies,
			activeCompanies,
			totalUsers,
			activeUsers,
			totalSurveys,
			totalResponses,
			recentAuditLogs,
			companiesDaily,
			surveysDaily,
			responsesDaily,
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
			Company.aggregate([
				{ $match: { createdAt: { $gte: startDate } } },
				{
					$group: {
						_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
						count: { $sum: 1 },
					},
				},
				{ $sort: { _id: 1 } },
			]),
			Survey.aggregate([
				{ $match: { createdAt: { $gte: startDate } } },
				{
					$group: {
						_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
						count: { $sum: 1 },
					},
				},
				{ $sort: { _id: 1 } },
			]),
			Response.aggregate([
				{ $match: { createdAt: { $gte: startDate } } },
				{
					$group: {
						_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
						count: { $sum: 1 },
					},
				},
				{ $sort: { _id: 1 } },
			]),
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
				daily: {
					companies: companiesDaily.map(d => ({ date: d._id, count: d.count })),
					surveys: surveysDaily.map(d => ({ date: d._id, count: d.count })),
					responses: responsesDaily.map(d => ({ date: d._id, count: d.count })),
					range: {
						from: startDate.toISOString().slice(0, 10),
						to: new Date().toISOString().slice(0, 10),
						days,
					},
				},
				recentActivity: recentAuditLogs,
			},
		});
	})
);

/**
 * @route   GET /sa/public-banks
 * @desc    Get all public banks
 * @access  SuperAdmin only
 */
router.get(
	'/public-banks',
	asyncHandler(async (req, res) => {
		const {
			page = 1,
			limit = 50,
			search,
			type,
			isActive,
			sortBy = 'createdAt',
			sortOrder = 'desc',
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
	})
);

/**
 * @route   GET /sa/public-banks/:id
 * @desc    Get a single public bank
 * @access  SuperAdmin only
 */
router.get(
	'/public-banks/:id',
	asyncHandler(async (req, res) => {
		const bankId = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(bankId)) {
			return res.status(400).json({ success: false, error: 'Invalid public bank id' });
		}
		const bank = await PublicBank.findById(bankId).lean();
		if (!bank) {
			return res.status(404).json({ success: false, error: 'Public bank not found' });
		}
		res.json({ success: true, data: bank });
	})
);

/**
 * @route   POST /sa/public-banks
 * @desc    Create a new public bank
 * @access  SuperAdmin only
 */
router.post(
	'/public-banks',
	asyncHandler(async (req, res) => {
		const { title, description, type, priceOneTime, tags, locales, isActive = true, isPublished = true } = req.body;

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
			isPublished,
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
	})
);

/**
 * @route   PUT /sa/public-banks/:id
 * @desc    Update a public bank
 * @access  SuperAdmin only
 */
router.put(
	'/public-banks/:id',
	asyncHandler(async (req, res) => {
		const { title, description, type, priceOneTime, tags, locales, isActive, isPublished } = req.body;

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
			isPublished: bank.isPublished,
		};

		// Update fields
		if (title) bank.title = title;
		if (description) bank.description = description;
		if (type) bank.type = type;
		if (priceOneTime !== undefined) bank.priceOneTime = priceOneTime;
		if (tags) bank.tags = tags;
		if (locales) bank.locales = locales;
		if (isActive !== undefined) bank.isActive = isActive;
		if (isPublished !== undefined) bank.isPublished = isPublished;
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
					isPublished: bank.isPublished,
				},
			},
			req
		);

		res.json({
			success: true,
			message: 'Public bank updated successfully',
			data: bank,
		});
	})
);

/**
 * @route   GET /sa/public-banks/:id/usage
 * @desc    Get usage statistics for a public bank
 * @access  SuperAdmin only
 */
// Get single public bank by id
router.get(
	'/public-banks/:id',
	asyncHandler(async (req, res) => {
		const bankId = req.params.id;
		const bank = await PublicBank.findById(bankId);
		if (!bank) {
			return res.status(404).json({ success: false, error: 'Public bank not found' });
		}
		res.json({ success: true, data: bank });
	})
);

router.get(
	'/public-banks/:id/usage',
	asyncHandler(async (req, res) => {
		const bankId = req.params.id;

		const [companiesCount, linkedSurveysCount, purchases, totalRevenue] = await Promise.all([
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
	})
);

/**
 * @route   GET /sa/purchases
 * @desc    Get all purchases and subscriptions
 * @access  SuperAdmin only
 */
router.get(
	'/purchases',
	asyncHandler(async (req, res) => {
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
			sortOrder = 'desc',
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
	})
);

/**
 * @route   GET /sa/purchases/export
 * @desc    Export purchases as CSV
 * @access  SuperAdmin only
 */
router.get(
	'/purchases/export',
	asyncHandler(async (req, res) => {
		const { companyId, bankId, type, status, startDate, endDate } = req.query;

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
	})
);

/**
 * @route   GET /sa/resale-policies
 * @desc    Get resale policies
 * @access  SuperAdmin only
 */
router.get(
	'/resale-policies',
	asyncHandler(async (req, res) => {
		const {
			page = 1,
			limit = 50,
			companyId,
			bankId,
			isEnabled,
			sortBy = 'createdAt',
			sortOrder = 'desc',
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
	})
);

/**
 * @route   PATCH /sa/resale-policies/:id
 * @desc    Update resale policy
 * @access  SuperAdmin only
 */
router.patch(
	'/resale-policies/:id',
	asyncHandler(async (req, res) => {
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
	})
);

// ===========================================
// PUBLIC BANK QUESTION MANAGEMENT ROUTES
// ===========================================

/**
 * @route   GET /sa/public-banks/:id/questions
 * @desc    Get questions for a public bank
 * @access  SuperAdmin only
 */
router.get(
	'/public-banks/:id/questions',
	asyncHandler(async (req, res) => {
		const {
			page = 1,
			limit = 50,
			search,
			difficulty,
			tags,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;
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
			questions = questions.filter(
				q =>
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
			questions = questions.filter(q => q.tags && q.tags.some(tag => tagArray.includes(tag)));
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
	})
);

/**
 * @route   POST /sa/public-banks/:id/questions
 * @desc    Add a new question to a public bank
 * @access  SuperAdmin only
 */
router.post(
	'/public-banks/:id/questions',
	asyncHandler(async (req, res) => {
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
			difficulty,
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
	})
);

/**
 * @route   PUT /sa/public-banks/:id/questions/:questionIndex
 * @desc    Update a question in a public bank
 * @access  SuperAdmin only
 */
router.put(
	'/public-banks/:id/questions/:questionIndex',
	asyncHandler(async (req, res) => {
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
			difficulty,
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
			description:
				description !== undefined ? description : bank.questions[questionIndex].description,
			type: type || bank.questions[questionIndex].type,
			options: options !== undefined ? options : bank.questions[questionIndex].options,
			correctAnswer:
				correctAnswer !== undefined
					? correctAnswer
					: bank.questions[questionIndex].correctAnswer,
			explanation:
				explanation !== undefined ? explanation : bank.questions[questionIndex].explanation,
			descriptionImage:
				descriptionImage !== undefined
					? descriptionImage
					: bank.questions[questionIndex].descriptionImage,
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
	})
);

/**
 * @route   DELETE /sa/public-banks/:id/questions/:questionIndex
 * @desc    Delete a question from a public bank
 * @access  SuperAdmin only
 */
router.delete(
	'/public-banks/:id/questions/:questionIndex',
	asyncHandler(async (req, res) => {
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
	})
);

/**
 * @route   POST /sa/public-banks/:id/questions/:questionIndex/duplicate
 * @desc    Duplicate a question in a public bank
 * @access  SuperAdmin only
 */
router.post(
	'/public-banks/:id/questions/:questionIndex/duplicate',
	asyncHandler(async (req, res) => {
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
	})
);

/**
 * @route   POST /sa/public-banks/:id/import-csv
 * @desc    Import questions from CSV file
 * @access  SuperAdmin only
 */
router.post(
	'/public-banks/:id/import-csv',
	asyncHandler(async (req, res) => {
		const multer = require('multer');
		const csv = require('csv-parser');
		const fs = require('fs');

		// Set up multer for file upload
		const upload = multer({ dest: 'uploads/' });

		upload.single('csvFile')(req, res, async err => {
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

			const errors = [];
			const warnings = [];
			const questions = [];
			let lineNumber = 1; // header line

			try {
				await new Promise((resolve, reject) => {
					fs.createReadStream(req.file.path)
						.pipe(
							csv({
								headers: [
									'questionText',
									'description',
									'type',
									'options',
									'correctAnswers',
									'tags',
									'explanation',
									'points',
									'difficulty',
									'descriptionImage',
								],
								skipEmptyLines: true,
							})
						)
						.on('data', row => {
							lineNumber++;
							try {
								// Normalize BOM and trim
								const normalize = v =>
									typeof v === 'string' ? v.replace(/^\ufeff/, '').trim() : v;
								row.questionText = normalize(row.questionText);
								row.type = normalize(row.type);
								row.options = normalize(row.options);
								row.correctAnswers = normalize(row.correctAnswers);
								row.tags = normalize(row.tags);
								row.description = normalize(row.description);
								row.explanation = normalize(row.explanation);
								row.difficulty = normalize(row.difficulty);
								row.descriptionImage = normalize(row.descriptionImage);

								// Skip empty
								if (!row.questionText || !row.questionText.trim()) {
									return;
								}

								// Skip header row if present in file
								if (row.questionText.trim().toLowerCase() === 'questiontext') {
									return;
								}

								const questionText = (
									row.questionText ||
									row.question ||
									''
								).trim();
								if (!questionText) {
									errors.push(`Line ${lineNumber}: questionText is required`);
									return;
								}
								const typeRaw = (row.type || '').toLowerCase() || 'single';
								let questionType;
								switch (typeRaw) {
								case 'single':
									questionType = 'single_choice';
									break;
								case 'multiple':
									questionType = 'multiple_choice';
									break;
								case 'text':
									questionType = 'short_text';
									break;
								default:
									questionType = 'single_choice';
								}

								const newQuestion = {
									text: questionText,
									type: questionType,
									points: parseInt(row.points) || 1,
									tags: [],
									difficulty:
										row.difficulty &&
										['easy', 'medium', 'hard'].includes(
											row.difficulty.toLowerCase()
										)
											? row.difficulty.toLowerCase()
											: 'medium',
								};

								if (row.description && row.description.trim()) {
									newQuestion.description = row.description.trim();
								}
								if (row.explanation && row.explanation.trim()) {
									newQuestion.explanation = row.explanation.trim();
								}
								if (row.descriptionImage && row.descriptionImage.trim()) {
									newQuestion.descriptionImage = row.descriptionImage.trim();
								}

								if (row.tags && row.tags.trim()) {
									newQuestion.tags = row.tags
										.split(',')
										.map(tag => tag.trim())
										.filter(tag => tag.length > 0);
								}

								if (questionType !== 'short_text') {
									const rawOptions = row.options || '';
									if (!rawOptions.trim()) {
										errors.push(
											`Line ${lineNumber}: Options are required for choice questions`
										);
										return;
									}
									// Strictly follow Question Bank format: semicolon-separated options
									const options = rawOptions
										.split(';')
										.map(opt => opt.trim())
										.filter(opt => opt.length > 0);
									if (options.length < 2) {
										errors.push(
											`Line ${lineNumber}: At least 2 options are required`
										);
										return;
									}
									newQuestion.options = options;

									const rawCorrect = (
										row.correctAnswers ||
										row.correct_answer ||
										''
									).trim();
									if (!rawCorrect) {
										errors.push(
											`Line ${lineNumber}: Correct answers are required for choice questions`
										);
										return;
									}
									// Strictly follow Question Bank format: semicolon-separated, 0-based indices
									const correctAnswerIndices = rawCorrect
										.split(';')
										.map(idx => parseInt(idx.trim(), 10))
										.filter(
											idx => !isNaN(idx) && idx >= 0 && idx < options.length
										);
									if (correctAnswerIndices.length === 0) {
										errors.push(
											`Line ${lineNumber}: Invalid correct answer indices`
										);
										return;
									}

									if (questionType === 'single_choice') {
										if (correctAnswerIndices.length > 1) {
											errors.push(
												`Line ${lineNumber}: Single choice questions can only have one correct answer`
											);
											return;
										}
										newQuestion.correctAnswer = correctAnswerIndices[0];
									} else {
										newQuestion.correctAnswer = correctAnswerIndices;
									}
								} else {
									if (row.correctAnswers && row.correctAnswers.trim()) {
										newQuestion.correctAnswer = row.correctAnswers.trim();
									}
								}

								questions.push(newQuestion);
							} catch (e) {
								errors.push(`Line ${lineNumber}: ${e.message}`);
							}
						})
						.on('end', resolve)
						.on('error', reject);
				});

				if (questions.length > 0) {
					bank.questions.push(...questions);
					await bank.save();
				}

				// Clean up uploaded file
				if (req.file && fs.existsSync(req.file.path)) {
					fs.unlinkSync(req.file.path);
				}

				await audit(
					'public_bank_csv_import',
					'PublicBank',
					bank._id.toString(),
					{
						targetName: `${bank.title} - CSV Import`,
						newValues: {
							imported: questions.length,
							totalQuestions: bank.questions.length,
							warnings: warnings.length,
							errors: errors.length,
						},
					},
					req
				);

				res.json({
					success: true,
					message: `Successfully imported ${questions.length} questions`,
					imported: questions.length,
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
	})
);

// Download CSV template aligned with Question Bank format
router.get(
	'/public-banks/csv-template/download',
	asyncHandler(async (req, res) => {
		try {
			const csvTemplate = `questionText,description,type,options,correctAnswers,tags,explanation,points,difficulty,descriptionImage
你喜欢哪个颜色？,"**场景**：请选择你最喜欢的颜色。",single,红色;绿色;蓝色,1,"颜色,兴趣",这是一个关于颜色偏好的问题,1,easy,
哪些是编程语言？,"提示：选择所有符合条件的选项。",multiple,JavaScript;Python;HTML,0;1,"技术,测试",选择所有编程语言选项,2,medium,
请简要说明你的人生目标,"可以使用Markdown，例如：**清晰简洁地描述**",text,,,"思辨,职业规划",请用简洁的语言描述,1,medium,
以下哪个是正确的数学公式？,"You can add Markdown like **bold** or _italic_.",single,2+2=4;2+2=5;2+2=6,0,"数学,基础",基础数学运算题,1,easy,
选择所有偶数,"请选择所有偶数。",multiple,1;2;3;4;5;6,1;3;5,"数学,数字",,1,medium,
描述一下你最喜欢的编程语言,"可使用 Markdown 描述你喜欢它的原因。",text,,,编程,,1,medium,
中国的首都是哪里？,"基础常识题。",single,北京;上海;广州;深圳,0,"地理,常识",,1,easy,`;

			res.setHeader('Content-Type', 'text/csv');
			res.setHeader(
				'Content-Disposition',
				'attachment; filename="question_bank_template.csv"'
			);
			res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
			res.setHeader('Pragma', 'no-cache');
			res.setHeader('Expires', '0');
			res.send(csvTemplate);
		} catch (e) {
			console.error('Error generating CSV template:', e);
			res.status(500).json({ error: 'Failed to generate CSV template' });
		}
	})
);

/**
 * @route   GET /sa/public-banks/:id/export-csv
 * @desc    Export questions to CSV file
 * @access  SuperAdmin only
 */
router.get(
	'/public-banks/:id/export-csv',
	asyncHandler(async (req, res) => {
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
			'difficulty',
		];

		// Convert questions to CSV format
		const csvRows = [headers.join(',')];

		bank.questions.forEach((q, index) => {
			const row = [
				`"${q.text.replace(/"/g, '""')}"`, // Escape quotes
				`"${(q.description || '').replace(/"/g, '""')}"`,
				q.type,
				q.options && q.options.length > 0 ? `"${q.options.join(',')}"` : '',
				q.correctAnswer !== null && q.correctAnswer !== undefined
					? Array.isArray(q.correctAnswer)
						? q.correctAnswer.map(idx => idx + 1).join(',')
						: q.correctAnswer + 1
					: '',
				`"${(q.explanation || '').replace(/"/g, '""')}"`,
				q.points || 1,
				q.tags && q.tags.length > 0 ? `"${q.tags.join(',')}"` : '',
				q.difficulty || 'medium',
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
	})
);

module.exports = router;
