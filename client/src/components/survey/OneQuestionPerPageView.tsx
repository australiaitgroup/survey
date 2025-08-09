import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionNavigator from './QuestionNavigator';
import { QUESTION_TYPE } from '../../constants';

interface Question {
	_id: string;
	text: string;
	type: string;
	options?: Array<string | { text?: string; imageUrl?: string }>;
	imageUrl?: string;
	descriptionImage?: string;
}

interface OneQuestionPerPageViewProps {
	questions: Question[];
	answers: Record<string, string>;
	onAnswerChange: (questionId: string, answer: string) => void;
	onSubmit: () => void;
	loading?: boolean;
	antiCheatEnabled?: boolean;
	getInputProps?: () => any;
}

const OneQuestionPerPageView: React.FC<OneQuestionPerPageViewProps> = ({
	questions,
	answers,
	onAnswerChange,
	onSubmit,
	loading = false,
	antiCheatEnabled = false,
	getInputProps = () => ({}),
}) => {
	const { t } = useTranslation();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [transitionDirection, setTransitionDirection] = useState<'up' | 'down'>('up');
    const [showHint, setShowHint] = useState(false);

	// Reset to first question when questions change
	useEffect(() => {
		setCurrentQuestionIndex(0);
	}, [questions]);

	const currentQuestion = questions[currentQuestionIndex];
	const currentAnswer = answers[currentQuestion?._id] || '';

	// Check if current question is answered (required for proceeding)
	const canProceed = currentAnswer.trim() !== '';

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1 && canProceed) {
            setTransitionDirection('up');
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
		if (currentQuestionIndex > 0) {
            setTransitionDirection('down');
            setCurrentQuestionIndex(prev => prev - 1);
		}
	};

	const handleSubmitWrapper = () => {
		if (canProceed) {
			onSubmit();
		}
	};

	// Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (currentQuestionIndex === questions.length - 1) {
                    handleSubmitWrapper();
                } else {
                    handleNext();
                }
            }
        };

        document.addEventListener('keypress', handleKeyPress);
        return () => document.removeEventListener('keypress', handleKeyPress);
    }, [currentQuestionIndex, canProceed, questions.length]);

    if (!currentQuestion) {
		return (
			<div className='text-center py-8'>
				<div className='text-gray-500 text-6xl mb-4'>❓</div>
				<h3 className='text-xl font-semibold text-gray-700 mb-2'>
					{t('survey.oneQuestionPerPage.noQuestions', 'No questions available')}
				</h3>
				<p className='text-gray-500'>
					{t(
						'survey.oneQuestionPerPage.noQuestionsDescription',
						'Please check back later.'
					)}
				</p>
			</div>
		);
	}

    // show lightweight hint bubble on first question for a few seconds
    useEffect(() => {
        if (currentQuestionIndex === 0) {
            setShowHint(true);
            const timer = setTimeout(() => setShowHint(false), 2400);
            return () => clearTimeout(timer);
        } else {
            setShowHint(false);
        }
    }, [currentQuestionIndex]);

    return (
		<div className='space-y-8'>
			{/* Question Header */}
			<div className='text-center mb-8'>
				<div className='inline-flex items-center justify-center w-12 h-12 bg-[#FF5A5F] bg-opacity-10 text-[#FF5A5F] rounded-full text-lg font-bold mb-4'>
					{currentQuestionIndex + 1}
				</div>
				<h2 className='text-2xl font-bold text-[#484848] mb-2'>
					{t('survey.oneQuestionPerPage.questionTitle', 'Question {{number}}', {
						number: currentQuestionIndex + 1,
					})}
				</h2>
				<div className='text-sm text-[#767676]'>
					{t(
						'survey.oneQuestionPerPage.progressText',
						'{{current}} of {{total}} questions',
						{
							current: currentQuestionIndex + 1,
							total: questions.length,
						}
					)}
				</div>
			</div>

			{/* Question Content */}
            <div
                className={`bg-white rounded-2xl p-8 border border-[#EBEBEB] shadow-sm hover:shadow-md transition-shadow ${
                    transitionDirection === 'up' ? 'animate-slide-down' : 'animate-slide-up'
                } ${
					antiCheatEnabled ? 'anti-cheat-container' : ''
				}`}
			>
                {showHint && (
                    <div className='mb-3 flex justify-center'>
                        <div className='text-xs text-[#767676] bg-[#F7F7F7] border border-[#EBEBEB] px-3 py-1.5 rounded-full animate-slide-down animate-fade-out'>
                            {t('survey.oneQuestionPerPage.hintEnter', '按 Enter 继续')}
                        </div>
                    </div>
                )}
				{/* Question Text */}
				<div className='mb-6'>
					<h3 className='text-xl font-medium text-[#484848] leading-relaxed'>
						{currentQuestion.text}
					</h3>
				</div>

				{/* Main Question Image */}
				{currentQuestion.imageUrl && (
					<div className='mb-6'>
						<img
							src={currentQuestion.imageUrl}
							alt={t('survey.oneQuestionPerPage.questionImage', 'Question image')}
							className='max-w-full h-auto rounded-lg border border-gray-300 mx-auto'
							onLoad={() => {
								console.log(
									'Main image loaded successfully:',
									currentQuestion.imageUrl
								);
							}}
							onError={e => {
								console.error(
									'Main image failed to load:',
									currentQuestion.imageUrl
								);
								e.currentTarget.style.display = 'none';
							}}
						/>
					</div>
				)}

				{/* Description Image */}
				{currentQuestion.descriptionImage && (
					<div className='mb-6'>
						<img
							src={currentQuestion.descriptionImage}
							alt={t(
								'survey.oneQuestionPerPage.descriptionImage',
								'Question illustration'
							)}
							className='max-w-full h-auto rounded-lg border border-gray-300 mx-auto'
							onLoad={() => {
								console.log(
									'Description image loaded successfully:',
									currentQuestion.descriptionImage
								);
							}}
							onError={e => {
								console.error(
									'Description image failed to load:',
									currentQuestion.descriptionImage
								);
								e.currentTarget.style.display = 'none';
							}}
						/>
					</div>
				)}

				{/* Answer Input */}
                {currentQuestion.type === QUESTION_TYPE.SHORT_TEXT ? (
                    <div className='space-y-4'>
                        <textarea
                            className='input-field resize-none w-full'
                            placeholder={t(
                                'survey.oneQuestionPerPage.textPlaceholder',
                                'Share your thoughts here...'
                            )}
                            rows={6}
                            value={currentAnswer}
                            onChange={e => onAnswerChange(currentQuestion._id, e.target.value)}
                            {...getInputProps()}
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (currentAnswer.trim().length > 0) {
                                        if (currentQuestionIndex === questions.length - 1) {
                                            handleSubmitWrapper();
                                        } else {
                                            handleNext();
                                        }
                                    }
                                }
                            }}
                        />
                        <div className='text-xs text-[#767676] mt-1'>
                            Press Enter to continue
                        </div>
                    </div>
                ) : (
                    <div className='space-y-4'>
						{currentQuestion.options?.map((opt, optIndex) => {
							const optionValue = typeof opt === 'string' ? opt : opt.text || '';
							const optionText = typeof opt === 'string' ? opt : opt.text || '';
							const optionImage = typeof opt === 'object' ? opt.imageUrl : null;
							const isSelected = currentAnswer === optionValue;

                            return (
                                <label
									key={`${currentQuestion._id}-${optIndex}-${optionText}`}
                                    className={`group flex items-start p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
										isSelected
											? 'border-[#FF5A5F] bg-[#FFF5F5] shadow-md'
											: 'border-[#EBEBEB] bg-white hover:border-[#FF5A5F] hover:border-opacity-30'
									}`}
								>
									<div className='flex items-center justify-center relative'>
										<input
											type='radio'
											name={currentQuestion._id}
											className='sr-only'
											value={optionValue}
											checked={isSelected}
											onChange={() =>
                                            {
                                                onAnswerChange(currentQuestion._id, optionValue);
                                                // Auto-advance like Typeform
                                                setTimeout(() => {
                                                    if (currentQuestionIndex === questions.length - 1) {
                                                        handleSubmitWrapper();
                                                    } else {
                                                        handleNext();
                                                    }
                                                }, 150);
                                            }
											}
										/>
										<div
                                        className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${
												isSelected
													? 'border-[#FF5A5F] bg-[#FF5A5F]'
													: 'border-[#DDDDDD] group-hover:border-[#FF5A5F]'
											}`}
										>
                                        {isSelected && (
                                            <div className='w-2 h-2 rounded-full bg-white animate-pop'></div>
                                        )}
										</div>
									</div>
									<div className='flex-1'>
										{optionText && (
											<span
												className={`block text-lg leading-relaxed font-medium transition-colors ${
													isSelected
														? 'text-[#484848] font-semibold'
														: 'text-[#484848] group-hover:text-[#FF5A5F]'
												}`}
											>
												{optionText}
											</span>
										)}
										{optionImage && (
											<div className='mt-4'>
												<img
													src={optionImage}
													alt={t(
														'survey.oneQuestionPerPage.optionImage',
														'Option {{number}}',
														{
															number: optIndex + 1,
														}
													)}
													className='max-w-full h-auto rounded-lg border border-[#EBEBEB] shadow-sm'
													style={{ maxHeight: '200px' }}
													onLoad={() => {
														console.log(
															'Option image loaded successfully:',
															optionImage
														);
													}}
													onError={e => {
														console.error(
															'Option image failed to load:',
															optionImage
														);
														e.currentTarget.style.display = 'none';
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

				{/* Validation Message */}
				{!canProceed && (
					<div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
						<div className='flex items-center gap-2 text-yellow-700'>
							<svg
								className='w-4 h-4 flex-shrink-0'
								fill='currentColor'
								viewBox='0 0 20 20'
							>
								<path
									fillRule='evenodd'
									d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
									clipRule='evenodd'
								/>
							</svg>
							<span className='text-sm font-medium'>
								{t(
									'survey.oneQuestionPerPage.answerRequired',
									'Please provide an answer to continue.'
								)}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Navigation */}
			<QuestionNavigator
				currentQuestion={currentQuestionIndex}
				totalQuestions={questions.length}
				canProceed={canProceed}
				onPrevious={handlePrevious}
				onNext={handleNext}
				onSubmit={handleSubmitWrapper}
				loading={loading}
			/>

			{/* Keyboard Hint */}
			<div className='text-center text-sm text-[#767676]'>
				{t(
					'survey.oneQuestionPerPage.keyboardHint',
					'Tip: Press Enter to proceed to the next question'
				)}
			</div>
		</div>
	);
};

export default OneQuestionPerPageView;
