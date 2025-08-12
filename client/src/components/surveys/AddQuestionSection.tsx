import React from 'react';
import type { QuestionForm, Survey } from '../../types/admin';
import { QUESTION_TYPE } from '../../constants';
import AddSurveyQuestionModal from '../modals/AddSurveyQuestionModal';

interface Props {
  survey: Survey;
  form: QuestionForm;
  setForm: (updater: (prev: Record<string, QuestionForm>) => Record<string, QuestionForm>) => void;
  onSubmit: (form: any) => Promise<void> | void;
  open: boolean;
  setOpen: (open: boolean) => void;
  onOptionChange: (surveyId: string, index: number, value: string | { text?: string; imageUrl?: string }) => void;
  onAddOption: (surveyId: string) => void;
  onRemoveOption: (surveyId: string, index: number) => void;
  loading: boolean;
}

const AddQuestionSection: React.FC<Props> = ({
  survey,
  form,
  setForm,
  onSubmit,
  open,
  setOpen,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  loading,
}) => {
  return (
    <AddSurveyQuestionModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onSubmit={onSubmit}
      form={form}
      onChange={(field, value) =>
        setForm(prev => ({
          ...prev,
          [survey._id]: { ...prev[survey._id], [field]: value },
        }))
      }
      onOptionChange={(index, value) => onOptionChange(survey._id, index, value)}
      onAddOption={() => onAddOption(survey._id)}
      onRemoveOption={index => onRemoveOption(survey._id, index)}
      loading={loading}
      surveyType={survey.type}
      isCustomScoringEnabled={survey.scoringSettings?.customScoringRules?.useCustomPoints}
      defaultQuestionPoints={
        survey.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1
      }
    />
  );
};

export default AddQuestionSection;
