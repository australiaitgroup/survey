const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { readJson, writeJson } = require('../utils/file');
const { submitSurveyResponse } = require('../controllers/surveyController');
const asyncHandler = require('../middlewares/asyncHandler');
const Response = require('../models/Response');
const Survey = require('../models/Survey');

const router = express.Router();
const RESPONSES_FILE = path.join(__dirname, '..', 'responses.json');

router.post('/response', (req, res) => {
	const responses = readJson(RESPONSES_FILE);
	responses.push({
		...req.body,
		timestamp: new Date().toISOString(),
	});
	writeJson(RESPONSES_FILE, responses);
	res.json({ success: true });
});

// Handle survey responses with answer durations
router.post(
	'/responses',
	asyncHandler(async (req, res) => {
		const {
			name,
			email,
			surveyId,
			answers,
			timeSpent = 0,
			isAutoSubmit = false,
			answerDurations = {},
		} = req.body;

		// Validate required fields
		if (!name || !email || !surveyId || !answers) {
			return res.status(400).json({
				success: false,
				error: 'Missing required fields: name, email, surveyId, answers',
			});
		}

		// Get survey data
		const survey = await Survey.findById(surveyId).lean();
		if (!survey) {
			return res.status(404).json({
				success: false,
				error: 'Survey not found',
			});
		}

		// Get scoring settings
		const scoringSettings = survey.scoringSettings || {};
		const enablePartialScoring =
			scoringSettings.multipleChoiceScoring?.enablePartialScoring || false;
		const partialScoringMode =
			scoringSettings.multipleChoiceScoring?.partialScoringMode || 'proportional';
		const includeShortTextInScore =
			scoringSettings.includeShortTextInScore !== undefined
				? scoringSettings.includeShortTextInScore
				: false;

		// Create response with question snapshots including durations
		const questionSnapshots = survey.questions.map((question, index) => {
			// Ensure we use string keys when reading from plain objects
			const qid = String(question._id);
			const userAnswer = answers[qid];
			const duration = answerDurations[qid] || 0;

			// Calculate scoring
			let isCorrect = false;
			let pointsAwarded = 0;
			const maxPoints = question.points || 1;

			// Skip scoring for short_text if not included in score
			const shouldScore = question.type !== 'short_text' || includeShortTextInScore;

			if (shouldScore && question.correctAnswer !== undefined && userAnswer !== undefined) {
				if (question.type === 'single_choice') {
					const options = Array.isArray(question.options) ? question.options : [];
					const userOptionIndex = options.findIndex(opt =>
						typeof opt === 'string' ? opt === userAnswer : opt?.text === userAnswer
					);
					isCorrect = userOptionIndex === question.correctAnswer;
				} else if (
					question.type === 'multiple_choice' &&
					Array.isArray(userAnswer) &&
					Array.isArray(question.correctAnswer)
				) {
					const options = Array.isArray(question.options) ? question.options : [];
					const userOptionIndices = userAnswer
						.map(ans =>
							options.findIndex(opt =>
								typeof opt === 'string' ? opt === ans : opt?.text === ans
							)
						)
						.filter(idx => idx !== -1);
					const correctIndices = question.correctAnswer;

					if (enablePartialScoring && partialScoringMode === 'proportional') {
						// Partial scoring: calculate proportional points
						const correctSelections = userOptionIndices.filter(idx =>
							correctIndices.includes(idx)
						);
						const incorrectSelections = userOptionIndices.filter(
							idx => !correctIndices.includes(idx)
						);

						// Calculate score: (correct selections / total correct answers) * maxPoints
						// But subtract penalty for incorrect selections
						const correctRatio = correctSelections.length / correctIndices.length;
						const incorrectPenalty =
							incorrectSelections.length > 0 ? 0.1 * incorrectSelections.length : 0;

						// Ensure score is not negative
						const proportionalScore = Math.max(0, correctRatio - incorrectPenalty);
						pointsAwarded = Math.round(proportionalScore * maxPoints * 100) / 100; // Round to 2 decimal places

						// Consider it "correct" if they got more than 50% of the selections right with no wrong selections
						isCorrect = correctRatio >= 0.5 && incorrectSelections.length === 0;
					} else {
						// Traditional all-or-nothing scoring
						isCorrect =
							userOptionIndices.length === correctIndices.length &&
							userOptionIndices.every(idx => correctIndices.includes(idx));
					}
				} else if (question.type === 'short_text') {
					isCorrect = String(userAnswer).trim() === String(question.correctAnswer).trim();
				}

				// For non-partial scoring or when fully correct
				if (!enablePartialScoring || question.type !== 'multiple_choice') {
					if (isCorrect) {
						pointsAwarded = maxPoints;
					}
				}
			}

			return {
				questionId: question._id,
				questionIndex: index,
				questionData: {
					text: question.text,
					type: question.type,
					options: question.options || [],
					correctAnswer: question.correctAnswer,
					explanation: question.explanation || '',
					points: question.points || 1,
					tags: question.tags || [],
					difficulty: question.difficulty || 'medium',
				},
				userAnswer: userAnswer || null,
				scoring: {
					isCorrect,
					pointsAwarded,
					maxPoints: shouldScore ? maxPoints : 0, // Don't count towards total if not scoring
				},
				durationInSeconds: duration,
			};
		});

		// Calculate total score (only include questions that should be scored)
		const scorableQuestions = questionSnapshots.filter(q => q.scoring.maxPoints > 0);
		const totalPoints = questionSnapshots.reduce((sum, q) => sum + q.scoring.pointsAwarded, 0);
		const maxPossiblePoints = questionSnapshots.reduce(
			(sum, q) => sum + q.scoring.maxPoints,
			0
		);
		const correctAnswers = scorableQuestions.filter(q => q.scoring.isCorrect).length;
		const wrongAnswers = scorableQuestions.length - correctAnswers;
		const percentage =
			maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;

		// Create response document. Persist answers using string keys to match how
		// we read above and how admin analytics expect them later.
		const response = new Response({
			name,
			email,
			surveyId,
			answers: new Map(Object.entries(answers).map(([key, value]) => [String(key), value])),
			questionSnapshots,
			score: {
				totalPoints,
				correctAnswers,
				wrongAnswers,
				percentage,
				passed: percentage >= (survey.passingThreshold || 70),
				scoringMode: 'percentage',
				maxPossiblePoints,
				displayScore: percentage,
				scoringDetails: {
					questionScores: questionSnapshots.map(q => ({
						questionIndex: q.questionIndex,
						pointsAwarded: q.scoring.pointsAwarded,
						maxPoints: q.scoring.maxPoints,
						isCorrect: q.scoring.isCorrect,
					})),
				},
			},
			timeSpent,
			isAutoSubmit,
			metadata: {
				userAgent: req.headers['user-agent'] || '',
				ipAddress: req.ip || req.connection.remoteAddress || '',
				deviceType: (() => {
					const userAgent = (req.headers['user-agent'] || '').toLowerCase();
					if (
						userAgent.includes('mobile') ||
						userAgent.includes('android') ||
						userAgent.includes('iphone')
					) {
						return 'mobile';
					} else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
						return 'tablet';
					} else if (
						userAgent.includes('windows') ||
						userAgent.includes('mac') ||
						userAgent.includes('linux')
					) {
						return 'desktop';
					}
					return 'unknown';
				})(),
			},
		});

		await response.save();

		res.json({
			success: true,
			responseId: response._id,
			score: {
				totalPoints,
				maxPossiblePoints,
				percentage,
				correctAnswers,
				wrongAnswers,
				passed: response.score.passed,
			},
		});
	})
);

router.post('/surveys/:surveyId/responses', asyncHandler(submitSurveyResponse));

module.exports = router;
