import React from 'react';
import { useTranslation } from 'react-i18next';
import { QuestionForm } from '../../types/admin';
import ImageUpload from '../common/ImageUpload';
import SimpleQuillEditor from '../common/SimpleQuillEditor';
import Drawer from '../Drawer';
import { ListBulletIcon, Squares2X2Icon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface AddQuestionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (form: QuestionForm) => void;
	form: QuestionForm;
	onChange: (field: string, value: unknown) => void;
	onOptionChange: (index: number, value: string | { text?: string; imageUrl?: string }) => void;
	onAddOption: () => void;
	onRemoveOption: (index: number) => void;
	loading?: boolean;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	form,
	onChange,
	onOptionChange,
	onAddOption,
	onRemoveOption,
	loading = false,
}) => {
    const { t, i18n } = useTranslation('admin');
    React.useEffect(() => {
        i18n.loadNamespaces(['admin', 'translation', 'question', 'survey']).catch(() => {});
    }, [i18n]);
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(form);
	};

	const toggleCorrectAnswer = (optionIndex: number) => {
		let newCorrectAnswer;
		const isCorrect = Array.isArray(form.correctAnswer)
			? form.correctAnswer.includes(optionIndex)
			: form.correctAnswer === optionIndex;

		if (form.type === 'single_choice') {
			// Single choice: only one correct answer
			newCorrectAnswer = isCorrect ? undefined : optionIndex;
		} else {
			// Multiple choice: allow multiple correct answers
			if (isCorrect) {
				// Remove from correct answers
				if (Array.isArray(form.correctAnswer)) {
					newCorrectAnswer = form.correctAnswer.filter(i => i !== optionIndex);
					if (newCorrectAnswer.length === 0) newCorrectAnswer = undefined;
				} else {
					newCorrectAnswer = undefined;
				}
			} else {
				// Add to correct answers
				if (Array.isArray(form.correctAnswer)) {
					newCorrectAnswer = [
						...(form.correctAnswer as number[]),
						optionIndex,
					].sort((a: number, b: number) => a - b);
				} else if (form.correctAnswer !== undefined) {
					newCorrectAnswer = [
						form.correctAnswer as number,
						optionIndex,
					].sort((a: number, b: number) => a - b);
				} else {
					newCorrectAnswer = [optionIndex];
				}
			}
		}

		onChange('correctAnswer', newCorrectAnswer);
	};

	const getValidationErrors = () => {
		const errors: string[] = [];

		if (!form.text.trim()) {
			errors.push('Question text is required');
		}

		if (form.type !== 'short_text') {
			const validOptions =
				form.options?.filter(opt => {
					const text = typeof opt === 'string' ? opt : opt.text || '';
					return text.trim();
				}) || [];

			if (validOptions.length < 2) {
				errors.push('At least 2 valid options are required');
			}

			if (form.correctAnswer === undefined) {
				errors.push('Please select a correct answer');
			}
		}

		return errors;
	};

	const isFormValid = () => {
		return getValidationErrors().length === 0;
	};

    return (
		<Drawer
			show={isOpen}
			onClose={onClose}
            title={t('questionBanks.addQuestion', 'Add New Question')}
			actions={
				<div className='flex justify-end gap-3'>
                    <button type='button' onClick={onClose} className='btn-secondary'>
                        {i18n.t('buttons.cancel', { ns: 'translation', defaultValue: 'Cancel' })}
					</button>
					<button
						type='submit'
						form='add-question-form'
						className='btn-primary'
						disabled={!isFormValid() || loading}
					>
                        {loading ? t('questionBanks.adding', 'Adding...') : t('questionBanks.addQuestion', 'Add Question')}
					</button>
				</div>
			}
		>
			<form id='add-question-form' onSubmit={handleSubmit} className='space-y-6'>
				{/* Two Column Layout */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Left Column - Question Description & Configuration */}
					<div className='space-y-6'>
						{/* Question Text */}
						<div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                {t('question.textRequired', 'Question Text *')}
                            </label>
							<textarea
								className='input-field w-full'
                                placeholder={t('question.enterText', 'Enter question text')}
								value={form.text}
								onChange={e => onChange('text', e.target.value)}
								rows={3}
								required
							/>
						</div>

						{/* Question Type */}
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								{t('question.typeRequired', 'Question Type *')}
							</label>
							<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
								{[
									{ value: 'single_choice', label: i18n.t('type.singleChoice', { ns: 'question', defaultValue: 'Single Choice' }), description: t('questionBanks.hint.singleChoice', 'Students can select only one correct answer'), Icon: ListBulletIcon },
									{ value: 'multiple_choice', label: i18n.t('type.multipleChoice', { ns: 'question', defaultValue: 'Multiple Choice' }), description: t('questionBanks.hint.multipleChoice', 'Students can select multiple correct answers'), Icon: Squares2X2Icon },
									{ value: 'short_text', label: i18n.t('type.shortText', { ns: 'question', defaultValue: 'Short Text' }), description: t('questionBanks.hint.shortText', 'Students can enter a text response'), Icon: PencilSquareIcon },
								].map(option => {
									const isSelected = form.type === option.value;
									const Icon = option.Icon as any;
									return (
										<label key={option.value} className={`relative block border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
											<input type='radio' name='question-type' value={option.value} checked={isSelected} onChange={() => onChange('type', option.value)} className='sr-only' />
											<div className='flex items-start gap-3'>
												<div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
													<Icon className='w-6 h-6' />
												</div>
												<div>
													<div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{option.label}</div>
													<div className='text-xs text-gray-500 mt-1'>{option.description}</div>
												</div>
											</div>
											{isSelected && (
												<div className='absolute top-2 right-2'>
													<div className='w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center'>
														<svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
															<path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
														</svg>
													</div>
												</div>
											)}
										</label>
									);
								})}
							</div>
						</div>

						{/* Question Description (Rich Text) */}
						<div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                {t('question.descriptionOptional', 'Question Description (Optional)')}
                            </label>
							<SimpleQuillEditor
								value={form.description || ''}
								onChange={value => onChange('description', value)}
                                placeholder={t('question.descriptionPlaceholder', 'Enter scenario or context for the question...')}
								className='w-full'
							/>
						</div>

						{/* Description Image */}
						<div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                {t('question.descriptionImageOptional', 'Description Image (Optional)')}
                            </label>
							<ImageUpload
								imageUrl={form.descriptionImage || null}
								onImageUpload={url => onChange('descriptionImage', url)}
								onImageRemove={() => onChange('descriptionImage', '')}
                                placeholder={t('question.descriptionImagePlaceholder', 'Upload image to illustrate question content')}
								uploadMethod='cloudinary'
								className='w-full'
							/>
							<div className='text-xs text-gray-500 mt-1'>
								Add an image to help explain the question context (charts, diagrams,
								scenarios, etc.)
							</div>
						</div>

						{/* Answer Configuration for Short Text */}
						{form.type === 'short_text' && (
							<div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    {t('question.expectedAnswerOptional', 'Expected Answer (Optional)')}
                                </label>
								<input
									type='text'
									className='input-field w-full'
                                    placeholder={t('question.expectedAnswerPlaceholder', 'Enter expected answer for scoring (optional)')}
									value={
										typeof form.correctAnswer === 'string'
											? form.correctAnswer
											: ''
									}
									onChange={e => onChange('correctAnswer', e.target.value)}
								/>
								<div className='text-xs text-gray-500 mt-1'>
									For assessments/quizzes, you can specify an expected answer for
									automatic scoring
								</div>
							</div>
						)}

						{/* Correct Answer Selection for Choice Questions */}
						{form.type !== 'short_text' &&
							form.options &&
							form.options.filter(opt => {
								const text = typeof opt === 'string' ? opt : opt.text || '';
								return text.trim();
							}).length >= 2 && (
							<div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        {t('question.selectCorrectAnswers', 'Select Correct Answer(s) *')}
                                </label>
								<div className='space-y-2'>
									{form.options.map((opt, idx) => {
										const optionText =
												typeof opt === 'string' ? opt : opt.text || '';
										const optionImageUrl =
												typeof opt === 'object' ? opt.imageUrl : undefined;
										if (!optionText.trim()) return null;
										const isCorrect = Array.isArray(form.correctAnswer)
											? form.correctAnswer.includes(idx)
											: form.correctAnswer === idx;
										return (
											<div key={idx} className='flex items-center gap-2'>
												<button
													type='button'
													onClick={() => toggleCorrectAnswer(idx)}
													className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
														isCorrect
															? 'bg-green-500 border-green-500 text-white'
															: 'border-gray-300 hover:border-green-400'
													}`}
												>
													{isCorrect && (
														<svg
															className='w-3 h-3'
															fill='currentColor'
															viewBox='0 0 20 20'
														>
															<path
																fillRule='evenodd'
																d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
																clipRule='evenodd'
															/>
														</svg>
													)}
												</button>
												<div className='flex-1'>
                                                        <span className='text-sm text-gray-700'>
                                                            {optionText || t('question.optionIndex', 'Option {{index}}', { index: idx + 1 })}
                                                        </span>
													{optionImageUrl && (
														<div className='mt-1'>
															<img
																src={optionImageUrl}
                                                                alt={t('question.optionIndex', 'Option {{index}}', { index: idx + 1 })}
																className='w-16 h-16 object-cover rounded border border-gray-300'
															/>
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
								<div className='text-xs text-gray-500 mt-1'>
                                        {form.type === 'single_choice'
                                            ? t('questionBanks.hint.selectSingle', 'Click to select the single correct answer')
                                            : t('questionBanks.hint.selectMultiple', 'Click the checkboxes to select multiple correct answers')}
								</div>
							</div>
						)}

						{/* Points */}
						<div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                {t('question.points', 'Points')}
                            </label>
							<input
								type='number'
								className='input-field w-full'
                                placeholder={t('question.pointsPlaceholder', 'Points for this question')}
								value={form.points || ''}
								onChange={e =>
									onChange(
										'points',
										e.target.value ? parseInt(e.target.value) : 1
									)
								}
								min='1'
								max='100'
							/>
                                <div className='text-xs text-gray-500 mt-1'>
                                {t('question.pointsHelp', 'Points awarded for answering this question correctly')}
                            </div>
						</div>

						{/* Difficulty */}
						<div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                {t('question.difficulty', 'Difficulty')}
                            </label>
							<select
								className='input-field w-full'
								value={form.difficulty || 'medium'}
								onChange={e => onChange('difficulty', e.target.value)}
							>
								<option value='easy'>{t('question.difficulty.easy', 'Easy')}</option>
								<option value='medium'>{t('question.difficulty.medium', 'Medium')}</option>
								<option value='hard'>{t('question.difficulty.hard', 'Hard')}</option>
							</select>
                            <div className='text-xs text-gray-500 mt-1'>
                                {t('question.difficultyHelp', 'Set the difficulty level for this question')}
                            </div>
						</div>

						{/* Tags */}
						<div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                {t('question.tags', 'Tags (Optional)')}
                            </label>
							<input
								type='text'
								className='input-field w-full'
                                placeholder={t('question.tagsPlaceholder', 'Enter tags separated by commas')}
								value={form.tags ? form.tags.join(', ') : ''}
								onChange={e => {
									const tagString = e.target.value;
									const tags = tagString
										.split(',')
										.map(tag => tag.trim())
										.filter(tag => tag.length > 0);
									onChange('tags', tags);
								}}
							/>
                            <div className='text-xs text-gray-500 mt-1'>
                                {t('question.tagsHelp', 'Add tags to help organize and filter questions')}
                            </div>
						</div>

						{/* Explanation */}
						<div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                {t('question.explanation', 'Answer Explanation (Optional)')}
                            </label>
							<textarea
								className='input-field w-full'
								rows={3}
                                placeholder={t('question.explanationPlaceholder', 'Explain why this is the correct answer')}
								value={form.explanation || ''}
								onChange={e => onChange('explanation', e.target.value)}
							/>
                            <div className='text-xs text-gray-500 mt-1'>
                                {t('question.explanationHelp', 'Provide explanation to help users understand the correct answer')}
                            </div>
						</div>
					</div>

					{/* Right Column - Options Management */}
					<div className='space-y-6'>
						{/* Options (for choice questions) */}
						{form.type !== 'short_text' && (
							<div>
								<div className='flex items-center justify-between mb-4'>
                                    <label className='block text-lg font-medium text-gray-700'>
                                        {t('question.optionsManagement', 'Options Management')}
                                    </label>
									<button
										className='btn-primary btn-small'
										onClick={onAddOption}
										type='button'
									>
                                        + {t('question.addOption', 'Add Option')}
									</button>
								</div>
								{form.options && form.options.length > 0 ? (
									<div className='space-y-4'>
										{form.options.map((option, index) => {
											const optionText =
												typeof option === 'string'
													? option
													: option.text || '';
											const optionImageUrl =
												typeof option === 'object'
													? option.imageUrl
													: undefined;

											return (
												<div
													key={index}
													className='border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50'
												>
													<div className='flex items-center gap-2'>
                                                        <span className='text-sm font-medium text-gray-500 min-w-[80px]'>
                                                            {t('question.optionIndex', 'Option {{index}}', { index: index + 1 })}
                                                        </span>
														<input
															className='input-field flex-1'
                                                            placeholder={t('question.enterOptionIndex', 'Enter option {{index}} text', { index: index + 1 })}
															value={optionText}
															onChange={e => {
																const newOption =
																	typeof option === 'string'
																		? e.target.value
																		: {
																			...option,
																			text: e.target
																				.value,
																		};
																onOptionChange(index, newOption);
															}}
														/>
														{form.options &&
															form.options.length > 2 && (
															<button
                                                                className='btn-secondary btn-small text-red-600 hover:bg-red-50'
																onClick={() =>
																	onRemoveOption(index)
																}
																type='button'
															>
                                                                {i18n.t('buttons.delete', { ns: 'translation', defaultValue: 'Delete' })}
															</button>
														)}
													</div>

													<div>
                                                            <label className='block text-xs font-medium text-gray-600 mb-2'>
                                                            {t('question.optionImageOptional', 'Option Image (Optional)')}
                                                        </label>
														<ImageUpload
															imageUrl={optionImageUrl || null}
															onImageUpload={url => {
																const newOption =
																	typeof option === 'string'
																		? {
																			text: option,
																			imageUrl: url,
																		}
																		: {
																			...option,
																			imageUrl: url,
																		};
																onOptionChange(index, newOption);
															}}
															onImageRemove={() => {
																const newOption =
																	typeof option === 'string'
																		? option
																		: {
																			...option,
																			imageUrl: undefined,
																		};
																onOptionChange(index, newOption);
															}}
                                                            placeholder={t('question.optionImagePlaceholder', 'Add image for this option')}
															uploadMethod='cloudinary'
															className='w-full'
														/>
													</div>
												</div>
											);
										})}

										{/* Add Option Button at Bottom */}
                                        <div className='flex justify-center pt-2'>
											<button
												className='btn-outline btn-small flex items-center gap-2'
												onClick={onAddOption}
												type='button'
											>
												<svg
													className='w-4 h-4'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M12 6v6m0 0v6m0-6h6m-6 0H6'
													/>
												</svg>
                                                {t('question.addOption', 'Add Option')}
											</button>
										</div>
									</div>
								) : (
                                    <div className='text-gray-500 text-sm p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50'>
										<div className='mb-2'>📝</div>
                                            <div>{t('question.noOptions', 'No options added yet')}</div>
                                            <div className='text-xs mt-1'>
                                                {t('question.noOptionsHelp', 'Click "Add Option" to start creating answer choices')}
                                            </div>
									</div>
								)}
							</div>
						)}

						{/* Short Text Type Info */}
						{form.type === 'short_text' && (
                            <div className='text-gray-500 text-sm p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50'>
								<div className='mb-2'>✍️</div>
                                <div>{t('question.shortText', 'Short Text Question')}</div>
                                <div className='text-xs mt-1'>
                                    {t('question.shortTextHelp', 'Users will be able to enter their own text response')}
                                </div>
							</div>
						)}
					</div>
				</div>

				{/* Validation Errors */}
				{!isFormValid() && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
						<ul className='list-disc list-inside space-y-1'>
							{getValidationErrors().map((error, index) => (
								<li key={index}>{error}</li>
							))}
						</ul>
					</div>
				)}
			</form>
		</Drawer>
	);
};

export default AddQuestionModal;
