const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const collectionCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional(),
	surveyIds: z.array(objectId).default([]).optional(),
	tags: z.array(z.string()).default([]).optional(),
});

const collectionUpdateSchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
	description: z.string().optional(),
	surveyIds: z.array(objectId).optional(),
	tags: z.array(z.string()).optional(),
});

// Additional schema for updating surveys
const collectionSurveysUpdateSchema = z.object({
	surveyIds: z.array(objectId).default([]),
});

module.exports = { collectionCreateSchema, collectionUpdateSchema, collectionSurveysUpdateSchema };
