'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.surveyResponseSchema = void 0;
const zod_1 = require('zod');
exports.surveyResponseSchema = zod_1.z.object({
	name: zod_1.z.string(),
	email: zod_1.z.string().email(),
	surveyId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/),
	answers: zod_1.z.array(zod_1.z.string()),
});
