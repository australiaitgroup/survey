import { Request, Response } from 'express';
import { surveyResponseSchema } from '../schemas/surveySchemas';
import { saveSurveyResponse } from '../services/surveyService';

export async function submitSurveyResponse(req: Request, res: Response) {
	const base = surveyResponseSchema.parse({ ...req.body, surveyId: req.params.surveyId });

	// Enrich metadata with server-side info (trust server for IP/UA)
	const userAgent = (req.headers['user-agent'] as string) || '';
	const ipAddress =
		((req as any).ip as string) || ((req as any).connection?.remoteAddress as string) || '';
	const uaLower = userAgent.toLowerCase();
	const deviceType =
		uaLower.includes('mobile') || uaLower.includes('iphone') || uaLower.includes('android')
			? 'mobile'
			: uaLower.includes('ipad') || uaLower.includes('tablet')
				? 'tablet'
				: uaLower.includes('windows') ||
					  uaLower.includes('mac') ||
					  uaLower.includes('linux')
					? 'desktop'
					: 'unknown';

	const data = {
		...base,
		metadata: {
			...base.metadata,
			userAgent,
			ipAddress,
			deviceType,
		},
	};

	const saved = await saveSurveyResponse(data);
	res.json({ success: true, data: saved });
}
