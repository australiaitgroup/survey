const express = require('express');
const Collection = require('../models/Collection');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { HTTP_STATUS, ERROR_MESSAGES, VALID_COLLECTION_STATUSES } = require('../shared/constants');
const { collectionCreateSchema, collectionUpdateSchema } = require('../schemas/collectionSchemas');

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
		if (data.status && !VALID_COLLECTION_STATUSES.includes(data.status)) {
			throw new AppError(
				ERROR_MESSAGES.INVALID_COLLECTION_STATUS,
				HTTP_STATUS.BAD_REQUEST,
				'errors.invalidCollectionStatus'
			);
		}
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
