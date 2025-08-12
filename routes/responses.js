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

			if (question.correctAnswer !== undefined && userAnswer !== undefined) {
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
					isCorrect =
						userOptionIndices.length === correctIndices.length &&
						userOptionIndices.every(idx => correctIndices.includes(idx));
				} else if (question.type === 'short_text') {
					isCorrect = String(userAnswer).trim() === String(question.correctAnswer).trim();
				}

				if (isCorrect) {
					pointsAwarded = maxPoints;
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
					maxPoints,
				},
				durationInSeconds: duration,
			};
		});

		// Calculate total score
		const totalPoints = questionSnapshots.reduce((sum, q) => sum + q.scoring.pointsAwarded, 0);
		const maxPossiblePoints = questionSnapshots.reduce(
			(sum, q) => sum + q.scoring.maxPoints,
			0
		);
		const correctAnswers = questionSnapshots.filter(q => q.scoring.isCorrect).length;
		const wrongAnswers = questionSnapshots.length - correctAnswers;
		const percentage =
			maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;

        // Create response document. Persist answers using string keys to match how
        // we read above and how admin analytics expect them later.
        const response = new Response({
			name,
			email,
			surveyId,
            answers: new Map(
                Object.entries(answers).map(([key, value]) => [String(key), value])
            ),
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
