import api from '../../../utils/axiosConfig';
import type { Question, Survey } from '../../../types/admin';

interface UseQuestionReorderParams {
	survey: Survey;
	setLoading: (v: boolean) => void;
	setError: (msg: string) => void;
	setSurveys: (updater: any) => void;
	setSelectedSurvey: (s: Survey) => void;
	loadSurveys: () => Promise<void>;
	t: (k: string, v?: any) => string;
}

export const useQuestionReorder = ({
	survey,
	setLoading,
	setError,
	setSurveys,
	setSelectedSurvey,
	loadSurveys,
	t,
}: UseQuestionReorderParams) => {
	const handleQuestionsReorder = async (surveyId: string, newQuestions: Question[]) => {
		setLoading(true);
		const questionIds = newQuestions.map(q => q._id).filter(id => id != null);
		if (questionIds.length !== newQuestions.length) {
			setError('Some questions are missing IDs - cannot reorder');
			setLoading(false);
			return;
		}
		const validIds = questionIds.every(id => typeof id === 'string' && id.length > 0);
		if (!validIds) {
			setError('Invalid question IDs detected');
			setLoading(false);
			return;
		}
		try {
			await api.patch(`/admin/surveys/${surveyId}/questions-reorder`, { questionIds });
			const updatedSurvey = { ...survey, questions: newQuestions } as Survey;
			setSurveys((prev: Survey[]) => prev.map(s => (s._id === surveyId ? updatedSurvey : s)));
			setSelectedSurvey(updatedSurvey);
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error ||
				err.response?.data?.message ||
				'Failed to reorder questions. Please try again.';
			setError(t('survey.questions.reorderError', errorMessage));
			alert(`Reorder Error: ${errorMessage}`);
			await loadSurveys();
		} finally {
			setLoading(false);
		}
	};

	return { handleQuestionsReorder };
};
