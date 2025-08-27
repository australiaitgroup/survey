const express = require('express');
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
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

// Helper function to mask questions (reused from assessments)
function maskQuestions(questions) {
	return (questions || []).map(q => {
		const { correctAnswer, explanation, ...rest } = q.toObject ? q.toObject() : q;
		return rest;
	});
}

// Helper function to check if answer is correct (reused from assessments)
function checkAnswer(question, userAnswer) {
	if (!question.correctAnswer) return false;

	if (question.type === 'single_choice') {
		return parseInt(userAnswer) === question.correctAnswer;
	} else if (question.type === 'multiple_choice') {
		const userAnswers = Array.isArray(userAnswer)
			? userAnswer.map(a => parseInt(a))
			: [parseInt(userAnswer)];
		const correctAnswers = Array.isArray(question.correctAnswer)
			? question.correctAnswer
			: [question.correctAnswer];
		return (
			userAnswers.length === correctAnswers.length &&
			userAnswers.every(a => correctAnswers.includes(a))
		);
	} else if (question.type === 'short_text') {
		return question.correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
	}

	return false;
}

// Helper function to get available hints based on attempt number
function getAvailableHints(question, attemptNumber) {
	if (!question.onboarding?.hints) return [];

	return question.onboarding.hints
		.filter(hint => attemptNumber >= hint.showAfterAttempts)
		.sort((a, b) => a.order - b.order);
}

// Employee Training specific endpoints
// GET /onboarding/:slug/employee-training/progress
router.get(
	'/:slug/employee-training/progress',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;
		const { employeeId } = req.query;

		if (!employeeId) {
			throw new AppError('Employee ID is required', 400);
		}

		// 查找对应的 onboarding survey
		let survey = await Survey.findOne({
			slug,
			status: SURVEY_STATUS.ACTIVE,
			type: SURVEY_TYPE.ONBOARDING,
		}).populate('questions');

		if (!survey) {
			throw new AppError('Training template not found', 404);
		}

		// TODO: 从 EmployeeProgress 模型获取实际进度
		// 现在返回默认状态
		res.json({
			status: 'not_started',
			template: survey,
			currentSection: null,
			currentQuestion: 0,
			answers: {},
			attempts: {},
			completedSections: [],
			startedAt: null,
		});
	})
);

// POST /onboarding/:slug/employee-training/start
router.post(
	'/:slug/employee-training/start',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;
		const { employeeId, name, email } = req.body;

		if (!employeeId || !name || !email) {
			throw new AppError('Employee ID, name, and email are required', 400);
		}

		// 查找对应的 onboarding survey
		let survey = await Survey.findOne({
			slug,
			status: SURVEY_STATUS.ACTIVE,
			type: SURVEY_TYPE.ONBOARDING,
		}).populate('questions');

		if (!survey) {
			throw new AppError('Training template not found', 404);
		}

		// TODO: 创建或更新 EmployeeProgress 记录
		// 现在直接返回模板数据
		res.json({
			success: true,
			template: survey,
			message: 'Training started successfully',
		});
	})
);

// GET /onboarding/:slug - metadata only (no questions) - REUSED from assessments
router.get(
	'/:slug',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;

		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE }).lean();
		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE }).lean();
		}
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

		// Ensure it is an onboarding-type survey
		if (survey.type !== SURVEY_TYPE.ONBOARDING) {
			throw new AppError('Not an onboarding survey', HTTP_STATUS.BAD_REQUEST);
		}

		// Never include questions in this metadata response
		survey.questions = [];
		res.json(survey);
	})
);

// POST /onboarding/:slug/start - lock questions and return masked list - REUSED from assessments
router.post(
	'/:slug/start',
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
		if (survey.type !== SURVEY_TYPE.ONBOARDING) {
			throw new AppError('Not an onboarding survey', HTTP_STATUS.BAD_REQUEST);
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
				// Handle question bank logic (reused from assessments)
				const QuestionBank = require('../models/QuestionBank');
				const questionBank = await QuestionBank.findById(survey.questionBankId);
				if (!questionBank) {
					throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
				}
				const questionCount = Math.min(
					survey.questionCount || questionBank.questions.length,
					questionBank.questions.length
				);
				const shuffled = [...questionBank.questions].sort(() => 0.5 - Math.random());
				selectedQuestions = shuffled.slice(0, questionCount);
			}
		}

		// Create or update response
		const responseData = {
			surveyId: survey._id,
			email,
			name,
			attempt: attempt ? parseInt(attempt) : 1,
			startedAt: new Date(),
			selectedQuestions: selectedQuestions.map(q => ({
				questionId: q._id || q.id,
				questionData: q,
			})),
			// Onboarding-specific fields
			onboardingProgress: {
				currentSection: 0,
				completedSections: [],
				learningPath: survey.onboardingSettings?.learningPath || {},
				timeTracking: {
					startedAt: new Date(),
					sectionTimes: [],
				},
			},
		};

		let response;
		if (existingResponse) {
			response = await Response.findByIdAndUpdate(existingResponse._id, responseData, {
				new: true,
			});
		} else {
			response = await Response.create(responseData);
		}

		// Return masked questions (reused from assessments)
		const maskedQuestions = maskQuestions(selectedQuestions);

		res.json({
			responseId: response._id,
			questions: maskedQuestions,
			onboardingSettings: survey.onboardingSettings,
			scoringSettings: survey.scoringSettings,
			timeLimit: survey.timeLimit,
			maxAttempts: survey.maxAttempts,
		});
	})
);

// POST /onboarding/:slug/submit-answer - submit individual answer - REUSED from assessments
router.post(
	'/:slug/submit-answer',
	asyncHandler(async (req, res) => {
		const { responseId, questionId, answer, attemptNumber = 1 } = req.body;

		if (!responseId || !questionId || answer === undefined) {
			throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
		}

		const response = await Response.findById(responseId);
		if (!response) {
			throw new AppError('Response not found', HTTP_STATUS.NOT_FOUND);
		}

		const survey = await Survey.findById(response.surveyId);
		if (!survey || survey.type !== SURVEY_TYPE.ONBOARDING) {
			throw new AppError('Invalid survey', HTTP_STATUS.BAD_REQUEST);
		}

		// Find the question
		const question = response.selectedQuestions.find(
			sq => sq.questionId.toString() === questionId.toString()
		)?.questionData;

		if (!question) {
			throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND);
		}

		// Check if answer is correct (reused from assessments)
		const isCorrect = checkAnswer(question, answer);

		// Get available hints for this attempt
		const availableHints = getAvailableHints(question, attemptNumber);

		// Create question attempt record
		const questionAttempt = {
			questionId,
			answer,
			isCorrect,
			attemptNumber,
			timestamp: new Date(),
			hintsUsed: [], // Will be populated when hints are shown
		};

		// Add to response if not exists
		if (!response.questionAttempts) {
			response.questionAttempts = [];
		}
		response.questionAttempts.push(questionAttempt);

		// Update onboarding progress
		if (response.onboardingProgress) {
			response.onboardingProgress.lastActivity = new Date();
		}

		await response.save();

		res.json({
			isCorrect,
			availableHints,
			explanation: isCorrect ? question.explanation : null,
			learningContext: question.onboarding?.learningContext || null,
			learningResources: question.onboarding?.learningResources || [],
			canProceed: isCorrect || attemptNumber >= (question.onboarding?.maxAttempts || 3),
		});
	})
);

// POST /onboarding/:slug/complete-section - complete a learning section
router.post(
	'/:slug/complete-section',
	asyncHandler(async (req, res) => {
		const { responseId, sectionIndex, timeSpent } = req.body;

		if (!responseId || sectionIndex === undefined) {
			throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
		}

		const response = await Response.findById(responseId);
		if (!response) {
			throw new AppError('Response not found', HTTP_STATUS.NOT_FOUND);
		}

		// Update onboarding progress
		if (!response.onboardingProgress) {
			response.onboardingProgress = {};
		}

		// Mark section as completed
		if (!response.onboardingProgress.completedSections) {
			response.onboardingProgress.completedSections = [];
		}

		if (!response.onboardingProgress.completedSections.includes(sectionIndex)) {
			response.onboardingProgress.completedSections.push(sectionIndex);
		}

		// Update current section
		response.onboardingProgress.currentSection = Math.max(
			response.onboardingProgress.currentSection,
			sectionIndex + 1
		);

		// Track time spent
		if (timeSpent && response.onboardingProgress.timeTracking) {
			if (!response.onboardingProgress.timeTracking.sectionTimes) {
				response.onboardingProgress.timeTracking.sectionTimes = [];
			}
			response.onboardingProgress.timeTracking.sectionTimes[sectionIndex] = timeSpent;
		}

		await response.save();

		res.json({
			message: 'Section completed successfully',
			progress: response.onboardingProgress,
		});
	})
);

// GET /onboarding/:slug/learning-resources - get learning resources for a question
router.get(
	'/:slug/learning-resources/:questionId',
	asyncHandler(async (req, res) => {
		const { responseId } = req.query;
		const { questionId } = req.params;

		if (!responseId) {
			throw new AppError('Response ID required', HTTP_STATUS.BAD_REQUEST);
		}

		const response = await Response.findById(responseId);
		if (!response) {
			throw new AppError('Response not found', HTTP_STATUS.NOT_FOUND);
		}

		const question = response.selectedQuestions.find(
			sq => sq.questionId.toString() === questionId.toString()
		)?.questionData;

		if (!question) {
			throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND);
		}

		res.json({
			learningContext: question.onboarding?.learningContext || null,
			learningResources: question.onboarding?.learningResources || [],
			hints: question.onboarding?.hints || [],
		});
	})
);

// POST /onboarding/:slug/complete - complete the entire onboarding - REUSED from assessments
router.post(
	'/:slug/complete',
	asyncHandler(async (req, res) => {
		const { responseId } = req.body;

		if (!responseId) {
			throw new AppError('Response ID required', HTTP_STATUS.BAD_REQUEST);
		}

		const response = await Response.findById(responseId);
		if (!response) {
			throw new AppError('Response not found', HTTP_STATUS.NOT_FOUND);
		}

		const survey = await Survey.findById(response.surveyId);
		if (!survey || survey.type !== SURVEY_TYPE.ONBOARDING) {
			throw new AppError('Invalid survey', HTTP_STATUS.BAD_REQUEST);
		}

		// Calculate final score (reused from assessment logic)
		let totalScore = 0;
		let correctAnswers = 0;
		let totalQuestions = response.selectedQuestions.length;

		response.questionAttempts?.forEach(attempt => {
			if (attempt.isCorrect) {
				correctAnswers++;
				// Get question points
				const question = response.selectedQuestions.find(
					sq => sq.questionId.toString() === attempt.questionId.toString()
				)?.questionData;
				totalScore += question?.points || 1;
			}
		});

		const percentageScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
		const isPassing = percentageScore >= (survey.scoringSettings?.passingThreshold || 60);

		// Update response
		response.completedAt = new Date();
		response.score = totalScore;
		response.percentageScore = percentageScore;
		response.isPassing = isPassing;
		response.status = 'completed';

		// Update onboarding progress
		if (response.onboardingProgress) {
			response.onboardingProgress.completedAt = new Date();
			response.onboardingProgress.finalScore = percentageScore;
			response.onboardingProgress.isCompliant = isPassing;
		}

		await response.save();

		res.json({
			message: 'Onboarding completed successfully',
			score: totalScore,
			percentageScore,
			isPassing,
			completionTime: response.completedAt,
			onboardingProgress: response.onboardingProgress,
		});
	})
);

// GET /onboarding/:slug/progress - get user's onboarding progress
router.get(
	'/:slug/progress',
	asyncHandler(async (req, res) => {
		const { email, attempt } = req.query;

		if (!email) {
			throw new AppError('Email required', HTTP_STATUS.BAD_REQUEST);
		}

		const survey = await Survey.findOne({ slug: req.params.slug });
		if (!survey || survey.type !== SURVEY_TYPE.ONBOARDING) {
			throw new AppError('Survey not found', HTTP_STATUS.NOT_FOUND);
		}

		const query = {
			surveyId: survey._id,
			email,
		};

		if (attempt) {
			query.attempt = parseInt(attempt);
		}

		const responses = await Response.find(query).sort({ createdAt: -1 });

		res.json({
			responses: responses.map(r => ({
				id: r._id,
				attempt: r.attempt,
				startedAt: r.startedAt,
				completedAt: r.completedAt,
				status: r.status,
				score: r.score,
				percentageScore: r.percentageScore,
				isPassing: r.isPassing,
				onboardingProgress: r.onboardingProgress,
			})),
		});
	})
);

// GET /onboarding/:slug/stats - get company-wide onboarding statistics
router.get(
	'/:slug/stats',
	asyncHandler(async (req, res) => {
		const survey = await Survey.findOne({ slug: req.params.slug });
		if (!survey || survey.type !== SURVEY_TYPE.ONBOARDING) {
			throw new AppError('Survey not found', HTTP_STATUS.NOT_FOUND);
		}

		const stats = await Response.aggregate([
			{ $match: { surveyId: survey._id } },
			{
				$group: {
					_id: null,
					totalResponses: { $sum: 1 },
					completedResponses: {
						$sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
					},
					averageScore: { $avg: '$percentageScore' },
					passingRate: {
						$avg: { $cond: ['$isPassing', 1, 0] },
					},
					averageCompletionTime: {
						$avg: {
							$subtract: ['$completedAt', '$startedAt'],
						},
					},
				},
			},
		]);

		res.json({
			surveyId: survey._id,
			stats: stats[0] || {
				totalResponses: 0,
				completedResponses: 0,
				averageScore: 0,
				passingRate: 0,
				averageCompletionTime: 0,
			},
		});
	})
);

module.exports = router;
