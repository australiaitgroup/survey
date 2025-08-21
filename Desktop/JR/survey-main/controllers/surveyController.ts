import { Request, Response } from 'express';
import { surveyResponseSchema } from '../schemas/surveySchemas';
import { saveSurveyResponse } from '../services/surveyService';

export async function submitSurveyResponse(req: Request, res: Response) {
	const data = surveyResponseSchema.parse({ ...req.body, surveyId: req.params.surveyId });
	const saved = await saveSurveyResponse(data);
	res.json({ success: true, data: saved });
}
