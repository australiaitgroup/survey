const express = require('express');
const router = express.Router();
const questionBankController = require('../controllers/questionBankController');
const { jwtAuth } = require('../middlewares/jwtAuth');
const upload = require('../middlewares/upload');

// Utility routes (不需要登录)
router.get('/csv-template/download', questionBankController.downloadCSVTemplate);

// Apply JWT authentication middleware to all routes
router.use(jwtAuth);

// Question Bank routes
router.get('/', questionBankController.getAllQuestionBanks);
router.post('/', questionBankController.createQuestionBank);
router.get('/:id', questionBankController.getQuestionBank);
router.put('/:id', questionBankController.updateQuestionBank);
router.delete('/:id', questionBankController.deleteQuestionBank);

// Question management routes
router.post('/:id/questions', questionBankController.addQuestion);
router.put('/:id/questions/:questionId', questionBankController.updateQuestion);
router.delete('/:id/questions/:questionId', questionBankController.deleteQuestion);

// Utility routes (需要登录)
router.get('/:id/random-questions', questionBankController.getRandomQuestions);
router.post('/:id/import', questionBankController.importQuestions);
router.post(
	'/:id/import-csv',
	upload.single('csvFile'),
	questionBankController.importQuestionsFromCSV
);

// Multi-question selection routes
router.post('/multi-bank-questions', questionBankController.getQuestionsFromMultipleBanks);
router.get('/:id/questions', questionBankController.getQuestionBankQuestions);
router.get('/:bankId/questions/:questionId', questionBankController.getQuestionDetails);

// Copy questions from public banks
router.post('/:targetBankId/questions/copy', questionBankController.copyQuestionsFromPublicBank);

module.exports = router;
