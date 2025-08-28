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
		
		// Ensure securitySettings is included in response
		const response = survey.toObject();
		response.securitySettings = response.securitySettings || {
			antiCheatEnabled: false
		};
		
		res.json(response);
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
					// Ensure securitySettings is included
					securitySettings: surveyObj.securitySettings || {
						antiCheatEnabled: false
					}
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
 * @desc    Update scoring settings for a survey (assessment/live_quiz only; legacy quiz/iq supported)
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
			multipleChoiceScoring,
			includeShortTextInScore,
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

		// Only allow scoring settings for assessment/live_quiz types
		if (!['assessment', 'live_quiz'].includes(survey.type)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Scoring settings are only available for assessment and live quiz types',
			});
		}

		// Initialize default scoring settings if not present
		const currentScoringSettings = survey.scoringSettings || {};
		
		// Update scoring settings
		const updatedScoringSettings = {
			...currentScoringSettings,
			...(scoringMode && { scoringMode }),
			...(passingThreshold !== undefined && { passingThreshold }),
			...(showScore !== undefined && { showScore }),
			...(showCorrectAnswers !== undefined && { showCorrectAnswers }),
			...(showScoreBreakdown !== undefined && { showScoreBreakdown }),
			...(includeShortTextInScore !== undefined && { includeShortTextInScore }),
		};

		// Handle nested objects properly
		if (customScoringRules) {
			updatedScoringSettings.customScoringRules = {
				...(currentScoringSettings.customScoringRules || {}),
				...customScoringRules,
			};
		}

		if (multipleChoiceScoring) {
			updatedScoringSettings.multipleChoiceScoring = {
				...(currentScoringSettings.multipleChoiceScoring || {}),
				...multipleChoiceScoring,
			};
		}

		survey.scoringSettings = updatedScoringSettings;
		await survey.save();

		// Recalculate scores for existing responses if scoring settings changed
		console.log('=== SCORING SETTINGS UPDATE ===');
		console.log('Survey ID:', id);
		console.log('New includeShortTextInScore:', updatedScoringSettings.includeShortTextInScore);
		
		try {
			const Response = require('./shared/models').Response;
			const existingResponses = await Response.find({ surveyId: id });
			
			for (const response of existingResponses) {
				// Skip incomplete responses that have no valid data
				const hasAnswers = response.answers && (
					(response.answers instanceof Map && response.answers.size > 0) ||
					(typeof response.answers === 'object' && Object.keys(response.answers).length > 0)
				);
				const hasSnapshots = response.questionSnapshots && response.questionSnapshots.length > 0;
				
				if (!hasAnswers && !hasSnapshots) {
					console.log(`Skipping incomplete response ${response._id}`);
					continue;
				}
				
				if (response.questionSnapshots && response.questionSnapshots.length > 0) {
					// Recalculate score based on new settings
					const { includeShortTextInScore: newIncludeShortText = false, multipleChoiceScoring: newMultipleChoiceScoring = {} } = updatedScoringSettings;
					const { enablePartialScoring = false, partialScoringMode = 'proportional' } = newMultipleChoiceScoring;
					
					// Recalculate scoring for each question snapshot
					response.questionSnapshots.forEach(snapshot => {
						const question = snapshot.questionData;
						const userAnswer = snapshot.userAnswer;
						
						// Reset scoring
						let isCorrect = false;
						let pointsAwarded = 0;
						const maxPoints = question.points || 1;
						
						// Skip scoring for short_text if not included in score
						const shouldScore = question.type !== 'short_text' || newIncludeShortText;
						
						if (shouldScore && question.correctAnswer !== undefined && userAnswer !== undefined) {
							if (question.type === 'single_choice') {
								const options = Array.isArray(question.options) ? question.options : [];
								const userOptionIndex = options.findIndex(opt =>
									typeof opt === 'string' ? opt === userAnswer : opt?.text === userAnswer
								);
								isCorrect = userOptionIndex === question.correctAnswer;
							} else if (question.type === 'multiple_choice' && Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
								const options = Array.isArray(question.options) ? question.options : [];
								const userOptionIndices = userAnswer
									.map(ans => options.findIndex(opt => typeof opt === 'string' ? opt === ans : opt?.text === ans))
									.filter(idx => idx !== -1);
								const correctIndices = question.correctAnswer;
								
								if (enablePartialScoring && partialScoringMode === 'proportional') {
									const correctSelections = userOptionIndices.filter(idx => correctIndices.includes(idx));
									const incorrectSelections = userOptionIndices.filter(idx => !correctIndices.includes(idx));
									const correctRatio = correctSelections.length / correctIndices.length;
									const incorrectPenalty = incorrectSelections.length > 0 ? 0.1 * incorrectSelections.length : 0;
									const proportionalScore = Math.max(0, correctRatio - incorrectPenalty);
									pointsAwarded = Math.round(proportionalScore * maxPoints * 100) / 100;
									isCorrect = correctRatio >= 0.5 && incorrectSelections.length === 0;
								} else {
									isCorrect = userOptionIndices.length === correctIndices.length && userOptionIndices.every(idx => correctIndices.includes(idx));
								}
							} else if (question.type === 'short_text') {
								isCorrect = String(userAnswer).trim() === String(question.correctAnswer).trim();
							}
							
							// For non-partial scoring or when fully correct
							if (!enablePartialScoring || question.type !== 'multiple_choice') {
								if (isCorrect) {
									pointsAwarded = maxPoints;
								}
							}
						}
						
						// Update snapshot scoring
						snapshot.scoring = {
							isCorrect,
							pointsAwarded,
							maxPoints: shouldScore ? maxPoints : 0,
						};
					});
					
					// Recalculate total score
					const scorableQuestions = response.questionSnapshots.filter(q => q.scoring.maxPoints > 0);
					const totalPoints = response.questionSnapshots.reduce((sum, q) => sum + q.scoring.pointsAwarded, 0);
					const maxPossiblePoints = response.questionSnapshots.reduce((sum, q) => sum + q.scoring.maxPoints, 0);
					const correctAnswers = scorableQuestions.filter(q => q.scoring.isCorrect).length;
					const wrongAnswers = scorableQuestions.length - correctAnswers;
					const percentage = maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;
					
					// Update response score
					response.score = {
						totalPoints,
						correctAnswers,
						wrongAnswers,
						percentage,
						passed: percentage >= (survey.passingThreshold || 70),
						scoringMode: 'percentage',
						maxPossiblePoints,
						displayScore: percentage,
						scoringDetails: {
							questionScores: response.questionSnapshots.map(q => ({
								questionIndex: q.questionIndex,
								pointsAwarded: q.scoring.pointsAwarded,
								maxPoints: q.scoring.maxPoints,
								isCorrect: q.scoring.isCorrect,
							})),
						},
					};
					
					await response.save();
				}
			}
			
			console.log(`Recalculated scores for ${existingResponses.length} responses based on new scoring settings`);
		} catch (recalcError) {
			console.error('Error recalculating response scores:', recalcError);
			// Don't fail the main request if recalculation fails
		}

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
