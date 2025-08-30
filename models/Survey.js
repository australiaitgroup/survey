const mongoose = require('mongoose');
const {
	SURVEY_STATUS,
	SURVEY_TYPE,
	QUESTION_TYPE,
	SOURCE_TYPE,
	TYPES_REQUIRING_ANSWERS,
	VALID_SOURCE_TYPES,
} = require('../shared/constants');

const surveySchema = new mongoose.Schema({
	title: String,
	description: String,
	slug: {
		type: String,
		unique: false, // Changed: not globally unique, will use compound index
		required: false,
		index: true,
	},
	type: {
		type: String,
		enum: [
			SURVEY_TYPE.SURVEY,
			SURVEY_TYPE.ASSESSMENT,
			SURVEY_TYPE.ONBOARDING,
			SURVEY_TYPE.LIVE_QUIZ,
		],
		default: SURVEY_TYPE.SURVEY,
	},
	// Time limit in minutes
	timeLimit: {
		type: Number,
		default: null,
	},
	// Maximum attempts allowed per user
	maxAttempts: {
		type: Number,
		default: 1,
	},
	// Instructions for students
	instructions: {
		type: String,
		default: null,
	},
	// Navigation mode for questions
	navigationMode: {
		type: String,
		enum: ['step-by-step', 'paginated', 'all-in-one', 'one-question-per-page'],
		default: 'step-by-step',
	},
	// Question source configuration
	sourceType: {
		type: String,
		enum: VALID_SOURCE_TYPES,
		default: SOURCE_TYPE.MANUAL,
	},
	// Reference to question bank (when sourceType is 'question_bank')
	questionBankId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'QuestionBank',
		default: null,
	},
	// Number of questions to randomly select from question bank
	questionCount: {
		type: Number,
		default: null,
	},
	// Multi-question bank configuration (when sourceType is 'multi_question_bank')
	multiQuestionBankConfig: [
		{
			questionBankId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'QuestionBank',
				required: true,
			},
			questionCount: {
				type: Number,
				required: true,
				min: 1,
			},
			// Optional filters for question selection
			filters: {
				tags: [String],
				difficulty: {
					type: String,
					enum: ['easy', 'medium', 'hard'],
				},
				questionTypes: [
					{
						type: String,
						enum: [
							QUESTION_TYPE.SINGLE_CHOICE,
							QUESTION_TYPE.MULTIPLE_CHOICE,
							QUESTION_TYPE.SHORT_TEXT,
						],
					},
				],
			},
		},
	],
	// Manual question selection (when sourceType is 'manual_selection')
	selectedQuestions: [
		{
			questionBankId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'QuestionBank',
				required: true,
			},
			questionId: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
			// Store question snapshot for consistency
			questionSnapshot: {
				text: String,
				description: String,
				type: String,
				options: [String],
				correctAnswer: mongoose.Schema.Types.Mixed,
				explanation: String,
				points: Number,
				tags: [String],
				difficulty: String,
			},
		},
	],
	questions: [
		{
			text: {
				type: String,
				required: true,
			},
			// Description field for markdown context/scenario
			description: {
				type: String,
				default: '',
			},
			// Description image (embedded in question text for context)
			descriptionImage: {
				type: String,
				default: null,
			},
			type: {
				type: String,
				enum: [
					QUESTION_TYPE.SINGLE_CHOICE,
					QUESTION_TYPE.MULTIPLE_CHOICE,
					QUESTION_TYPE.SHORT_TEXT,
				],
				default: QUESTION_TYPE.SINGLE_CHOICE,
			},
			// Enhanced options support: can be text, image, or both
			options: {
				type: [
					{
						text: {
							type: String,
							default: '',
						},
						imageUrl: {
							type: String,
							default: null,
						},
					},
				],
				required: false,
				// Validation disabled for reordering compatibility
				validate: {
					validator: function (options) {
						// Always return true to skip validation during reordering
						return true;
					},
					message: 'Options validation skipped',
				},
			},
			// For quiz/assessment/iq questions: correct answer(s)
			// For single choice: number (index of correct option)
			// For multiple choice: array of numbers (indices of correct options)
			// For short_text: string (expected answer - optional for surveys)
			correctAnswer: {
				type: mongoose.Schema.Types.Mixed, // Can be Number, [Number], or String
				default: null,
				// Validation disabled for reordering compatibility
				validate: {
					validator: function (value) {
						// Always return true to skip validation during reordering
						return true;
					},
					message: 'CorrectAnswer validation skipped',
				},
			},
			// Optional: explanation for the correct answer
			explanation: {
				type: String,
				default: null,
			},
			// Optional: points for scoring
			points: {
				type: Number,
				default: 1,
			},
		},
	],
	status: {
		type: String,
		enum: [SURVEY_STATUS.DRAFT, SURVEY_STATUS.ACTIVE, SURVEY_STATUS.CLOSED],
		default: SURVEY_STATUS.DRAFT,
	},
	// Distribution settings
	distributionSettings: {
		allowAnonymous: {
			type: Boolean,
			default: true,
		},
		requireLogin: {
			type: Boolean,
			default: false,
		},
		allowedRoles: [
			{
				type: String,
				enum: ['student', 'teacher', 'admin', 'user'],
			},
		],
		maxResponsesPerUser: {
			type: Number,
			default: 1,
		},
	},
	// Security settings
	securitySettings: {
		// Enable anti-cheat protection (blocks copy/paste, right-click, etc.)
		antiCheatEnabled: {
			type: Boolean,
			default: false,
		},
	},
	// Publishing settings
	publishingSettings: {
		publishedAt: Date,
		publishedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		scheduledPublishAt: Date,
		scheduledCloseAt: Date,
		autoClose: {
			type: Boolean,
			default: false,
		},
	},
	// Scoring settings (for quiz/assessment/iq)
	scoringSettings: {
		// Scoring mode: 'percentage' or 'accumulated'
		scoringMode: {
			type: String,
			enum: ['percentage', 'accumulated'],
			default: 'percentage',
		},
		totalPoints: {
			type: Number,
			default: 0,
		},
		passingScore: {
			type: Number,
			default: 0,
		},
		// For percentage mode: passing percentage (0-100)
		// For accumulated mode: minimum points needed to pass
		passingThreshold: {
			type: Number,
			default: 60, // 60% for percentage mode, or 60 points for accumulated mode
		},
		showScore: {
			type: Boolean,
			default: true,
		},
		showCorrectAnswers: {
			type: Boolean,
			default: false,
		},
		// Show detailed breakdown of scoring
		showScoreBreakdown: {
			type: Boolean,
			default: true,
		},
		// Custom scoring rules
		customScoringRules: {
			// Whether to use custom point values per question
			useCustomPoints: {
				type: Boolean,
				default: false,
			},
			// Default points for new questions when using custom scoring
			defaultQuestionPoints: {
				type: Number,
				default: 1,
			},
		},
		// Multiple choice scoring settings
		multipleChoiceScoring: {
			// Enable partial scoring for multiple choice questions
			enablePartialScoring: {
				type: Boolean,
				default: false,
			},
			// Partial scoring mode: 'proportional' or 'all_or_nothing'
			partialScoringMode: {
				type: String,
				enum: ['proportional', 'all_or_nothing'],
				default: 'proportional',
			},
		},
		// Whether to include short text questions in score calculation
		includeShortTextInScore: {
			type: Boolean,
			default: false,
		},
	},
	// Multi-tenant support: reference to company (optional for backward compatibility)
	companyId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Company',
		default: null,
	},
	createdBy: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	isPublic: {
		type: Boolean,
		default: false,
		description: 'Whether this survey should be visible in public survey list',
	},
});

// Helper function to generate unique slug
surveySchema.statics.generateSlug = async function (title, excludeId = null) {
	let baseSlug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

	// If the slug is empty (e.g., Chinese title), generate a unique ID
	if (!baseSlug) {
		// Generate a unique slug using timestamp and random string
		const timestamp = Date.now().toString(36);
		const randomStr = Math.random().toString(36).substring(2, 8);
		baseSlug = `survey-${timestamp}-${randomStr}`;
	}

	// Ensure slug is unique
	let slug = baseSlug;
	let counter = 1;

	// Check if slug already exists (excluding current document)
	const query = { slug };
	if (excludeId) {
		query._id = { $ne: excludeId };
	}

	while (await this.findOne(query)) {
		slug = `${baseSlug}-${counter}`;
		counter++;
		query.slug = slug;
	}

	return slug;
};

// Virtual method to check if survey requires answers
surveySchema.virtual('requiresAnswers').get(function () {
	return TYPES_REQUIRING_ANSWERS.includes(this.type);
});

// Virtual method to get scoring mode description
surveySchema.virtual('scoringDescription').get(function () {
	if (!this.requiresAnswers) return null;

	const mode = this.scoringSettings.scoringMode;
	const threshold = this.scoringSettings.passingThreshold;
	const totalPoints = this.scoringSettings.totalPoints;

	if (mode === 'percentage') {
		return `Percentage scoring, max score 100, passing threshold ${threshold}`;
	} else {
		return `Accumulated scoring, max score ${totalPoints}, passing threshold ${threshold}`;
	}
});

// Create compound index to ensure slug uniqueness within each company
// This allows different companies to have surveys with the same slug
surveySchema.index({ slug: 1, companyId: 1 }, { 
	unique: true,
	partialFilterExpression: { 
		slug: { $exists: true, $type: 'string' },
		companyId: { $exists: true }
	}
});

// For backward compatibility with surveys without companyId
surveySchema.index({ slug: 1 }, { 
	unique: true,
	partialFilterExpression: { 
		slug: { $exists: true, $type: 'string' },
		companyId: { $exists: false }
	}
});

module.exports = mongoose.model('Survey', surveySchema);
