const mongoose = require('mongoose');
const { QUESTION_TYPE } = require('../shared/constants');

const questionBankSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		trim: true,
	},
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
			type: {
				type: String,
				enum: [
					QUESTION_TYPE.SINGLE_CHOICE,
					QUESTION_TYPE.MULTIPLE_CHOICE,
					QUESTION_TYPE.SHORT_TEXT,
				],
				default: QUESTION_TYPE.SINGLE_CHOICE,
			},
			options: {
				type: [String],
				required: function () {
					return this.type !== QUESTION_TYPE.SHORT_TEXT;
				},
				validate: {
					validator: function (options) {
						// For short_text questions, options are not required
						if (this.type === QUESTION_TYPE.SHORT_TEXT) {
							return true;
						}
						return options && options.length >= 2;
					},
					message: 'At least 2 options are required for choice questions',
				},
			},
			// Correct answer(s) for scoring
			correctAnswer: {
				type: mongoose.Schema.Types.Mixed, // Can be Number, [Number], or String
				required: function () {
					return this.type !== QUESTION_TYPE.SHORT_TEXT;
				},
				validate: {
					validator: function (value) {
						if (this.type === QUESTION_TYPE.SHORT_TEXT) {
							// For short_text questions, correct answer is optional
							// but should be a string if provided
							return (
								value === null || value === undefined || typeof value === 'string'
							);
						}

						if (this.type === QUESTION_TYPE.SINGLE_CHOICE) {
							return (
								typeof value === 'number' &&
								value >= 0 &&
								value < this.options.length
							);
						}

						if (this.type === QUESTION_TYPE.MULTIPLE_CHOICE) {
							return (
								Array.isArray(value) &&
								value.length > 0 &&
								value.every(
									idx =>
										typeof idx === 'number' &&
										idx >= 0 &&
										idx < this.options.length
								)
							);
						}

						return false;
					},
					message: 'Invalid correct answer for question type',
				},
			},
			// Optional: explanation for the correct answer
			explanation: {
				type: String,
				default: null,
			},
			// Optional: description image URL (embedded in question text)
			descriptionImage: {
				type: String,
				default: null,
			},
			// Points for scoring
			points: {
				type: Number,
				default: 1,
			},
			// Optional: tags for filtering
			tags: [
				{
					type: String,
					trim: true,
				},
			],
			// Optional: difficulty level
			difficulty: {
				type: String,
				enum: ['easy', 'medium', 'hard'],
				default: 'medium',
			},
			// Required question flag - if true, this question must be included in assessments
			isRequired: {
				type: Boolean,
				default: false,
			},
		},
	],
	// Creator information
	createdBy: {
		type: String,
		required: true,
	},
	// Timestamps
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Update the updatedAt field before saving
questionBankSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

// Virtual to get question count
questionBankSchema.virtual('questionCount').get(function () {
	return this.questions.length;
});

module.exports = mongoose.model('QuestionBank', questionBankSchema);
