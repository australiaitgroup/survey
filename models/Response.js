const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	surveyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Survey' },
	// Answers format:
	// For single choice: { questionIndex: selectedOptionIndex }
	// For multiple choice: { questionIndex: [selectedOptionIndex1, selectedOptionIndex2, ...] }
	answers: {
		type: Map,
		of: mongoose.Schema.Types.Mixed, // Can be Number or [Number]
		required: true,
	},
	// Question snapshots - store complete question data at the time of response
	// This ensures data consistency even if questions are modified/deleted later
	questionSnapshots: [
		{
			questionId: {
				type: mongoose.Schema.Types.ObjectId,
				required: false, // Optional for backward compatibility
			},
			questionIndex: {
				type: Number,
				required: true,
			},
			// Complete question data snapshot
			questionData: {
				text: { type: String, required: true },
				description: String, // Added description field
				type: {
					type: String,
					enum: ['single_choice', 'multiple_choice', 'short_text'],
					required: true,
				},
				// Store option texts only for snapshots
				options: [String],
				correctAnswer: mongoose.Schema.Types.Mixed, // Number, [Number], or String
				explanation: String,
				points: { type: Number, default: 1 },
				tags: [String],
				difficulty: {
					type: String,
					enum: ['easy', 'medium', 'hard'],
					default: 'medium',
				},
				descriptionImage: String, // Also add descriptionImage for consistency
			},
			// User's answer for this question
			userAnswer: mongoose.Schema.Types.Mixed, // String, [String], or null
			// Scoring information for this question
			scoring: {
				isCorrect: { type: Boolean, default: false },
				pointsAwarded: { type: Number, default: 0 },
				maxPoints: { type: Number, default: 1 },
			},
			// Answer time tracking for this question
			durationInSeconds: {
				type: Number,
				default: 0,
				min: 0,
			},
		},
	],
	// For question bank submissions: store the selected question IDs (legacy support)
	selectedQuestions: [
		{
			originalQuestionId: {
				type: mongoose.Schema.Types.ObjectId,
				required: false,
			},
			questionIndex: {
				type: Number,
				required: false,
			},
			// Store the actual question data to ensure consistency
			questionData: {
				type: mongoose.Schema.Types.Mixed,
				required: false,
			},
		},
	],
	// Scoring information (for quiz/assessment/iq)
	score: {
		totalPoints: { type: Number, default: 0 },
		correctAnswers: { type: Number, default: 0 },
		wrongAnswers: { type: Number, default: 0 },
		percentage: { type: Number, default: 0 },
		passed: { type: Boolean, default: false },
		// Enhanced scoring details
		scoringMode: { type: String, enum: ['percentage', 'accumulated'], default: 'percentage' },
		maxPossiblePoints: { type: Number, default: 0 },
		displayScore: { type: Number, default: 0 }, // The score to display to user
		scoringDetails: {
			questionScores: [
				{
					questionIndex: Number,
					pointsAwarded: Number,
					maxPoints: Number,
					isCorrect: Boolean,
				},
			],
		},
	},
	// Response time tracking
	timeSpent: {
		type: Number, // in seconds
		default: 0,
	},
	// Whether the response was auto-submitted due to time limit
	isAutoSubmit: {
		type: Boolean,
		default: false,
	},
	// Device/browser information
	metadata: {
		userAgent: String,
		ipAddress: String,
		deviceType: String,
	},
	createdAt: { type: Date, default: Date.now },
});

// Method to create question snapshots from survey questions
responseSchema.methods.createQuestionSnapshots = function (
	questions,
	userAnswers,
	answerDurations
) {
	this.questionSnapshots = questions.map((question, index) => {
		const userAnswer = userAnswers[index] || null;

		// Create snapshot of question data
		const questionSnapshot = {
			questionId: question._id || null,
			questionIndex: index,
			questionData: {
				text: question.text,
				type: question.type,
				options: question.options || [],
				correctAnswer: question.correctAnswer,
				explanation: question.explanation || null,
				points: question.points || 1,
				tags: question.tags || [],
				difficulty: question.difficulty || 'medium',
			},
			userAnswer: userAnswer,
			scoring: {
				isCorrect: false,
				pointsAwarded: 0,
				maxPoints: question.points || 1,
			},
			durationInSeconds: (() => {
				if (!answerDurations) return 0;
				const byId = answerDurations[String(question._id)] ?? answerDurations[question._id];
				const byIndex = answerDurations[String(index)] ?? answerDurations[index];
				const v = byId ?? byIndex;
				return typeof v === 'number' && v >= 0 ? v : 0;
			})(),
		};

		// Calculate scoring for this question
		if (question.correctAnswer !== undefined && question.correctAnswer !== null) {
			let isCorrect = false;

			if (question.type === 'single_choice') {
				// For single choice, compare user answer with correct answer
				const correctOption = question.options[question.correctAnswer];
				let correctAnswerText;

				if (typeof correctOption === 'string') {
					// Check if it's a stringified object
					if (correctOption.startsWith('{') && correctOption.includes('text:')) {
						try {
							// Try to extract text from stringified object using regex
							const textMatch = correctOption.match(/text:\s*'([^']+)'/);
							if (textMatch) {
								correctAnswerText = textMatch[1];
							} else {
								correctAnswerText = correctOption;
							}
						} catch (e) {
							// If parsing fails, use the string as-is
							correctAnswerText = correctOption;
						}
					} else {
						correctAnswerText = correctOption;
					}
				} else {
					correctAnswerText = correctOption?.text || correctOption;
				}

				isCorrect = userAnswer === correctAnswerText;
			} else if (question.type === 'multiple_choice') {
				// For multiple choice, compare arrays
				const parseOption = option => {
					if (typeof option === 'string') {
						// Check if it's a stringified object
						if (option.startsWith('{') && option.includes('text:')) {
							try {
								const textMatch = option.match(/text:\s*'([^']+)'/);
								return textMatch ? textMatch[1] : option;
							} catch (e) {
								return option;
							}
						} else {
							return option;
						}
					} else {
						return option?.text || option;
					}
				};

				const correctOptions = Array.isArray(question.correctAnswer)
					? question.correctAnswer.map(idx => parseOption(question.options[idx]))
					: [parseOption(question.options[question.correctAnswer])];
				const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

				isCorrect =
					correctOptions.length === userAnswerArray.length &&
					correctOptions.every(opt => userAnswerArray.includes(opt));
			} else if (question.type === 'short_text') {
				// For short text, exact string comparison
				isCorrect = userAnswer === question.correctAnswer;
			}

			questionSnapshot.scoring.isCorrect = isCorrect;
			questionSnapshot.scoring.pointsAwarded = isCorrect ? question.points || 1 : 0;
		}

		return questionSnapshot;
	});
};

// Method to calculate score for quiz/assessment/iq
responseSchema.methods.calculateScore = function (survey) {
	if (!survey.requiresAnswers) {
		return; // No scoring for regular surveys
	}

	let totalPoints = 0;
	let correctAnswers = 0;
	let wrongAnswers = 0;
	const questionScores = [];

	// Use question snapshots if available, otherwise fall back to legacy method
	let questions = [];
	if (this.questionSnapshots && this.questionSnapshots.length > 0) {
		// Use snapshots for scoring
		questions = this.questionSnapshots.map(snapshot => snapshot.questionData);
	} else {
		// Legacy method - determine the source of questions
		const isQuestionBank = survey.sourceType === 'question_bank';
		questions = isQuestionBank
			? this.selectedQuestions.map(sq => sq.questionData)
			: survey.questions;
	}

	// Calculate total possible points
	const maxPossiblePoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

	// Calculate score for each question
	questions.forEach((question, index) => {
		let userAnswer, isCorrect, pointsAwarded;

		if (this.questionSnapshots && this.questionSnapshots[index]) {
			// Use snapshot data
			const snapshot = this.questionSnapshots[index];
			userAnswer = snapshot.userAnswer;
			isCorrect = snapshot.scoring.isCorrect;
			pointsAwarded = snapshot.scoring.pointsAwarded;
		} else {
			// Legacy method
			userAnswer = this.answers.get(index.toString());
			const correctAnswer = question.correctAnswer;
			const questionPoints = question.points || 1;

			isCorrect = false;
			pointsAwarded = 0;

			if (userAnswer !== undefined && userAnswer !== null) {
				// Check if answer is correct
				if (question.type === 'single_choice') {
					isCorrect = userAnswer === correctAnswer;
				} else if (question.type === 'multiple_choice') {
					// For multiple choice, both arrays must have same elements
					if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
						const userSet = new Set(userAnswer.sort());
						const correctSet = new Set(correctAnswer.sort());
						isCorrect =
							userSet.size === correctSet.size &&
							[...userSet].every(val => correctSet.has(val));
					}
				}

				if (isCorrect) {
					pointsAwarded = questionPoints;
				}
			}
		}

		// Record detailed scoring for this question
		questionScores.push({
			questionIndex: index,
			pointsAwarded,
			maxPoints: question.points || 1,
			isCorrect,
		});

		// Update totals for all questions
		if (userAnswer === undefined || userAnswer === null) {
			wrongAnswers++;
		} else {
			if (isCorrect) {
				correctAnswers++;
				totalPoints += pointsAwarded;
			} else {
				wrongAnswers++;
			}
		}
	});

	// Calculate percentage
	const percentage = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;

	// Determine scoring mode and display score
	const scoringMode = survey.scoringSettings?.scoringMode || 'percentage';
	let displayScore = 0;
	let passed = false;

	if (scoringMode === 'percentage') {
		// Percentage mode: score is 0-100
		displayScore = Math.round(percentage * 100) / 100;
		passed = percentage >= (survey.scoringSettings?.passingThreshold || 60);
	} else {
		// Accumulated mode: score is the actual points earned
		displayScore = totalPoints;
		passed = totalPoints >= (survey.scoringSettings?.passingThreshold || 0);
	}

	// Save all scoring information
	this.score = {
		totalPoints,
		correctAnswers,
		wrongAnswers,
		percentage: Math.round(percentage * 100) / 100,
		passed,
		scoringMode,
		maxPossiblePoints,
		displayScore,
		scoringDetails: {
			questionScores,
		},
	};
};

// Virtual method to get formatted score display
responseSchema.virtual('formattedScore').get(function () {
	if (!this.score) return null;

	const mode = this.score.scoringMode;
	const display = this.score.displayScore;
	const max = mode === 'percentage' ? 100 : this.score.maxPossiblePoints;

	if (mode === 'percentage') {
		return `${display}分 (${display}%)`;
	} else {
		return `${display}分 (满分${max}分)`;
	}
});

module.exports = mongoose.model('Response', responseSchema);
