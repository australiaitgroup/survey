const QuestionBank = require('../models/QuestionBank');
const { HTTP_STATUS } = require('../shared/constants');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Get all question banks
exports.getAllQuestionBanks = async (req, res) => {
	try {
		const questionBanks = await QuestionBank.find({ createdBy: req.user.id })
			.populate('createdBy', 'username')
			.sort({ createdAt: -1 });

		res.status(HTTP_STATUS.OK).json(questionBanks);
	} catch (error) {
		console.error('Error fetching question banks:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to fetch question banks',
		});
	}
};

// Get a specific question bank by ID
exports.getQuestionBank = async (req, res) => {
	try {
		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		}).populate('createdBy', 'username');

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error fetching question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to fetch question bank',
		});
	}
};

// Create a new question bank
exports.createQuestionBank = async (req, res) => {
	try {
		const { name, description } = req.body;

		if (!name || !name.trim()) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Question bank name is required' });
		}

		const questionBank = new QuestionBank({
			name: name.trim(),
			description: description?.trim(),
			createdBy: req.user.id, // Get user ID from JWT payload
			questions: [],
		});

		await questionBank.save();

		res.status(HTTP_STATUS.CREATED).json(questionBank);
	} catch (error) {
		console.error('Error creating question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to create question bank',
		});
	}
};

// Update a question bank
exports.updateQuestionBank = async (req, res) => {
	try {
		const { name, description } = req.body;

		if (!name || !name.trim()) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Question bank name is required' });
		}

		const questionBank = await QuestionBank.findOneAndUpdate(
			{ _id: req.params.id, createdBy: req.user.id },
			{
				name: name.trim(),
				description: description?.trim(),
				updatedAt: Date.now(),
			},
			{ new: true }
		);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error updating question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to update question bank',
		});
	}
};

// Delete a question bank
exports.deleteQuestionBank = async (req, res) => {
	try {
		const questionBank = await QuestionBank.findOneAndDelete({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		res.status(HTTP_STATUS.OK).json({ message: 'Question bank deleted successfully' });
	} catch (error) {
		console.error('Error deleting question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to delete question bank',
		});
	}
};

// Add a question to a question bank
exports.addQuestion = async (req, res) => {
	try {
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
			descriptionImage,
		} = req.body;

		if (!text || !text.trim()) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Question text is required' });
		}

		// For choice-based questions, options are required
		const questionType = type || 'single_choice';
		if (questionType !== 'short_text') {
			if (!options || !Array.isArray(options) || options.length < 2) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'At least 2 options are required for choice questions' });
			}

			if (correctAnswer === undefined || correctAnswer === null) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'Correct answer is required for choice questions' });
			}
		}

		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		const newQuestion = {
			text: text.trim(),
			description: description?.trim() || '',
			type: questionType,
			explanation: explanation?.trim(),
			points: points || 1,
			tags: tags || [],
			difficulty: difficulty || 'medium',
		};

		// Add description image if provided
		if (descriptionImage) {
			newQuestion.descriptionImage = descriptionImage;
		}

		// Add options and correctAnswer only for choice-based questions
		if (questionType !== 'short_text') {
			newQuestion.options = options.map(opt => opt.trim()).filter(opt => opt.length > 0);
			newQuestion.correctAnswer = correctAnswer;
		} else if (correctAnswer && typeof correctAnswer === 'string') {
			// For short_text, correctAnswer is optional but if provided should be a string
			newQuestion.correctAnswer = correctAnswer.trim();
		}

		questionBank.questions.push(newQuestion);
		await questionBank.save();

		res.status(HTTP_STATUS.CREATED).json(questionBank);
	} catch (error) {
		console.error('Error adding question:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to add question' });
	}
};

// Update a question in a question bank
exports.updateQuestion = async (req, res) => {
	try {
		const { questionId } = req.params;
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
			descriptionImage,
		} = req.body;

		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		// Find question by ID
		const questionIndex = questionBank.questions.findIndex(
			q => q._id.toString() === questionId
		);

		if (questionIndex === -1) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question not found' });
		}

		// Update the question
		const question = questionBank.questions[questionIndex];
		if (text !== undefined) question.text = text.trim();
		if (description !== undefined) question.description = description?.trim() || '';
		if (type !== undefined) question.type = type;
		if (options !== undefined)
			question.options = options.map(opt => opt.trim()).filter(opt => opt.length > 0);
		if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
		if (explanation !== undefined) question.explanation = explanation?.trim();
		if (points !== undefined) question.points = points;
		if (tags !== undefined) question.tags = tags;
		if (difficulty !== undefined) question.difficulty = difficulty;
		if (descriptionImage !== undefined) {
			if (descriptionImage) {
				question.descriptionImage = descriptionImage;
			} else {
				// Remove description image if explicitly set to null/empty
				delete question.descriptionImage;
			}
		}

		await questionBank.save();

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error updating question:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update question' });
	}
};

// Delete a question from a question bank
exports.deleteQuestion = async (req, res) => {
	try {
		const { questionId } = req.params;

		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		// Find question by ID
		const questionIndex = questionBank.questions.findIndex(
			q => q._id.toString() === questionId
		);

		if (questionIndex === -1) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question not found' });
		}

		questionBank.questions.splice(questionIndex, 1);
		await questionBank.save();

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error deleting question:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete question' });
	}
};

// Get random questions from a question bank (for testing/preview)
exports.getRandomQuestions = async (req, res) => {
	try {
		const { count, tags, difficulty } = req.query;

		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		let questions = questionBank.questions;

		// Apply filters if provided
		if (tags && tags.length > 0) {
			const tagArray = Array.isArray(tags) ? tags : [tags];
			questions = questions.filter(q => q.tags.some(tag => tagArray.includes(tag)));
		}

		if (difficulty) {
			questions = questions.filter(q => q.difficulty === difficulty);
		}

		// Randomly select questions
		const questionCount = Math.min(parseInt(count) || questions.length, questions.length);
		const shuffled = questions.sort(() => 0.5 - Math.random());
		const selectedQuestions = shuffled.slice(0, questionCount);

		res.status(HTTP_STATUS.OK).json({
			questions: selectedQuestions,
			totalAvailable: questions.length,
			selected: selectedQuestions.length,
		});
	} catch (error) {
		console.error('Error getting random questions:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to get random questions',
		});
	}
};

// Import questions from JSON
exports.importQuestions = async (req, res) => {
	try {
		const { questions } = req.body;

		if (!Array.isArray(questions) || questions.length === 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Questions array is required' });
		}

		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		// Validate and process questions
		const validQuestions = [];
		const errors = [];

		questions.forEach((q, index) => {
			try {
				if (!q.text || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
					errors.push(`Question ${index + 1}: Invalid format`);
					return;
				}

				if (q.correctAnswer === undefined || q.correctAnswer === null) {
					errors.push(`Question ${index + 1}: Missing correct answer`);
					return;
				}

				validQuestions.push({
					text: q.text.trim(),
					type: q.type || 'single_choice',
					options: q.options.map(opt => opt.trim()).filter(opt => opt.length > 0),
					correctAnswer: q.correctAnswer,
					explanation: q.explanation?.trim(),
					points: q.points || 1,
					tags: q.tags || [],
					difficulty: q.difficulty || 'medium',
				});
			} catch (error) {
				errors.push(`Question ${index + 1}: ${error.message}`);
			}
		});

		if (errors.length > 0) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Some questions have validation errors',
				errors,
				imported: validQuestions.length,
			});
		}

		// Add valid questions to the bank
		questionBank.questions.push(...validQuestions);
		await questionBank.save();

		res.status(HTTP_STATUS.OK).json({
			message: `Successfully imported ${validQuestions.length} questions`,
			questionBank,
		});
	} catch (error) {
		console.error('Error importing questions:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to import questions' });
	}
};

// Import questions from CSV file
exports.importQuestionsFromCSV = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'CSV file is required' });
		}

		const questionBank = await QuestionBank.findOne({
			_id: req.params.id,
			createdBy: req.user.id,
		});

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		const csvData = req.file.buffer.toString('utf8');
		const questions = [];
		const errors = [];
		let lineNumber = 1; // Start from 1 (header line)

		// Parse CSV data
		const stream = Readable.from([csvData]);

		return new Promise(resolve => {
			stream
				.pipe(
					csv({
						headers: [
							'questionText',
							'description',
							'type',
							'options',
							'correctAnswers',
							'tags',
							'explanation',
							'points',
							'difficulty',
							'descriptionImage',
						],
						skipEmptyLines: true,
					})
				)
				.on('data', row => {
					lineNumber++;
					try {
						// Skip empty rows
						if (!row.questionText || !row.questionText.trim()) {
							return;
						}

						const questionText = row.questionText.trim();
						const type = (row.type || 'single').toLowerCase();

						// Map CSV type to internal type
						let questionType;
						switch (type) {
						case 'single':
							questionType = 'single_choice';
							break;
						case 'multiple':
							questionType = 'multiple_choice';
							break;
						case 'text':
							questionType = 'short_text';
							break;
						default:
							questionType = 'single_choice';
						}

						const newQuestion = {
							text: questionText,
							type: questionType,
							points: parseInt(row.points) || 1,
							tags: [],
							difficulty:
								row.difficulty &&
								['easy', 'medium', 'hard'].includes(row.difficulty.toLowerCase())
									? row.difficulty.toLowerCase()
									: 'medium',
						};

						// Handle description (supports Markdown)
						if (row.description && row.description.trim()) {
							newQuestion.description = row.description.trim();
						}

						// Handle explanation
						if (row.explanation && row.explanation.trim()) {
							newQuestion.explanation = row.explanation.trim();
						}

						// Handle description image
						if (row.descriptionImage && row.descriptionImage.trim()) {
							newQuestion.descriptionImage = row.descriptionImage.trim();
						}

						// Handle tags
						if (row.tags && row.tags.trim()) {
							newQuestion.tags = row.tags
								.split(',')
								.map(tag => tag.trim())
								.filter(tag => tag.length > 0);
						}

						// Handle options and correct answers for choice questions
						if (questionType !== 'short_text') {
							if (!row.options || !row.options.trim()) {
								errors.push(
									`Line ${lineNumber}: Options are required for choice questions`
								);
								return;
							}

							const options = row.options
								.split(';')
								.map(opt => opt.trim())
								.filter(opt => opt.length > 0);

							if (options.length < 2) {
								errors.push(`Line ${lineNumber}: At least 2 options are required`);
								return;
							}

							newQuestion.options = options;

							// Parse correct answers
							if (!row.correctAnswers || !row.correctAnswers.trim()) {
								errors.push(
									`Line ${lineNumber}: Correct answers are required for choice questions`
								);
								return;
							}

							const correctAnswerIndices = row.correctAnswers
								.split(';')
								.map(idx => parseInt(idx.trim()))
								.filter(idx => !isNaN(idx) && idx >= 0 && idx < options.length);

							if (correctAnswerIndices.length === 0) {
								errors.push(`Line ${lineNumber}: Invalid correct answer indices`);
								return;
							}

							if (questionType === 'single_choice') {
								if (correctAnswerIndices.length > 1) {
									errors.push(
										`Line ${lineNumber}: Single choice questions can only have one correct answer`
									);
									return;
								}
								newQuestion.correctAnswer = correctAnswerIndices[0];
							} else {
								newQuestion.correctAnswer = correctAnswerIndices;
							}
						} else {
							// For text questions, correctAnswer is optional
							if (row.correctAnswers && row.correctAnswers.trim()) {
								newQuestion.correctAnswer = row.correctAnswers.trim();
							}
						}

						questions.push(newQuestion);
					} catch (error) {
						errors.push(`Line ${lineNumber}: ${error.message}`);
					}
				})
				.on('end', async () => {
					try {
						if (errors.length > 0 && questions.length === 0) {
							return res.status(HTTP_STATUS.BAD_REQUEST).json({
								error: 'CSV parsing failed',
								errors,
								imported: 0,
							});
						}

						// Add questions to the bank
						if (questions.length > 0) {
							questionBank.questions.push(...questions);
							await questionBank.save();
						}

						const response = {
							message: `Successfully imported ${questions.length} questions`,
							imported: questions.length,
							questionBank,
						};

						if (errors.length > 0) {
							response.warnings = errors;
							response.message += ` with ${errors.length} warnings`;
						}

						res.status(HTTP_STATUS.OK).json(response);
						resolve();
					} catch (error) {
						console.error('Error saving questions:', error);
						res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
							error: 'Failed to save questions to database',
						});
						resolve();
					}
				})
				.on('error', error => {
					console.error('CSV parsing error:', error);
					res.status(HTTP_STATUS.BAD_REQUEST).json({
						error: 'Failed to parse CSV file',
						details: error.message,
					});
					resolve();
				});
		});
	} catch (error) {
		console.error('Error importing CSV:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to import CSV file' });
	}
};

// Download CSV template
exports.downloadCSVTemplate = async (req, res) => {
	try {
		const csvTemplate = `questionText,description,type,options,correctAnswers,tags,explanation,points,difficulty,descriptionImage
	你喜欢哪个颜色？,"**场景**：请选择你最喜欢的颜色。",single,红色;绿色;蓝色,1,"颜色,兴趣",这是一个关于颜色偏好的问题,1,easy,
	哪些是编程语言？,"提示：选择所有符合条件的选项。",multiple,JavaScript;Python;HTML,0;1,"技术,测试",选择所有编程语言选项,2,medium,
	请简要说明你的人生目标,"可以使用Markdown，例如：**清晰简洁地描述**",text,,,"思辨,职业规划",请用简洁的语言描述,1,medium,
	What is 2+2?,"You can add Markdown like **bold** or _italic_.",single,3;4;5,1,"数学,基础",基础数学运算题,1,easy,`;

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename="question_bank_template.csv"');
		// Prevent caching so clients always get the latest template
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
		res.send(csvTemplate);
	} catch (error) {
		console.error('Error generating CSV template:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to generate CSV template',
		});
	}
};

// Get questions from multiple question banks with filters
exports.getQuestionsFromMultipleBanks = async (req, res) => {
	try {
		const { configurations } = req.body; // Array of { questionBankId, questionCount, filters, isPublic }

		if (!Array.isArray(configurations) || configurations.length === 0) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Configurations array is required',
			});
		}

		const results = [];

		for (const config of configurations) {
			const { questionBankId, questionCount, filters = {}, isPublic } = config;
			let questionBank;
			let bankName;
			let questions;

			if (isPublic) {
				// Handle public banks
				const PublicBank = require('../models/PublicBank');
				const Entitlement = require('../models/Entitlement');
				const User = require('../models/User');

				questionBank = await PublicBank.findOne({
					_id: questionBankId,
					isActive: true,
					isPublished: true,
				});

				if (!questionBank) {
					return res.status(HTTP_STATUS.NOT_FOUND).json({
						error: `Public question bank with ID ${questionBankId} not found`,
					});
				}

				// Check if user has access to this public bank
				const user = await User.findById(req.user.id).select('companyId subscription');
				let hasAccess = false;

				if (user && user.companyId) {
					hasAccess = await Entitlement.hasAccess(user.companyId, questionBank._id);

					// Also check if it's free or user has premium subscription
					if (!hasAccess) {
						if (questionBank.type === 'free') {
							hasAccess = true;
						} else if (user.subscription && user.subscription.plan === 'premium') {
							hasAccess = true;
						}
					}
				}

				if (!hasAccess) {
					return res.status(HTTP_STATUS.FORBIDDEN).json({
						error: `You do not have access to public question bank "${questionBank.title}"`,
					});
				}

				bankName = questionBank.title;
				questions = [...questionBank.questions];
			} else {
				// Handle local banks
				questionBank = await QuestionBank.findOne({
					_id: questionBankId,
					createdBy: req.user.id,
				});

				if (!questionBank) {
					return res.status(HTTP_STATUS.NOT_FOUND).json({
						error: `Question bank with ID ${questionBankId} not found`,
					});
				}

				bankName = questionBank.name;
				questions = [...questionBank.questions];
			}

			// Apply filters
			if (filters.tags && filters.tags.length > 0) {
				questions = questions.filter(q => filters.tags.some(tag => q.tags.includes(tag)));
			}

			if (filters.difficulty) {
				questions = questions.filter(q => q.difficulty === filters.difficulty);
			}

			if (filters.questionTypes && filters.questionTypes.length > 0) {
				questions = questions.filter(q => filters.questionTypes.includes(q.type));
			}

			// Randomly select the requested number of questions
			const selectedQuestions = [];
			const availableQuestions = [...questions];

			for (let i = 0; i < Math.min(questionCount, availableQuestions.length); i++) {
				const randomIndex = Math.floor(Math.random() * availableQuestions.length);
				const selectedQuestion = availableQuestions.splice(randomIndex, 1)[0];

				selectedQuestions.push({
					...selectedQuestion.toObject(),
					questionBankId,
					questionBankName: bankName,
					isPublic: !!isPublic,
				});
			}

			results.push({
				questionBankId,
				questionBankName: bankName,
				requestedCount: questionCount,
				actualCount: selectedQuestions.length,
				questions: selectedQuestions,
				isPublic: !!isPublic,
			});
		}

		res.status(HTTP_STATUS.OK).json({
			results,
			totalQuestions: results.reduce((sum, r) => sum + r.actualCount, 0),
		});
	} catch (error) {
		console.error('Error getting questions from multiple banks:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to get questions from multiple banks',
		});
	}
};

// Get all questions from a question bank with pagination and filtering
exports.getQuestionBankQuestions = async (req, res) => {
	try {
		const { id } = req.params;
		const { page = 1, limit = 50, tags, difficulty, questionTypes, search } = req.query;

		const questionBank = await QuestionBank.findOne({
			_id: id,
			createdBy: req.user.id,
		});
		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Question bank not found',
			});
		}

		let questions = [...questionBank.questions];

		// Apply filters
		if (tags) {
			const tagArray = tags.split(',').map(tag => tag.trim());
			questions = questions.filter(q => tagArray.some(tag => q.tags.includes(tag)));
		}

		if (difficulty) {
			questions = questions.filter(q => q.difficulty === difficulty);
		}

		if (questionTypes) {
			const typeArray = questionTypes.split(',').map(type => type.trim());
			questions = questions.filter(q => typeArray.includes(q.type));
		}

		if (search) {
			const searchLower = search.toLowerCase();
			questions = questions.filter(
				q =>
					q.text.toLowerCase().includes(searchLower) ||
					q.tags.some(tag => tag.toLowerCase().includes(searchLower))
			);
		}

		// Pagination
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const paginatedQuestions = questions.slice(startIndex, endIndex);

		// Add question IDs for reference
		const questionsWithIds = paginatedQuestions.map((question, index) => ({
			...question.toObject(),
			questionId: questionBank.questions.id(question._id) ? question._id : null,
			index: startIndex + index,
		}));

		res.status(HTTP_STATUS.OK).json({
			questionBank: {
				_id: questionBank._id,
				name: questionBank.name,
				description: questionBank.description,
			},
			questions: questionsWithIds,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(questions.length / limit),
				totalQuestions: questions.length,
				hasNextPage: endIndex < questions.length,
				hasPreviousPage: page > 1,
			},
		});
	} catch (error) {
		console.error('Error getting question bank questions:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to get question bank questions',
		});
	}
};

// Get question details by bank ID and question ID
exports.getQuestionDetails = async (req, res) => {
	try {
		const { bankId, questionId } = req.params;

		const questionBank = await QuestionBank.findOne({
			_id: bankId,
			createdBy: req.user.id,
		});
		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Question bank not found',
			});
		}

		const question = questionBank.questions.id(questionId);
		if (!question) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Question not found',
			});
		}

		res.status(HTTP_STATUS.OK).json({
			questionBankId: bankId,
			questionBankName: questionBank.name,
			question: {
				...question.toObject(),
				questionId: question._id,
			},
		});
	} catch (error) {
		console.error('Error getting question details:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to get question details',
		});
	}
};

// Copy questions from public bank to user's question bank
exports.copyQuestionsFromPublicBank = async (req, res) => {
	try {
		const { targetBankId } = req.params;
		const { sourceBankId, questionIds } = req.body;

		if (!sourceBankId || !questionIds || !Array.isArray(questionIds)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'sourceBankId and questionIds array are required',
			});
		}

		// Verify target bank belongs to user
		const targetBank = await QuestionBank.findOne({
			_id: targetBankId,
			createdBy: req.user.id,
		});

		if (!targetBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Target question bank not found',
			});
		}

		// Get source public bank
		const PublicBank = require('../models/PublicBank');
		const Entitlement = require('../models/Entitlement');
		const User = require('../models/User');

		const sourceBank = await PublicBank.findOne({
			_id: sourceBankId,
			isActive: true,
			isPublished: true,
		});

		if (!sourceBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				error: 'Source public bank not found',
			});
		}

		// Check if user has access to source bank
		const user = await User.findById(req.user.id).select('companyId subscription');
		let hasAccess = false;

		if (user && user.companyId) {
			hasAccess = await Entitlement.hasAccess(user.companyId, sourceBank._id);

			// Also check if it's free or user has premium subscription
			if (!hasAccess) {
				if (sourceBank.type === 'free') {
					hasAccess = true;
				} else if (user.subscription && user.subscription.plan === 'premium') {
					hasAccess = true;
				}
			}
		}

		if (!hasAccess) {
			return res.status(HTTP_STATUS.FORBIDDEN).json({
				error: 'You do not have access to copy questions from this bank',
			});
		}

		// Get the specific questions to copy
		const questionsToCopy = sourceBank.questions.filter(q =>
			questionIds.includes(q._id.toString())
		);

		if (questionsToCopy.length === 0) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'No valid questions found to copy',
			});
		}

		// Copy questions to target bank (without IDs to create new ones)
		const copiedQuestions = questionsToCopy.map(q => ({
			text: q.text,
			description: q.description,
			type: q.type,
			options: q.options,
			correctAnswer: q.correctAnswer,
			explanation: q.explanation,
			descriptionImage: q.descriptionImage,
			points: q.points,
			tags: [...q.tags, `copied-from-${sourceBank.title.toLowerCase().replace(/\s+/g, '-')}`],
			difficulty: q.difficulty,
		}));

		// Add questions to target bank
		targetBank.questions.push(...copiedQuestions);
		await targetBank.save();

		res.status(HTTP_STATUS.OK).json({
			success: true,
			message: `Successfully copied ${copiedQuestions.length} questions`,
			targetBank: {
				_id: targetBank._id,
				name: targetBank.name,
				questionCount: targetBank.questions.length,
			},
			copiedCount: copiedQuestions.length,
		});
	} catch (error) {
		console.error('Error copying questions from public bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to copy questions',
			details: error.message,
		});
	}
};
