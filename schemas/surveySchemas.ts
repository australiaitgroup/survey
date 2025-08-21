import { z } from 'zod';

export const surveyResponseSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	surveyId: z.string().regex(/^[0-9a-fA-F]{24}$/),
	// Support both simple array answers and nested arrays for multiple choice
	answers: z.array(z.union([z.string(), z.array(z.string())])),
	// Optional timing and submission metadata
	timeSpent: z.number().min(0).optional(),
	isAutoSubmit: z.boolean().optional(),
	answerDurations: z.record(z.string(), z.number().int().min(0)).optional(),
	// Optional device/browser metadata (will also be enriched server-side)
	metadata: z
		.object({
			userAgent: z.string().optional(),
			ipAddress: z.string().optional(),
			deviceType: z.string().optional(),
		})
		.optional(),
});

export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
