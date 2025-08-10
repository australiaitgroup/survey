import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import Drawer from '../Drawer';
import MultiQuestionBankModal from './MultiQuestionBankModal';
import ManualQuestionSelectionModal from './ManualQuestionSelectionModal';
import type { SelectedQuestion, MultiQuestionBankConfig } from '../../types/api';
import { SOURCE_TYPE, SURVEY_TYPE } from '../../constants';
import {
	ClipboardDocumentListIcon,
	AcademicCapIcon,
	CheckBadgeIcon,
	PuzzlePieceIcon,
	ListBulletIcon,
	RectangleStackIcon,
} from '@heroicons/react/24/outline';

const CreateSurveyModal: React.FC = () => {
	const { showCreateModal, setShowCreateModal, newSurvey, setNewSurvey, loading, error } =
		useAdmin();

	const { createSurvey } = useSurveys();
	const { questionBanks } = useQuestionBanks();
	const { t } = useTranslation('admin');

	// Survey type options with icons and descriptions
	const surveyTypeOptions = [
		{
			value: SURVEY_TYPE.SURVEY,
			label: t('createModal.surveyTypes.survey.label', { defaultValue: 'Survey' }),
			icon: ClipboardDocumentListIcon,
			description: t('createModal.surveyTypes.survey.description', {
				defaultValue: 'Collect feedback and opinions',
			}),
		},
		{
			value: SURVEY_TYPE.QUIZ,
			label: t('createModal.surveyTypes.quiz.label', { defaultValue: 'Quiz' }),
			icon: PuzzlePieceIcon,
			description: t('createModal.surveyTypes.quiz.description', {
				defaultValue: 'Test knowledge with scoring',
			}),
		},
		{
			value: SURVEY_TYPE.ASSESSMENT,
			label: t('createModal.surveyTypes.assessment.label', { defaultValue: 'Assessment' }),
			icon: CheckBadgeIcon,
			description: t('createModal.surveyTypes.assessment.description', {
				defaultValue: 'Professional evaluation tool',
			}),
		},
		{
			value: SURVEY_TYPE.IQ,
			label: t('createModal.surveyTypes.iq.label', { defaultValue: 'IQ Test' }),
			icon: AcademicCapIcon,
			description: t('createModal.surveyTypes.iq.description', {
				defaultValue: 'Intelligence assessment',
			}),
		},
	];

	// Modal states for multi-question selection
	const [showMultiBankModal, setShowMultiBankModal] = useState(false);
	const [showManualSelectionModal, setShowManualSelectionModal] = useState(false);

	if (!showCreateModal) return null;

	const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
		setNewSurvey(prev => {
			// Sanitize navigationMode when type changes to SURVEY
			if (field === 'type' && value === SURVEY_TYPE.SURVEY) {
				const current =
					(prev.navigationMode as 'step-by-step' | 'one-question-per-page' | undefined) ||
					'step-by-step';
				const nextNav: 'step-by-step' | 'one-question-per-page' =
					current === 'one-question-per-page' ? 'one-question-per-page' : 'step-by-step';
				return { ...prev, type: SURVEY_TYPE.SURVEY, navigationMode: nextNav };
			}
			return { ...prev, [field]: value as any };
		});
	};

	const handleScoringChange = (field: string, value: string | number | boolean) => {
		setNewSurvey(prev => ({
			...prev,
			scoringSettings: {
				...prev.scoringSettings!,
				[field]: value,
			},
		}));
	};

	const handleCustomScoringChange = (field: string, value: string | number | boolean) => {
		setNewSurvey(prev => ({
			...prev,
			scoringSettings: {
				...prev.scoringSettings!,
				customScoringRules: {
					...prev.scoringSettings!.customScoringRules,
					[field]: value,
				},
			},
		}));
	};

	const isAssessmentType =
		newSurvey.type === SURVEY_TYPE.QUIZ ||
		newSurvey.type === SURVEY_TYPE.ASSESSMENT ||
		newSurvey.type === SURVEY_TYPE.IQ;

	const handleMultiBankSave = (config: MultiQuestionBankConfig[]) => {
		setNewSurvey(prev => ({ ...prev, multiQuestionBankConfig: config }));
	};

	const handleManualSelectionSave = (selectedQuestions: SelectedQuestion[]) => {
		setNewSurvey(prev => ({ ...prev, selectedQuestions }));
	};

	return (
		<Drawer
			show={showCreateModal}
			onClose={() => setShowCreateModal(false)}
			title={t('createModal.title', { defaultValue: 'Create New Survey' })}
			actions={
				<div className='flex justify-end space-x-3'>
					<button
						type='button'
						onClick={() => setShowCreateModal(false)}
						className='btn-secondary'
					>
						{t('createModal.cancel', { defaultValue: 'Cancel' })}
					</button>
					<button
						type='submit'
						form='create-survey-form'
						disabled={loading}
						className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{loading
							? t('createModal.creating', { defaultValue: 'Creating...' })
							: t('createModal.createButton', { defaultValue: 'Create Survey' })}
					</button>
				</div>
			}
		>
			<form id='create-survey-form' onSubmit={createSurvey} className='space-y-6'>
				{/* Basic Information */}
				<div>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>
						{t('createModal.basicInfo.title', { defaultValue: 'Basic Information' })}
					</h3>
					<div className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								{t('createModal.basicInfo.titleRequired', {
									defaultValue: 'Title *',
								})}
							</label>
							<input
								type='text'
								required
								value={newSurvey.title}
								onChange={e => handleInputChange('title', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								placeholder={t('createModal.basicInfo.titlePlaceholder', {
									defaultValue: 'Enter survey title',
								})}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								{t('createModal.basicInfo.description', {
									defaultValue: 'Description',
								})}
							</label>
							<textarea
								value={newSurvey.description}
								onChange={e => handleInputChange('description', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								rows={3}
								placeholder={t('createModal.basicInfo.descriptionPlaceholder', {
									defaultValue: 'Describe your survey',
								})}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-3'>
								{t('createModal.basicInfo.typeRequired', {
									defaultValue: 'Type *',
								})}
							</label>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
								{surveyTypeOptions.map(option => {
									const IconComponent = option.icon;
									const isSelected = newSurvey.type === option.value;

									return (
										<label
											key={option.value}
											className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
												isSelected
													? 'border-[#FF5A5F] bg-[#FF5A5F]/5 shadow-sm'
													: 'border-gray-200 hover:border-[#FF5A5F]/50'
											}`}
										>
											<input
												type='radio'
												name='surveyType'
												value={option.value}
												checked={isSelected}
												onChange={e =>
													handleInputChange('type', e.target.value)
												}
												className='sr-only'
											/>
											<div className='flex items-start space-x-3 w-full'>
												<div
													className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
														isSelected
															? 'bg-[#FF5A5F] text-white'
															: 'bg-gray-100 text-gray-600'
													}`}
												>
													<IconComponent className='w-5 h-5' />
												</div>
												<div className='flex-1 min-w-0'>
													<div
														className={`text-sm font-semibold ${
															isSelected
																? 'text-[#FF5A5F]'
																: 'text-gray-900'
														}`}
													>
														{option.label}
													</div>
													<div className='text-xs text-gray-500 mt-1'>
														{option.description}
													</div>
												</div>
											</div>
											{isSelected && (
												<div className='absolute top-2 right-2'>
													<div className='w-4 h-4 bg-[#FF5A5F] rounded-full flex items-center justify-center'>
														<svg
															className='w-2.5 h-2.5 text-white'
															fill='currentColor'
															viewBox='0 0 20 20'
														>
															<path
																fillRule='evenodd'
																d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
																clipRule='evenodd'
															/>
														</svg>
													</div>
												</div>
											)}
										</label>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				{/* Question Source */}
				<div>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>
						{t('createModal.questionSource.title', { defaultValue: 'Question Source' })}
					</h3>
					<div className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								{t('createModal.questionSource.sourceType', {
									defaultValue: 'Source Type',
								})}
							</label>
							<select
								value={newSurvey.sourceType}
								onChange={e => handleInputChange('sourceType', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								disabled={newSurvey.type === SURVEY_TYPE.SURVEY}
							>
								<option value={SOURCE_TYPE.MANUAL}>
									{t('createModal.questionSource.manual', {
										defaultValue: 'Manual (Create questions manually)',
									})}
								</option>
								<option value={SOURCE_TYPE.QUESTION_BANK}>
									{t('createModal.questionSource.singleBank', {
										defaultValue: 'Single Question Bank (Random selection)',
									})}
								</option>
								<option value={SOURCE_TYPE.MULTI_QUESTION_BANK}>
									{t('createModal.questionSource.multiBank', {
										defaultValue:
											'Multiple Question Banks (Configured selection)',
									})}
								</option>
								<option value={SOURCE_TYPE.MANUAL_SELECTION}>
									{t('createModal.questionSource.manualSelection', {
										defaultValue:
											'Manual Selection (Choose specific questions)',
									})}
								</option>
							</select>
							{newSurvey.type === SURVEY_TYPE.SURVEY && (
								<p className='text-sm text-gray-500 mt-1'>
									{t('createModal.questionSource.surveyOnlyManual', {
										defaultValue:
											'Surveys only support manual question creation',
									})}
								</p>
							)}
						</div>

						{/* Single Question Bank */}
						{newSurvey.sourceType === SOURCE_TYPE.QUESTION_BANK && (
							<>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										{t('createModal.questionSource.questionBank', {
											defaultValue: 'Question Bank',
										})}
									</label>
									<select
										value={newSurvey.questionBankId || ''}
										onChange={e =>
											handleInputChange('questionBankId', e.target.value)
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									>
										<option value=''>
											{t('createModal.questionSource.selectBank', {
												defaultValue: 'Select a question bank',
											})}
										</option>
										{questionBanks.map(bank => (
											<option key={bank._id} value={bank._id}>
												{bank.name} ({bank.questions.length}{' '}
												{t('createModal.questionSource.questions', {
													defaultValue: 'questions',
												})}
												)
											</option>
										))}
									</select>
								</div>

								{newSurvey.questionBankId && (
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											{t('createModal.questionSource.questionCount', {
												defaultValue: 'Number of Questions',
											})}
										</label>
										<input
											type='number'
											min='1'
											max={
												questionBanks.find(
													b => b._id === newSurvey.questionBankId
												)?.questions.length || 100
											}
											value={newSurvey.questionCount || ''}
											onChange={e =>
												handleInputChange(
													'questionCount',
													parseInt(e.target.value)
												)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										/>
									</div>
								)}
							</>
						)}

						{/* Multiple Question Banks */}
						{newSurvey.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.questionSource.multiBankConfig', {
										defaultValue: 'Question Bank Configuration',
									})}
								</label>
								<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
									{newSurvey.multiQuestionBankConfig &&
									newSurvey.multiQuestionBankConfig.length > 0 ? (
											<div className='space-y-2'>
												{newSurvey.multiQuestionBankConfig.map(
													(config, index: number) => {
														const bank = questionBanks.find(
															b => b._id === config.questionBankId
														);
														return (
															<div
																key={index}
																className='text-sm text-gray-700'
															>
																<strong>
																	{bank?.name ||
																	t(
																		'createModal.questionSource.unknownBank',
																		{
																			defaultValue:
																				'Unknown Bank',
																		}
																	)}
																</strong>
															: {config.questionCount}{' '}
																{t(
																	'createModal.questionSource.questions',
																	{ defaultValue: 'questions' }
																)}
																{config.filters &&
																Object.keys(config.filters).length >
																	0 && (
																	<span className='text-gray-500'>
																		{' '}
																		{t(
																			'createModal.questionSource.withFilters',
																			{
																				defaultValue:
																					'with filters',
																			}
																		)}
																	</span>
																)}
															</div>
														);
													}
												)}
												<div className='text-xs text-gray-500 mt-2'>
													{t('createModal.questionSource.totalQuestions', {
														defaultValue: 'Total:',
													})}{' '}
													{newSurvey.multiQuestionBankConfig.reduce(
														(sum: number, config) =>
															sum + config.questionCount,
														0
													)}{' '}
													{t('createModal.questionSource.questions', {
														defaultValue: 'questions',
													})}
												</div>
											</div>
										) : (
											<div className='text-sm text-gray-500'>
												{t('createModal.questionSource.noConfigurations', {
													defaultValue: 'No configurations set up yet',
												})}
											</div>
										)}
									<button
										type='button'
										onClick={() => setShowMultiBankModal(true)}
										className='mt-3 btn-primary btn-small'
									>
										{t('createModal.questionSource.configureQuestionBanks', {
											defaultValue: 'Configure Question Banks',
										})}
									</button>
								</div>
							</div>
						)}

						{/* Manual Question Selection */}
						{newSurvey.sourceType === SOURCE_TYPE.MANUAL_SELECTION && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.questionSource.manualSelectionConfig', {
										defaultValue: 'Manual Selection Configuration',
									})}
								</label>
								<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
									{newSurvey.selectedQuestions &&
									newSurvey.selectedQuestions.length > 0 ? (
											<div className='space-y-2'>
												<div className='text-sm text-gray-700'>
													<strong>
														{newSurvey.selectedQuestions.length}
													</strong>{' '}
													{t('createModal.questionSource.questionsSelected', {
														defaultValue: 'questions selected',
													})}
												</div>
												<div className='text-xs text-gray-500'>
													{t('createModal.questionSource.selectedFromBanks', {
														defaultValue:
														'Selected from various question banks',
													})}
												</div>
											</div>
										) : (
											<div className='text-sm text-gray-500'>
												{t('createModal.questionSource.noQuestionsSelected', {
													defaultValue: 'No questions selected yet',
												})}
											</div>
										)}
									<button
										type='button'
										onClick={() => setShowManualSelectionModal(true)}
										className='mt-3 btn-primary btn-small'
									>
										{t('createModal.questionSource.selectQuestions', {
											defaultValue: 'Select Questions',
										})}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Display / Navigation */}
				<div>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>
						{t('createModal.assessmentConfig.navigationMode', {
							defaultValue: 'Navigation Mode',
						})}
					</h3>
					{newSurvey.type === SURVEY_TYPE.SURVEY ? (
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
							{/* Step by Step */}
							<label
								className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${newSurvey.navigationMode === 'step-by-step' ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-blue-300'}`}
							>
								<input
									type='radio'
									name='navigationMode'
									value='step-by-step'
									checked={newSurvey.navigationMode === 'step-by-step'}
									onChange={() =>
										handleInputChange('navigationMode', 'step-by-step')
									}
									className='sr-only'
								/>
								<div className='flex items-start space-x-3 w-full'>
									<div
										className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${newSurvey.navigationMode === 'step-by-step' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
									>
										<ListBulletIcon className='w-5 h-5' />
									</div>
									<div className='flex-1 min-w-0'>
										<div
											className={`text-sm font-semibold ${newSurvey.navigationMode === 'step-by-step' ? 'text-blue-600' : 'text-gray-900'}`}
										>
											Step by Step
										</div>
										<div className='text-xs text-gray-500 mt-1'>
											Sequential list, multiple questions per screen
										</div>
									</div>
									{newSurvey.navigationMode === 'step-by-step' && (
										<div className='absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full'></div>
									)}
								</div>
							</label>
							{/* One Question Per Page */}
							<label
								className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${newSurvey.navigationMode === 'one-question-per-page' ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-blue-300'}`}
							>
								<input
									type='radio'
									name='navigationMode'
									value='one-question-per-page'
									checked={newSurvey.navigationMode === 'one-question-per-page'}
									onChange={() =>
										handleInputChange('navigationMode', 'one-question-per-page')
									}
									className='sr-only'
								/>
								<div className='flex items-start space-x-3 w-full'>
									<div
										className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${newSurvey.navigationMode === 'one-question-per-page' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
									>
										<RectangleStackIcon className='w-5 h-5' />
									</div>
									<div className='flex-1 min-w-0'>
										<div
											className={`text-sm font-semibold ${newSurvey.navigationMode === 'one-question-per-page' ? 'text-blue-600' : 'text-gray-900'}`}
										>
											One Question Per Page
										</div>
										<div className='text-xs text-gray-500 mt-1'>
											Typeform-like, focus on one question each step
										</div>
									</div>
									{newSurvey.navigationMode === 'one-question-per-page' && (
										<div className='absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full'></div>
									)}
								</div>
							</label>
						</div>
					) : (
						<div className='grid grid-cols-1 gap-3'>
							<div className='relative flex items-start p-4 border-2 rounded-xl bg-gray-50 border-blue-500'>
								<div className='flex items-start space-x-3 w-full'>
									<div className='flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500 text-white'>
										<RectangleStackIcon className='w-5 h-5' />
									</div>
									<div className='flex-1 min-w-0'>
										<div className='text-sm font-semibold text-blue-600'>
											One Question Per Page
										</div>
										<div className='text-xs text-gray-500 mt-1'>
											Required for assessment-like types
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Assessment Configuration */}
				{isAssessmentType && (
					<div>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>
							{t('createModal.assessmentConfig.title', {
								defaultValue: 'Assessment Configuration',
							})}
						</h3>
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.assessmentConfig.timeLimit', {
										defaultValue: 'Time Limit (minutes)',
									})}
								</label>
								<input
									type='number'
									min='1'
									value={newSurvey.timeLimit || ''}
									onChange={e =>
										handleInputChange(
											'timeLimit',
											e.target.value ? parseInt(e.target.value) : undefined
										)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder={t(
										'createModal.assessmentConfig.timeLimitPlaceholder',
										{ defaultValue: 'No time limit' }
									)}
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.assessmentConfig.maxAttempts', {
										defaultValue: 'Maximum Attempts',
									})}
								</label>
								<input
									type='number'
									min='1'
									max='10'
									value={newSurvey.maxAttempts || 1}
									onChange={e =>
										handleInputChange('maxAttempts', parseInt(e.target.value))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.assessmentConfig.instructions', {
										defaultValue: 'Instructions',
									})}
								</label>
								<textarea
									value={newSurvey.instructions}
									onChange={e =>
										handleInputChange('instructions', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									rows={3}
									placeholder={t(
										'createModal.assessmentConfig.instructionsPlaceholder',
										{ defaultValue: 'Special instructions for test takers' }
									)}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Scoring Settings */}
				{isAssessmentType && (
					<div>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>
							{t('createModal.scoringSettings.title', {
								defaultValue: 'Scoring Settings',
							})}
						</h3>
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.scoringSettings.scoringMode', {
										defaultValue: 'Scoring Mode',
									})}
								</label>
								<select
									value={newSurvey.scoringSettings?.scoringMode || 'percentage'}
									onChange={e =>
										handleScoringChange('scoringMode', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value='percentage'>
										{t('createModal.scoringSettings.percentage', {
											defaultValue: 'Percentage',
										})}
									</option>
									<option value='accumulated'>
										{t('createModal.scoringSettings.accumulated', {
											defaultValue: 'Accumulated Points',
										})}
									</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.scoringSettings.passingThreshold', {
										defaultValue: 'Passing Threshold',
									})}{' '}
									(
									{newSurvey.scoringSettings?.scoringMode === 'percentage'
										? '%'
										: t('createModal.scoringSettings.points', {
											defaultValue: 'points',
										})}
									)
								</label>
								<input
									type='number'
									min='0'
									max={
										newSurvey.scoringSettings?.scoringMode === 'percentage'
											? 100
											: 1000
									}
									value={newSurvey.scoringSettings?.passingThreshold || 70}
									onChange={e =>
										handleScoringChange(
											'passingThreshold',
											parseInt(e.target.value)
										)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div className='space-y-3'>
								<div className='space-y-1'>
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={newSurvey.scoringSettings?.showScore ?? true}
											onChange={e =>
												handleScoringChange('showScore', e.target.checked)
											}
											className='mr-2'
										/>
										{t('createModal.scoringSettings.showScore', {
											defaultValue: 'Show final score to students',
										})}
									</label>
									<p className='text-xs text-gray-500 ml-6'>
										{t(
											'createModal.scoringSettings.showScoreHelp',
											'When enabled, students will see their final score after completing the assessment. When disabled, they will only see a completion message.'
										)}
									</p>
								</div>

								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={
											newSurvey.scoringSettings?.showCorrectAnswers ?? false
										}
										onChange={e =>
											handleScoringChange(
												'showCorrectAnswers',
												e.target.checked
											)
										}
										className='mr-2'
									/>
									{t('createModal.scoringSettings.showCorrectAnswers', {
										defaultValue: 'Show correct answers after completion',
									})}
								</label>

								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={
											newSurvey.scoringSettings?.showScoreBreakdown ?? true
										}
										onChange={e =>
											handleScoringChange(
												'showScoreBreakdown',
												e.target.checked
											)
										}
										className='mr-2'
									/>
									{t('createModal.scoringSettings.showScoreBreakdown', {
										defaultValue: 'Show detailed score breakdown',
									})}
								</label>

								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={
											newSurvey.scoringSettings?.customScoringRules
												?.useCustomPoints ?? false
										}
										onChange={e =>
											handleCustomScoringChange(
												'useCustomPoints',
												e.target.checked
											)
										}
										className='mr-2'
									/>
									{t('createModal.scoringSettings.useCustomPoints', {
										defaultValue: 'Use custom point values per question',
									})}
								</label>

								{newSurvey.scoringSettings?.customScoringRules?.useCustomPoints && (
									<div className='ml-6'>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											{t(
												'createModal.scoringSettings.defaultQuestionPoints',
												{ defaultValue: 'Default Points per Question' }
											)}
										</label>
										<input
											type='number'
											min='1'
											value={
												newSurvey.scoringSettings?.customScoringRules
													?.defaultQuestionPoints || 1
											}
											onChange={e =>
												handleCustomScoringChange(
													'defaultQuestionPoints',
													parseInt(e.target.value)
												)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Error Display */}
				{error && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
						{error}
					</div>
				)}
			</form>

			{/* Multi-Question Bank Configuration Modal */}
			<MultiQuestionBankModal
				show={showMultiBankModal}
				onClose={() => setShowMultiBankModal(false)}
				onSave={handleMultiBankSave}
				initialConfig={newSurvey.multiQuestionBankConfig || []}
			/>

			{/* Manual Question Selection Modal */}
			<ManualQuestionSelectionModal
				show={showManualSelectionModal}
				onClose={() => setShowManualSelectionModal(false)}
				onSave={handleManualSelectionSave}
				initialSelection={newSurvey.selectedQuestions || []}
			/>
		</Drawer>
	);
};

export default CreateSurveyModal;
