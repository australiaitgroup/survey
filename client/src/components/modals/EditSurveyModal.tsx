import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { SOURCE_TYPE } from '../../constants/index';
import Drawer from '../Drawer';
import MultiQuestionBankModal from './MultiQuestionBankModal';
import ManualQuestionSelectionModal from './ManualQuestionSelectionModal';

const EditSurveyModal: React.FC = () => {
	const {
		showEditModal,
		setShowEditModal,
		editForm,
		setEditForm,
		selectedSurvey,
		loading,
		setLoading,
		setError,
	} = useAdmin();

	const { updateSurvey } = useSurveys();
	const { questionBanks } = useQuestionBanks();

	// Modal state for question bank configuration
	const [showMultiBankModal, setShowMultiBankModal] = useState(false);
	const [showManualSelectionModal, setShowManualSelectionModal] = useState(false);

	// Initialize scoring settings if not present
	useEffect(() => {
		if (selectedSurvey && !editForm.scoringSettings) {
			setEditForm(prev => ({
				...prev,
				scoringSettings: {
					scoringMode: selectedSurvey.scoringSettings?.scoringMode || 'percentage',
					passingThreshold: selectedSurvey.scoringSettings?.passingThreshold || 60,
					showScore: selectedSurvey.scoringSettings?.showScore ?? true,
					showCorrectAnswers: selectedSurvey.scoringSettings?.showCorrectAnswers ?? false,
					showScoreBreakdown: selectedSurvey.scoringSettings?.showScoreBreakdown ?? true,
					customScoringRules: selectedSurvey.scoringSettings?.customScoringRules || {
						useCustomPoints: false,
						defaultQuestionPoints: 1,
					},
				},
			}));
		}
	}, [selectedSurvey, editForm.scoringSettings, setEditForm]);


	if (!selectedSurvey || !showEditModal) return null;

	const closeEditModal = () => {
		setShowEditModal(false);
	};

	const handleUpdateSurvey = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const surveyData = {
				...editForm,
				// Ensure isActive matches status for backward compatibility
				isActive: editForm.status === 'active',
				timeLimit: editForm.timeLimit ? Number(editForm.timeLimit) : undefined,
				maxAttempts: editForm.maxAttempts || 1,
				// Include security settings
				securitySettings: editForm.securitySettings || {
					antiCheatEnabled: false,
				},
				// Include scoring settings if it's an assessment type
				...(['assessment', 'live_quiz', 'quiz', 'iq'].includes(editForm.type) &&
					editForm.scoringSettings && {
					scoringSettings: editForm.scoringSettings,
				}),
			};

			await updateSurvey(selectedSurvey._id, surveyData);
			closeEditModal();
		} catch (err) {
			console.error('❌ Failed to update survey:', err);
			setError('Failed to update survey. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Drawer
			show={showEditModal}
			title={`Edit Survey: ${selectedSurvey.title}`}
			onClose={closeEditModal}
			actions={
				<div className='flex justify-end space-x-3'>
					<button type='button' className='btn-secondary' onClick={closeEditModal}>
						Cancel
					</button>
					<button
						className='btn-primary flex-1'
						type='submit'
						form='edit-survey-form'
						disabled={loading}
					>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			}
		>
			<form id='edit-survey-form' onSubmit={handleUpdateSurvey}>
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Left Column */}
					<div className='space-y-6'>
						{/* Basic Information */}
						<div>
							<h3 className='text-lg font-medium text-gray-900 mb-4'>
								Basic Information
							</h3>
							<div className='space-y-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Title *
									</label>
									<input
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Enter survey title'
										value={editForm.title}
										onChange={e =>
											setEditForm({ ...editForm, title: e.target.value })
										}
										required
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Description
									</label>
									<textarea
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Enter description'
										value={editForm.description}
										onChange={e =>
											setEditForm({
												...editForm,
												description: e.target.value,
											})
										}
										rows={3}
									/>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Type
										</label>
										<select
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
											value={editForm.type}
											onChange={e =>
												setEditForm({
													...editForm,
													type: e.target.value as any,
													// Set navigationMode based on survey type
													navigationMode:
														e.target.value === 'survey'
															? (editForm.navigationMode as string) ||
																'step-by-step'
															: 'step-by-step', // Non-survey types default to step-by-step
												})
											}
										>
											<option value='survey'>Survey</option>
											<option value='assessment'>Assessment</option>
											<option value='onboarding'>Onboarding</option>
											<option value='live_quiz'>Kahoot (Live Quiz)</option>
										</select>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Status
										</label>
										<select
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
											value={editForm.status}
											onChange={e =>
												setEditForm({
													...editForm,
													status: e.target.value as
														| 'draft'
														| 'active'
														| 'closed',
												})
											}
										>
											<option value='draft'>Draft</option>
											<option value='active'>Active</option>
											<option value='closed'>Closed</option>
										</select>
									</div>
								</div>
							</div>
						</div>

						{/* Security Settings */}
						{(editForm.type === 'assessment' || editForm.type === 'live_quiz') && (
							<div>
								<h3 className='text-lg font-medium text-gray-900 mb-4'>
									Security Settings
								</h3>
								<div className='bg-gray-50 p-4 rounded-lg border'>
									<label className='flex items-center cursor-pointer'>
										<input
											type='checkbox'
											checked={editForm.securitySettings?.antiCheatEnabled || false}
											onChange={(e) => setEditForm({
												...editForm,
												securitySettings: {
													...editForm.securitySettings,
													antiCheatEnabled: e.target.checked,
												},
											})}
											className='mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
										/>
										<div className='flex-1'>
											<div className='font-medium text-gray-900'>Enable Anti-Cheat Protection</div>
											<div className='text-sm text-gray-500'>
												Prevents copying, pasting, right-clicking, and developer tools access during assessments
											</div>
										</div>
									</label>
								</div>
							</div>
						)}

						{/* Question Source */}
						<div>
							<h3 className='text-lg font-medium text-gray-900 mb-4'>
								Question Source
							</h3>
							<div className='space-y-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Source Type
									</label>

									{/* Display current source type info */}
									<div className='mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg'>
										<div className='text-sm text-blue-800'>
											<strong>Current source:</strong>{' '}
											{editForm.sourceType === SOURCE_TYPE.MANUAL
												? 'Manual Questions'
												: editForm.sourceType === SOURCE_TYPE.QUESTION_BANK
													? 'Question Bank (Random)'
													: editForm.sourceType ===
														  SOURCE_TYPE.MULTI_QUESTION_BANK
														? 'Multi-Question Bank'
														: editForm.sourceType ===
															  SOURCE_TYPE.MANUAL_SELECTION
															? 'Manual Selection'
															: 'Manual Questions (default)'}
										</div>
									</div>

									<select
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										value={editForm.sourceType || SOURCE_TYPE.MANUAL}
										onChange={e => {
											const sourceType = e.target.value;
											setEditForm({
												...editForm,
												sourceType,
												// Clear other source-specific fields when changing type
												...(sourceType !== SOURCE_TYPE.QUESTION_BANK && {
													questionBankId: undefined,
													questionCount: undefined,
												}),
												...(sourceType !==
													SOURCE_TYPE.MULTI_QUESTION_BANK && {
													multiQuestionBankConfig: [],
												}),
												...(sourceType !== SOURCE_TYPE.MANUAL_SELECTION && {
													selectedQuestions: [],
												}),
											});
										}}
									>
										<option value={SOURCE_TYPE.MANUAL}>Manual Questions</option>
										<option value={SOURCE_TYPE.QUESTION_BANK}>
											Question Bank (Random)
										</option>
										<option value={SOURCE_TYPE.MULTI_QUESTION_BANK}>
											Multi-Question Bank
										</option>
										<option value={SOURCE_TYPE.MANUAL_SELECTION}>
											Manual Selection
										</option>
									</select>
									<div className='text-xs text-gray-500 mt-1'>
										Choose how questions are sourced for this survey
									</div>
								</div>

								{/* Single Question Bank */}
								{editForm.sourceType === SOURCE_TYPE.QUESTION_BANK && (
									<>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Question Bank
											</label>

											{/* Display current selection info */}
											{editForm.questionBankId && (
												<div className='mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg'>
													<div className='text-sm text-blue-800'>
														<strong>Currently selected:</strong>{' '}
														{questionBanks?.find(
															bank =>
																bank._id === editForm.questionBankId
														)?.name ||
															'Unknown Bank (ID: ' +
																editForm.questionBankId +
																')'}
													</div>
													{editForm.questionCount && (
														<div className='text-xs text-blue-600 mt-1'>
															Configured to select{' '}
															{editForm.questionCount} questions
														</div>
													)}
												</div>
											)}

											<select
												className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
												value={editForm.questionBankId || ''}
												onChange={e =>
													setEditForm({
														...editForm,
														questionBankId: e.target.value || undefined,
													})
												}
												required
											>
												<option value=''>Select a question bank</option>
												{questionBanks?.map(bank => (
													<option key={bank._id} value={bank._id}>
														{bank.name} ({bank.questions?.length || 0}{' '}
														questions)
													</option>
												))}
											</select>

											{(!questionBanks || questionBanks.length === 0) && (
												<div className='text-sm text-red-600 mt-1'>
													No question banks available. Please create a
													question bank first.
												</div>
											)}
										</div>

										{editForm.questionBankId && (
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-1'>
													Number of Questions
												</label>
												<input
													type='number'
													className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
													value={editForm.questionCount || ''}
													onChange={e =>
														setEditForm({
															...editForm,
															questionCount: e.target.value
																? parseInt(e.target.value)
																: undefined,
														})
													}
													placeholder='All questions'
													min='1'
													max={
														questionBanks?.find(
															b => b._id === editForm.questionBankId
														)?.questions?.length || 100
													}
												/>
												<div className='text-xs text-gray-500 mt-1'>
													Number of questions to randomly select (leave
													empty for all)
												</div>
											</div>
										)}
									</>
								)}

								{/* Multiple Question Banks */}
								{editForm.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK && (
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Question Bank Configuration
										</label>
										<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
											{editForm.multiQuestionBankConfig &&
											editForm.multiQuestionBankConfig.length > 0 ? (
													<div className='space-y-2'>
														{editForm.multiQuestionBankConfig.map(
															(config: unknown, index: number) => {
																const bank = questionBanks?.find(
																	b => b._id === config.questionBankId
																);
																return (
																	<div
																		key={index}
																		className='text-sm text-gray-700'
																	>
																		<strong>
																			{bank?.name ||
																			'Unknown Bank'}
																		</strong>
																	: {config.questionCount}{' '}
																	questions
																		{config.filters &&
																		Object.keys(config.filters)
																			.length > 0 && (
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
															{editForm.multiQuestionBankConfig.reduce(
																(sum: number, config: unknown) =>
																	sum + config.questionCount,
																0
															)}{' '}
														questions
														</div>
													</div>
												) : (
													<div className='text-sm text-gray-500'>
													No configurations set up yet
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
								{editForm.sourceType === SOURCE_TYPE.MANUAL_SELECTION && (
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Manual Selection Configuration
										</label>
										<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
											{editForm.selectedQuestions &&
											editForm.selectedQuestions.length > 0 ? (
													<div className='space-y-2'>
														<div className='text-sm text-gray-700'>
															<strong>
																{editForm.selectedQuestions.length}
															</strong>{' '}
														questions selected
														</div>
														<div className='text-xs text-gray-500'>
														Selected from various question banks
														</div>
													</div>
												) : (
													<div className='text-sm text-gray-500'>
													No questions selected yet
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
					</div>

					{/* Right Column */}
					<div className='space-y-6'>
						{/* Display / Navigation */}
						<div>
							<h3 className='text-lg font-medium text-gray-900 mb-4'>
								Navigation Mode
							</h3>
							{editForm.type === 'survey' ? (
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
									<label
										className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${editForm.navigationMode === 'step-by-step' ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-blue-300'}`}
									>
										<input
											type='radio'
											name='navigationModeEdit'
											value='step-by-step'
											checked={editForm.navigationMode === 'step-by-step'}
											onChange={() =>
												setEditForm({
													...editForm,
													navigationMode: 'step-by-step',
												})
											}
											className='sr-only'
										/>
										<div className='flex items-start space-x-3 w-full'>
											<div
												className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${editForm.navigationMode === 'step-by-step' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
											>
												<svg
													className='w-5 h-5'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M4 6h16M4 12h10M4 18h6'
													/>
												</svg>
											</div>
											<div className='flex-1 min-w-0'>
												<div
													className={`text-sm font-semibold ${editForm.navigationMode === 'step-by-step' ? 'text-blue-600' : 'text-gray-900'}`}
												>
													All in One
												</div>
												<div className='text-xs text-gray-500 mt-1'>
													All questions displayed on a single page
												</div>
											</div>
										</div>
									</label>
									<label
										className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${editForm.navigationMode === 'one-question-per-page' ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-blue-300'}`}
									>
										<input
											type='radio'
											name='navigationModeEdit'
											value='one-question-per-page'
											checked={
												editForm.navigationMode === 'one-question-per-page'
											}
											onChange={() =>
												setEditForm({
													...editForm,
													navigationMode: 'one-question-per-page',
												})
											}
											className='sr-only'
										/>
										<div className='flex items-start space-x-3 w-full'>
											<div
												className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${editForm.navigationMode === 'one-question-per-page' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
											>
												<svg
													className='w-5 h-5'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M4 6h16M4 10h16M4 14h10'
													/>
												</svg>
											</div>
											<div className='flex-1 min-w-0'>
												<div
													className={`text-sm font-semibold ${editForm.navigationMode === 'one-question-per-page' ? 'text-blue-600' : 'text-gray-900'}`}
												>
													One Question Per Page
												</div>
												<div className='text-xs text-gray-500 mt-1'>
													Typeform-like, focus on one question each step
												</div>
											</div>
										</div>
									</label>
								</div>
							) : (
								<div className='grid grid-cols-1 gap-3'>
									<div className='relative flex items-start p-4 border-2 rounded-xl bg-gray-50 border-blue-500'>
										<div className='flex items-start space-x-3 w-full'>
											<div className='flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500 text-white'>
												<svg
													className='w-5 h-5'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M4 6h16M4 12h10M4 18h6'
													/>
												</svg>
											</div>
											<div className='flex-1 min-w-0'>
												<div className='text-sm font-semibold text-blue-600'>
													Step by Step
												</div>
												<div className='text-xs text-gray-500 mt-1'>
													Default for assessment types - all questions on
													one page
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Assessment Configuration */}
						{['assessment', 'live_quiz', 'quiz', 'iq'].includes(editForm.type) && (
							<div>
								<h3 className='text-lg font-medium text-gray-900 mb-4'>
									Assessment Configuration
								</h3>
								<div className='space-y-4'>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Time Limit (minutes)
											</label>
											<input
												type='number'
												min='1'
												value={editForm.timeLimit || ''}
												onChange={e =>
													setEditForm({
														...editForm,
														timeLimit: e.target.value
															? parseInt(e.target.value)
															: undefined,
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
												placeholder='No limit'
											/>
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Max Attempts
											</label>
											<input
												type='number'
												min='1'
												max='10'
												value={editForm.maxAttempts || 1}
												onChange={e =>
													setEditForm({
														...editForm,
														maxAttempts: parseInt(e.target.value) || 1,
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
											/>
										</div>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Instructions
										</label>
										<textarea
											value={editForm.instructions}
											onChange={e =>
												setEditForm({
													...editForm,
													instructions: e.target.value,
												})
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
						{['assessment', 'live_quiz', 'quiz', 'iq'].includes(editForm.type) && (
							<div>
								<h3 className='text-lg font-medium text-gray-900 mb-4'>
									Scoring Settings
								</h3>
								<div className='space-y-4'>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Scoring Mode
											</label>
											<select
												value={
													editForm.scoringSettings?.scoringMode ||
													'percentage'
												}
												onChange={e =>
													setEditForm({
														...editForm,
														scoringSettings: {
															...editForm.scoringSettings,
															scoringMode: e.target.value,
														},
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
											>
												<option value='percentage'>Percentage</option>
												<option value='accumulated'>
													Accumulated Points
												</option>
											</select>
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Passing Threshold (
												{editForm.scoringSettings?.scoringMode ===
												'percentage'
													? '%'
													: 'points'}
												)
											</label>
											<input
												type='number'
												min='0'
												max={
													editForm.scoringSettings?.scoringMode ===
													'percentage'
														? 100
														: 1000
												}
												value={
													editForm.scoringSettings?.passingThreshold || 70
												}
												onChange={e =>
													setEditForm({
														...editForm,
														scoringSettings: {
															...editForm.scoringSettings,
															passingThreshold:
																parseInt(e.target.value) || 0,
														},
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
											/>
										</div>
									</div>

									<div className='space-y-3'>
										<div className='space-y-1'>
											<label className='flex items-center'>
												<input
													type='checkbox'
													checked={
														editForm.scoringSettings?.showScore ?? true
													}
													onChange={e =>
														setEditForm({
															...editForm,
															scoringSettings: {
																...editForm.scoringSettings,
																showScore: e.target.checked,
															},
														})
													}
													className='mr-2'
												/>
												Show final score to students
											</label>
											<p className='text-xs text-gray-500 ml-6'>
												When enabled, students will see their final score
												after completing the assessment. When disabled, they
												will only see a completion message.
											</p>
										</div>

										<label className='flex items-center'>
											<input
												type='checkbox'
												checked={
													editForm.scoringSettings?.showCorrectAnswers ??
													false
												}
												onChange={e =>
													setEditForm({
														...editForm,
														scoringSettings: {
															...editForm.scoringSettings,
															showCorrectAnswers: e.target.checked,
														},
													})
												}
												className='mr-2'
											/>
											Show correct answers after completion
										</label>

										<label className='flex items-center'>
											<input
												type='checkbox'
												checked={
													editForm.scoringSettings?.showScoreBreakdown ??
													true
												}
												onChange={e =>
													setEditForm({
														...editForm,
														scoringSettings: {
															...editForm.scoringSettings,
															showScoreBreakdown: e.target.checked,
														},
													})
												}
												className='mr-2'
											/>
											Show detailed score breakdown
										</label>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</form>

			{/* Question Bank Configuration Modals */}
			{showMultiBankModal && (
				<MultiQuestionBankModal
					show={showMultiBankModal}
					onClose={() => setShowMultiBankModal(false)}
					onSave={config => {
						setEditForm({
							...editForm,
							multiQuestionBankConfig: config,
						});
						setShowMultiBankModal(false);
					}}
					initialConfig={editForm.multiQuestionBankConfig || []}
					questionBanks={questionBanks}
				/>
			)}

			{showManualSelectionModal && (
				<ManualQuestionSelectionModal
					show={showManualSelectionModal}
					onClose={() => setShowManualSelectionModal(false)}
					onSave={selectedQuestions => {
						setEditForm({
							...editForm,
							selectedQuestions,
						});
						setShowManualSelectionModal(false);
					}}
					initialSelection={editForm.selectedQuestions || []}
					questionBanks={questionBanks}
				/>
			)}
		</Drawer>
	);
};

export default EditSurveyModal;
