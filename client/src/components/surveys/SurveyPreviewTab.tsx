import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Survey, Question } from '../../types/admin';
import OneQuestionPerPageView from '../survey/OneQuestionPerPageView';
import { NAVIGATION_MODE, QUESTION_TYPE, SOURCE_TYPE, SURVEY_TYPE } from '../../constants';

interface SurveyPreviewTabProps {
	survey: Survey;
	hideLeftPane?: boolean;
}

// Preview context to isolate state and suppress writes
interface PreviewContextValue {
	preview: boolean;
	previewSessionId: string;
	answers: Record<string, any>;
	setAnswer: (qid: string, value: any) => void;
	clear: () => void;
	scrollToQuestion: (qid: string) => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

const usePreview = () => {
	const ctx = useContext(PreviewContext);
	if (!ctx) throw new Error('usePreview must be used within PreviewProvider');
	return ctx;
};

const generateUUID = () =>
	crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

// Removed device widths & switcher; preview is fully responsive to screen width

const PreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [previewSessionId, setPreviewSessionId] = useState<string>(generateUUID());
	// Expose imperative helpers for panes
	const listScrollRef = useRef<HTMLDivElement | null>(null);

	const setAnswer = useCallback((qid: string, value: any) => {
		setAnswers(prev => ({ ...prev, [qid]: value }));
	}, []);

	const clear = useCallback(() => {
		setAnswers({});
		setPreviewSessionId(generateUUID());
	}, []);

	const scrollToQuestion = useCallback((qid: string) => {
		const el = document.querySelector(`[data-question-id="${qid}"]`);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, []);

	const value = useMemo<PreviewContextValue>(
		() => ({
			preview: true,
			previewSessionId,
			answers,
			setAnswer,
			clear,
			scrollToQuestion,
		}),
		[answers, clear, previewSessionId, scrollToQuestion, setAnswer]
	);

	return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
};

type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

const LeftPane: React.FC<{ survey: Survey; onFocusQuestion: (q: Question) => void }> = ({
	survey,
	onFocusQuestion,
}) => {
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const questions = (survey.questions || []) as unknown as Question[];
	const filtered = questions.filter(q => {
		if (!query) return true;
		const text = [q.text, (q as any).description].filter(Boolean).join(' ').toLowerCase();
		return text.includes(query.toLowerCase());
	});

	return (
		<div className='h-full overflow-y-auto border-r border-gray-200 pr-4'>
			<div className='mb-3'>
				<input
					className='input-field w-full'
					placeholder={t('preview.search.placeholder', 'Search questions')}
					value={query}
					onChange={e => setQuery(e.target.value)}
				/>
			</div>
			<ul className='space-y-2'>
				{filtered.map((q, idx) => (
					<li key={q._id}>
						<button
							className='w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200'
							onClick={() => onFocusQuestion(q)}
						>
							<div className='text-xs text-gray-500'>
								#{idx + 1} · {q.type}
							</div>
							<div className='text-sm text-gray-800 truncate'>{q.text}</div>
						</button>
					</li>
				))}
				{filtered.length === 0 && (
					<div className='text-sm text-gray-500'>
						{t('preview.search.noResults', 'No matching questions')}
					</div>
				)}
			</ul>
		</div>
	);
};

// Right pane renderer that reuses end-user components but isolated
const RightPane: React.FC<{
	survey: Survey;
	externalPageIndex?: number;
	forceSingleColumn?: boolean;
}> = ({ survey, externalPageIndex, forceSingleColumn = false }) => {
	const { answers, setAnswer } = usePreview();
	const { t } = useTranslation();
	const [submitted, setSubmitted] = useState(false);
	const [scoring, setScoring] = useState<any | null>(null);

	const questions = (survey.questions || []) as unknown as Question[];

	const handleAnswerChange = (qid: string, val: any) => setAnswer(qid, val);

	const computeLocalScore = () => {
		if (!survey || !questions?.length) return null;
		// Mirror logic from TakeSurvey for scoring
		let totalPoints = 0;
		let maxPossiblePoints = 0;
		let correctAnswers = 0;
		let wrongAnswers = 0;

		questions.forEach(q => {
			const userAnswer = answers[q._id];
			let isCorrect = false;
			let correctAnswerText = '';

			if ((q as any).correctAnswer !== undefined && userAnswer !== undefined) {
				if (q.type === QUESTION_TYPE.SINGLE_CHOICE) {
					if (typeof (q as any).correctAnswer === 'number') {
						const options = q.options || [];
						const userIndex = options.findIndex(opt =>
							typeof opt === 'string'
								? opt === userAnswer
								: (opt as any).text === userAnswer
						);
						isCorrect = userIndex === (q as any).correctAnswer;
						const correctOption = options[(q as any).correctAnswer as number];
						correctAnswerText =
							typeof correctOption === 'string'
								? correctOption
								: (correctOption as any)?.text || '';
					} else {
						isCorrect = userAnswer === (q as any).correctAnswer;
						correctAnswerText = String((q as any).correctAnswer);
					}
				} else if (
					q.type === QUESTION_TYPE.MULTIPLE_CHOICE &&
					Array.isArray((q as any).correctAnswer)
				) {
					const ansArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
					const options = q.options || [];
					const userIdx = ansArr
						.map(a =>
							options.findIndex(opt =>
								typeof opt === 'string' ? opt === a : (opt as any).text === a
							)
						)
						.filter(i => i !== -1);
					const correctIdx = (q as any).correctAnswer as number[];
					isCorrect =
						userIdx.length === correctIdx.length &&
						userIdx.every(i => correctIdx.includes(i));
					correctAnswerText = correctIdx
						.map(i => {
							const opt = options[i];
							return typeof opt === 'string' ? opt : (opt as any)?.text || '';
						})
						.join(', ');
				} else if (q.type === QUESTION_TYPE.SHORT_TEXT) {
					isCorrect = userAnswer === (q as any).correctAnswer;
					correctAnswerText = String((q as any).correctAnswer);
				} else {
					isCorrect = userAnswer === (q as any).correctAnswer;
					correctAnswerText = String((q as any).correctAnswer);
				}
			}

			const maxPoints =
				(q as any).points ||
				(survey.scoringSettings?.customScoringRules?.defaultQuestionPoints ?? 1);
			const pointsAwarded = isCorrect ? maxPoints : 0;
			totalPoints += pointsAwarded;
			maxPossiblePoints += maxPoints;
			if (isCorrect) correctAnswers++;
			else wrongAnswers++;
		});

		const scoringMode = survey.scoringSettings?.scoringMode || 'percentage';
		const passingThreshold = survey.scoringSettings?.passingThreshold || 60;
		const percentage = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;

		let displayScore = 0;
		let passed = false;
		let scoringDescription = '';

		if (scoringMode === 'percentage') {
			displayScore = Math.round(percentage);
			passed = displayScore >= passingThreshold;
			scoringDescription = t(
				'survey.scoring.percentageDescription',
				'Your score is based on the percentage of correct answers.'
			);
		} else {
			displayScore = totalPoints;
			passed = totalPoints >= passingThreshold;
			scoringDescription = t(
				'survey.scoring.accumulatedDescription',
				'Your score is the total points from all questions.'
			);
		}

		return {
			totalPoints,
			maxPossiblePoints,
			correctAnswers,
			wrongAnswers,
			displayScore,
			passed,
			scoringMode,
			scoringDescription,
		};
	};

	const handleSubmit = () => {
		// Suppress network writes; just compute local score and show terminal UI
		console.debug('Preview mode: write suppressed');
		setSubmitted(true);
		if (survey && survey.scoringSettings) {
			const res = computeLocalScore();
			setScoring(res);
		}
	};

	if (submitted) {
		return (
			<div className='p-6 text-center'>
				<h3 className='text-xl font-semibold mb-2'>
					{t('preview.thankYou', 'Thank you!')}
				</h3>
				{scoring ? (
					<div className='text-gray-700'>
						{t('preview.scoreLine', 'Score: {{score}}', {
							score: scoring.displayScore,
						})}
					</div>
				) : (
					<div className='text-gray-700'>
						{t('preview.submissionNotSaved', 'Submission not saved (preview mode)')}
					</div>
				)}
			</div>
		);
	}

	// Empty state in preview when no questions
	if (!questions || questions.length === 0) {
		const isBankBased =
			survey.sourceType === SOURCE_TYPE.QUESTION_BANK ||
			survey.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK ||
			survey.sourceType === SOURCE_TYPE.MANUAL_SELECTION;
		const title = isBankBased
			? t('preview.empty.bank.title', 'Question bank in use')
			: t('preview.empty.title', 'No questions yet');
		const subtitle = isBankBased
			? t(
				'preview.empty.bank.subtitle',
				'Questions will be selected from the question bank when respondents start the test.'
			)
			: t(
				'preview.empty.subtitle',
				'Add questions to see a live preview of your assessment.'
			);
		return (
			<div className='h-full w-full flex items-center justify-center p-8'>
				<div className='text-center max-w-md'>
					<div className='mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400'>
						{isBankBased ? (
							// Dice icon for randomized selection
							<svg
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 24 24'
								fill='currentColor'
								className='h-8 w-8'
							>
								<path d='M21 7.5V18a3 3 0 01-3 3H7.5a3 3 0 01-3-3V6a3 3 0 013-3H18a3 3 0 013 3v1.5zM9 8.25a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM15 8.25a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM9 14.25a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM15 14.25a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z' />
							</svg>
						) : (
							// Chat bubble icon for manual questions
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='h-8 w-8'
								viewBox='0 0 20 20'
								fill='currentColor'
							>
								<path d='M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 4v-4H4a2 2 0 01-2-2V5z' />
							</svg>
						)}
					</div>
					<h3 className='text-lg font-semibold text-gray-800 mb-1'>{title}</h3>
					<p className='text-gray-500 text-sm'>{subtitle}</p>
				</div>
			</div>
		);
	}

	// Determine effective navigation for preview: assessments are always one-per-page
	const effectiveNavigationMode =
		survey.type === SURVEY_TYPE.ASSESSMENT
			? NAVIGATION_MODE.ONE_QUESTION_PER_PAGE
			: (survey.navigationMode as any);

	// Display modes
	if (effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE) {
		return (
			<OneQuestionPerPageView
				questions={questions as any}
				answers={answers as any}
				onAnswerChange={handleAnswerChange}
				onSubmit={handleSubmit}
				loading={false}
				antiCheatEnabled={false}
				getInputProps={() => ({})}
				externalPageIndex={externalPageIndex}
				ignoreRequiredForNavigation={false}
				autoAdvanceOnSelect={false}
				forceSingleColumn={forceSingleColumn}
			/>
		);
	}

	// List mode
	return (
		<div className='space-y-6'>
			{questions.map((q, idx) => (
				<div key={q._id} data-question-id={q._id} className='bg-white rounded-xl p-6'>
					<label className='block mb-5 font-medium text-[#484848] text-lg leading-relaxed'>
						<span className='inline-flex items-center justify-center min-w-[24px] h-6 rounded mr-3 bg-blue-50 text-blue-600 text-sm font-medium shadow-sm px-2'>
							{idx + 1}
						</span>
						{q.text}
					</label>
					{(q as any).description && (
						<div className='mb-6 text-sm text-gray-700'>{(q as any).description}</div>
					)}
					{q.type === QUESTION_TYPE.SHORT_TEXT ? (
						<textarea
							className='input-field resize-none'
							placeholder='...'
							rows={4}
							value={(answers as any)[q._id] || ''}
							onChange={e => handleAnswerChange(q._id, e.target.value)}
						/>
					) : (
						<div className='space-y-3'>
							{(q.options || []).map((opt: any, optIndex: number) => {
								const optionValue = typeof opt === 'string' ? opt : opt?.text;

								// Handle both single and multiple choice selection
								const isMultipleChoice = q.type === QUESTION_TYPE.MULTIPLE_CHOICE;
								const currentAnswer = (answers as any)[q._id];
								const isSelected = isMultipleChoice
									? Array.isArray(currentAnswer) &&
										currentAnswer.includes(optionValue)
									: currentAnswer === optionValue;

								const handleOptionChange = () => {
									if (isMultipleChoice) {
										const currentAnswers = Array.isArray(currentAnswer)
											? currentAnswer
											: [];
										if (isSelected) {
											// Remove from selection
											const newAnswers = currentAnswers.filter(
												(val: any) => val !== optionValue
											);
											handleAnswerChange(q._id, newAnswers);
										} else {
											// Add to selection
											handleAnswerChange(q._id, [
												...currentAnswers,
												optionValue,
											]);
										}
									} else {
										// Single choice
										handleAnswerChange(q._id, optionValue);
									}
								};

								return (
									<label
										key={`${q._id}-${optIndex}`}
										className={`group flex items-start p-3 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-[#FFF5F5]' : 'bg-gray-50 hover:bg-gray-100'}`}
									>
										<div className='flex items-center justify-center relative mr-3 mt-1'>
											<input
												type={isMultipleChoice ? 'checkbox' : 'radio'}
												name={isMultipleChoice ? undefined : q._id}
												checked={isSelected}
												onChange={handleOptionChange}
												className='sr-only'
											/>
											<div
												className={`w-4 h-4 ${isMultipleChoice ? 'rounded' : 'rounded-full'} border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#FF5A5F] bg-[#FF5A5F]' : 'border-[#DDDDDD] group-hover:border-[#FF5A5F]'}`}
											>
												{isSelected &&
													(isMultipleChoice ? (
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
													) : (
														<div className='w-1.5 h-1.5 rounded-full bg-white'></div>
													))}
											</div>
										</div>
										<span>{optionValue}</span>
									</label>
								);
							})}
						</div>
					)}
				</div>
			))}
			<div className='pt-2'>
				<button className='btn-primary' onClick={handleSubmit}>
					{t('buttons.submit', 'Submit')}
				</button>
			</div>
		</div>
	);
};

const SurveyPreviewTab: React.FC<SurveyPreviewTabProps> = ({ survey, hideLeftPane = false }) => {
	const { t } = useTranslation();
	// No device control; rely on responsive layout
	const { clear, scrollToQuestion } = usePreview();
	const [pageIndex, setPageIndex] = useState<number>(0);
	const [device, setDevice] = useState<PreviewDevice>(
		survey.type === SURVEY_TYPE.ASSESSMENT ? 'mobile' : 'desktop'
	);
	// Use effective navigation mode for label and behaviors in preview
	// Assessment types now use step-by-step mode (handled by TakeAssessment component)
	const effectiveNavigationMode = React.useMemo(
		() =>
			survey.type === SURVEY_TYPE.ASSESSMENT
				? NAVIGATION_MODE.STEP_BY_STEP
				: (survey.navigationMode as any),
		[survey.type, survey.navigationMode]
	);

	// Constrain preview width by selected device for better fidelity
	const containerWidthClass = React.useMemo(() => {
		switch (device) {
			case 'mobile':
				return 'max-w-[420px]';
			case 'tablet':
				return 'max-w-[768px]';
			case 'desktop':
			default:
				return 'max-w-[1024px]';
		}
	}, [device]);

	const navigationLabel = React.useMemo(() => {
		if (effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE) {
			return t('preview.navigation.one', 'One Question Per Page');
		} else {
			// For survey type, show 'All in One'; for assessment type, show 'Step by Step'
			return survey.type === SURVEY_TYPE.ASSESSMENT
				? t('preview.navigation.stepByStep', 'Step by Step')
				: t('preview.navigation.allInOne', 'All in One');
		}
	}, [effectiveNavigationMode, survey.type, t]);

	// Preview no longer toggles global flags
	React.useEffect(() => {
		return () => {};
	}, []);

	const onFocusQuestion = (q: Question) => {
		if (effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE) {
			// Jump to page
			setPageIndex(
				(survey.questions || []).findIndex(qq => (qq as any)._id === (q as any)._id)
			);
		} else {
			scrollToQuestion((q as any)._id);
		}
	};

	return (
		<div className='flex flex-col h-full min-h-[75vh]'>
			{/* Header */}
			<div className='pb-3 border-b border-gray-200'>
				{/* Row 1: Title + Preview tag */}
				<div className='flex items-center gap-3 mb-2'>
					<h3 className='text-lg font-semibold'>{survey.title}</h3>
					<span className='px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700'>
						{t('preview.badge', 'Preview')}
					</span>
				</div>
				{/* Row 2: Badges on the left, device switcher on the right */}
				<div className='flex items-center justify-between gap-2 flex-wrap'>
					<div className='flex items-center gap-2'>
						<span className='px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700'>
							{t('preview.navigation.label', 'Navigation:')} {navigationLabel}
						</span>
					</div>
					{/* Device switcher */}
					<div className='flex items-center gap-2'>
						<button
							className={`px-2 py-1 text-xs rounded border ${device === 'mobile' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'}`}
							onClick={() => setDevice('mobile')}
						>
							{t('preview.device.mobile', 'Mobile')}
						</button>
						<button
							className={`px-2 py-1 text-xs rounded border ${device === 'tablet' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'}`}
							onClick={() => setDevice('tablet')}
						>
							{t('preview.device.tablet', 'Tablet')}
						</button>
						<button
							className={`px-2 py-1 text-xs rounded border ${device === 'desktop' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'}`}
							onClick={() => setDevice('desktop')}
						>
							{t('preview.device.desktop', 'Desktop')}
						</button>
					</div>
				</div>
			</div>

			{/* Content */}
			<div
				className={`flex flex-1 gap-4 sm:gap-6 pt-4 overflow-hidden ${hideLeftPane ? 'flex-col' : 'flex-col md:flex-row'}`}
			>
				{!hideLeftPane && (
					<div className='w-full md:w-1/2 md:min-w-[320px]'>
						<LeftPane survey={survey} onFocusQuestion={onFocusQuestion} />
					</div>
				)}
				{/* Right */}
				<div className={`${hideLeftPane ? 'flex-1' : 'md:w-1/2'} h-full overflow-y-auto`}>
					<div className={`mx-auto w-full px-2 md:px-0 ${containerWidthClass}`}>
						<div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3'>
							<div className='flex items-center gap-3'>
								<img
									src={(survey as any).company?.logoUrl || '/SigmaQ-logo.svg'}
									alt={((survey as any).company?.name || 'SigmaQ') + ' Logo'}
									className='h-8 w-auto object-contain'
									onError={e => {
										const img = e.currentTarget as HTMLImageElement;
										if (!img.src.includes('/SigmaQ-logo.svg'))
											img.src = '/SigmaQ-logo.svg';
										else img.remove();
									}}
								/>
								<div className='min-w-0'>
									<div className='text-base font-semibold text-[#484848] truncate'>
										{survey.title}
									</div>
									{survey.description && (
										<div className='text-xs text-[#767676] truncate'>
											{survey.description}
										</div>
									)}
								</div>
							</div>
						</div>
						<div>
							<RightPane
								survey={survey}
								externalPageIndex={pageIndex}
								forceSingleColumn={device === 'mobile'}
							/>
						</div>
						<div className='mt-6 pb-2 text-center text-xs text-[#767676]'>
							Powered by{' '}
							<a
								href='https://sigmaq.ai'
								target='_blank'
								rel='noopener noreferrer'
								className='text-[#FF5A5F] hover:underline'
							>
								SigmaQ
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const SurveyPreviewTabWithProvider: React.FC<SurveyPreviewTabProps> = ({
	survey,
	hideLeftPane,
}) => {
	return (
		<PreviewProvider>
			<SurveyPreviewTab survey={survey} hideLeftPane={hideLeftPane} />
		</PreviewProvider>
	);
};

export default SurveyPreviewTabWithProvider;
