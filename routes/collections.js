const express = require('express');
const Collection = require('../models/Collection');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../shared/constants');
const { collectionCreateSchema, collectionUpdateSchema, collectionSurveysUpdateSchema } = require('../schemas/collectionSchemas');

const router = express.Router();

// GET /api/collections
router.get(
	'/collections',
	asyncHandler(async (req, res) => {
		const items = await Collection.find({}).lean();
		res.json({ success: true, data: items });
	})
);

// POST /api/collections
router.post(
	'/collections',
	asyncHandler(async (req, res) => {
		const data = collectionCreateSchema.parse(req.body);
		const created = await Collection.create(data);
		res.status(HTTP_STATUS.CREATED).json({ success: true, data: created });
	})
);

// GET /api/collections/:id
router.get(
	'/collections/:id',
	asyncHandler(async (req, res) => {
		const item = await Collection.findById(req.params.id).lean();
		if (!item) throw new AppError(ERROR_MESSAGES.COLLECTION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, 'errors.collectionNotFound');
		res.json({ success: true, data: item });
	})
);

// PATCH /api/collections/:id
router.patch(
	'/collections/:id',
	asyncHandler(async (req, res) => {
		const data = collectionUpdateSchema.parse(req.body);
		const updated = await Collection.findByIdAndUpdate(req.params.id, data, { new: true });
		if (!updated)
			throw new AppError(ERROR_MESSAGES.COLLECTION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, 'errors.collectionNotFound');
		res.json({ success: true, data: updated });
	})
);

// DELETE /api/collections/:id
router.delete(
	'/collections/:id',
	asyncHandler(async (req, res) => {
		const deleted = await Collection.findByIdAndDelete(req.params.id);
		if (!deleted)
			throw new AppError(ERROR_MESSAGES.COLLECTION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, 'errors.collectionNotFound');
		res.json({ success: true, message: 'Collection deleted' });
	})
);

module.exports = router;

// PATCH /api/collections/:id/surveys - update surveyIds
router.patch(
  '/collections/:id/surveys',
  asyncHandler(async (req, res) => {
    const { surveyIds } = collectionSurveysUpdateSchema.parse(req.body);
    const updated = await Collection.findByIdAndUpdate(
      req.params.id,
      { surveyIds },
      { new: true }
    );
    if (!updated)
      throw new AppError(ERROR_MESSAGES.COLLECTION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, 'errors.collectionNotFound');
    res.json({ success: true, data: updated });
  })
);

// GET /api/collections/:id/stats - basic aggregated stats
router.get(
  '/collections/:id/stats',
  asyncHandler(async (req, res) => {
    const item = await Collection.findById(req.params.id).lean();
    if (!item)
      throw new AppError(ERROR_MESSAGES.COLLECTION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, 'errors.collectionNotFound');

    const surveyIds = (item.surveyIds || []).map(String);
    const totalSurveys = surveyIds.length;

    let totalQuestions = 0;
    let lastActivity = null;

    if (totalSurveys > 0) {
      const surveys = await Survey.find({ _id: { $in: surveyIds } }, { questions: 1, updatedAt: 1 }).lean();
      totalQuestions = surveys.reduce((sum, s) => sum + ((s.questions || []).length), 0);
      const surveyUpdated = surveys.map(s => s.updatedAt).filter(Boolean);

      const responses = await Response.find({ surveyId: { $in: surveyIds } }, { updatedAt: 1 }).lean();
      const responseUpdated = responses.map(r => r.updatedAt).filter(Boolean);

      const allDates = [...surveyUpdated, ...responseUpdated].map(d => new Date(d).getTime()).filter(n => !isNaN(n));
      if (allDates.length > 0) {
        lastActivity = new Date(Math.max(...allDates)).toISOString();
      }
    }

    const totalResponses = await Response.countDocuments(totalSurveys > 0 ? { surveyId: { $in: surveyIds } } : {});

    res.json({
      success: true,
      data: {
        totalSurveys,
        totalQuestions,
        totalResponses,
        lastActivity,
      },
    });
  })
);
