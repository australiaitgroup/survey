import React from 'react';
import {
	QUESTION_TYPE,
	TYPES_REQUIRING_ANSWERS,
	type QuestionType,
	type SurveyType,
} from '../../constants';
import ImageUpload from '../common/ImageUpload';
import SimpleQuillEditor from '../common/SimpleQuillEditor';
import Drawer from '../Drawer';

interface SurveyQuestionForm {
	text: string;
	description?: string;
	descriptionImage?: string;
	options?: string[] | { text?: string; imageUrl?: string }[];
	type: QuestionType;
	correctAnswer?: number | number[] | string;
	points?: number;
}

interface EditSurveyQuestionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (form: SurveyQuestionForm) => void;
	form: SurveyQuestionForm;
	onChange: (field: string, value: unknown) => void;
	onOptionChange: (index: number, value: string | { text?: string; imageUrl?: string }) => void;
	onAddOption: () => void;
	onRemoveOption: (index: number) => void;
	loading?: boolean;
	surveyType: SurveyType;
	isCustomScoringEnabled?: boolean;
	defaultQuestionPoints?: number;
	questionIndex: number;
}

const EditSurveyQuestionModal: React.FC<EditSurveyQuestionModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	form,
	onChange,
	onOptionChange,
	onAddOption,
	onRemoveOption,
	loading = false,
	surveyType,
	isCustomScoringEnabled = false,
	defaultQuestionPoints = 1,
	questionIndex,
}) => {
	const isAssessmentType = TYPES_REQUIRING_ANSWERS.includes(surveyType as any);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(form);
	};

	const toggleCorrectAnswer = (optionIndex: number) => {
		if (form.type === QUESTION_TYPE.SINGLE_CHOICE) {
			onChange('correctAnswer', optionIndex);
		} else if (form.type === QUESTION_TYPE.MULTIPLE_CHOICE) {
			const currentAnswers = Array.isArray(form.correctAnswer) ? form.correctAnswer : [];
			const newAnswers = currentAnswers.includes(optionIndex)
				? currentAnswers.filter(idx => idx !== optionIndex)
				: [...currentAnswers, optionIndex];
			onChange('correctAnswer', newAnswers);
		}
	};

	const isFormValid = () => {
		if (!form.text.trim()) return false;

		if (form.type === QUESTION_TYPE.SHORT_TEXT) {
			return true;
		}

		if (!form.options || form.options.length < 2) return false;

		// Check if each option has either text or image
		const validOptions = form.options.filter(opt => {
			if (typeof opt === 'string') {
				return opt.trim().length > 0;
			}
			return (opt.text && opt.text.trim()) || opt.imageUrl;
		});

		return validOptions.length >= 2;
	};

	if (!isOpen) return null;

	return (
		<Drawer
			show={isOpen}
			onClose={onClose}
			title={`Edit Question ${questionIndex + 1}`}
			actions={
				<div className='flex justify-end gap-3'>
					<button type='button' onClick={onClose} className='btn-secondary'>
						Cancel
					</button>
					<button
						type='submit'
						form='edit-survey-question-form'
						className='btn-primary'
						disabled={loading || !isFormValid()}
					>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			}
		>
			<form id='edit-survey-question-form' onSubmit={handleSubmit} className='space-y-6'>
				{/* Two Column Layout to match Add drawer */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Left Column - Question Description & Configuration */}
					<div className='space-y-6'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Question Text *
							</label>
							<textarea
								className='input-field w-full'
								placeholder='Enter question text'
								value={form.text}
								onChange={e => onChange('text', e.target.value)}
								rows={3}
								required
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Question Type *
							</label>
							<select
								className='input-field w-full'
								value={form.type}
								onChange={e => onChange('type', e.target.value)}
								required
							>
								<option value={QUESTION_TYPE.SINGLE_CHOICE}>Single Choice</option>
								<option value={QUESTION_TYPE.MULTIPLE_CHOICE}>
									Multiple Choice
								</option>
								<option value={QUESTION_TYPE.SHORT_TEXT}>Short Text</option>
							</select>
							<div className='text-xs text-gray-500 mt-1'>
								{form.type === QUESTION_TYPE.SINGLE_CHOICE &&
									'Users can select only one answer'}
								{form.type === QUESTION_TYPE.MULTIPLE_CHOICE &&
									'Users can select multiple answers'}
								{form.type === QUESTION_TYPE.SHORT_TEXT &&
									'Users can enter a text response'}
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Question Description (Optional)
							</label>
							<SimpleQuillEditor
								value={form.description || ''}
								onChange={value => onChange('description', value)}
								placeholder='Enter scenario or context for the question...'
								className='w-full'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Description Image (Optional)
							</label>
							<ImageUpload
								imageUrl={form.descriptionImage || null}
								onImageUpload={url => onChange('descriptionImage', url)}
								onImageRemove={() => onChange('descriptionImage', '')}
								placeholder='Upload image to illustrate question content'
								uploadMethod='cloudinary'
								className='w-full'
							/>
							<div className='text-xs text-gray-500 mt-1'>
								Add an image to help explain the question context (charts, diagrams,
								scenarios, etc.)
							</div>
						</div>

						{/* Options moved to right column for a single source of truth */}

						{form.type === QUESTION_TYPE.SHORT_TEXT && isAssessmentType && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Expected Answer (Optional)
								</label>
								<input
									type='text'
									className='input-field w-full'
									placeholder='Enter expected answer for scoring (optional)'
									value={
										typeof form.correctAnswer === 'string'
											? form.correctAnswer
											: ''
									}
									onChange={e => onChange('correctAnswer', e.target.value)}
								/>
								<div className='text-xs text-gray-500 mt-1'>
									For assessment/quiz types, you can specify an expected answer
									for scoring
								</div>
							</div>
						)}

						{form.type !== QUESTION_TYPE.SHORT_TEXT &&
							isAssessmentType &&
							form.options &&
							form.options.filter(opt =>
								typeof opt === 'string' ? opt.trim() : opt.text && opt.text.trim()
							).length >= 2 && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
										Select Correct Answer(s) *
								</label>
								<div className='space-y-2'>
									{form.options.map((opt, idx) => {
										const optionText =
												typeof opt === 'string' ? opt : opt?.text || '';
										const optionImage =
												typeof opt === 'string' ? null : opt?.imageUrl;

										if (!optionText.trim() && !optionImage) return null;

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
												<div className='flex items-center gap-2'>
													<span className='text-sm text-gray-700'>
														{optionText || `Option ${idx + 1}`}
													</span>
													{optionImage && (
														<img
															src={optionImage}
															alt={`Option ${idx + 1}`}
															className='w-8 h-8 object-cover rounded border'
														/>
													)}
												</div>
											</div>
										);
									})}
								</div>
								<div className='text-xs text-gray-500 mt-1'>
									{form.type === QUESTION_TYPE.SINGLE_CHOICE
										? 'Click to select the single correct answer'
										: 'Click the checkboxes to select multiple correct answers'}
								</div>
							</div>
						)}

						{isAssessmentType && isCustomScoringEnabled && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Question Points
								</label>
								<input
									type='number'
									className='input-field w-full'
									placeholder={`Default points: ${defaultQuestionPoints}`}
									value={form.points || ''}
									onChange={e =>
										onChange(
											'points',
											e.target.value ? parseInt(e.target.value) : undefined
										)
									}
									min='1'
									max='100'
								/>
								<div className='text-xs text-gray-500 mt-1'>
									Leave empty to use default points ({defaultQuestionPoints}{' '}
									points)
								</div>
							</div>
						)}
					</div>
					{/* Right Column - Options Management mirrors Add drawer layout */}
					<div className='space-y-6'>
						{form.type !== QUESTION_TYPE.SHORT_TEXT && (
							<div>
								<div className='flex items-center justify-between mb-4'>
									<label className='block text-lg font-medium text-gray-700'>
										Options Management
									</label>
									<button
										className='btn-primary btn-small'
										onClick={onAddOption}
										type='button'
									>
										+ Add Option
									</button>
								</div>
								{form.options && form.options.length > 0 ? (
									<div className='space-y-4'>
										{form.options.map((option, index) => {
											const isStringOption = typeof option === 'string';
											const optionText = isStringOption
												? option
												: (option as { text?: string; imageUrl?: string })
													?.text || '';
											const optionImageUrl = isStringOption
												? undefined
												: (option as { text?: string; imageUrl?: string })
													?.imageUrl;

											return (
												<div
													key={index}
													className='border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50'
												>
													<div className='flex items-center gap-2'>
														<span className='text-sm font-medium text-gray-500 min-w-[80px]'>
															Option {index + 1}
														</span>
														<input
															className='input-field flex-1'
															placeholder={`Enter option ${index + 1} text`}
															value={optionText}
															onChange={e => {
																const newOption = isStringOption
																	? e.target.value
																	: {
																		...option,
																		text: e.target.value,
																	};
																onOptionChange(
																	index,
																	newOption as any
																);
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
																	Remove
															</button>
														)}
													</div>

													<div>
														<label className='block text-xs font-medium text-gray-600 mb-2'>
															Option Image (Optional)
														</label>
														<ImageUpload
															imageUrl={optionImageUrl || null}
															onImageUpload={url => {
																const newOption = isStringOption
																	? {
																		text: optionText,
																		imageUrl: url,
																	}
																	: {
																		...(option as any),
																		imageUrl: url,
																	};
																onOptionChange(index, newOption);
															}}
															onImageRemove={() => {
																const newOption = isStringOption
																	? optionText
																	: {
																		...(option as any),
																		imageUrl: undefined,
																	};
																onOptionChange(index, newOption);
															}}
															placeholder='Add image for this option'
															uploadMethod='cloudinary'
															className='w-full'
														/>
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<div className='text-gray-500 text-sm p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50'>
										<div className='mb-2'>📝</div>
										<div>No options added yet</div>
										<div className='text-xs mt-1'>
											Click "Add Option" to start creating answer choices
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</form>
		</Drawer>
	);
};

export default EditSurveyQuestionModal;
