const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler, jwtAuth } = require('./shared/middleware');
const { QuestionBank, Survey } = require('./shared/models');
const { HTTP_STATUS, ERROR_MESSAGES, DATA_TYPES, AppError } = require('./shared/constants');

const router = express.Router();

// ============================================================================
// QUESTION BANKS MANAGEMENT
// ============================================================================

/**
 * @route   GET /admin/question-banks
 * @desc    List all question banks for the authenticated user
 * @access  Private (Admin)
 */
router.get(
	'/question-banks',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const questionBanks = await QuestionBank.find({ createdBy: req.user.id })
			.populate('createdBy', 'username')
			.sort({ createdAt: -1 });
		res.json(questionBanks);
	})
);

/**
 * @route   POST /admin/question-banks
 * @desc    Create a new question bank
 * @access  Private (Admin)
 */
router.post(
	'/question-banks',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { name, description } = req.body;
		const questionBank = new QuestionBank({
			name,
			description,
			createdBy: req.user.id,
			questions: [],
		});
		await questionBank.save();
		res.status(201).json(questionBank);
	})
);

/**
 * @route   GET /admin/question-banks/:id
 * @desc    Get a single question bank
 * @access  Private (Admin)
 */
router.get(
	'/question-banks/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		}).populate('createdBy', 'username');

		if (!questionBank) {
			throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
		}
		res.json(questionBank);
	})
);

/**
 * @route   PUT /admin/question-banks/:id
 * @desc    Update a question bank
 * @access  Private (Admin)
 */
router.put(
	'/question-banks/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { name, description } = req.body;
		const questionBank = await QuestionBank.findOneAndUpdate(
			{ _id: req.params.id, createdBy: req.user.id },
			{ name, description, updatedAt: Date.now() },
			{ new: true }
		);

		if (!questionBank) {
			throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
		}
		res.json(questionBank);
	})
);

/**
 * @route   DELETE /admin/question-banks/:id
 * @desc    Delete a question bank
 * @access  Private (Admin)
 */
router.delete(
	'/question-banks/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const questionBank = await QuestionBank.findOneAndDelete({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
		}
		res.json({ message: 'Question bank deleted successfully' });
	})
);

// ============================================================================
// QUESTIONS IN QUESTION BANKS
// ============================================================================

/**
 * @route   POST /admin/question-banks/:id/questions
 * @desc    Add question to question bank
 * @access  Private (Admin)
 */
router.post(
	'/question-banks/:id/questions',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
		}

		const {
			text,
			description,
			type,
			options,
			correctAnswer,
			explanation,
			points,
			tags,
			difficulty,
		} = req.body;

		questionBank.questions.push({
			text,
			description: description || '',
			type: type || 'single_choice',
			options,
			correctAnswer,
			explanation,
			points: points || 1,
			tags: tags || [],
			difficulty: difficulty || 'medium',
		});

		await questionBank.save();
		res.json(questionBank);
	})
);

/**
 * @route   GET /admin/surveys/:id/questions
 * @desc    Get questions for a survey with optional pagination
 * @access  Private (Admin)
 */
router.get(
	'/surveys/:id/questions',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;

		// Detect if the client explicitly requested pagination
		const hasPagingParams =
			Object.prototype.hasOwnProperty.call(req.query, 'page') ||
			Object.prototype.hasOwnProperty.call(req.query, 'limit');

		// Parse and validate page/limit
		let page = parseInt(req.query.page, 10);
		let limit = parseInt(req.query.limit, 10);
		if (!Number.isFinite(page) || page <= 0) page = 1;
		if (!Number.isFinite(limit) || limit <= 0) limit = 10;
		limit = Math.min(limit, 50);

		if (!hasPagingParams) {
			// Backward compatibility: return all questions when no pagination params are provided
			const survey = await Survey.findOne({ _id: id, createdBy: req.user.id }).select('questions');
			if (!survey) {
				throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
			}
			const totalQuestions = Array.isArray(survey.questions) ? survey.questions.length : 0;
			return res.status(HTTP_STATUS.OK).json({
				questions: survey.questions || [],
				totalQuestions,
				totalPages: 1,
				currentPage: 1,
			});
		}

		// Paginated path: use MongoDB $slice for efficiency
		const start = (page - 1) * limit;
		const objectId = new mongoose.Types.ObjectId(id);
		const results = await Survey.aggregate([
			{ $match: { _id: objectId, createdBy: req.user.id } },
			{ $project: { totalQuestions: { $size: '$questions' }, questions: { $slice: ['$questions', start, limit] } } },
		]);

		if (!results || results.length === 0) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const { totalQuestions, questions } = results[0];
		const totalPages = Math.max(1, Math.ceil((totalQuestions || 0) / limit));
		const currentPage = Math.min(page, totalPages);

		return res.status(HTTP_STATUS.OK).json({
			questions: questions || [],
			totalQuestions: totalQuestions || 0,
			totalPages,
			currentPage,
		});
	})
);

/**
 * @route   PUT /admin/question-banks/:id/questions/:questionId
 * @desc    Update question in question bank
 * @access  Private (Admin)
 */
router.put(
	'/question-banks/:id/questions/:questionId',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
		}

		const question = questionBank.questions.id(req.params.questionId);
		if (!question) {
			throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND);
		}

		Object.assign(question, req.body);
		await questionBank.save();
		res.json(questionBank);
	})
);

/**
 * @route   DELETE /admin/question-banks/:id/questions/:questionId
 * @desc    Delete question from question bank
 * @access  Private (Admin)
 */
router.delete(
	'/question-banks/:id/questions/:questionId',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
		}

		questionBank.questions.pull(req.params.questionId);
		await questionBank.save();
		res.json(questionBank);
	})
);

// ============================================================================
// QUESTIONS IN SURVEYS (MANUAL SURVEYS)
// ============================================================================

/**
 * @route   PUT /admin/surveys/:id/questions
 * @desc    Add a question to an existing survey
 * @access  Private (Admin)
 */
router.put(
	'/surveys/:id/questions',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const {
			text,
			description,
			imageUrl,
			descriptionImage,
			options,
			correctAnswer,
			points,
			type,
		} = req.body;

		// Debug: Log the received data
		console.log('Add question request body:', req.body);
		console.log('Question type:', type);
		console.log('Options:', options);
		console.log('Text:', text);

		// Basic validation
		if (typeof text !== DATA_TYPES.STRING) {
			console.log('Validation failed: text is not string, type:', typeof text);
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Question text must be a string' });
		}

		// Validate question type
		if (type && !['single_choice', 'multiple_choice', 'short_text'].includes(type)) {
			console.log('Validation failed: invalid type:', type);
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question type' });
		}

		// For choice questions, validate options
		if (type !== 'short_text') {
			if (!options || !Array.isArray(options) || options.length < 2) {
				console.log('Validation failed: insufficient options for choice question');
				console.log('Options:', options);
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'At least 2 options are required for choice questions' });
			}

			// Validate option format: each option should have either text or imageUrl
			const validOptions = options.every(option => {
				if (typeof option === 'string') {
					// Legacy format: plain string
					return option.trim().length > 0;
				} else if (typeof option === 'object' && option !== null) {
					// New format: object with text/imageUrl
					return (option.text && option.text.trim()) || option.imageUrl;
				}
				return false;
			});

			if (!validOptions) {
				console.log('Validation failed: invalid option format');
				console.log('Options:', options);
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'Each option must have either text or image' });
			}
		}

		// Validate correctAnswer if provided
		if (correctAnswer !== undefined && correctAnswer !== null) {
			if (type === 'short_text') {
				// For short text, correctAnswer should be a string
				if (typeof correctAnswer !== DATA_TYPES.STRING) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			} else {
				// For choice questions: Support both single answer (number) and multiple answers (array)
				if (Array.isArray(correctAnswer)) {
					// Multiple choice: validate array of indices
					if (
						!correctAnswer.every(
							idx =>
								typeof idx === DATA_TYPES.NUMBER && idx >= 0 && idx < options.length
						)
					) {
						return res
							.status(HTTP_STATUS.BAD_REQUEST)
							.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
					}
				} else {
					// Single choice: validate single index
					if (
						typeof correctAnswer !== DATA_TYPES.NUMBER ||
						correctAnswer < 0 ||
						correctAnswer >= options.length
					) {
						return res
							.status(HTTP_STATUS.BAD_REQUEST)
							.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
					}
				}
			}
		}

		// Validate points if provided
		if (points !== undefined && (typeof points !== DATA_TYPES.NUMBER || points < 1)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Points must be a positive number' });
		}

		const survey = await Survey.findOne({ _id: id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Use provided type or determine from correctAnswer format
		let questionType = type || 'single_choice';
		let normalizedCorrectAnswer = correctAnswer;

		// If type is not provided, determine from correctAnswer format (backward compatibility)
		if (!type && correctAnswer !== undefined) {
			if (Array.isArray(correctAnswer) && correctAnswer.length > 1) {
				// Multiple correct answers = multiple choice
				questionType = 'multiple_choice';
				normalizedCorrectAnswer = correctAnswer;
			} else if (Array.isArray(correctAnswer) && correctAnswer.length === 1) {
				// Single answer in array format = single choice
				questionType = 'single_choice';
				normalizedCorrectAnswer = correctAnswer[0];
			} else if (typeof correctAnswer === 'number') {
				// Single answer in number format = single choice
				questionType = 'single_choice';
				normalizedCorrectAnswer = correctAnswer;
			} else if (typeof correctAnswer === 'string') {
				// String answer = short text
				questionType = 'short_text';
				normalizedCorrectAnswer = correctAnswer;
			}
		}

		const question = {
			text,
			type: questionType,
		};

		// Add description if provided
		if (description !== undefined) {
			question.description = description;
		}

		// Add question image if provided
		if (imageUrl) {
			question.imageUrl = imageUrl;
		}

		// Add description image if provided
		if (descriptionImage) {
			question.descriptionImage = descriptionImage;
		}

		// Only add options for non-short_text questions
		if (questionType !== 'short_text') {
			// Normalize options to the new format
			question.options = options.map(option => {
				if (typeof option === 'string') {
					// Legacy format: convert string to object
					return { text: option, imageUrl: null };
				} else {
					// New format: ensure structure
					return {
						text: option.text || '',
						imageUrl: option.imageUrl || null,
					};
				}
			});
		}

		if (correctAnswer !== undefined) {
			question.correctAnswer = normalizedCorrectAnswer;
		}
		if (points !== undefined) {
			question.points = points;
		}

		survey.questions.push(question);

		// Fix: Normalize ALL questions' options to the new object format before saving
		// This prevents validation errors when some questions have legacy string array format
		survey.questions.forEach(q => {
			if (q.type !== 'short_text' && q.options && Array.isArray(q.options)) {
				q.options = q.options.map(option => {
					if (typeof option === 'string') {
						const text = option.trim();
						return { text: text || 'Option', imageUrl: null };
					} else if (typeof option === 'object' && option !== null) {
						const text = (option.text || '').trim();
						const imageUrl = option.imageUrl || null;
						return {
							text: text || (imageUrl ? '' : 'Option'),
							imageUrl: imageUrl,
						};
					} else {
						return { text: 'Option', imageUrl: null };
					}
				});
			}
		});

		await survey.save();
		res.json(survey);
	})
);

/**
 * @route   PATCH /admin/surveys/:id/questions/:questionIndex
 * @desc    Update a question in an existing survey (PATCH for partial updates)
 * @access  Private (Admin)
 */
router.patch(
	'/surveys/:id/questions/:questionIndex',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id, questionIndex } = req.params;
		const {
			text,
			description,
			imageUrl,
			descriptionImage,
			type,
			options,
			correctAnswer,
			points,
		} = req.body;

		// Validate input - only validate fields that are provided (PATCH method)
		if (text !== undefined && typeof text !== DATA_TYPES.STRING) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_DATA });
		}

		// Validate type if provided
		if (type && !['single_choice', 'multiple_choice', 'short_text'].includes(type)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question type' });
		}

		// Validate options only if provided
		if (options !== undefined) {
			if (!Array.isArray(options)) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: ERROR_MESSAGES.INVALID_DATA });
			}

			// Validate option format: each option should have either text or imageUrl
			const validOptions = options.every(option => {
				if (typeof option === 'string') {
					// Legacy format: plain string
					return option.trim().length > 0;
				} else if (typeof option === 'object' && option !== null) {
					// New format: object with text/imageUrl
					return (option.text && option.text.trim()) || option.imageUrl;
				}
				return false;
			});

			if (!validOptions) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'Each option must have either text or image' });
			}
		}

		// Validate points if provided
		if (points !== undefined && (typeof points !== DATA_TYPES.NUMBER || points < 1)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Points must be a positive number' });
		}

		const survey = await Survey.findOne({ _id: id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const qIndex = parseInt(questionIndex, 10);
		if (qIndex < 0 || qIndex >= survey.questions.length) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question index' });
		}

		const question = survey.questions[qIndex];

		// Update fields if provided
		if (text !== undefined) question.text = text;
		if (description !== undefined) question.description = description;
		if (imageUrl !== undefined) question.imageUrl = imageUrl;
		if (descriptionImage !== undefined) question.descriptionImage = descriptionImage;
		if (type !== undefined) question.type = type;
		if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
		if (points !== undefined) question.points = points;

		// Handle options update
		if (options !== undefined) {
			// Normalize options to the new format
			question.options = options.map(option => {
				if (typeof option === 'string') {
					// Legacy format: convert string to object
					return { text: option, imageUrl: null };
				} else {
					// New format: ensure structure
					return {
						text: option.text || '',
						imageUrl: option.imageUrl || null,
					};
				}
			});
		}

		// Normalize ALL questions' options to prevent validation errors
		survey.questions.forEach(q => {
			if (q.type !== 'short_text' && q.options && Array.isArray(q.options)) {
				q.options = q.options.map(option => {
					if (typeof option === 'string') {
						const text = option.trim();
						return { text: text || 'Option', imageUrl: null };
					} else if (typeof option === 'object' && option !== null) {
						const text = (option.text || '').trim();
						const imageUrl = option.imageUrl || null;
						return {
							text: text || (imageUrl ? '' : 'Option'),
							imageUrl: imageUrl,
						};
					} else {
						return { text: 'Option', imageUrl: null };
					}
				});
			}
		});

		try {
			console.log('Attempting to save updated question...');
			await survey.save();
			console.log('Survey saved successfully');
		} catch (saveError) {
			console.error('Survey save error:', saveError.message);
			console.error('Full error:', saveError);
			throw saveError;
		}
		res.json(survey);
	})
);

/**
 * @route   DELETE /admin/surveys/:id/questions/:questionIndex
 * @desc    Delete a question from an existing survey
 * @access  Private (Admin)
 */
router.delete(
	'/surveys/:id/questions/:questionIndex',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id, questionIndex } = req.params;

		const survey = await Survey.findOne({ _id: id, createdBy: req.user.id });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const qIndex = parseInt(questionIndex, 10);
		if (qIndex < 0 || qIndex >= survey.questions.length) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question index' });
		}

		survey.questions.splice(qIndex, 1);
		await survey.save();
		res.json(survey);
	})
);

/**
 * @route   PATCH /admin/surveys/:id/questions-reorder
 * @desc    Update question order for manual surveys
 * @access  Private (Admin)
 */
router.patch(
	'/surveys/:id/questions-reorder',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { questionIds } = req.body; // Expect array of question IDs in new order

		// Basic validation
		if (!Array.isArray(questionIds)) {
			return res.status(400).json({
				success: false,
				error: 'questionIds must be an array',
			});
		}

		// Find survey - handle both legacy admin ID and regular user ObjectId
		let survey = await Survey.findOne({ _id: id, createdBy: req.user.id });

		// If not found and user is admin, try with string conversion (handle ObjectId vs string mismatch)
		if (!survey && req.user.id) {
			const userIdStr = req.user.id.toString();
			survey = await Survey.findOne({ _id: id, createdBy: userIdStr });
		}

		if (!survey) {
			return res.status(404).json({
				success: false,
				error: 'Survey not found or access denied',
			});
		}

		// Check if manual
		if (survey.sourceType !== 'manual') {
			return res.status(400).json({
				success: false,
				error: 'Only manual surveys can be reordered',
			});
		}

		// Check question count matches
		if (questionIds.length !== survey.questions.length) {
			return res.status(400).json({
				success: false,
				error: 'Question count does not match',
				expected: survey.questions.length,
				received: questionIds.length,
			});
		}

		// Validate all question IDs exist and create ordered array
		const questionMap = new Map();
		survey.questions.forEach((question, index) => {
			const questionId = question._id.toString();
			questionMap.set(questionId, question);
		});

		// Validate all IDs exist
		for (const questionId of questionIds) {
			if (!questionMap.has(questionId.toString())) {
				return res.status(400).json({
					success: false,
					error: 'Invalid question ID: ' + questionId,
				});
			}
		}

		try {
			// Reorder questions based on the ID array and strip to plain objects
			const reorderedQuestions = questionIds.map(questionId => {
				const question = questionMap.get(questionId.toString());
				// Convert to plain object to remove all mongoose properties and validation
				return {
					_id: question._id,
					text: question.text,
					description: question.description || '',
					imageUrl: question.imageUrl || null,
					descriptionImage: question.descriptionImage || null,
					type: question.type,
					options: question.options || [],
					correctAnswer: question.correctAnswer || null,
					explanation: question.explanation || null,
					points: question.points || 1,
				};
			});

			// Update the survey with reordered questions using Mongoose
			survey.questions = reorderedQuestions;
			await survey.save();

			return res.json({
				success: true,
				message: 'Questions reordered successfully',
				newOrder: reorderedQuestions.map(q => ({
					id: q._id,
					text: q.text.substring(0, 30),
				})),
			});
		} catch (error) {
			console.error('UPDATE ERROR:', error);
			console.error('Stack trace:', error.stack);
			return res.status(500).json({
				success: false,
				error: error.message,
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			});
		}
	})
);

module.exports = router;
