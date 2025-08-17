import React from 'react';
import { QUESTION_TYPE, SOURCE_TYPE, TYPES_REQUIRING_ANSWERS } from '../../constants';
import SafeMarkdown from './SafeMarkdown';
import type { Question } from './takeSurveyTypes';

interface QuestionListProps {
	questions: Question[];
	answers: Record<string, any>;
	onAnswerChange: (qid: string, value: string | string[]) => void;
	antiCheatEnabled: boolean;
	isAssessmentType: boolean | undefined;
	getInputProps: () => Record<string, any>;
	sourceType?: string;
}

const QuestionList: React.FC<QuestionListProps> = ({
	questions,
	answers,
	onAnswerChange,
	antiCheatEnabled,
	isAssessmentType,
	getInputProps,
	sourceType,
}) => {
	return (
		<div className='space-y-8'>
			<div className='flex items-center justify-between border-b border-[#EBEBEB] pb-4'>
				<h3 className='heading-sm'>📝 Survey Questions</h3>
				{sourceType === SOURCE_TYPE.QUESTION_BANK && (
					<div className='text-sm text-[#FC642D] bg-[#FC642D] bg-opacity-10 px-3 py-1.5 rounded-lg font-medium'>
						🎲 Randomized Questions
					</div>
				)}
			</div>
			{questions && questions.length > 0 ? (
				questions.map((q, index) => (
					<div
						key={q._id}
						className={`bg-white rounded-xl p-6 border border-[#EBEBEB] ${antiCheatEnabled && isAssessmentType ? 'anti-cheat-container' : ''}`}
					>
						<label className='block mb-5 font-medium text-[#484848] text-lg leading-relaxed break-words'>
							<span className='inline-flex items-center justify-center w-7 h-7 bg-[#FF5A5F] bg-opacity-10 text-[#FF5A5F] rounded-full text-sm font-bold mr-3'>
								{index + 1}
							</span>
							{q.text}
						</label>

						{q.description && (
							<SafeMarkdown
								content={q.description}
								className='mb-6 prose prose-sm max-w-none'
							/>
						)}

						{q.imageUrl && (
							<div className='mb-4'>
								<img
									src={q.imageUrl}
									alt='Question image'
									className='max-w-full h-auto rounded-lg border border-gray-200'
									onError={e => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
						)}

						{q.descriptionImage && (
							<div className='mb-4'>
								<img
									src={q.descriptionImage}
									alt='Question illustration'
									className='max-w-full h-auto rounded-lg border border-gray-300'
									onError={e => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
						)}

						{q.type === QUESTION_TYPE.SHORT_TEXT ? (
							<div className='space-y-4'>
								<textarea
									className='input-field resize-none'
									placeholder='Share your thoughts here...'
									rows={5}
									value={answers[q._id] || ''}
									onChange={e => onAnswerChange(q._id, e.target.value)}
									required
									{...getInputProps()}
								/>
							</div>
						) : (
							<div className='space-y-4'>
								{q.options &&
									q.options.map((opt, optIndex) => {
										const optionValue =
											typeof opt === 'string' ? opt : opt.text;
										const optionText = typeof opt === 'string' ? opt : opt.text;
										const optionImage =
											typeof opt === 'object' ? (opt as any).imageUrl : null;
										const isSelected = answers[q._id] === optionValue;
										return (
											<label
												key={`${q._id}-${optIndex}-${optionText}`}
												className={`group flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-[#FF5A5F] bg-[#FFF5F5]' : 'border-[#EBEBEB] bg-white hover:border-[#FF5A5F] hover:border-opacity-20'}`}
											>
												<div className='flex items-center justify-center relative'>
													<input
														type='radio'
														name={q._id}
														className='sr-only'
														value={optionValue}
														checked={isSelected}
														onChange={() =>
															onAnswerChange(q._id, optionValue)
														}
														required
													/>
													<div
														className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#FF5A5F] bg-[#FF5A5F]' : 'border-[#DDDDDD] group-hover:border-[#FF5A5F]'}`}
													>
														{isSelected && (
															<div className='w-1.5 h-1.5 rounded-full bg-white'></div>
														)}
													</div>
												</div>
												<div className='flex-1'>
													{optionText && (
														<span
															className={`block text-base leading-relaxed font-medium transition-colors break-words ${isSelected ? 'text-[#484848] font-semibold' : 'text-[#484848] group-hover:text-[#FF5A5F]'}`}
														>
															{optionText}
														</span>
													)}
													{optionImage && (
														<div className='mt-3'>
															<img
																src={optionImage}
																alt={`Option ${optIndex + 1}`}
																className='max-w-full h-auto rounded-lg border border-[#EBEBEB]'
																style={{ maxHeight: '200px' }}
																onError={e => {
																	e.currentTarget.style.display =
																		'none';
																}}
															/>
														</div>
													)}
												</div>
											</label>
										);
									})}
							</div>
						)}
					</div>
				))
			) : (
				<div className='text-center py-8'>
					<div className='text-gray-500 text-4xl mb-4'>⚠️</div>
					<h3 className='text-lg font-semibold text-gray-700 mb-2'>
						No Questions Available
					</h3>
					<p className='text-gray-500'>Questions could not be loaded.</p>
				</div>
			)}
		</div>
	);
};

export default QuestionList;
