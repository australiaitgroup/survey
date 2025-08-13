const {
	surveyResponseSchema,
	surveyCreateSchema,
	surveyUpdateSchema,
} = require('../schemas/surveySchemas');
const {
	saveSurveyResponse,
	getSurveyResponses,
	getSurveyStatistics,
} = require('../services/surveyService');
const SurveyModel = require('../models/Survey');
const QuestionBankModel = require('../models/QuestionBank');
const { HTTP_STATUS, ERROR_MESSAGES, SOURCE_TYPE } = require('../shared/constants');

async function submitSurveyResponse(req, res) {
	try {
		// Add metadata to the request body
		const requestData = {
			...req.body,
			surveyId: req.params.surveyId,
			metadata: {
				userAgent: req.get('User-Agent'),
				ipAddress: req.ip || req.connection.remoteAddress,
				deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
			},
		};

		const data = surveyResponseSchema.parse(requestData);
		const saved = await saveSurveyResponse(data);

		// For assessments, include scoring data in response
		let responseData = saved;
		if (saved && saved.score && saved.questionSnapshots) {
			responseData = {
				...saved,
				scoring: saved.score,
				questionSnapshots: saved.questionSnapshots,
			};
		}

		res.status(HTTP_STATUS.CREATED).json({
			success: true,
			data: responseData,
			message: 'Response submitted successfully',
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

// Helper function to validate and process multi-question bank configurations
async function processMultiQuestionBankConfig(config) {
	for (const bankConfig of config) {
		const questionBank = await QuestionBankModel.findById(bankConfig.questionBankId);
		if (!questionBank) {
			throw new Error(`Question bank with ID ${bankConfig.questionBankId} not found`);
		}

		// Validate that there are enough questions available
		let availableQuestions = questionBank.questions;

		// Apply filters if provided
		if (bankConfig.filters) {
			if (bankConfig.filters.tags && bankConfig.filters.tags.length > 0) {
				availableQuestions = availableQuestions.filter(q =>
					bankConfig.filters.tags.some(tag => q.tags.includes(tag))
				);
			}

			if (bankConfig.filters.difficulty) {
				availableQuestions = availableQuestions.filter(
					q => q.difficulty === bankConfig.filters.difficulty
				);
			}

			if (bankConfig.filters.questionTypes && bankConfig.filters.questionTypes.length > 0) {
				availableQuestions = availableQuestions.filter(q =>
					bankConfig.filters.questionTypes.includes(q.type)
				);
			}
		}

		if (availableQuestions.length < bankConfig.questionCount) {
			throw new Error(
				`Question bank "${questionBank.name}" only has ${availableQuestions.length} questions matching the filters, but ${bankConfig.questionCount} were requested`
			);
		}
	}
}

// Helper function to validate manual selection questions
async function processSelectedQuestions(selectedQuestions) {
	for (const selection of selectedQuestions) {
		const questionBank = await QuestionBankModel.findById(selection.questionBankId);
		if (!questionBank) {
			throw new Error(`Question bank with ID ${selection.questionBankId} not found`);
		}

		const question = questionBank.questions.id(selection.questionId);
		if (!question) {
			throw new Error(
				`Question with ID ${selection.questionId} not found in question bank "${questionBank.name}"`
			);
		}

		// Create question snapshot if not provided
		if (!selection.questionSnapshot) {
			selection.questionSnapshot = {
				text: question.text,
				type: question.type,
				options: question.options,
				correctAnswer: question.correctAnswer,
				explanation: question.explanation,
				points: question.points,
				tags: question.tags,
				difficulty: question.difficulty,
			};
		}
	}
}

async function createSurvey(req, res) {
	try {
		const data = surveyCreateSchema.parse(req.body);

		// Validate and process different source types
		if (data.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK && data.multiQuestionBankConfig) {
			await processMultiQuestionBankConfig(data.multiQuestionBankConfig);
		} else if (data.sourceType === SOURCE_TYPE.MANUAL_SELECTION && data.selectedQuestions) {
			await processSelectedQuestions(data.selectedQuestions);
		} else if (data.sourceType === SOURCE_TYPE.QUESTION_BANK && data.questionBankId) {
			// Validate single question bank
			const questionBank = await QuestionBankModel.findById(data.questionBankId);
			if (!questionBank) {
				throw new Error('Question bank not found');
			}
			if (questionBank.questions.length < data.questionCount) {
				throw new Error(
					`Question bank only has ${questionBank.questions.length} questions, but ${data.questionCount} were requested`
				);
			}
		}

		// Generate slug after schema validation
		// Check for both falsy values and empty strings
		if (data.title && (!data.slug || data.slug.trim() === '')) {
			data.slug = await SurveyModel.generateSlug(data.title);
		}

		// Add createdBy field from authenticated user
		data.createdBy = req.user.id;

		const survey = new SurveyModel(data);
		await survey.save();

		res.status(HTTP_STATUS.CREATED).json({
			success: true,
			data: survey.toObject(),
			message: 'Survey created successfully',
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function updateSurvey(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const data = surveyUpdateSchema.parse(req.body);

		const survey = await SurveyModel.findByIdAndUpdate(surveyId, data, {
			new: true,
			runValidators: true,
		});

		if (!survey) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				error: ERROR_MESSAGES.SURVEY_NOT_FOUND,
			});
		}

		res.json({
			success: true,
			data: survey.toObject(),
			message: 'Survey updated successfully',
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function getSurvey(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const survey = await SurveyModel.findById(surveyId);

		if (!survey) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				error: ERROR_MESSAGES.SURVEY_NOT_FOUND,
			});
		}

		// Don't expose correct answers to survey takers
		const surveyData = survey.toObject();
		if (!req.query.includeAnswers) {
			surveyData.questions.forEach(question => {
				delete question.correctAnswer;
				delete question.explanation;
			});
		}

		res.json({
			success: true,
			data: surveyData,
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function getSurveyResponsesController(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const includeScores = req.query.includeScores === 'true';

		const responses = await getSurveyResponses(surveyId, includeScores);

		res.json({
			success: true,
			data: responses,
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function getSurveyStatisticsController(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const statistics = await getSurveyStatistics(surveyId);

		res.json({
			success: true,
			data: statistics,
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

module.exports = {
	submitSurveyResponse,
	createSurvey,
	updateSurvey,
	getSurvey,
	getSurveyResponsesController,
	getSurveyStatisticsController,
};
