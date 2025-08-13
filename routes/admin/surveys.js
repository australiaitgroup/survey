const express = require('express');
const { asyncHandler, jwtAuth } = require('./shared/middleware');
const { Survey, Response } = require('./shared/models');
const { HTTP_STATUS, ERROR_MESSAGES, DATA_TYPES, AppError } = require('./shared/constants');

const router = express.Router();

/**
 * @route   POST /admin/surveys
 * @desc    Create a new survey
 * @access  Private (Admin)
 */
router.post(
	'/surveys',
	jwtAuth,
	asyncHandler(async (req, res) => {
		// Generate slug after validating the request data
		const surveyData = { ...req.body };
		// Check for both falsy values and empty strings
		if (surveyData.title && (!surveyData.slug || surveyData.slug.trim() === '')) {
			surveyData.slug = await Survey.generateSlug(surveyData.title);
		}

		// Ensure isActive and status are in sync
		if (surveyData.status) {
			surveyData.isActive = surveyData.status === 'active';
		} else if (surveyData.isActive !== undefined) {
			surveyData.status = surveyData.isActive ? 'active' : 'draft';
		}

		// Add createdBy field from authenticated user
		surveyData.createdBy = req.user.id;

		const survey = new Survey(surveyData);
		await survey.save();
		res.json(survey);
	})
);

/**
 * @route   GET /admin/surveys/:id
 * @desc    Get a single survey
 * @access  Private (Admin)
 */
router.get(
	'/surveys/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const survey = await Survey.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		}).populate('questionBankId', 'name description');

		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}
		res.json(survey);
	})
);

/**
 * @route   GET /admin/surveys
 * @desc    List all surveys with statistics
 * @access  Private (Admin)
 */
router.get(
	'/surveys',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const surveys = await Survey.find({ createdBy: req.user.id }).populate(
			'questionBankId',
			'name description'
		);

		// Add lastActivity and responseCount for each survey
		const surveysWithStats = await Promise.all(
			surveys.map(async survey => {
				const surveyObj = survey.toObject();

				// Get response count - use ObjectId directly
				const responseCount = await Response.countDocuments({
					surveyId: survey._id,
				});

				// Get last activity (most recent response)
				const lastResponse = await Response.findOne({
					surveyId: survey._id,
				})
					.sort({ createdAt: -1 })
					.select('createdAt')
					.lean();

				return {
					...surveyObj,
					responseCount,
					lastActivity: lastResponse ? lastResponse.createdAt : null,
				};
			})
		);

		res.json(surveysWithStats);
	})
);

/**
 * @route   PUT /admin/surveys/:id
 * @desc    Update a survey
 * @access  Private (Admin)
 */
router.put(
	'/surveys/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		// Ensure isActive and status are in sync
		const updateData = { ...req.body };
		if (updateData.status) {
			updateData.isActive = updateData.status === 'active';
		} else if (updateData.isActive !== undefined) {
			updateData.status = updateData.isActive ? 'active' : 'draft';
		}

		const survey = await Survey.findOneAndUpdate(
			{ _id: req.params.id, createdBy: req.user.id },
			updateData,
			{ new: true }
		);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}
		res.json(survey);
	})
);

/**
 * @route   DELETE /admin/surveys/:id
 * @desc    Delete a survey and all its responses
 * @access  Private (Admin)
 */
router.delete(
	'/surveys/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const survey = await Survey.findOneAndDelete({
			_id: req.params.id,
			createdBy: req.user.id,
		});
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}
		// Also delete all responses for this survey
		await Response.deleteMany({ surveyId: req.params.id });
		res.json({ message: 'Survey deleted successfully' });
	})
);

/**
 * @route   PUT /admin/surveys/:id/scoring
 * @desc    Update scoring settings for a survey (quiz/assessment/iq only)
 * @access  Private (Admin)
 */
router.put(
	'/surveys/:id/scoring',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const {
			scoringMode,
			passingThreshold,
			showScore,
			showCorrectAnswers,
			showScoreBreakdown,
			customScoringRules,
		} = req.body;

		// Validate scoring mode
		if (scoringMode && !['percentage', 'accumulated'].includes(scoringMode)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Invalid scoring mode. Must be "percentage" or "accumulated"',
			});
		}

		// Validate passing threshold
		if (
			passingThreshold !== undefined &&
			(typeof passingThreshold !== DATA_TYPES.NUMBER || passingThreshold < 0)
		) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Passing threshold must be a non-negative number',
			});
		}

		const survey = await Survey.findOne({ _id: id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Only allow scoring settings for quiz/assessment/iq types
		if (!['quiz', 'assessment', 'iq'].includes(survey.type)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Scoring settings are only available for quiz, assessment, and IQ test types',
			});
		}

		// Update scoring settings
		const updatedScoringSettings = {
			...survey.scoringSettings,
			...(scoringMode && { scoringMode }),
			...(passingThreshold !== undefined && { passingThreshold }),
			...(showScore !== undefined && { showScore }),
			...(showCorrectAnswers !== undefined && { showCorrectAnswers }),
			...(showScoreBreakdown !== undefined && { showScoreBreakdown }),
			...(customScoringRules && {
				customScoringRules: {
					...survey.scoringSettings.customScoringRules,
					...customScoringRules,
				},
			}),
		};

		survey.scoringSettings = updatedScoringSettings;
		await survey.save();

		res.json(survey);
	})
);

/**
 * @route   PUT /admin/surveys/:id/toggle-status
 * @desc    Toggle survey active status
 * @access  Private (Admin)
 */
router.put(
	'/surveys/:id/toggle-status',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const survey = await Survey.findOne({ _id: req.params.id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Toggle both isActive and status fields to keep them in sync
		survey.isActive = !survey.isActive;
		survey.status = survey.isActive ? 'active' : 'draft';
		await survey.save();

		res.json(survey);
	})
);

module.exports = router;
