import ResponseModel from '../models/Response';
import { SurveyResponse } from '../schemas/surveySchemas';

export async function saveSurveyResponse(data: SurveyResponse) {
	const response = await ResponseModel.create(data);
	return response.toObject();
}
