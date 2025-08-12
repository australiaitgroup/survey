import React from 'react';
import { SOURCE_TYPE, SURVEY_TYPE } from '../../../constants';
import type { Survey } from '../../../types/admin';
import DroppableQuestionList from '../DroppableQuestionList';

interface Props {
	survey: Survey;
	questionBanks: any[];
	loading: boolean;
	handleQuestionsReorder: (surveyId: string, newQuestions: any[]) => void;
	startEditQuestion: (surveyId: string, index: number) => void;
	deleteQuestion: (surveyId: string, index: number) => void;
	setShowAddQuestionModal: (open: boolean) => void;
}

const SurveyQuestionList: React.FC<Props> = ({
	survey: s,
	questionBanks,
	loading,
	handleQuestionsReorder,
	startEditQuestion,
	deleteQuestion,
	setShowAddQuestionModal,
}) => {
	if (s.sourceType === SOURCE_TYPE.MANUAL) {
		return (
			<DroppableQuestionList
				questions={s.questions || []}
				surveyId={s._id}
				surveyType={s.type}
				onQuestionsReorder={newQuestions => handleQuestionsReorder(s._id, newQuestions)}
				onEditQuestion={index => startEditQuestion(s._id, index)}
				onDeleteQuestion={index => deleteQuestion(s._id, index)}
				onAddQuestion={() => setShowAddQuestionModal(true)}
				loading={loading}
			/>
		);
	}

	if (s.sourceType === SOURCE_TYPE.QUESTION_BANK) {
		return (
			<div className='mb-4'>
				<h4 className='font-semibold text-gray-800 mb-3'>Question Bank Survey</h4>
				<div className='bg-purple-50 rounded-lg p-4'>
					<div className='flex items-center justify-between mb-3'>
						<div>
							<div className='font-medium text-gray-800'>
								Random Question Selection
							</div>
							<div className='text-sm text-gray-600'>
								This survey will randomly select {s.questionCount} questions from
								the linked question bank for each student.
							</div>
						</div>
						<div className='text-lg font-bold text-purple-600'>
							{s.questionCount} questions
						</div>
					</div>
					<div className='text-xs text-gray-500'>
						💡 Questions are randomized per student to ensure assessment fairness
					</div>
				</div>
			</div>
		);
	}

	if (s.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK) {
		return (
			<div className='mb-4'>
				<h4 className='font-semibold text-gray-800 mb-3'>Multi-Question Bank Survey</h4>
				<div className='bg-blue-50 rounded-lg p-4'>
					<div className='space-y-3'>
						{s.multiQuestionBankConfig && s.multiQuestionBankConfig.length > 0 ? (
							s.multiQuestionBankConfig.map((config: any, index: number) => {
								const bank = questionBanks.find(
									b => b._id === config.questionBankId
								);
								return (
									<div
										key={index}
										className='flex items-center justify-between p-3 bg-white rounded-lg border'
									>
										<div>
											<div className='font-medium text-gray-800'>
												{bank?.name || 'Unknown Bank'}
											</div>
											<div className='text-sm text-gray-600'>
												{config.questionCount} questions
												{config.filters &&
													Object.keys(config.filters).length > 0 && (
													<span className='text-blue-600'>
														{' '}
															(with filters)
													</span>
												)}
											</div>
										</div>
										<div className='text-lg font-bold text-blue-600'>
											{config.questionCount}
										</div>
									</div>
								);
							})
						) : (
							<div className='text-gray-500 text-sm text-center py-4'>
								No question bank configurations set
							</div>
						)}
						<div className='text-xs text-gray-500 mt-2'>
							💡 Questions are selected based on configured rules for each bank
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (s.sourceType === SOURCE_TYPE.MANUAL_SELECTION) {
		return (
			<div className='mb-4'>
				<h4 className='font-semibold text-gray-800 mb-3'>
					Manual Question Selection Survey
				</h4>
				<div className='bg-green-50 rounded-lg p-4'>
					<div className='flex items-center justify-between mb-3'>
						<div>
							<div className='font-medium text-gray-800'>Pre-selected Questions</div>
							<div className='text-sm text-gray-600'>
								This survey uses {s.selectedQuestions?.length || 0} manually
								selected questions from various question banks.
							</div>
						</div>
						<div className='text-lg font-bold text-green-600'>
							{s.selectedQuestions?.length || 0} questions
						</div>
					</div>
					<div className='text-xs text-gray-500'>
						💡 Questions are pre-selected and will be the same for all students
					</div>
				</div>
			</div>
		);
	}

	return null;
};

export default SurveyQuestionList;
