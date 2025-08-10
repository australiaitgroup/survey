const ResponseModel = require('../models/Response');
const SurveyModel = require('../models/Survey');
const { TYPES_REQUIRING_ANSWERS } = require('../shared/constants');

async function saveSurveyResponse(data) {
	// Get the survey to check if it requires scoring
	const survey = await SurveyModel.findById(data.surveyId);
	if (!survey) {
		throw new Error('Survey not found');
	}

	// Check if user already has a response (for bank-based surveys)
	let existingResponse = null;
	const bankBasedSources = ['question_bank', 'multi_question_bank', 'manual_selection'];
	if (bankBasedSources.includes(survey.sourceType)) {
		existingResponse = await ResponseModel.findOne({
			surveyId: data.surveyId,
			email: data.email,
		});
	}

	// Process answers to convert new format (string values) to old format (indices)
	const processedAnswers = new Map();

	// For bank-based surveys, we need to use the selectedQuestions
	let questionsToProcess = survey.questions;
	if (
		bankBasedSources.includes(survey.sourceType) &&
		existingResponse &&
		Array.isArray(existingResponse.selectedQuestions) &&
		existingResponse.selectedQuestions.length > 0
	) {
		questionsToProcess = existingResponse.selectedQuestions.map(sq => sq.questionData);
	}

	// Prepare user answers array for snapshot creation
	const userAnswersArray = [];

	if (Array.isArray(data.answers)) {
		// New format: array of answers (string values)
		data.answers.forEach((answer, index) => {
			userAnswersArray[index] = answer;
			if (answer !== null && answer !== undefined && answer !== '') {
				const question = questionsToProcess[index];
				if (question) {
					if (question.type === 'single_choice') {
						// Find the index of the selected option
						let optionIndex = question.options.indexOf(answer);

						// If not found, check if options are objects with text property or stringified objects
						if (optionIndex === -1) {
							optionIndex = question.options.findIndex(opt => {
								if (typeof opt === 'object') {
									return opt.text === answer;
								} else if (
									typeof opt === 'string' &&
									opt.startsWith('{') &&
									opt.includes('text:')
								) {
									try {
										const textMatch = opt.match(/text:\s*'([^']+)'/);
										return textMatch ? textMatch[1] === answer : opt === answer;
									} catch (e) {
										return opt === answer;
									}
								} else {
									return opt === answer;
								}
							});
						}

						if (optionIndex !== -1) {
							processedAnswers.set(index.toString(), optionIndex);
						}
					} else if (question.type === 'multiple_choice' && Array.isArray(answer)) {
						// Find the indices of the selected options
						const optionIndices = answer
							.map(opt => {
								let idx = question.options.indexOf(opt);
								// If not found, check if options are objects with text property or stringified objects
								if (idx === -1) {
									idx = question.options.findIndex(option => {
										if (typeof option === 'object') {
											return option.text === opt;
										} else if (
											typeof option === 'string' &&
											option.startsWith('{') &&
											option.includes('text:')
										) {
											try {
												const textMatch = option.match(/text:\s*'([^']+)'/);
												return textMatch
													? textMatch[1] === opt
													: option === opt;
											} catch (e) {
												return option === opt;
											}
										} else {
											return option === opt;
										}
									});
								}
								return idx;
							})
							.filter(idx => idx !== -1);
						if (optionIndices.length > 0) {
							processedAnswers.set(index.toString(), optionIndices);
						}
					} else if (question.type === 'short_text' && typeof answer === 'string') {
						// For short text, persist the raw string so statistics can evaluate correctness
						processedAnswers.set(index.toString(), answer.trim());
					}
				}
			}
		});
	} else {
		// Old format: object with question IDs as keys
		Object.entries(data.answers).forEach(([questionId, answer]) => {
			const index = parseInt(questionId, 10);
			userAnswersArray[index] = answer;
			if (answer !== null && answer !== undefined && answer !== '') {
				processedAnswers.set(questionId, answer);
			}
		});
	}

	let response;

	if (existingResponse) {
		// Update existing response
		existingResponse.name = data.name;
		existingResponse.answers = processedAnswers;
		existingResponse.timeSpent = data.timeSpent || 0;
		existingResponse.isAutoSubmit = data.isAutoSubmit || false;
		existingResponse.metadata = data.metadata || {};

		// Create question snapshots for the updated response
		if (questionsToProcess.length > 0) {
			existingResponse.createQuestionSnapshots(questionsToProcess, userAnswersArray);
		}

		response = existingResponse;
	} else {
		// Create new response
		response = new ResponseModel({
			...data,
			answers: processedAnswers,
		});

		// Create question snapshots for the new response
		if (questionsToProcess.length > 0) {
			response.createQuestionSnapshots(questionsToProcess, userAnswersArray);
		}
	}

	// Calculate score if it's a quiz/assessment/iq
	if (survey.requiresAnswers) {
		response.calculateScore(survey);
	}

	// Save the response
	await response.save();

	// For assessments, return the response with scoring data
	if (survey.requiresAnswers) {
		// Re-fetch the response to ensure all computed fields are included
		const savedResponse = await ResponseModel.findById(response._id).lean();
		return savedResponse;
	}

	return response.toObject();
}

async function getSurveyResponses(surveyId, includeScores = false) {
	const query = ResponseModel.find({ surveyId });

	if (includeScores) {
		// Include all response data including scores
		return await query.exec();
	} else {
		// Exclude sensitive scoring information for regular surveys
		return await query.select('-score').exec();
	}
}

async function getSurveyStatistics(surveyId) {
	const survey = await SurveyModel.findById(surveyId);
	if (!survey) {
		throw new Error('Survey not found');
	}

	const responses = await ResponseModel.find({ surveyId });
	const totalResponses = responses.length;

	if (totalResponses === 0) {
		return {
			totalResponses: 0,
			averageScore: 0,
			passRate: 0,
			questionStatistics: [],
		};
	}

	// Calculate statistics
	const statistics = {
		totalResponses,
		averageScore: 0,
		passRate: 0,
		questionStatistics: [],
	};

	// Calculate scoring statistics for quiz/assessment/iq
	if (survey.requiresAnswers) {
		const totalScore = responses.reduce(
			(sum, response) => sum + (response.score?.percentage || 0),
			0
		);
		statistics.averageScore = Math.round((totalScore / totalResponses) * 100) / 100;

		const passedCount = responses.filter(response => response.score?.passed || false).length;
		statistics.passRate = Math.round((passedCount / totalResponses) * 100 * 100) / 100;
	}

	// Calculate question-level statistics
	survey.questions.forEach((question, questionIndex) => {
		const questionStats = {
			questionIndex,
			questionText: question.text,
			questionType: question.type,
			totalAnswers: 0,
			optionStatistics: [],
			correctAnswerRate: 0,
		};

		// Initialize option statistics (only for choice questions)
		if (Array.isArray(question.options)) {
			question.options.forEach((option, optionIndex) => {
				const optionText = typeof option === 'string' ? option : (option?.text ?? '');
				questionStats.optionStatistics.push({
					optionIndex,
					optionText,
					count: 0,
					percentage: 0,
				});
			});
		}

		// Count answers for each option (choice questions only)
		responses.forEach(response => {
			const answer = response.answers.get(questionIndex.toString());
			if (answer !== undefined && answer !== null) {
				questionStats.totalAnswers++;

				if (question.type === 'single_choice') {
					if (
						typeof answer === 'number' &&
						answer < questionStats.optionStatistics.length
					) {
						questionStats.optionStatistics[answer].count++;
					}
				} else if (question.type === 'multiple_choice') {
					if (Array.isArray(answer)) {
						answer.forEach(optionIndex => {
							if (optionIndex < questionStats.optionStatistics.length) {
								questionStats.optionStatistics[optionIndex].count++;
							}
						});
					}
				}
			}
		});

		// Calculate percentages
		if (questionStats.totalAnswers > 0) {
			questionStats.optionStatistics.forEach(optionStat => {
				optionStat.percentage =
					Math.round((optionStat.count / questionStats.totalAnswers) * 100 * 100) / 100;
			});
		}

		// Calculate correct answer rate for quiz/assessment/iq
		if (survey.requiresAnswers && question.correctAnswer !== null) {
			let correctCount = 0;

			responses.forEach(response => {
				const answer = response.answers.get(questionIndex.toString());
				if (answer !== undefined && answer !== null) {
					let isCorrect = false;

					if (question.type === 'single_choice') {
						isCorrect = answer === question.correctAnswer;
					} else if (question.type === 'multiple_choice') {
						if (Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
							const userSet = new Set(answer.sort());
							const correctSet = new Set(question.correctAnswer.sort());
							isCorrect =
								userSet.size === correctSet.size &&
								[...userSet].every(val => correctSet.has(val));
						}
					} else if (question.type === 'short_text') {
						// Compare trimmed strings for short text questions
						const userText = String(answer).trim();
						const correctText = String(question.correctAnswer ?? '').trim();
						isCorrect = userText === correctText;
					}

					if (isCorrect) {
						correctCount++;
					}
				}
			});

			questionStats.correctAnswerRate =
				questionStats.totalAnswers > 0
					? Math.round((correctCount / questionStats.totalAnswers) * 100 * 100) / 100
					: 0;
		}

		statistics.questionStatistics.push(questionStats);
	});

	return statistics;
}

module.exports = {
	saveSurveyResponse,
	getSurveyResponses,
	getSurveyStatistics,
};
