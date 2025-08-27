const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');

// GET /api/employee-training/:templateId/progress
// 获取员工培训进度
router.get(
	'/:templateId/progress',
	asyncHandler(async (req, res) => {
		const { templateId } = req.params;
		const { employeeId } = req.query;

		if (!employeeId) {
			throw new AppError('Employee ID is required', 400);
		}

		// 查找对应的 onboarding survey
		const survey = await Survey.findOne({
			slug: templateId,
			surveyType: 'onboarding',
		}).populate('questions');

		if (!survey) {
			throw new AppError('Training template not found', 404);
		}

		// TODO: 从 EmployeeProgress 模型获取实际进度
		// 现在返回默认状态
		res.json({
			status: 'not_started',
			template: survey,
			currentSection: null,
			currentQuestion: 0,
			answers: {},
			attempts: {},
			completedSections: [],
			startedAt: null,
		});
	})
);

// POST /api/employee-training/:templateId/start
// 开始新的员工培训
router.post(
	'/:templateId/start',
	asyncHandler(async (req, res) => {
		const { templateId } = req.params;
		const { employeeId, name, email } = req.body;

		if (!employeeId || !name || !email) {
			throw new AppError('Employee ID, name, and email are required', 400);
		}

		// 查找对应的 onboarding survey
		const survey = await Survey.findOne({
			slug: templateId,
			surveyType: 'onboarding',
		}).populate('questions');

		if (!survey) {
			throw new AppError('Training template not found', 404);
		}

		// TODO: 创建或更新 EmployeeProgress 记录
		// 现在直接返回模板数据
		res.json({
			success: true,
			template: survey,
			message: 'Training started successfully',
		});
	})
);

// POST /api/employee-training/:templateId/submit-answer
// 提交答案
router.post(
	'/:templateId/submit-answer',
	asyncHandler(async (req, res) => {
		const { templateId } = req.params;
		const { employeeId, questionId, answer, sectionIndex, questionIndex } = req.body;

		if (!employeeId || !questionId || !answer) {
			throw new AppError('Employee ID, question ID, and answer are required', 400);
		}

		// 查找对应的 onboarding survey
		const survey = await Survey.findOne({
			slug: templateId,
			surveyType: 'onboarding',
		}).populate('questions');

		if (!survey) {
			throw new AppError('Training template not found', 404);
		}

		// 查找问题
		const question = survey.questions.find(q => q._id.toString() === questionId);
		if (!question) {
			throw new AppError('Question not found', 404);
		}

		// 检查答案是否正确
		const isCorrect = checkAnswer(question, answer);

		// 计算下一个问题和模块
		const nextQuestion = questionIndex + 1;
		const nextSection = nextQuestion >= survey.questions.length ? sectionIndex + 1 : undefined;
		const completed = nextSection >= survey.onboardingSettings?.sections?.length;

		// TODO: 更新 EmployeeProgress 记录

		res.json({
			success: true,
			isCorrect,
			explanation: question.explanation,
			nextQuestion: nextQuestion < survey.questions.length ? nextQuestion : 0,
			nextSection,
			completed,
		});
	})
);

// POST /api/employee-training/:templateId/complete-section
// 完成模块
router.post(
	'/:templateId/complete-section',
	asyncHandler(async (req, res) => {
		const { templateId } = req.params;
		const { employeeId, sectionId, sectionIndex } = req.body;

		if (!employeeId || !sectionId) {
			throw new AppError('Employee ID and section ID are required', 400);
		}

		// TODO: 更新 EmployeeProgress 记录，标记模块完成

		res.json({
			success: true,
			message: 'Section completed successfully',
		});
	})
);

// 辅助函数：检查答案是否正确
function checkAnswer(question, userAnswer) {
	if (question.type === 'single_choice') {
		return userAnswer === question.correctAnswer;
	} else if (question.type === 'multiple_choice') {
		if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
			return (
				userAnswer.length === question.correctAnswer.length &&
				userAnswer.every(ans => question.correctAnswer.includes(ans))
			);
		}
		return false;
	} else if (question.type === 'short_text') {
		// 简单的文本匹配，可以扩展为更复杂的逻辑
		return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
	}
	return false;
}

module.exports = router;
