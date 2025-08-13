const { z } = require('zod');
const { COLLECTION_STATUS } = require('../shared/constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const collectionCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional(),
	surveyIds: z.array(objectId).default([]).optional(),
	tags: z.array(z.string()).default([]).optional(),
	status: z
		.enum([COLLECTION_STATUS.DRAFT, COLLECTION_STATUS.ACTIVE, COLLECTION_STATUS.ARCHIVED])
		.default(COLLECTION_STATUS.DRAFT)
		.optional(),
});

const collectionUpdateSchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
	description: z.string().optional(),
	surveyIds: z.array(objectId).optional(),
	tags: z.array(z.string()).optional(),
	status: z.enum([COLLECTION_STATUS.DRAFT, COLLECTION_STATUS.ACTIVE, COLLECTION_STATUS.ARCHIVED]).optional(),
});

module.exports = { collectionCreateSchema, collectionUpdateSchema };
