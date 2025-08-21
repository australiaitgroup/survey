const express = require('express');
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const QuestionBank = require('../models/QuestionBank');
const Response = require('../models/Response');
const User = require('../models/User');
const Company = require('../models/Company');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const {
	ERROR_MESSAGES,
	SURVEY_STATUS,
	SOURCE_TYPE,
	HTTP_STATUS,
	VALID_STATUSES,
} = require('../shared/constants');

const router = express.Router();

// Public list of all active surveys
router.get(
	'/surveys',
	asyncHandler(async (req, res) => {
		const surveys = await Survey.find({
			status: SURVEY_STATUS.ACTIVE,
			isPublic: true,
		})
			.select('title description slug createdAt status type')
			.lean();

		// Get company information from admin user
		let companyInfo = null;
		try {
			const adminUser = await User.findOne({ role: 'admin' }).populate('companyId');
			if (adminUser && adminUser.companyId) {
				companyInfo = {
					name: adminUser.companyId.name,
					logoUrl: adminUser.companyId.logoUrl,
					industry: adminUser.companyId.industry,
					website: adminUser.companyId.website,
					description: adminUser.companyId.description,
				};
			}
		} catch (error) {
			console.error('Error fetching company info:', error);
			// Continue without company info if there's an error
		}

		// Add company information to each survey
		const surveysWithCompany = surveys.map(survey => ({
			...survey,
			company: companyInfo,
		}));

		res.json(surveysWithCompany);
	})
);

// Fetch a single survey by id
router.get(
	'/surveys/:id',
	asyncHandler(async (req, res) => {
		const survey = await Survey.findById(req.params.id).lean();
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

		// Get company information from admin user
		let companyInfo = null;
		try {
			const adminUser = await User.findOne({ role: 'admin' }).populate('companyId');
			if (adminUser && adminUser.companyId) {
				companyInfo = {
					name: adminUser.companyId.name,
					logoUrl: adminUser.companyId.logoUrl,
					industry: adminUser.companyId.industry,
					website: adminUser.companyId.website,
					description: adminUser.companyId.description,
				};
			}
		} catch (error) {
			console.error('Error fetching company info:', error);
			// Continue without company info if there's an error
		}

		// Add company information to survey response
		if (companyInfo) {
			survey.company = companyInfo;
		}

		res.json(survey);
	})
);

// Fetch a single survey by slug (for public access)
router.get(
	'/survey/:slug',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;

		// Try to find by slug first
		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE }).lean();

		// If not found by slug, try to find by ID (fallback for old links)
		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE }).lean();
		}

		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

		// Get company information from admin user
		let companyInfo = null;
		try {
			const adminUser = await User.findOne({ role: 'admin' }).populate('companyId');
			if (adminUser && adminUser.companyId) {
				companyInfo = {
					name: adminUser.companyId.name,
					logoUrl: adminUser.companyId.logoUrl,
					industry: adminUser.companyId.industry,
					website: adminUser.companyId.website,
					description: adminUser.companyId.description,
				};
			}
		} catch (error) {
			console.error('Error fetching company info:', error);
			// Continue without company info if there's an error
		}

		// Add company information to survey response
		if (companyInfo) {
			survey.company = companyInfo;
		}

		// For non-survey types (assessment/live_quiz), never include questions in initial response
		// This prevents leaking correct answers or content prior to start
		if (survey.type && survey.type !== 'survey') {
			survey.questions = [];
		} else if (
			[
				SOURCE_TYPE.QUESTION_BANK,
				SOURCE_TYPE.MULTI_QUESTION_BANK,
				SOURCE_TYPE.MANUAL_SELECTION,
			].includes(survey.sourceType)
		) {
			// For regular survey type but bank-based sources, also avoid pre-sending questions
			survey.questions = [];
		}

		res.json(survey);
	})
);

// Get questions for a survey (handles both manual and question bank modes)
router.get(
	'/survey/:slug/questions',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;
		const { email, attempt } = req.query;

		// Find the survey
		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE });

		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE });
		}

		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

		// Only allow this endpoint for regular survey type
		if (survey.type && survey.type !== 'survey') {
			throw new AppError('Use assessment endpoints for this survey', HTTP_STATUS.FORBIDDEN);
		}

		let questions = [];

		if (survey.sourceType === SOURCE_TYPE.MANUAL) {
			// For manual surveys, return the questions directly
			questions = survey.questions;
		} else if (
			[
				SOURCE_TYPE.QUESTION_BANK,
				SOURCE_TYPE.MULTI_QUESTION_BANK,
				SOURCE_TYPE.MANUAL_SELECTION,
			].includes(survey.sourceType)
		) {
			// For all question bank-based surveys, check if user has already started

			// Check if user has already started this survey
			const existingResponse = await Response.findOne({
				surveyId: survey._id,
				email: email,
				// If multiple attempts are allowed, find the specific attempt
				...(attempt && { attempt: parseInt(attempt) }),
			});

			if (existingResponse && existingResponse.selectedQuestions.length > 0) {
				// User has already started, use their selected questions
				questions = existingResponse.selectedQuestions.map(sq => sq.questionData);
			} else {
				// New attempt - select questions based on source type
				let selectedQuestions = [];

				if (survey.sourceType === SOURCE_TYPE.QUESTION_BANK) {
					// Single question bank random selection
					const questionBank = await QuestionBank.findById(survey.questionBankId);

					if (!questionBank) {
						throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
					}

					// Randomly select questions
					const questionCount = Math.min(
						survey.questionCount || questionBank.questions.length,
						questionBank.questions.length
					);
					const shuffled = [...questionBank.questions].sort(() => 0.5 - Math.random());
					selectedQuestions = shuffled.slice(0, questionCount);
				} else if (survey.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK) {
					// Multi-question bank configured selection
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

						// Randomly select from filtered questions
						const shuffled = bankQuestions.sort(() => 0.5 - Math.random());
						const selected = shuffled.slice(
							0,
							Math.min(config.questionCount, shuffled.length)
						);
						selectedQuestions.push(...selected);
					}
				} else if (survey.sourceType === SOURCE_TYPE.MANUAL_SELECTION) {
					// Manual question selection - use pre-selected questions
					if (!survey.selectedQuestions || survey.selectedQuestions.length === 0) {
						throw new AppError(
							'No questions selected for this survey',
							HTTP_STATUS.BAD_REQUEST
						);
					}

					// Load the actual question data from snapshots
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

				questions = selectedQuestions;

				// If email is provided, create a response record to lock in the selected questions
				if (email && selectedQuestions.length > 0) {
					const response = new Response({
						name: 'User', // Will be updated when they submit
						email: email,
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
							},
						})),
					});

					await response.save();
				}
			}
		}

		res.json({
			questions,
			totalQuestions: questions.length,
			sourceType: survey.sourceType,
		});
	})
);

// Create a new survey
router.post(
	'/surveys',
	asyncHandler(async (req, res) => {
		const survey = new Survey(req.body);
		await survey.save();
		res.status(HTTP_STATUS.CREATED).json(survey);
	})
);

// Update a survey
router.put(
	'/surveys/:id',
	asyncHandler(async (req, res) => {
		const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		res.json(survey);
	})
);

// Delete a survey
router.delete(
	'/surveys/:id',
	asyncHandler(async (req, res) => {
		const survey = await Survey.findByIdAndDelete(req.params.id);
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		res.json({ message: 'Survey deleted successfully' });
	})
);

// Update survey status
router.patch(
	'/surveys/:id/status',
	asyncHandler(async (req, res) => {
		const { status } = req.body;

		// Validate status value
		if (!status || !VALID_STATUSES.includes(status)) {
			throw new AppError(ERROR_MESSAGES.INVALID_STATUS, HTTP_STATUS.BAD_REQUEST);
		}

		const survey = await Survey.findByIdAndUpdate(req.params.id, { status }, { new: true });

		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		res.json(survey);
	})
);

module.exports = router;
