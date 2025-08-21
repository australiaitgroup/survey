import { z } from 'zod';

export const surveyResponseSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	surveyId: z.string().regex(/^[0-9a-fA-F]{24}$/),
	answers: z.array(z.string()),
});

export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
