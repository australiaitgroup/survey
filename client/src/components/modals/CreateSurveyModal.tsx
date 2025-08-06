import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import Drawer from '../Drawer';
import MultiQuestionBankModal from './MultiQuestionBankModal';
import ManualQuestionSelectionModal from './ManualQuestionSelectionModal';
import { SOURCE_TYPE, SURVEY_TYPE } from '../../constants';
import { 
	ClipboardDocumentListIcon, 
	AcademicCapIcon, 
	CheckBadgeIcon, 
	PuzzlePieceIcon 
} from '@heroicons/react/24/outline';

const CreateSurveyModal: React.FC = () => {
	const { showCreateModal, setShowCreateModal, newSurvey, setNewSurvey, loading, error } =
		useAdmin();

	const { createSurvey } = useSurveys();
	const { questionBanks } = useQuestionBanks();

	// Survey type options with icons and descriptions
	const surveyTypeOptions = [
		{
			value: SURVEY_TYPE.SURVEY,
			label: 'Survey',
			icon: ClipboardDocumentListIcon,
			description: 'Collect feedback and opinions'
		},
		{
			value: SURVEY_TYPE.QUIZ,
			label: 'Quiz',
			icon: PuzzlePieceIcon,
			description: 'Test knowledge with scoring'
		},
		{
			value: SURVEY_TYPE.ASSESSMENT,
			label: 'Assessment',
			icon: CheckBadgeIcon,
			description: 'Professional evaluation tool'
		},
		{
			value: SURVEY_TYPE.IQ,
			label: 'IQ Test',
			icon: AcademicCapIcon,
			description: 'Intelligence assessment'
		}
	];

	// Modal states for multi-question selection
	const [showMultiBankModal, setShowMultiBankModal] = useState(false);
	const [showManualSelectionModal, setShowManualSelectionModal] = useState(false);

	if (!showCreateModal) return null;

	const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
		setNewSurvey(prev => ({ ...prev, [field]: value }));
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

	const isAssessmentType = [SURVEY_TYPE.QUIZ, SURVEY_TYPE.ASSESSMENT, SURVEY_TYPE.IQ].includes(
		newSurvey.type
	);

	const handleMultiBankSave = (config: unknown[]) => {
		setNewSurvey(prev => ({ ...prev, multiQuestionBankConfig: config }));
	};

	const handleManualSelectionSave = (selectedQuestions: unknown[]) => {
		setNewSurvey(prev => ({ ...prev, selectedQuestions }));
	};

	return (
		<Drawer
			show={showCreateModal}
			onClose={() => setShowCreateModal(false)}
			title='Create New Survey'
			actions={
				<div className='flex justify-end space-x-3'>
					<button
						type='button'
						onClick={() => setShowCreateModal(false)}
						className='btn-secondary'
					>
						Cancel
					</button>
					<button
						type='submit'
						form='create-survey-form'
						disabled={loading}
						className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{loading ? 'Creating...' : 'Create Survey'}
					</button>
				</div>
			}
		>
			<form id='create-survey-form' onSubmit={createSurvey} className='space-y-6'>
				{/* Basic Information */}
				<div>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>Basic Information</h3>
					<div className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Title *
							</label>
							<input
								type='text'
								required
								value={newSurvey.title}
								onChange={e => handleInputChange('title', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								placeholder='Enter survey title'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Description
							</label>
							<textarea
								value={newSurvey.description}
								onChange={e => handleInputChange('description', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								rows={3}
								placeholder='Describe your survey'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-3'>
								Type *
							</label>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
								{surveyTypeOptions.map((option) => {
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
												type="radio"
												name="surveyType"
												value={option.value}
												checked={isSelected}
												onChange={(e) => handleInputChange('type', e.target.value)}
												className="sr-only"
											/>
											<div className="flex items-start space-x-3 w-full">
												<div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
													isSelected 
														? 'bg-[#FF5A5F] text-white' 
														: 'bg-gray-100 text-gray-600'
												}`}>
													<IconComponent className="w-5 h-5" />
												</div>
												<div className="flex-1 min-w-0">
													<div className={`text-sm font-semibold ${
														isSelected ? 'text-[#FF5A5F]' : 'text-gray-900'
													}`}>
														{option.label}
													</div>
													<div className="text-xs text-gray-500 mt-1">
														{option.description}
													</div>
												</div>
											</div>
											{isSelected && (
												<div className="absolute top-2 right-2">
													<div className="w-4 h-4 bg-[#FF5A5F] rounded-full flex items-center justify-center">
														<svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
					<h3 className='text-lg font-medium text-gray-900 mb-4'>Question Source</h3>
					<div className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Source Type
							</label>
							<select
								value={newSurvey.sourceType}
								onChange={e => handleInputChange('sourceType', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								disabled={newSurvey.type === SURVEY_TYPE.SURVEY}
							>
								<option value={SOURCE_TYPE.MANUAL}>
									Manual (Create questions manually)
								</option>
								<option value={SOURCE_TYPE.QUESTION_BANK}>
									Single Question Bank (Random selection)
								</option>
								<option value={SOURCE_TYPE.MULTI_QUESTION_BANK}>
									Multiple Question Banks (Configured selection)
								</option>
								<option value={SOURCE_TYPE.MANUAL_SELECTION}>
									Manual Selection (Choose specific questions)
								</option>
							</select>
							{newSurvey.type === SURVEY_TYPE.SURVEY && (
								<p className='text-sm text-gray-500 mt-1'>
									Surveys only support manual question creation
								</p>
							)}
						</div>

						{/* Single Question Bank */}
						{newSurvey.sourceType === SOURCE_TYPE.QUESTION_BANK && (
							<>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Question Bank
									</label>
									<select
										value={newSurvey.questionBankId || ''}
										onChange={e =>
											handleInputChange('questionBankId', e.target.value)
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									>
										<option value=''>Select a question bank</option>
										{questionBanks.map(bank => (
											<option key={bank._id} value={bank._id}>
												{bank.name} ({bank.questions.length} questions)
											</option>
										))}
									</select>
								</div>

								{newSurvey.questionBankId && (
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Number of Questions
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
									Multi-Question Bank Configuration
								</label>
								<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
									{newSurvey.multiQuestionBankConfig &&
									newSurvey.multiQuestionBankConfig.length > 0 ? (
											<div className='space-y-2'>
												{newSurvey.multiQuestionBankConfig.map(
													(config: unknown, index: number) => {
														const bank = questionBanks.find(
															b => b._id === config.questionBankId
														);
														return (
															<div
																key={index}
																className='text-sm text-gray-700'
															>
																<strong>
																	{bank?.name || 'Unknown Bank'}
																</strong>
															: {config.questionCount} questions
																{config.filters &&
																Object.keys(config.filters).length >
																	0 && (
																	<span className='text-gray-500'>
																		{' '}
																		(with filters)
																	</span>
																)}
															</div>
														);
													}
												)}
												<div className='text-xs text-gray-500 mt-2'>
												Total:{' '}
													{newSurvey.multiQuestionBankConfig.reduce(
														(sum: number, config: unknown) =>
															sum + config.questionCount,
														0
													)}{' '}
												questions
												</div>
											</div>
										) : (
											<div className='text-sm text-gray-500'>
											No configurations set
											</div>
										)}
									<button
										type='button'
										onClick={() => setShowMultiBankModal(true)}
										className='mt-3 btn-primary btn-small'
									>
										Configure Question Banks
									</button>
								</div>
							</div>
						)}

						{/* Manual Question Selection */}
						{newSurvey.sourceType === SOURCE_TYPE.MANUAL_SELECTION && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Manual Question Selection
								</label>
								<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
									{newSurvey.selectedQuestions &&
									newSurvey.selectedQuestions.length > 0 ? (
											<div className='space-y-2'>
												<div className='text-sm text-gray-700'>
													<strong>
														{newSurvey.selectedQuestions.length}
													</strong>{' '}
												questions selected
												</div>
												<div className='text-xs text-gray-500'>
												Questions selected from various question banks
												</div>
											</div>
										) : (
											<div className='text-sm text-gray-500'>
											No questions selected
											</div>
										)}
									<button
										type='button'
										onClick={() => setShowManualSelectionModal(true)}
										className='mt-3 btn-primary btn-small'
									>
										Select Questions
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Assessment Configuration */}
				{isAssessmentType && (
					<div>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>
							Assessment Configuration
						</h3>
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Time Limit (minutes)
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
									placeholder='No time limit'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Maximum Attempts
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
									Navigation Mode
								</label>
								<select
									value={newSurvey.navigationMode}
									onChange={e =>
										handleInputChange('navigationMode', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value='step-by-step'>Step by Step</option>
									<option value='paginated'>Paginated</option>
									<option value='all-in-one'>All in One</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Instructions
								</label>
								<textarea
									value={newSurvey.instructions}
									onChange={e =>
										handleInputChange('instructions', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									rows={3}
									placeholder='Special instructions for test takers'
								/>
							</div>
						</div>
					</div>
				)}

				{/* Scoring Settings */}
				{isAssessmentType && (
					<div>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>Scoring Settings</h3>
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Scoring Mode
								</label>
								<select
									value={newSurvey.scoringSettings?.scoringMode || 'percentage'}
									onChange={e =>
										handleScoringChange('scoringMode', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value='percentage'>Percentage</option>
									<option value='accumulated'>Accumulated Points</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Passing Threshold (
									{newSurvey.scoringSettings?.scoringMode === 'percentage'
										? '%'
										: 'points'}
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
								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={newSurvey.scoringSettings?.showScore ?? true}
										onChange={e =>
											handleScoringChange('showScore', e.target.checked)
										}
										className='mr-2'
									/>
									Show score to participants
								</label>

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
									Show correct answers after completion
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
									Show score breakdown
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
									Use custom points per question
								</label>

								{newSurvey.scoringSettings?.customScoringRules?.useCustomPoints && (
									<div className='ml-6'>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Default Question Points
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
