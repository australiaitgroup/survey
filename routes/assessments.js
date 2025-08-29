const express = require('express');
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const QuestionBank = require('../models/QuestionBank');
const Response = require('../models/Response');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const {
	ERROR_MESSAGES,
	SURVEY_STATUS,
	SOURCE_TYPE,
	SURVEY_TYPE,
	HTTP_STATUS,
} = require('../shared/constants');

const router = express.Router();

function maskQuestions(questions) {
	return (questions || []).map(q => {
		const { correctAnswer, explanation, ...rest } = q.toObject ? q.toObject() : q;
		return rest;
	});
}

// GET /assessment/:slug - metadata only (no questions)
router.get(
	'/assessment/:slug',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;

		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE }).lean();
		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE }).lean();
		}
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

		// Ensure it is an assessment-type survey
		if (survey.type !== SURVEY_TYPE.ASSESSMENT) {
			throw new AppError('Not an assessment', HTTP_STATUS.BAD_REQUEST);
		}

		// Never include questions in this metadata response
		survey.questions = [];
		
		// Ensure securitySettings is included in the response
		const response = {
			...survey,
			securitySettings: survey.securitySettings || {
				antiCheatEnabled: false
			}
		};
		
		res.json(response);
	})
);

// POST /assessment/:slug/start - lock questions and return masked list
router.post(
	'/assessment/:slug/start',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;
		const { name, email, attempt, resume } = req.body || {};

		if (!email || !name) {
			throw new AppError('Missing required fields: name, email', HTTP_STATUS.BAD_REQUEST);
		}

		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE });
		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE });
		}
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		if (survey.type !== SURVEY_TYPE.ASSESSMENT) {
			throw new AppError('Not an assessment', HTTP_STATUS.BAD_REQUEST);
		}

		// If a response already exists for this user and attempt, reuse questions
		let existingResponse = await Response.findOne({
			surveyId: survey._id,
			email,
			...(attempt && { attempt: parseInt(attempt) }),
		});

		let selectedQuestions = [];

		// Only reuse an existing selection when explicitly resuming
		if (resume === true && existingResponse && existingResponse.selectedQuestions?.length > 0) {
			selectedQuestions = existingResponse.selectedQuestions.map(sq => sq.questionData);
		} else {
			if (survey.sourceType === SOURCE_TYPE.MANUAL) {
				selectedQuestions = survey.questions || [];
			} else if (survey.sourceType === SOURCE_TYPE.QUESTION_BANK) {
				const questionBank = await QuestionBank.findById(survey.questionBankId);
				if (!questionBank) {
					throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
				}
				
				// Separate required and optional questions
				const requiredQuestions = questionBank.questions.filter(q => q.isRequired);
				const optionalQuestions = questionBank.questions.filter(q => !q.isRequired);
				
				const maxQuestionCount = Math.min(
					survey.questionCount || questionBank.questions.length,
					questionBank.questions.length
				);
				
				// Always include all required questions
				selectedQuestions = [...requiredQuestions];
				
				// Fill remaining slots with optional questions if there's space
				const remainingSlots = Math.max(0, maxQuestionCount - requiredQuestions.length);
				if (remainingSlots > 0 && optionalQuestions.length > 0) {
					const shuffledOptional = optionalQuestions.sort(() => 0.5 - Math.random());
					selectedQuestions.push(...shuffledOptional.slice(0, remainingSlots));
				}
				
				// Shuffle the final question order
				selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());
			} else if (survey.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK) {
				if (
					!survey.multiQuestionBankConfig ||
					survey.multiQuestionBankConfig.length === 0
				) {
					throw new AppError(
						'Multi-question bank configuration not found',
						HTTP_STATUS.BAD_REQUEST
					);
				}
				for (const config of survey.multiQuestionBankConfig) {
					const questionBank = await QuestionBank.findById(config.questionBankId);
					if (!questionBank) {
						throw new AppError(
							`Question bank with ID ${config.questionBankId} not found`,
							HTTP_STATUS.NOT_FOUND
						);
					}
					let bankQuestions = [...questionBank.questions];
					
					// Apply filters
					if (config.filters) {
						if (config.filters.tags && config.filters.tags.length > 0) {
							bankQuestions = bankQuestions.filter(q =>
								config.filters.tags.some(tag => q.tags && q.tags.includes(tag))
							);
						}
						if (config.filters.difficulty) {
							bankQuestions = bankQuestions.filter(
								q => q.difficulty === config.filters.difficulty
							);
						}
						if (
							config.filters.questionTypes &&
							config.filters.questionTypes.length > 0
						) {
							bankQuestions = bankQuestions.filter(q =>
								config.filters.questionTypes.includes(q.type)
							);
						}
					}
					
					// Separate required and optional questions from this bank
					const requiredFromBank = bankQuestions.filter(q => q.isRequired);
					const optionalFromBank = bankQuestions.filter(q => !q.isRequired);
					
					// Always include required questions from this bank
					selectedQuestions.push(...requiredFromBank);
					
					// Fill remaining slots for this bank with optional questions
					const remainingSlotsForBank = Math.max(0, config.questionCount - requiredFromBank.length);
					if (remainingSlotsForBank > 0 && optionalFromBank.length > 0) {
						const shuffledOptional = optionalFromBank.sort(() => 0.5 - Math.random());
						const selectedOptional = shuffledOptional.slice(0, remainingSlotsForBank);
						selectedQuestions.push(...selectedOptional);
					}
				}
				// After pooling questions from all banks, shuffle globally so questions are interleaved
				// This ensures users see a mixed order rather than grouped by question bank
				selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());
			} else if (survey.sourceType === SOURCE_TYPE.MANUAL_SELECTION) {
				if (!survey.selectedQuestions || survey.selectedQuestions.length === 0) {
					throw new AppError(
						'No questions selected for this survey',
						HTTP_STATUS.BAD_REQUEST
					);
				}
				selectedQuestions = survey.selectedQuestions.map(
					selection =>
						selection.questionSnapshot || {
							text: 'Question data not available',
							type: 'single_choice',
							options: ['Option 1', 'Option 2'],
							correctAnswer: 0,
							points: 1,
						}
				);
			}

			// Create a response to lock in questions
			existingResponse = new Response({
				name,
				email,
				surveyId: survey._id,
				answers: new Map(),
				selectedQuestions: selectedQuestions.map((q, index) => ({
					originalQuestionId: q._id || `selected_${index}`,
					questionIndex: index,
					questionData: {
						text: q.text,
						description: q.description,
						type: q.type,
						descriptionImage: q.descriptionImage,
						options: q.options,
						correctAnswer: q.correctAnswer,
						explanation: q.explanation,
						points: q.points,
						tags: q.tags,
						difficulty: q.difficulty,
						isRequired: q.isRequired,
					},
				})),
				metadata: {
					userAgent: req.get('User-Agent'),
					ipAddress:
						(req.headers['x-forwarded-for']?.split(',')[0] || '').trim() ||
						req.ip ||
						req.connection?.remoteAddress,
					deviceType: (() => {
						const userAgent = (req.get('User-Agent') || '').toLowerCase();
						if (
							userAgent.includes('mobile') ||
							userAgent.includes('android') ||
							userAgent.includes('iphone')
						) {
							return 'mobile';
						} else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
							return 'tablet';
						} else if (
							userAgent.includes('windows') ||
							userAgent.includes('mac') ||
							userAgent.includes('linux')
						) {
							return 'desktop';
						}
						return 'unknown';
					})(),
				},
			});
			await existingResponse.save();
		}

		const masked = maskQuestions(selectedQuestions);
		// Ensure metadata exists on reused responses as well
		if (existingResponse) {
			existingResponse.metadata = {
				...(existingResponse.metadata || {}),
				userAgent: req.get('User-Agent'),
				ipAddress:
					(req.headers['x-forwarded-for']?.split(',')[0] || '').trim() ||
					req.ip ||
					req.connection?.remoteAddress,
				deviceType: (() => {
					const userAgent = (req.get('User-Agent') || '').toLowerCase();
					if (
						userAgent.includes('mobile') ||
						userAgent.includes('android') ||
						userAgent.includes('iphone')
					) {
						return 'mobile';
					} else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
						return 'tablet';
					} else if (
						userAgent.includes('windows') ||
						userAgent.includes('mac') ||
						userAgent.includes('linux')
					) {
						return 'desktop';
					}
					return 'unknown';
				})(),
			};
			await existingResponse.save();
		}
		res.json({
			responseId: existingResponse._id,
			questions: masked,
			totalQuestions: masked.length,
		});
	})
);

// POST /assessment/:slug/submit - evaluate answers server-side
router.post(
	'/assessment/:slug/submit',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;
		const {
			responseId,
			answers = [],
			timeSpent = 0,
			answerDurations = {},
			isAutoSubmit = false,
		} = req.body || {};

		if (!responseId) {
			throw new AppError('Missing responseId', HTTP_STATUS.BAD_REQUEST);
		}

		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE });
		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE });
		}
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		if (survey.type !== SURVEY_TYPE.ASSESSMENT) {
			throw new AppError('Not an assessment', HTTP_STATUS.BAD_REQUEST);
		}

		const responseDoc = await Response.findById(responseId);
		if (!responseDoc) {
			throw new AppError('Response not found', HTTP_STATUS.NOT_FOUND);
		}

		const questions = (responseDoc.selectedQuestions || []).map(sq => sq.questionData);

		// Build snapshots with scoring
		const questionSnapshots = questions.map((question, index) => {
			const userAnswer = Array.isArray(answers) ? answers[index] : answers?.[index];
			const duration = answerDurations?.[index] || 0;

			let isCorrect = false;
			let pointsAwarded = 0;
			const maxPoints = question.points || 1;

			if (question.correctAnswer !== undefined && userAnswer !== undefined) {
				if (question.type === 'single_choice') {
					const options = Array.isArray(question.options) ? question.options : [];
					const userOptionIndex = options.findIndex(opt =>
						typeof opt === 'string' ? opt === userAnswer : opt?.text === userAnswer
					);
					isCorrect = userOptionIndex === question.correctAnswer;
				} else if (
					question.type === 'multiple_choice' &&
					Array.isArray(userAnswer) &&
					Array.isArray(question.correctAnswer)
				) {
					const options = Array.isArray(question.options) ? question.options : [];
					const userOptionIndices = userAnswer
						.map(ans =>
							options.findIndex(opt =>
								typeof opt === 'string' ? opt === ans : opt?.text === ans
							)
						)
						.filter(idx => idx !== -1);
					const correctIndices = question.correctAnswer;
					isCorrect =
						userOptionIndices.length === correctIndices.length &&
						userOptionIndices.every(idx => correctIndices.includes(idx));
				} else if (question.type === 'short_text') {
					isCorrect = String(userAnswer).trim() === String(question.correctAnswer).trim();
				}

				if (isCorrect) pointsAwarded = maxPoints;
			}

			// Ensure options are stored as array of strings to satisfy schema
			const optionTexts = Array.isArray(question.options)
				? question.options.map(opt => (typeof opt === 'string' ? opt : opt?.text || ''))
				: [];

			return {
				questionId: questions[index]?._id,
				questionIndex: index,
				questionData: {
					text: question.text,
					description: question.description || '',
					type: question.type,
					options: optionTexts,
					correctAnswer: question.correctAnswer,
					explanation: question.explanation || '',
					points: question.points || 1,
					tags: question.tags || [],
					difficulty: question.difficulty || 'medium',
					isRequired: question.isRequired || false,
				},
				userAnswer: userAnswer ?? null,
				scoring: {
					isCorrect,
					pointsAwarded,
					maxPoints,
				},
				durationInSeconds: duration,
			};
		});

		const totalPoints = questionSnapshots.reduce((sum, q) => sum + q.scoring.pointsAwarded, 0);
		const maxPossiblePoints = questionSnapshots.reduce(
			(sum, q) => sum + q.scoring.maxPoints,
			0
		);
		const correctAnswers = questionSnapshots.filter(q => q.scoring.isCorrect).length;
		const wrongAnswers = questionSnapshots.length - correctAnswers;
		const percentage =
			maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;

		// Persist on response
		responseDoc.answers = new Map(
			questionSnapshots.map((snap, idx) => [String(idx), snap.userAnswer])
		);
		responseDoc.questionSnapshots = questionSnapshots;
		responseDoc.timeSpent = timeSpent;
		responseDoc.isAutoSubmit = Boolean(isAutoSubmit);
		const userAgent = req.get('User-Agent') || '';
		const detectDeviceType = ua => {
			const userAgent = ua.toLowerCase();
			if (
				userAgent.includes('mobile') ||
				userAgent.includes('android') ||
				userAgent.includes('iphone')
			) {
				return 'mobile';
			} else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
				return 'tablet';
			} else if (
				userAgent.includes('windows') ||
				userAgent.includes('mac') ||
				userAgent.includes('linux')
			) {
				return 'desktop';
			}
			return 'unknown';
		};

		responseDoc.metadata = {
			...(responseDoc.metadata || {}),
			userAgent: userAgent,
			ipAddress:
				(req.headers['x-forwarded-for']?.split(',')[0] || '').trim() ||
				req.ip ||
				req.connection?.remoteAddress,
			deviceType: detectDeviceType(userAgent),
		};
		responseDoc.score = {
			totalPoints,
			correctAnswers,
			wrongAnswers,
			percentage,
			passed: percentage >= (survey.passingThreshold || 70),
			scoringMode: 'percentage',
			maxPossiblePoints,
			displayScore: percentage,
			scoringDetails: {
				questionScores: questionSnapshots.map(q => ({
					questionIndex: q.questionIndex,
					pointsAwarded: q.scoring.pointsAwarded,
					maxPoints: q.scoring.maxPoints,
					isCorrect: q.scoring.isCorrect,
				})),
			},
		};
		await responseDoc.save();

		// Prepare client-safe result
		const allowBreakdown = survey.scoringSettings?.showScoreBreakdown !== false;
		const allowCorrect = survey.scoringSettings?.showCorrectAnswers === true;
		const questionResults = allowBreakdown
			? questionSnapshots.map(snap => ({
				questionId: snap.questionId,
				questionText: snap.questionData.text,
				questionDescription: snap.questionData.description || '',
				userAnswer: Array.isArray(snap.userAnswer)
					? snap.userAnswer.join(', ')
					: (snap.userAnswer ?? ''),
				correctAnswer: allowCorrect
					? (() => {
						const q = snap.questionData;
						if (
							q.type === 'single_choice' &&
									typeof q.correctAnswer === 'number'
						) {
							const opt = q.options?.[q.correctAnswer];
							return typeof opt === 'string' ? opt : opt?.text || '';
						}
						if (
							q.type === 'multiple_choice' &&
									Array.isArray(q.correctAnswer)
						) {
							return q.correctAnswer
								.map(idx => {
									const opt = q.options?.[idx];
									return typeof opt === 'string' ? opt : opt?.text || '';
								})
								.join(', ');
						}
						return String(q.correctAnswer ?? '');
					})()
					: '',
				isCorrect: snap.scoring.isCorrect,
				pointsAwarded: snap.scoring.pointsAwarded,
				maxPoints: snap.scoring.maxPoints,
				descriptionImage: snap.questionData.descriptionImage || null,
			}))
			: [];

		res.json({
			success: true,
			score: {
				totalPoints,
				maxPossiblePoints,
				percentage,
				correctAnswers,
				wrongAnswers,
				passed: responseDoc.score.passed,
				scoringMode: 'percentage',
				displayScore: percentage,
				scoringDescription: survey.scoringDescription || '',
			},
			questionResults,
		});
	})
);

module.exports = router;
