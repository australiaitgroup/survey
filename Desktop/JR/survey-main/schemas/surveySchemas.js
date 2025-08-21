const { z } = require('zod');
const {
	SURVEY_TYPE,
	QUESTION_TYPE,
	SOURCE_TYPE,
	TYPES_REQUIRING_ANSWERS,
	VALID_SOURCE_TYPES,
} = require('../shared/constants');

// Question schema
const questionSchema = z
	.object({
		text: z.string().min(1, 'Question text is required'),
		type: z.enum([
			QUESTION_TYPE.SINGLE_CHOICE,
			QUESTION_TYPE.MULTIPLE_CHOICE,
			QUESTION_TYPE.SHORT_TEXT,
		]),
		options: z.array(z.string()).min(2, 'At least 2 options are required').optional(),
		correctAnswer: z
			.union([
				z.number().int().min(0), // For single choice
				z.array(z.number().int().min(0)), // For multiple choice
				z.string(), // For short text
				z.null(), // For survey questions
			])
			.optional(),
		explanation: z.string().optional(),
		points: z.number().positive().optional().default(1),
	})
	.refine(
		data => {
			// For choice-based questions, options are required
			if (data.type !== QUESTION_TYPE.SHORT_TEXT) {
				return data.options && Array.isArray(data.options) && data.options.length >= 2;
			}
			return true;
		},
		{
			message: 'At least 2 options are required for choice questions',
			path: ['options'],
		}
	);

// Multi-question bank configuration schema
const multiQuestionBankConfigSchema = z.object({
	questionBankId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question bank ID'),
	questionCount: z.number().positive('Question count must be positive'),
	filters: z
		.object({
			tags: z.array(z.string()).optional(),
			difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
			questionTypes: z
				.array(
					z.enum([
						QUESTION_TYPE.SINGLE_CHOICE,
						QUESTION_TYPE.MULTIPLE_CHOICE,
						QUESTION_TYPE.SHORT_TEXT,
					])
				)
				.optional(),
		})
		.optional(),
});

// Selected question schema for manual selection
const selectedQuestionSchema = z.object({
	questionBankId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question bank ID'),
	questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID'),
	questionSnapshot: z
		.object({
			text: z.string(),
			type: z.string(),
			options: z.array(z.string()).optional(),
			correctAnswer: z
				.union([z.number(), z.array(z.number()), z.string(), z.null()])
				.optional(),
			explanation: z.string().optional(),
			points: z.number().optional(),
			tags: z.array(z.string()).optional(),
			difficulty: z.string().optional(),
		})
		.optional(),
});

// Survey creation schema
const surveyCreateSchema = z
	.object({
		title: z.string().min(1, 'Title is required'),
		description: z.string().optional(),
		type: z.enum([
			SURVEY_TYPE.SURVEY,
			SURVEY_TYPE.ASSESSMENT,
			SURVEY_TYPE.ONBOARDING,
			SURVEY_TYPE.LIVE_QUIZ,
		]),
		timeLimit: z.number().positive().optional(), // in minutes
		maxAttempts: z.number().positive().default(1),
		instructions: z.string().optional(),
		navigationMode: z
			.enum(['step-by-step', 'paginated', 'all-in-one', 'one-question-per-page'])
			.default('step-by-step'),
		sourceType: z.enum(VALID_SOURCE_TYPES).default(SOURCE_TYPE.MANUAL).optional(),
		questionBankId: z.string().min(1).optional(),
		questionCount: z.number().positive().optional(),
		multiQuestionBankConfig: z.array(multiQuestionBankConfigSchema).optional(),
		selectedQuestions: z.array(selectedQuestionSchema).optional(),
		questions: z.array(questionSchema).optional(),
		distributionSettings: z
			.object({
				allowAnonymous: z.boolean().default(true),
				requireLogin: z.boolean().default(false),
				allowedRoles: z.array(z.string()).optional(),
				maxResponsesPerUser: z.number().positive().default(1),
			})
			.optional(),
		scoringSettings: z
			.object({
				passingScore: z.number().min(0).max(100).default(0),
				showScore: z.boolean().default(true),
				showCorrectAnswers: z.boolean().default(false),
			})
			.optional(),
	})
	.refine(
		data => {
			// Validate that survey type cannot use question banks
			if (
				data.type === SURVEY_TYPE.SURVEY &&
				[
					SOURCE_TYPE.QUESTION_BANK,
					SOURCE_TYPE.MULTI_QUESTION_BANK,
					SOURCE_TYPE.MANUAL_SELECTION,
				].includes(data.sourceType)
			) {
				return false;
			}
			return true;
		},
		{
			message: 'Survey type cannot use question banks. Please use manual question creation.',
		}
	)
	.refine(
		data => {
			// Validate required fields based on source type
			if (data.sourceType === SOURCE_TYPE.QUESTION_BANK) {
				return data.questionBankId && data.questionCount;
			}
			if (data.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK) {
				return data.multiQuestionBankConfig && data.multiQuestionBankConfig.length > 0;
			}
			if (data.sourceType === SOURCE_TYPE.MANUAL_SELECTION) {
				return data.selectedQuestions && data.selectedQuestions.length > 0;
			}
			if (data.sourceType === SOURCE_TYPE.MANUAL) {
				return data.questions && data.questions.length > 0;
			}
			return true;
		},
		{
			message: 'Required fields missing for selected source type',
		}
	)
	.refine(
		data => {
			// Validate that quiz/assessment/iq questions have correct answers (only for manual questions)
			const requiresAnswers = TYPES_REQUIRING_ANSWERS.includes(data.type);

			if (requiresAnswers && data.sourceType === SOURCE_TYPE.MANUAL && data.questions) {
				return data.questions.every(question => {
					// For short_text questions, correct answer is optional
					if (question.type === QUESTION_TYPE.SHORT_TEXT) {
						return true; // Short text questions don't require correct answers for validation
					}

					if (question.correctAnswer === null || question.correctAnswer === undefined) {
						return false;
					}

					// Validate correctAnswer format based on question type
					if (question.type === QUESTION_TYPE.SINGLE_CHOICE) {
						return (
							typeof question.correctAnswer === 'number' &&
							question.correctAnswer >= 0 &&
							question.correctAnswer < question.options.length
						);
					}

					if (question.type === QUESTION_TYPE.MULTIPLE_CHOICE) {
						return (
							Array.isArray(question.correctAnswer) &&
							question.correctAnswer.length > 0 &&
							question.correctAnswer.every(
								idx =>
									typeof idx === 'number' &&
									idx >= 0 &&
									idx < question.options.length
							)
						);
					}

					return false;
				});
			}

			return true;
		},
		{
			message: 'Quiz/Assessment/IQ questions must have valid correct answers',
		}
	);

// Survey response schema
const surveyResponseSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Valid email is required'),
	surveyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid survey ID'),
	answers: z.union([
		z.record(
			z.string(),
			z.union([
				z.number().int().min(0), // Single choice answer (legacy format)
				z.array(z.number().int().min(0)), // Multiple choice answers (legacy format)
				z.string(), // Text answer
			])
		),
		z.array(
			z.union([
				z.string(), // Single choice answer or text answer (new format)
				z.array(z.string()), // Multiple choice answers (new format)
			])
		),
	]),
	answerDurations: z.record(z.string(), z.number().int().min(0)).optional(),
	timeSpent: z.number().min(0).optional(),
	isAutoSubmit: z.boolean().optional(),
	metadata: z
		.object({
			userAgent: z.string().optional(),
			ipAddress: z.string().optional(),
			deviceType: z.string().optional(),
		})
		.optional(),
});

// Survey update schema (manually defining partial fields)
const surveyUpdateSchema = z.object({
	title: z.string().min(1, 'Title is required').optional(),
	description: z.string().optional(),
	type: z
		.enum([
			SURVEY_TYPE.SURVEY,
			SURVEY_TYPE.ASSESSMENT,
			SURVEY_TYPE.ONBOARDING,
			SURVEY_TYPE.LIVE_QUIZ,
		])
		.optional(),
	timeLimit: z.number().positive().optional(),
	maxAttempts: z.number().positive().optional(),
	instructions: z.string().optional(),
	navigationMode: z
		.enum(['step-by-step', 'paginated', 'all-in-one', 'one-question-per-page'])
		.optional(),
	questions: z.array(questionSchema).min(1, 'At least one question is required').optional(),
	distributionSettings: z
		.object({
			allowAnonymous: z.boolean().default(true),
			requireLogin: z.boolean().default(false),
			allowedRoles: z.array(z.string()).optional(),
			maxResponsesPerUser: z.number().positive().default(1),
		})
		.optional(),
	scoringSettings: z
		.object({
			passingScore: z.number().min(0).max(100).default(0),
			showScore: z.boolean().default(true),
			showCorrectAnswers: z.boolean().default(false),
		})
		.optional(),
	status: z.enum(['draft', 'active', 'closed']).optional(),
});

module.exports = {
	questionSchema,
	surveyCreateSchema,
	surveyResponseSchema,
	surveyUpdateSchema,
};
