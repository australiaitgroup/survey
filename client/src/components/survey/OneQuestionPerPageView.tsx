import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import QuestionNavigator from './QuestionNavigator';
import { QUESTION_TYPE } from '../../constants';

interface Question {
	_id: string;
	text: string;
	description?: string;
	type: string;
	options?: Array<string | { text?: string; imageUrl?: string }>;
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
	// Preview support
	externalPageIndex?: number;
	ignoreRequiredForNavigation?: boolean;
}

const OneQuestionPerPageView: React.FC<OneQuestionPerPageViewProps> = ({
	questions,
	answers,
	onAnswerChange,
	onSubmit,
	loading = false,
	antiCheatEnabled = false,
	getInputProps = () => ({}),
	externalPageIndex,
	ignoreRequiredForNavigation = false,
}) => {
	const { t } = useTranslation();
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [transitionDirection, setTransitionDirection] = useState<'up' | 'down'>('up');
	const [showHint, setShowHint] = useState(false);

	// Reset to first question when questions change
	useEffect(() => {
		setCurrentQuestionIndex(0);
	}, [questions]);

	// Sync external page index
	useEffect(() => {
		if (typeof externalPageIndex === 'number') {
			setCurrentQuestionIndex(
				Math.max(0, Math.min(externalPageIndex, (questions?.length || 1) - 1))
			);
		}
	}, [externalPageIndex, questions?.length]);

	const currentQuestion = questions?.[currentQuestionIndex];
	const currentAnswer = answers[currentQuestion?._id] || '';

	// Check if current question is answered (required for proceeding)
	const canProceed = ignoreRequiredForNavigation || currentAnswer.trim() !== '';

	const handleNext = () => {
		if (currentQuestionIndex < (questions?.length || 0) - 1 && canProceed) {
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
				if (currentQuestionIndex === (questions?.length || 0) - 1) {
					handleSubmitWrapper();
				} else {
					handleNext();
				}
			}
		};

		document.addEventListener('keypress', handleKeyPress);
		return () => document.removeEventListener('keypress', handleKeyPress);
	}, [currentQuestionIndex, canProceed, questions?.length]);

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

	// hint bubble for first question
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
			<div className='text-center mb-4'>
				{/* Steps indicator */}
				<div className='flex items-center justify-center gap-2 mb-2'>
					{questions &&
						questions.map((_, i) => (
							<span
								key={`step-${i}`}
								className={
									'rounded-full transition-all ' +
									(i === currentQuestionIndex
										? 'bg-[#FF5A5F] h-2.5 w-5'
										: i < currentQuestionIndex
											? 'bg-[#FF5A5F] bg-opacity-30 h-2 w-4'
											: 'bg-[#EBEBEB] h-2 w-3')
								}
								aria-hidden='true'
							/>
						))}
				</div>
				<div className='text-xs text-[#767676]'>
					{t(
						'survey.oneQuestionPerPage.progressText',
						'{{current}} of {{total}} questions',
						{
							current: currentQuestionIndex + 1,
							total: questions?.length || 0,
						}
					)}
				</div>
			</div>

			{/* Question Content */}
			<div
				className={`bg-white rounded-xl p-6 border border-[#EBEBEB] transition-all ${
					transitionDirection === 'up' ? 'animate-slide-down' : 'animate-slide-up'
				} ${antiCheatEnabled ? 'anti-cheat-container' : ''}`}
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

				{/* Question Description (Markdown) */}
				{currentQuestion.description && (
					<div className='mb-6 prose prose-sm max-w-none'>
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							rehypePlugins={[
								rehypeRaw,
								[
									rehypeSanitize,
									{
										tagNames: [
											'p',
											'br',
											'span',
											'strong',
											'em',
											'del',
											'code',
											'pre',
											'blockquote',
											'a',
											'h1',
											'h2',
											'h3',
											'h4',
											'h5',
											'h6',
											'ul',
											'ol',
											'li',
										],
										attributes: {
											a: ['href', 'title', 'rel', 'target'],
											code: ['className'],
											span: ['className'],
										},
									},
								],
							]}
						>
							{currentQuestion.description}
						</ReactMarkdown>
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
						/>
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
									className={`group flex items-start p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
										isSelected
											? 'border-[#FF5A5F] bg-[#FFF5F5]'
											: 'border-[#EBEBEB] bg-white hover:border-[#FF5A5F] hover:border-opacity-20'
									}`}
								>
									<div className='flex items-center justify-center relative'>
										<input
											type='radio'
											name={currentQuestion._id}
											className='sr-only'
											value={optionValue}
											checked={isSelected}
											onChange={() => {
												onAnswerChange(currentQuestion._id, optionValue);
												setTimeout(() => {
													if (
														currentQuestionIndex ===
														(questions?.length || 0) - 1
													) {
														handleSubmitWrapper();
													} else {
														handleNext();
													}
												}, 150);
											}}
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
				totalQuestions={questions?.length || 0}
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
