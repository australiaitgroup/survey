const express = require('express');
const path = require('path');
const { readJson, writeJson } = require('../utils/file');
const { ERROR_MESSAGES, DATA_TYPES, HTTP_STATUS } = require('../shared/constants');

const router = express.Router();
const QUESTIONS_FILE = path.join(__dirname, '..', 'questions.json');

router.get('/questions', (req, res) => {
	const questions = readJson(QUESTIONS_FILE);
	res.json(questions);
});

router.put('/questions', (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const { text, options } = req.body;
	if (
		typeof text !== DATA_TYPES.STRING ||
		!Array.isArray(options) ||
		!options.every(o => typeof o === DATA_TYPES.STRING)
	) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_DATA });
	}
	const questions = readJson(QUESTIONS_FILE);
	const id = 'q' + (questions.length + 1);
	const newQuestion = { id, text, options };
	questions.push(newQuestion);
	writeJson(QUESTIONS_FILE, questions);
	res.json(newQuestion);
});

module.exports = router;
