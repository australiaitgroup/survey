const express = require('express');
const { asyncHandler, jwtAuth } = require('./shared/middleware');
const { Survey, Invitation } = require('./shared/models');
const { HTTP_STATUS, ERROR_MESSAGES, AppError } = require('./shared/constants');

const router = express.Router();

/**
 * @route   POST /admin/surveys/:id/publish
 * @desc    Publish survey with distribution settings
 * @access  Private (Admin)
 */
router.post(
	'/surveys/:id/publish',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { enableRSVP, rsvpQuestions, distributionSettings, invitationTemplate } = req.body;

		const survey = await Survey.findOne({ _id: id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Update survey with publication settings
		survey.isActive = true;
		survey.status = 'active';

		if (enableRSVP !== undefined) {
			survey.enableRSVP = enableRSVP;
		}
		if (rsvpQuestions) {
			survey.rsvpQuestions = rsvpQuestions;
		}
		if (distributionSettings) {
			survey.distributionSettings = distributionSettings;
		}
		if (invitationTemplate) {
			survey.invitationTemplate = invitationTemplate;
		}

		await survey.save();

		res.json({
			success: true,
			message: 'Survey published successfully',
			survey,
		});
	})
);

/**
 * @route   GET /admin/surveys/:id/invitations
 * @desc    Get survey invitations
 * @access  Private (Admin)
 */
router.get(
	'/surveys/:id/invitations',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;

		const survey = await Survey.findOne({ _id: id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const invitations = await Invitation.find({ surveyId: id }).sort({ createdAt: -1 });

		res.json({
			invitations,
			survey: {
				_id: survey._id,
				title: survey.title,
				slug: survey.slug,
			},
		});
	})
);

/**
 * @route   POST /admin/surveys/:id/invitations
 * @desc    Create survey invitation
 * @access  Private (Admin)
 */
router.post(
	'/surveys/:id/invitations',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { email, name, message, expiryDate } = req.body;

		const survey = await Survey.findOne({ _id: id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Validate email
		if (!email || !email.includes('@')) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Valid email address is required',
			});
		}

		const invitation = new Invitation({
			surveyId: id,
			email: email.toLowerCase(),
			name: name || '',
			message: message || '',
			expiryDate: expiryDate ? new Date(expiryDate) : undefined,
			status: 'sent',
			createdBy: req.user.id,
		});

		await invitation.save();

		res.status(201).json({
			success: true,
			message: 'Invitation created successfully',
			invitation,
		});
	})
);

module.exports = router;
