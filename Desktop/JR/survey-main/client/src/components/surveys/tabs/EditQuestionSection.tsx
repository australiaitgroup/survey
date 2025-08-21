import React from 'react';
import EditSurveyQuestionModal from '../../modals/EditSurveyQuestionModal';
import type { QuestionForm, Survey } from '../../../types/admin';
import { QUESTION_TYPE } from '../../../constants';

interface Props {
	survey: Survey;
	open: boolean;
	questionIndex: number;
	form: QuestionForm | undefined;
	onClose: () => void;
	onSubmit: (form: any) => void;
	onChange: (field: string, value: any) => void;
	onOptionChange: (index: number, value: any) => void;
	onAddOption: () => void;
	onRemoveOption: (index: number) => void;
	loading: boolean;
}

const EditQuestionSection: React.FC<Props> = ({
	survey,
	open,
	questionIndex,
	form,
	onClose,
	onSubmit,
	onChange,
	onOptionChange,
	onAddOption,
	onRemoveOption,
	loading,
}) => {
	return open && questionIndex >= 0 ? (
		<EditSurveyQuestionModal
			isOpen={open}
			onClose={onClose}
			onSubmit={onSubmit}
			form={form || { text: '', type: QUESTION_TYPE.SINGLE_CHOICE, options: [] }}
			onChange={onChange}
			onOptionChange={onOptionChange}
			onAddOption={onAddOption}
			onRemoveOption={onRemoveOption}
			loading={loading}
			surveyType={survey.type}
			isCustomScoringEnabled={survey.scoringSettings?.customScoringRules?.useCustomPoints}
			defaultQuestionPoints={
				survey.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1
			}
			questionIndex={questionIndex}
		/>
	) : null;
};

export default EditQuestionSection;
