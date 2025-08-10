import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Survey, Question } from '../../types/admin';
import OneQuestionPerPageView from '../survey/OneQuestionPerPageView';
import { NAVIGATION_MODE, QUESTION_TYPE } from '../../constants';

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

// Device switcher removed

const LeftPane: React.FC<{ survey: Survey; onFocusQuestion: (q: Question) => void }> = ({
	survey,
	onFocusQuestion,
}) => {
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const questions = (survey.questions || []) as unknown as Question[];
	const filtered = questions.filter(q => {
		if (!query) return true;
		const text = [q.text, q.description].filter(Boolean).join(' ').toLowerCase();
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
const RightPane: React.FC<{ survey: Survey; externalPageIndex?: number }> = ({
	survey,
	externalPageIndex,
}) => {
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

	// Display modes
	if (survey.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE) {
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
				ignoreRequiredForNavigation={true}
			/>
		);
	}

	// List mode
	return (
		<div className='space-y-6'>
			{questions.map((q, idx) => (
				<div key={q._id} data-question-id={q._id} className='bg-white rounded-xl p-6'>
					<label className='block mb-5 font-medium text-[#484848] text-lg leading-relaxed'>
						<span className='inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 bg-[#FF5A5F] text-white text-xs font-bold shadow-sm'>
							{idx + 1}
						</span>
						{q.text}
					</label>
					{q.description && (
						<div className='mb-6 text-sm text-gray-700'>{q.description}</div>
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
								const isSelected = (answers as any)[q._id] === optionValue;
								return (
									<label
										key={`${q._id}-${optIndex}`}
										className={`group flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-[#FF5A5F] bg-[#FFF5F5]' : 'border-[#EBEBEB] bg-white hover:border-[#FF5A5F] hover:border-opacity-20'}`}
									>
										<input
											type='radio'
											name={q._id}
											checked={isSelected}
											onChange={() => handleAnswerChange(q._id, optionValue)}
											className='mr-3 mt-1 accent-[#FF5A5F]'
										/>
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
	const navigationLabel = React.useMemo(() => {
		return survey.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE
			? t('preview.navigation.one', 'One Question Per Page')
			: t('preview.navigation.step', 'Step by Step');
	}, [survey.navigationMode, t]);

	React.useEffect(() => {
		(window as any).__PREVIEW__ = true;
		return () => {
			delete (window as any).__PREVIEW__;
		};
	}, []);

	const onFocusQuestion = (q: Question) => {
		if (survey.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE) {
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
			<div className='flex items-center justify-between pb-3 border-b border-gray-200'>
				<div className='flex items-center gap-3'>
					<h3 className='text-lg font-semibold'>{survey.title}</h3>
					<span className='px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700'>
						{t('preview.badge', 'Preview')}
					</span>
					<span className='px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700'>
						{t('preview.navigation.label', 'Navigation:')} {navigationLabel}
					</span>
				</div>
				<div className='flex items-center gap-3'>
					<button
						className='btn-secondary'
						onClick={() => {
							clear();
							setPageIndex(0);
						}}
					>
						{t('preview.clear', 'Clear preview data')}
					</button>
				</div>
			</div>

			{/* Content */}
			<div
				className={`flex flex-1 gap-4 sm:gap-6 pt-4 overflow-hidden ${hideLeftPane ? 'flex-col' : ''}`}
			>
				{!hideLeftPane && (
					<div className='w-[40%] min-w-[280px]'>
						<LeftPane survey={survey} onFocusQuestion={onFocusQuestion} />
					</div>
				)}
				{/* Right */}
				<div className='flex-1 h-full overflow-y-auto'>
					<div className='mx-auto w-full px-2 md:px-0'>
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
						<RightPane survey={survey} externalPageIndex={pageIndex} />
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
