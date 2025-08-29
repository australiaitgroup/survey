const express = require('express');
const Invitation = require('../models/Invitation');
const Survey = require('../models/Survey');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_MESSAGES, HTTP_STATUS } = require('../shared/constants');
const { sendMail } = require('../utils/mailer');
const { jwtAuth } = require('../middlewares/jwtAuth');

const router = express.Router();

// Create a new invitation (admin only)
router.post(
	'/',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const {
			surveyId,
			distributionMode,
			targetUsers,
			targetEmails,
			maxResponses,
			expiresAt,
			preventDuplicates = false, // 可选参数：是否防止重复邀请
		} = req.body;

		// Validate required fields
		if (!surveyId || !distributionMode) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Survey ID and distribution mode are required',
			});
		}

		// Check if survey exists
		const survey = await Survey.findById(surveyId);
		if (!survey) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Survey not found',
			});
		}

		// Validate distribution mode
		if (!['open', 'targeted', 'link'].includes(distributionMode)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Invalid distribution mode',
			});
		}

		// For targeted mode, validate target users/emails
		if (distributionMode === 'targeted' && !targetUsers && !targetEmails) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Target users or emails are required for targeted distribution',
			});
		}

		// 批量邮箱邀请逻辑
		if (
			distributionMode === 'targeted' &&
			Array.isArray(targetEmails) &&
			targetEmails.length > 0
		) {
			const results = [];
			for (const email of targetEmails) {
				try {
					// Handle createdBy field - only set if it's a valid ObjectId
					let createdBy = null;
					if (req.user?.id && req.user.id !== 'admin') {
						try {
							const mongoose = require('mongoose');
							createdBy = new mongoose.Types.ObjectId(req.user.id);
						} catch (error) {
							// Invalid ObjectId, leave as null
							console.log('Invalid ObjectId for createdBy:', req.user.id);
						}
					}

					const invitation = await Invitation.create({
						surveyId,
						distributionMode: 'targeted',
						targetEmails: [email],
						maxResponses: 1,
						expiresAt: expiresAt ? new Date(expiresAt) : null,
						createdBy,
					});

					// 生成 assessment 专属链接 - 使用 survey slug 而不是 invitation code
					const link = `${process.env.BASE_URL || 'http://localhost:5173'}/assessment/${survey.slug}?invitation=${invitation.invitationCode}`;
					const expireText = expiresAt
						? `此链接将在 ${new Date(expiresAt).toLocaleDateString()} 过期。`
						: '';
					const subject = `[Assessment Invitation] 你被邀请参与一次测评`;
					const html = `
						<p>Hi ${email},</p>
						<p>您被邀请参与我们的在线测评：<b>${survey.title}</b>。</p>
						<p>请点击下方按钮开始答题：</p>
						<p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">👉 开始测评</a></p>
						<p>${expireText}</p>
						<p>—— 测评系统</p>
					`;
					await sendMail({ to: email, subject, html });
					results.push({ email, status: 'success' });
				} catch (err) {
					results.push({ email, status: 'fail', error: err.message });
				}
			}
			return res.json({ success: true, results });
		}

		// Handle createdBy field - only set if it's a valid ObjectId
		let createdBy = null;
		if (req.user?.id && req.user.id !== 'admin') {
			try {
				const mongoose = require('mongoose');
				createdBy = new mongoose.Types.ObjectId(req.user.id);
			} catch (error) {
				// Invalid ObjectId, leave as null
				console.log('Invalid ObjectId for createdBy:', req.user.id);
			}
		}

		// 兼容原有 invitation 创建逻辑
		const invitation = await Invitation.create({
			surveyId,
			distributionMode,
			targetUsers: targetUsers || [],
			targetEmails: targetEmails || [],
			maxResponses,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
			createdBy,
		});

		// Populate the invitation with survey and target user details
		await invitation.populate('surveyId', 'title description');
		await invitation.populate('targetUsers', 'name email studentId');

		res.status(HTTP_STATUS.CREATED).json(invitation);
	})
);

// Get all invitations for a survey (admin only)
router.get(
	'/survey/:surveyId',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { surveyId } = req.params;

		const invitations = await Invitation.find({ surveyId })
			.populate('surveyId', 'title description')
			.populate('targetUsers', 'name email studentId')
			.sort({ createdAt: -1 });

		res.json(invitations);
	})
);

// Get all invitations (admin only)
router.get(
	'/',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { distributionMode, isActive, surveyId } = req.query;

		let query = {};

		// Apply filters
		if (distributionMode) query.distributionMode = distributionMode;
		if (isActive !== undefined) query.isActive = isActive === 'true';
		if (surveyId) query.surveyId = surveyId;

		const invitations = await Invitation.find(query)
			.populate('surveyId', 'title description')
			.populate('targetUsers', 'name email studentId')
			.sort({ createdAt: -1 });

		res.json(invitations);
	})
);

// Update an invitation (admin only)
router.put(
	'/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { targetUsers, targetEmails, maxResponses, expiresAt, isActive } = req.body;

		const invitation = await Invitation.findById(req.params.id);
		if (!invitation) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Invitation not found',
			});
		}

		// Update fields
		if (targetUsers !== undefined) invitation.targetUsers = targetUsers;
		if (targetEmails !== undefined) invitation.targetEmails = targetEmails;
		if (maxResponses !== undefined) invitation.maxResponses = maxResponses;
		if (expiresAt !== undefined) invitation.expiresAt = expiresAt ? new Date(expiresAt) : null;
		if (isActive !== undefined) invitation.isActive = isActive;

		await invitation.save();

		// Populate the invitation with survey and target user details
		await invitation.populate('surveyId', 'title description');
		await invitation.populate('targetUsers', 'name email studentId');

		res.json(invitation);
	})
);

// Delete an invitation (admin only)
router.delete(
	'/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const invitation = await Invitation.findById(req.params.id);
		if (!invitation) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Invitation not found',
			});
		}

		// Soft delete by setting isActive to false
		invitation.isActive = false;
		await invitation.save();

		res.json({ message: 'Invitation deleted successfully' });
	})
);

// Get invitation statistics (admin only)
router.get(
	'/:id/statistics',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const invitation = await Invitation.findById(req.params.id).populate(
			'surveyId',
			'title description'
		);

		if (!invitation) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Invitation not found',
			});
		}

		const stats = {
			invitation: {
				id: invitation._id,
				surveyTitle: invitation.surveyId.title,
				distributionMode: invitation.distributionMode,
				createdAt: invitation.createdAt,
				expiresAt: invitation.expiresAt,
				maxResponses: invitation.maxResponses,
				currentResponses: invitation.currentResponses,
				isActive: invitation.isActive,
				isValid: invitation.isValid(),
			},
			access: {
				totalAccess: invitation.accessLog.length,
				uniqueUsers: [...new Set(invitation.accessLog.map(log => log.userId || log.email))]
					.length,
				recentAccess: invitation.accessLog.slice(-10).reverse(),
			},
			completion: {
				totalCompletions: invitation.completedBy.length,
				completionRate:
					invitation.accessLog.length > 0
						? (
							(invitation.completedBy.length / invitation.accessLog.length) *
								100
						).toFixed(2)
						: 0,
				recentCompletions: invitation.completedBy.slice(-10).reverse(),
			},
		};

		if (invitation.distributionMode === 'targeted') {
			stats.targeting = {
				targetUsers: invitation.targetUsers.length,
				targetEmails: invitation.targetEmails.length,
				totalTargeted: invitation.targetUsers.length + invitation.targetEmails.length,
			};
		}

		res.json(stats);
	})
);

// Access survey via invitation code (public)
router.get(
	'/access/:invitationCode',
	asyncHandler(async (req, res) => {
		const { invitationCode } = req.params;
		const { userId, email } = req.query;

		const invitation = await Invitation.findOne({ invitationCode }).populate('surveyId');

		if (!invitation) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Invitation not found',
			});
		}

		// Check if invitation is valid
		if (!invitation.isValid()) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Invitation is no longer valid',
			});
		}

		// Check if user has access
		if (!invitation.canAccess(userId, email)) {
			return res.status(HTTP_STATUS.FORBIDDEN).json({
				error: 'You do not have access to this survey',
			});
		}

		// Log access
		invitation.accessLog.push({
			userId: userId || null,
			email: email || null,
			accessedAt: new Date(),
		});

		await invitation.save();

		res.json({
			survey: invitation.surveyId,
			invitation: {
				id: invitation._id,
				distributionMode: invitation.distributionMode,
				maxResponses: invitation.maxResponses,
				currentResponses: invitation.currentResponses,
				expiresAt: invitation.expiresAt,
			},
		});
	})
);

// 标记 invitation 已完成（作答后调用）
router.post(
	'/complete/:invitationCode',
	asyncHandler(async (req, res) => {
		const { invitationCode } = req.params;
		const { userId, email } = req.body;

		const invitation = await Invitation.findOne({ invitationCode });
		if (!invitation) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Invitation not found' });
		}

		// 增加 currentResponses
		invitation.currentResponses = (invitation.currentResponses || 0) + 1;
		invitation.completedBy.push({
			userId: userId || null,
			email: email || null,
			completedAt: new Date(),
		});
		// 如果只允许一次，自动失效
		if (invitation.maxResponses === 1) {
			invitation.isActive = false;
		}
		await invitation.save();
		res.json({ success: true });
	})
);

// Generate invitation URLs (admin only)
router.get(
	'/:id/urls',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const invitation = await Invitation.findById(req.params.id).populate(
			'surveyId',
			'title slug'
		);

		if (!invitation) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Invitation not found',
			});
		}

		const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

		const urls = {
			invitationUrl: `${baseUrl}/invitation/${invitation.invitationCode}`,
			directSurveyUrl: `${baseUrl}/survey/${invitation.surveyId.slug}`,
			surveyWithInvitation: `${baseUrl}/survey/${invitation.surveyId.slug}?invitation=${invitation.invitationCode}`,
		};

		res.json(urls);
	})
);

// Get all invitations for a specific user (admin only)
router.get(
	'/user/:userId',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { userId } = req.params;
		const { includeCompleted = false } = req.query;

		// Check if user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'User not found',
			});
		}

		// Find all invitations for this user
		const query = {
			$or: [{ targetUsers: userId }, { targetEmails: user.email }],
		};

		// Optionally filter out completed invitations
		if (!includeCompleted) {
			query.isActive = true;
		}

		const invitations = await Invitation.find(query)
			.populate('surveyId', 'title description type status')
			.sort({ createdAt: -1 });

		// Add completion status for each invitation
		const invitationsWithStatus = invitations.map(inv => {
			const hasCompleted = inv.completedBy.some(
				completed =>
					completed.userId?.toString() === userId || completed.email === user.email
			);

			return {
				...inv.toObject(),
				hasCompleted,
				canAccess: inv.canAccess(userId, user.email),
				isValid: inv.isValid(),
			};
		});

		res.json({
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
			invitations: invitationsWithStatus,
			summary: {
				total: invitations.length,
				completed: invitationsWithStatus.filter(inv => inv.hasCompleted).length,
				pending: invitationsWithStatus.filter(inv => !inv.hasCompleted && inv.isValid)
					.length,
				expired: invitationsWithStatus.filter(inv => !inv.isValid).length,
			},
		});
	})
);

// Get all invitations for a specific email (public - for external users)
router.get(
	'/email/:email',
	asyncHandler(async (req, res) => {
		const { email } = req.params;
		const { includeCompleted = false } = req.query;

		// Find all invitations for this email
		const query = {
			targetEmails: email,
		};

		// Optionally filter out completed invitations
		if (!includeCompleted) {
			query.isActive = true;
		}

		const invitations = await Invitation.find(query)
			.populate('surveyId', 'title description type status')
			.sort({ createdAt: -1 });

		// Add completion status for each invitation
		const invitationsWithStatus = invitations.map(inv => {
			const hasCompleted = inv.completedBy.some(completed => completed.email === email);

			return {
				...inv.toObject(),
				hasCompleted,
				canAccess: inv.canAccess(null, email),
				isValid: inv.isValid(),
			};
		});

		res.json({
			email,
			invitations: invitationsWithStatus,
			summary: {
				total: invitations.length,
				completed: invitationsWithStatus.filter(inv => inv.hasCompleted).length,
				pending: invitationsWithStatus.filter(inv => !inv.hasCompleted && inv.isValid)
					.length,
				expired: invitationsWithStatus.filter(inv => !inv.isValid).length,
			},
		});
	})
);

// Check if user has already been invited to a survey
router.get(
	'/check-duplicate/:surveyId',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { surveyId } = req.params;
		const { userId, email } = req.query;

		if (!userId && !email) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'User ID or email is required',
			});
		}

		// Check for existing invitations
		const query = {
			surveyId,
			isActive: true,
			$or: [],
		};

		if (userId) {
			query.$or.push({ targetUsers: userId });
		}
		if (email) {
			query.$or.push({ targetEmails: email });
		}

		const existingInvitation = await Invitation.findOne(query);

		res.json({
			hasExistingInvitation: !!existingInvitation,
			existingInvitation: existingInvitation || null,
		});
	})
);

// Bulk create invitations (admin only)
router.post(
	'/bulk',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { surveyId, invitations } = req.body;

		if (!surveyId || !Array.isArray(invitations) || invitations.length === 0) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Survey ID and invitations array are required',
			});
		}

		// Check if survey exists
		const survey = await Survey.findById(surveyId);
		if (!survey) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Survey not found',
			});
		}

		const results = {
			created: [],
			errors: [],
		};

		for (const invitationData of invitations) {
			try {
				const { distributionMode, targetUsers, targetEmails, maxResponses, expiresAt } =
					invitationData;

				// Validate distribution mode
				if (!['open', 'targeted', 'link'].includes(distributionMode)) {
					results.errors.push({
						invitationData,
						error: 'Invalid distribution mode',
					});
					continue;
				}

				// For targeted mode, validate target users/emails
				if (distributionMode === 'targeted' && !targetUsers && !targetEmails) {
					results.errors.push({
						invitationData,
						error: 'Target users or emails are required for targeted distribution',
					});
					continue;
				}

				// Handle createdBy field - only set if it's a valid ObjectId
				let createdBy = null;
				if (req.user?.id && req.user.id !== 'admin') {
					try {
						const mongoose = require('mongoose');
						createdBy = new mongoose.Types.ObjectId(req.user.id);
					} catch (error) {
						// Invalid ObjectId, leave as null
						console.log('Invalid ObjectId for createdBy:', req.user.id);
					}
				}

				const invitation = await Invitation.create({
					surveyId,
					distributionMode,
					targetUsers: targetUsers || [],
					targetEmails: targetEmails || [],
					maxResponses,
					expiresAt: expiresAt ? new Date(expiresAt) : null,
					createdBy,
				});

				results.created.push(invitation);
			} catch (error) {
				results.errors.push({ invitationData, error: error.message });
			}
		}

		res.json(results);
	})
);

module.exports = router;
