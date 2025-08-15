const express = require('express');
const { asyncHandler, jwtAuth } = require('./shared/middleware');
const { Survey, Response, QuestionBank } = require('./shared/models');
const {
	HTTP_STATUS,
	ERROR_MESSAGES,
	AppError,
	readJson,
	RESPONSES_FILE,
} = require('./shared/constants');

const router = express.Router();

/**
 * @route   GET /admin/responses
 * @desc    Get all responses (from file and database)
 * @access  Private (Admin)
 */
router.get(
	'/responses',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const fileResponses = readJson(RESPONSES_FILE);
		const dbResponses = await Response.find().lean();
		res.json([...fileResponses, ...dbResponses]);
	})
);

/**
 * @route   DELETE /admin/responses/:responseId
 * @desc    Delete a specific response
 * @access  Private (Admin)
 */
router.delete(
	'/responses/:responseId',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { responseId } = req.params;
		const response = await Response.findById(responseId).populate('surveyId');
		if (!response) {
			throw new AppError('Response not found', HTTP_STATUS.NOT_FOUND);
		}
		const survey = response.surveyId;
		if (!survey || survey.createdBy.toString() !== req.user.id) {
			throw new AppError('Unauthorized to delete this response', HTTP_STATUS.FORBIDDEN);
		}
		await Response.deleteOne({ _id: responseId });
		res.json({ success: true, message: 'Response deleted' });
	})
);

/**
 * @route   GET /admin/responses/:responseId
 * @desc    Get detailed information for a specific candidate response
 * @access  Private (Admin)
 */
router.get(
	'/responses/:responseId',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { responseId } = req.params;

		// Find the response with populated survey data
		const response = await Response.findById(responseId).populate('surveyId').lean();

		if (!response) {
			throw new AppError('Response not found', HTTP_STATUS.NOT_FOUND);
		}

		// Check if the survey belongs to the current user
		const survey = response.surveyId;
		if (!survey || survey.createdBy.toString() !== req.user.id) {
			throw new AppError('Unauthorized to access this response', HTTP_STATUS.FORBIDDEN);
		}

		// Get questions based on survey type and available snapshots
		let questions = [];

		// Use question snapshots if available
		if (response.questionSnapshots && response.questionSnapshots.length > 0) {
			questions = response.questionSnapshots
				.sort((a, b) => a.questionIndex - b.questionIndex)
				.map(snapshot => ({
					...snapshot.questionData,
					userAnswer: snapshot.userAnswer,
					durationInSeconds: snapshot.durationInSeconds || 0,
					scoring: snapshot.scoring,
				}));
		} else {
			// Fallback to survey questions
			questions = survey.questions || [];
		}

		// Calculate detailed statistics
		const totalQuestions = questions.length;
		const answeredQuestions = questions.filter(
			q => q.userAnswer !== null && q.userAnswer !== undefined
		).length;
		const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

		// Calculate time statistics
		const totalTimeSpent = response.timeSpent || 0;
		const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

		// Question-level time statistics
		let questionTimeStats = {};
		if (response.questionSnapshots && response.questionSnapshots.length > 0) {
			const durations = response.questionSnapshots
				.filter(s => s.durationInSeconds !== undefined && s.durationInSeconds > 0)
				.map(s => s.durationInSeconds);

			if (durations.length > 0) {
				questionTimeStats = {
					fastest: Math.min(...durations),
					slowest: Math.max(...durations),
					average: durations.reduce((a, b) => a + b, 0) / durations.length,
					median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
				};
			}
		}

		// Format response data
		const responseData = {
			_id: response._id,
			candidateInfo: {
				name: response.name,
				email: response.email,
				submittedAt: response.createdAt,
				metadata: response.metadata || {},
			},
			surveyInfo: {
				_id: survey._id,
				title: survey.title,
				type: survey.type,
				description: survey.description,
			},
			statistics: {
				completion: {
					totalQuestions,
					answeredQuestions,
					skippedQuestions: totalQuestions - answeredQuestions,
					completionRate: Math.round(completionRate * 100) / 100,
				},
				timing: {
					totalTimeSpent,
					averageTimePerQuestion: Math.round(averageTimePerQuestion * 100) / 100,
					isAutoSubmit: response.isAutoSubmit || false,
					questionTimeStats,
				},
			},
			score: null,
			questionDetails: [],
		};

		// Add scoring information if applicable
		if (response.score && ['quiz', 'assessment', 'iq'].includes(survey.type)) {
			responseData.score = {
				totalPoints: response.score.totalPoints || 0,
				maxPossiblePoints: response.score.maxPossiblePoints || 0,
				correctAnswers: response.score.correctAnswers || 0,
				wrongAnswers: response.score.wrongAnswers || 0,
				percentage: response.score.percentage || 0,
				displayScore: response.score.displayScore || 0,
				scoringMode: response.score.scoringMode || 'percentage',
				passed: response.score.passed || false,
			};
		}

		// Add detailed question-by-question information
		if (response.questionSnapshots && response.questionSnapshots.length > 0) {
			responseData.questionDetails = response.questionSnapshots
				.sort((a, b) => a.questionIndex - b.questionIndex)
				.map(snapshot => ({
					questionIndex: snapshot.questionIndex,
					questionText: snapshot.questionData.text,
					questionType: snapshot.questionData.type,
					options: snapshot.questionData.options || [],
					userAnswer: snapshot.userAnswer,
					correctAnswer: snapshot.questionData.correctAnswer,
					isCorrect: snapshot.scoring?.isCorrect || false,
					pointsAwarded: snapshot.scoring?.pointsAwarded || 0,
					maxPoints: snapshot.scoring?.maxPoints || 1,
					timeSpent: snapshot.durationInSeconds || 0,
					difficulty: snapshot.questionData.difficulty || 'medium',
					tags: snapshot.questionData.tags || [],
					explanation: snapshot.questionData.explanation || null,
				}));
		} else {
			// Fallback for responses without snapshots
			responseData.questionDetails = questions.map((q, idx) => {
				let userAnswer = null;

				if (response.answers) {
					if (typeof response.answers.get === 'function') {
						userAnswer =
							response.answers.get(idx.toString()) ||
							response.answers.get(q._id?.toString());
					} else if (typeof response.answers === 'object') {
						userAnswer = response.answers[idx.toString()] || response.answers[q._id];
					}
				}

				return {
					questionIndex: idx,
					questionText: q.text,
					questionType: q.type,
					options: q.options || [],
					userAnswer: userAnswer,
					correctAnswer: q.correctAnswer,
					isCorrect: false,
					pointsAwarded: 0,
					maxPoints: q.points || 1,
					timeSpent: 0,
					difficulty: q.difficulty || 'medium',
					tags: q.tags || [],
					explanation: q.explanation || null,
				};
			});
		}

		res.json(responseData);
	})
);

/**
 * @route   GET /admin/surveys/:surveyId/statistics
 * @desc    Get detailed statistics for a specific survey
 * @access  Private (Admin)
 */
router.get(
	'/surveys/:surveyId/statistics',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { surveyId } = req.params;
		const { name, email, fromDate, toDate, status } = req.query;

		const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user.id }).lean();
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Build filter query for responses
		let responseFilter = { surveyId };

		// Filter by name (fuzzy match)
		if (name) {
			responseFilter.name = { $regex: name, $options: 'i' };
		}

		// Filter by email (fuzzy match)
		if (email) {
			responseFilter.email = { $regex: email, $options: 'i' };
		}

		// Filter by date range (treat toDate as end-of-day inclusive)
		if (fromDate || toDate) {
			responseFilter.createdAt = {};
			if (fromDate) {
				const start = new Date(fromDate);
				// Normalize to start of day
				start.setHours(0, 0, 0, 0);
				responseFilter.createdAt.$gte = start;
			}
			if (toDate) {
				const endExclusive = new Date(toDate);
				// Move to next day start to make original day inclusive
				endExclusive.setHours(0, 0, 0, 0);
				endExclusive.setDate(endExclusive.getDate() + 1);
				responseFilter.createdAt.$lt = endExclusive;
			}
		}

		// Filter by completion status
		if (status) {
			if (status === 'completed') {
				// For assessments, check questionSnapshots; for surveys, check answers
				if (survey.type === 'assessment') {
					// Assessment responses are considered completed if they have questionSnapshots
					responseFilter.questionSnapshots = { $exists: true, $ne: [] };
				} else {
					// Responses with at least one non-empty answer
					responseFilter.answers = { $exists: true, $ne: {} };
				}
			} else if (status === 'incomplete') {
				// This is tricky to filter at DB level, we'll handle it after fetching
			}
		}

		let responses = await Response.find(responseFilter).sort({ createdAt: -1 }).lean();

		// Filter incomplete responses if needed (post-processing)
		if (status === 'incomplete') {
			responses = responses.filter(response => {
				if (survey.type === 'assessment') {
					// For assessments, check questionSnapshots
					if (!response.questionSnapshots || response.questionSnapshots.length === 0) {
						return true; // No question snapshots = incomplete
					}
					// Check if all answers in snapshots are empty
					const hasAnswers = response.questionSnapshots.some(snapshot => {
						const answer = snapshot.userAnswer;
						if (answer === null || answer === undefined || answer === '') {
							return false;
						}
						if (Array.isArray(answer) && answer.length === 0) {
							return false;
						}
						return true;
					});
					return !hasAnswers; // Return incomplete responses
				} else {
					// For surveys, check answers field
					if (!response.answers || typeof response.answers !== 'object') {
						return true; // No answers = incomplete
					}

					// Check if all answers are empty/null/undefined
					const hasAnswers = Object.values(response.answers).some(answer => {
						if (answer === null || answer === undefined || answer === '') {
							return false;
						}
						if (Array.isArray(answer) && answer.length === 0) {
							return false;
						}
						return true;
					});

					return !hasAnswers; // Return incomplete responses
				}
			});
		}

		// Get questions based on survey type and available snapshots
		let questions = [];
		let useSnapshots = false;

		// Check if we have responses with question snapshots
		const responsesWithSnapshots = responses.filter(
			r => r.questionSnapshots && r.questionSnapshots.length > 0
		);

		if (responsesWithSnapshots.length > 0) {
			// Use snapshots from the first response to get question structure
			// This ensures we use the exact questions that were presented to users
			const firstResponseWithSnapshots = responsesWithSnapshots[0];
			questions = firstResponseWithSnapshots.questionSnapshots
				.sort((a, b) => a.questionIndex - b.questionIndex)
				.map(snapshot => snapshot.questionData);
			useSnapshots = true;

			console.log(`Using question snapshots from ${responsesWithSnapshots.length} responses`);
		} else {
			// Fallback to survey questions (legacy method)
			if (survey.sourceType === 'question_bank' && survey.questionBankId) {
				// Single question bank
				const questionBank = await QuestionBank.findById(survey.questionBankId).lean();
				if (questionBank) {
					questions = questionBank.questions || [];
				}
			} else if (
				survey.sourceType === 'multi_question_bank' &&
				survey.multiQuestionBankConfig
			) {
				// Multiple question banks
				const questionBankIds = survey.multiQuestionBankConfig.map(
					config => config.questionBankId
				);
				const questionBanks = await QuestionBank.find({
					_id: { $in: questionBankIds },
				}).lean();
				questions = questionBanks.reduce((allQuestions, qb) => {
					return allQuestions.concat(qb.questions || []);
				}, []);
			} else {
				// Manual questions
				questions = survey.questions || [];
			}

			console.log(`Using survey questions (legacy method)`);
		}

		// Calculate aggregated statistics
		const stats = questions.map((q, questionIndex) => {
			const counts = {};
			const normalizeOptionText = opt => {
				if (typeof opt === 'string') {
					// Handle stringified object like "{\n  text: '4', ... }"
					if (opt.includes('text:')) {
						const m = opt.match(/text:\s*'([^']+)'/);
						return m ? m[1] : opt;
					}
					return opt;
				}
				return (opt && opt.text) || '';
			};
			if (q.options && q.options.length > 0) {
				q.options.forEach(opt => {
					counts[normalizeOptionText(opt)] = 0;
				});
			}

			responses.forEach(r => {
				let ans = null;
				let userAnswer = null;

				if (useSnapshots && r.questionSnapshots && r.questionSnapshots.length > 0) {
					// Use snapshot data
					const snapshot = r.questionSnapshots.find(
						s => s.questionIndex === questionIndex
					);
					if (snapshot) {
						userAnswer = snapshot.userAnswer;
						if (snapshot.userAnswer !== null && snapshot.userAnswer !== undefined) {
							if (Array.isArray(snapshot.userAnswer)) {
								snapshot.userAnswer.forEach(answer => {
									const key =
										typeof answer === 'string'
											? answer
											: normalizeOptionText(answer);
									if (counts.hasOwnProperty(key)) counts[key] += 1;
								});
							} else {
								const key =
									typeof snapshot.userAnswer === 'string'
										? snapshot.userAnswer
										: normalizeOptionText(snapshot.userAnswer);
								if (counts.hasOwnProperty(key)) counts[key] += 1;
							}
						}
					}
				} else {
					// Legacy method - handle different answer formats
					if (Array.isArray(r.answers)) {
						// Array format: answers is an array of strings
						ans = r.answers[questionIndex];
					} else if (r.answers && typeof r.answers.get === 'function') {
						// Map format: answers is a Map object
						ans = r.answers.get(questionIndex.toString());
						if (ans === undefined || ans === null) {
							ans = r.answers.get(q._id.toString());
						}
						if (ans === undefined || ans === null) {
							ans = r.answers.get(q.text);
						}
					} else if (typeof r.answers === 'object' && r.answers !== null) {
						// Object format: answers is a plain object
						ans = r.answers[questionIndex.toString()];
						if (ans === undefined || ans === null) {
							ans = r.answers[q._id];
						}
						if (ans === undefined || ans === null) {
							ans = r.answers[q.text];
						}
					}

					// Debug: Print answer processing
					console.log(
						`Response ${r._id}, Question ${questionIndex}: raw answer = ${ans}, type = ${typeof ans}`
					);

					if (ans !== undefined && ans !== null) {
						// Handle different answer value formats
						if (
							typeof ans === 'number' ||
							(typeof ans === 'string' && /^\d+$/.test(ans))
						) {
							const idx = typeof ans === 'number' ? ans : parseInt(ans, 10);
							if (idx >= 0 && idx < (q.options || []).length) {
								const key = normalizeOptionText(q.options[idx]);
								counts[key] += 1;
								console.log(`  -> Counted: ${key} (index ${idx})`);
							} else {
								console.log(
									`  -> Invalid index: ${idx}, options length: ${(q.options || []).length}`
								);
							}
						} else if (Array.isArray(ans)) {
							// Multiple choice: ans is array of option indices
							ans.forEach(optionIndex => {
								const idx =
									typeof optionIndex === 'number'
										? optionIndex
										: parseInt(optionIndex, 10);
								if (idx >= 0 && idx < (q.options || []).length) {
									const key = normalizeOptionText(q.options[idx]);
									counts[key] += 1;
								}
							});
						} else if (typeof ans === 'string') {
							// Direct string answer
							const key = normalizeOptionText(ans);
							if (counts.hasOwnProperty(key)) counts[key] += 1;
						}
					} else {
						console.log(`  -> No answer found`);
					}
				}
			});
			return { question: q.text, options: counts };
		});

		// Prepare individual user responses
		const userResponses = responses.map(response => {
			const userAnswers = {};
			let responseQuestions = questions;
			let useResponseSnapshots = false;

			// Check if this response has snapshots
			if (response.questionSnapshots && response.questionSnapshots.length > 0) {
				responseQuestions = response.questionSnapshots
					.sort((a, b) => a.questionIndex - b.questionIndex)
					.map(snapshot => snapshot.questionData);
				useResponseSnapshots = true;
			} else if (
				['question_bank', 'multi_question_bank', 'manual_selection'].includes(
					survey.sourceType
				) &&
				response.selectedQuestions &&
				response.selectedQuestions.length > 0
			) {
				// Legacy method for question bank surveys
				responseQuestions = response.selectedQuestions
					.map(sq => sq.questionData)
					.filter(Boolean);
			}

			responseQuestions.forEach((q, questionIndex) => {
				let ans = null;

				if (useResponseSnapshots) {
					// Use snapshot data
					const snapshot = response.questionSnapshots.find(
						s => s.questionIndex === questionIndex
					);
					if (snapshot) {
						ans = snapshot.userAnswer;
					}
				} else {
					// Legacy method - handle different answer formats
					if (Array.isArray(response.answers)) {
						ans = response.answers[questionIndex];
					} else if (response.answers && typeof response.answers.get === 'function') {
						ans = response.answers.get(questionIndex.toString());
						if (ans === undefined || ans === null) {
							ans = response.answers.get(q._id ? q._id.toString() : '');
						}
						if (ans === undefined || ans === null) {
							ans = response.answers.get(q.text);
						}
					} else if (typeof response.answers === 'object' && response.answers !== null) {
						ans = response.answers[questionIndex.toString()];
						if (ans === undefined || ans === null) {
							ans = response.answers[q._id];
						}
						if (ans === undefined || ans === null) {
							ans = response.answers[q.text];
						}
					}
				}

				// Format the answer for display
				let formattedAnswer = 'No answer';
				if (ans !== undefined && ans !== null) {
					if (useResponseSnapshots) {
						// Use snapshot data directly
						if (Array.isArray(ans)) {
							formattedAnswer = ans.join(', ');
						} else {
							formattedAnswer = ans;
						}
					} else {
						// Legacy formatting
						if (
							typeof ans === 'number' ||
							(typeof ans === 'string' && /^\d+$/.test(ans))
						) {
							const idx = typeof ans === 'number' ? ans : parseInt(ans, 10);
							if (idx >= 0 && idx < (q.options || []).length) {
								formattedAnswer = q.options[idx];
							}
						} else if (Array.isArray(ans)) {
							const selectedOptions = ans
								.map(optionIndex =>
									typeof optionIndex === 'number'
										? optionIndex
										: parseInt(optionIndex, 10)
								)
								.filter(
									optionIndex =>
										optionIndex >= 0 && optionIndex < (q.options || []).length
								)
								.map(optionIndex => q.options[optionIndex]);
							formattedAnswer =
								selectedOptions.length > 0
									? selectedOptions.join(', ')
									: 'No answer';
						} else if (typeof ans === 'string') {
							formattedAnswer = ans;
						}
					}
				}

				userAnswers[q.text] = formattedAnswer;
			});

			// Prepare response object with score information
			const responseData = {
				_id: response._id,
				name: response.name,
				email: response.email,
				answers: userAnswers,
				createdAt: response.createdAt,
				timeSpent: response.timeSpent || 0,
				isAutoSubmit: response.isAutoSubmit || false,
			};

			// Add score information for quiz/assessment/iq types
			if (response.score && ['quiz', 'assessment', 'iq'].includes(survey.type)) {
				responseData.score = {
					totalPoints: response.score.totalPoints || 0,
					correctAnswers: response.score.correctAnswers || 0,
					wrongAnswers: response.score.wrongAnswers || 0,
					percentage: response.score.percentage || 0,
					displayScore: response.score.displayScore || 0,
					scoringMode: response.score.scoringMode || 'percentage',
					maxPossiblePoints: response.score.maxPossiblePoints || 0,
					passed: response.score.passed || false,
					formattedScore: response.formattedScore,
				};
			}

			return responseData;
		});

		// Calculate total responses and completion rate
		const totalResponses = responses.length;
		const completionRate =
			questions.length > 0
				? (userResponses.filter(r =>
					Object.values(r.answers).some(ans => ans !== 'No answer')
				).length /
						totalResponses) *
					100
				: 0;

		res.json({
			aggregatedStats: stats,
			userResponses: userResponses,
			summary: {
				totalResponses,
				completionRate: parseFloat(completionRate.toFixed(2)),
				totalQuestions: questions.length,
			},
		});
	})
);

module.exports = router;
