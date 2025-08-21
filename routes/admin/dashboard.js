const express = require('express');
const { asyncHandler, jwtAuth } = require('./shared/middleware');
const { Survey, Invitation, User, Response } = require('./shared/models');
const { HTTP_STATUS, ERROR_MESSAGES, AppError } = require('./shared/constants');

const router = express.Router();

/**
 * @route   GET /admin/dashboard/statistics
 * @desc    Get dashboard statistics (admin only)
 * @access  Private (Admin)
 */
router.get(
	'/dashboard/statistics',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const [
			totalSurveys,
			activeSurveys,
			totalInvitations,
			activeInvitations,
			totalUsers,
			totalResponses,
		] = await Promise.all([
			Survey.countDocuments(),
			Survey.countDocuments({ status: 'active' }),
			Invitation.countDocuments(),
			Invitation.countDocuments({ isActive: true }),
			User.countDocuments({ isActive: true }),
			Response.countDocuments(),
		]);

		// Get survey statistics by type
		const surveysByType = await Survey.aggregate([
			{
				$group: {
					_id: '$type',
					count: { $sum: 1 },
				},
			},
		]);

		// Get invitation statistics by distribution mode
		const invitationsByMode = await Invitation.aggregate([
			{
				$group: {
					_id: '$distributionMode',
					count: { $sum: 1 },
				},
			},
		]);

		// Get user statistics by role
		const usersByRole = await User.aggregate([
			{ $match: { isActive: true } },
			{
				$group: {
					_id: '$role',
					count: { $sum: 1 },
				},
			},
		]);

		// Get recent activity
		const recentSurveys = await Survey.find({ createdBy: req.user.id })
			.sort({ createdAt: -1 })
			.limit(5)
			.select('title status createdAt');

		const recentInvitations = await Invitation.find()
			.populate('surveyId', 'title')
			.sort({ createdAt: -1 })
			.limit(5)
			.select('distributionMode currentResponses createdAt');

		res.json({
			overview: {
				totalSurveys,
				activeSurveys,
				totalInvitations,
				activeInvitations,
				totalUsers,
				totalResponses,
			},
			charts: {
				surveysByType,
				invitationsByMode,
				usersByRole,
			},
			recent: {
				surveys: recentSurveys,
				invitations: recentInvitations,
			},
		});
	})
);

module.exports = router;
