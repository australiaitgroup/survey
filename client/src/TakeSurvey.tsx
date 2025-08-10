import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useAntiCheating } from './hooks/useAntiCheating';
import { useSimpleAntiCheating } from './hooks/useSimpleAntiCheating';
import { useAggressiveAntiCheating } from './hooks/useAggressiveAntiCheating';
import { useWorkingAntiCheating } from './hooks/useWorkingAntiCheating';
import OneQuestionPerPageView from './components/survey/OneQuestionPerPageView';
import './styles/antiCheating.css';
import type { SurveyResponse } from '../../shared/surveyResponse';
import {
	QUESTION_TYPE,
	SOURCE_TYPE,
	TYPES_REQUIRING_ANSWERS,
	NAVIGATION_MODE,
	type QuestionType,
	type SourceType,
	type SurveyType,
	type SurveyStatus,
	type NavigationMode,
	type ScoringMode,
} from './constants';
import type {
	Survey as ApiSurvey,
	Question as ApiQuestion,
	Company,
	AssessmentAccessResponse,
	ApiResponse,
} from './types/api';

// 使用API类型定义
interface Survey extends ApiSurvey {
	// 可以添加前端特有的属性
}

interface Question extends ApiQuestion {
	// 可以添加前端特有的属性
}

interface FormState {
	name: string;
	email: string;
	answers: Record<string, string>;
}

interface AssessmentResult {
	questionId: string;
	questionText: string;
	questionDescription?: string;
	userAnswer: string;
	correctAnswer: string;
	isCorrect: boolean;
	pointsAwarded: number;
	maxPoints: number;
	descriptionImage?: string;
}

interface ScoringResult {
	totalPoints: number;
	maxPossiblePoints: number;
	correctAnswers: number;
	wrongAnswers: number;
	displayScore: number;
	passed: boolean;
	scoringMode: ScoringMode;
	scoringDescription: string;
}

const TakeSurvey: React.FC = () => {
	const { t } = useTranslation();
	const { slug, companySlug } = useParams<{ slug: string; companySlug?: string }>();
	const navigate = useNavigate();

	// Helper function to generate API paths with multi-tenant support
	const getApiPath = (path: string) => {
		return companySlug ? `/${companySlug}/api${path}` : `/api${path}`;
	};
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [survey, setSurvey] = useState<Survey | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [questionsLoaded, setQuestionsLoaded] = useState(false);
	const [form, setForm] = useState<FormState>({ name: '', email: '', answers: {} });
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
	const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
	// For one-question-per-page: gate questions behind an initial personal info step
	const [infoStepDone, setInfoStepDone] = useState(false);

	// Enable anti-cheating measures for assessments and quizzes
	const isAssessmentType = survey && TYPES_REQUIRING_ANSWERS.includes(survey.type);

	// Control anti-cheating features - can be configured per survey or globally
	const antiCheatEnabled = false; // Set to false to disable all anti-cheating features

	// Debug logging removed

	// Helper to check if survey questions come from any bank-based source
	const isBankBasedSource = (sourceType: SourceType | undefined) =>
		sourceType === SOURCE_TYPE.QUESTION_BANK ||
		sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK ||
		sourceType === SOURCE_TYPE.MANUAL_SELECTION;

	// Use both hooks for comprehensive protection
	const { getInputProps } = useAntiCheating({
		enabled: antiCheatEnabled && isAssessmentType,
		disableCopy: true,
		disablePaste: true,
		disableRightClick: true,
		disableSelectAll: true,
		disableDevTools: true,
		showWarnings: true,
	});

	// Disable all React hook versions - using direct script instead
	useSimpleAntiCheating(antiCheatEnabled && isAssessmentType);
	useAggressiveAntiCheating(antiCheatEnabled && isAssessmentType);
	useWorkingAntiCheating(antiCheatEnabled && isAssessmentType);

	const loadQuestions = async (survey: Survey, userEmail?: string) => {
		if (isBankBasedSource(survey.sourceType)) {
			try {
				const response = await axios.get(getApiPath(`/survey/${survey.slug}/questions`), {
					params: { email: userEmail },
				});
				setQuestions(response.data.questions);
			} catch (err) {
				setError('Failed to load questions');
			}
		} else {
			// For manual surveys, use the questions from the survey object
			setQuestions(survey.questions);
		}
		// Questions loaded
		setQuestionsLoaded(true);
	};

	useEffect(() => {
		// If slug is provided, fetch that specific survey
		if (slug) {
			setLoading(true);
			const apiUrl = getApiPath(`/survey/${slug}`);
			axios
				.get<Survey>(apiUrl)
				.then(res => {
					setSurvey(res.data);

					// Load questions immediately only for manual surveys
					// For bank-based surveys, wait for user email
					if (res.data.sourceType === SOURCE_TYPE.MANUAL) {
						loadQuestions(res.data);
					}
				})
				.catch(() => {
					setError('Survey not found');
				})
				.finally(() => setLoading(false));
		} else {
			// Otherwise fetch all surveys for selection
			axios.get<Survey[]>(getApiPath('/surveys')).then(res => setSurveys(res.data));
		}
	}, [slug]);

	// Reset info step when survey or navigation mode changes
	useEffect(() => {
		if (survey?.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE) {
			setInfoStepDone(false);
		} else {
			setInfoStepDone(true);
		}
	}, [survey?.navigationMode, survey?._id]);

	const handleAnswerChange = (qid: string, value: string) => {
		setForm({ ...form, answers: { ...form.answers, [qid]: value } });
	};

	const handleEmailChange = (email: string) => {
		setForm({ ...form, email });

		// For question bank surveys, load questions when email is entered
		if (survey && isBankBasedSource(survey.sourceType) && email && !questionsLoaded) {
			loadQuestions(survey, email);
		}
	};

	const canStart = () => {
		const hasName = form.name && form.name.trim().length > 0;
		const hasEmail = form.email && form.email.includes('@');
		return Boolean(hasName && hasEmail);
	};

	const handleStart = async () => {
		if (!survey) return;
		if (!canStart()) return;
		// Ensure questions are loaded for question bank surveys before starting
		if (isBankBasedSource(survey.sourceType) && form.email && !questionsLoaded) {
			await loadQuestions(survey, form.email);
		}
		setInfoStepDone(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!survey || !questionsLoaded) return;

		setLoading(true);
		try {
			const payload: SurveyResponse = {
				name: form.name,
				email: form.email,
				surveyId: survey._id,
				answers: questions.map(q => form.answers[q._id]),
			};
			// Preview suppression: if global preview flag is set, skip network write
			if ((window as any).__PREVIEW__ === true) {
				console.debug('Preview mode: write suppressed');
			} else {
				await axios.post(getApiPath(`/surveys/${survey._id}/responses`), payload);
			}

			// Calculate assessment results if this is an assessment, quiz, or iq test
			if (TYPES_REQUIRING_ANSWERS.includes(survey.type)) {
				let totalPoints = 0;
				let maxPossiblePoints = 0;
				let correctAnswers = 0;
				let wrongAnswers = 0;

				const results: AssessmentResult[] = questions.map(q => {
					const userAnswer = form.answers[q._id];

					// Proper answer matching logic
					let isCorrect = false;
					let correctAnswerText = '';

					if (q.correctAnswer !== undefined && userAnswer !== undefined) {
						if (q.type === 'single_choice') {
							// For single choice, correctAnswer is an index
							if (typeof q.correctAnswer === 'number') {
								const userOptionIndex = q.options?.findIndex(opt =>
									typeof opt === 'string'
										? opt === userAnswer
										: opt.text === userAnswer
								);
								isCorrect = userOptionIndex === q.correctAnswer;

								// Get correct answer text
								const correctOption = q.options?.[q.correctAnswer];
								correctAnswerText =
									typeof correctOption === 'string'
										? correctOption
										: correctOption?.text || '';
							} else {
								// Fallback for direct text comparison
								isCorrect = userAnswer === q.correctAnswer;
								correctAnswerText = String(q.correctAnswer);
							}
						} else if (q.type === 'multiple_choice' && Array.isArray(q.correctAnswer)) {
							// Handle multiple choice
							const userAnswerArray = Array.isArray(userAnswer)
								? userAnswer
								: [userAnswer];
							const userOptionIndices = userAnswerArray
								.map(ans =>
									q.options?.findIndex(opt =>
										typeof opt === 'string' ? opt === ans : opt.text === ans
									)
								)
								.filter(idx => idx !== -1);
							const correctIndices = q.correctAnswer as number[];
							isCorrect =
								userOptionIndices.length === correctIndices.length &&
								userOptionIndices.every(idx => correctIndices.includes(idx));

							// Get correct answer text
							correctAnswerText = correctIndices
								.map(idx => {
									const option = q.options?.[idx];
									return typeof option === 'string' ? option : option?.text || '';
								})
								.join(', ');
						} else if (q.type === 'short_text') {
							// For short text, compare directly
							isCorrect = userAnswer === q.correctAnswer;
							correctAnswerText = String(q.correctAnswer);
						} else {
							// Fallback logic
							isCorrect = userAnswer === q.correctAnswer;
							correctAnswerText = String(q.correctAnswer);
						}
					}
					const maxPoints =
						q.points ||
						survey.scoringSettings?.customScoringRules?.defaultQuestionPoints ||
						1;
					const pointsAwarded = isCorrect ? maxPoints : 0;

					totalPoints += pointsAwarded;
					maxPossiblePoints += maxPoints;

					if (isCorrect) {
						correctAnswers++;
					} else {
						wrongAnswers++;
					}

					return {
						questionId: q._id,
						questionText: q.text,
						questionDescription: q.description,
						descriptionImage: q.descriptionImage,
						userAnswer: userAnswer || '',
						correctAnswer: correctAnswerText,
						isCorrect,
						pointsAwarded,
						maxPoints,
					};
				});

				// Calculate scoring result
				const scoringMode = survey.scoringSettings?.scoringMode || 'percentage';
				const passingThreshold = survey.scoringSettings?.passingThreshold || 60;
				const percentage =
					maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;

				let displayScore = 0;
				let passed = false;
				let scoringDescription = '';

				if (scoringMode === 'percentage') {
					displayScore = Math.round(percentage * 100) / 100;
					passed = percentage >= passingThreshold;
					scoringDescription = `Percentage scoring, max score 100, passing threshold ${passingThreshold}`;
				} else {
					displayScore = totalPoints;
					passed = totalPoints >= passingThreshold;
					scoringDescription = `Accumulated scoring, max score ${maxPossiblePoints}, passing threshold ${passingThreshold}`;
				}

				const scoring: ScoringResult = {
					totalPoints,
					maxPossiblePoints,
					correctAnswers,
					wrongAnswers,
					displayScore,
					passed,
					scoringMode,
					scoringDescription,
				};

				setAssessmentResults(results);
				setScoringResult(scoring);
			}

			setSubmitted(true);
		} catch (err) {
			setError('Failed to submit survey. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Loading survey...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='card max-w-md mx-auto text-center'>
					<div className='text-red-500 text-6xl mb-4'>⚠️</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>Survey Not Found</h2>
					<p className='text-gray-600 mb-6'>{error}</p>
					<button onClick={() => navigate('/')} className='btn-primary'>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	// Check if survey is not active
	if (survey && survey.status && survey.status !== 'active') {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='card max-w-md mx-auto text-center'>
					<div className='text-yellow-500 text-6xl mb-4'>🚫</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>Survey Unavailable</h2>
					<p className='text-gray-600 mb-6'>
						{survey.status === 'draft'
							? 'This survey is not yet open.'
							: 'This survey has been closed.'}
					</p>
					<button onClick={() => navigate('/')} className='btn-primary'>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	// Check if survey has no questions (for manual surveys) or questions haven't loaded yet
	if (
		survey &&
		survey.sourceType === SOURCE_TYPE.MANUAL &&
		(!survey.questions || survey.questions.length === 0)
	) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='card max-w-md mx-auto text-center'>
					<div className='text-orange-500 text-6xl mb-4'>📝</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>Survey In Progress</h2>
					<p className='text-gray-600 mb-6'>
						This survey is still being prepared. Please check back later.
					</p>
					<div className='mb-4 p-3 bg-gray-100 rounded text-left text-xs'>
						<strong>Debug Info:</strong>
						<br />
						Survey: {survey ? 'loaded' : 'null'}
						<br />
						Questions:{' '}
						{survey?.questions ? `array(${survey.questions.length})` : 'undefined'}
						<br />
						Status: {survey?.status || 'undefined'}
					</div>
					<button onClick={() => navigate('/')} className='btn-primary'>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	// 公司Logo组件（左上角，弱化阴影与边框）
	const CompanyLogo: React.FC<{ company?: Company }> = ({ company }) => {
		if (!company?.logoUrl) return null;

		return (
			<div className='flex justify-start mb-6'>
				<img
					src={company.logoUrl}
					alt={company.name || 'Company Logo'}
					className='h-8 md:h-10 w-auto object-contain'
					onError={e => {
						e.currentTarget.remove();
					}}
				/>
			</div>
		);
	};

	return (
		<div className='min-h-screen bg-[#F7F7F7] py-12'>
			<div className={`mx-auto px-4 ${slug ? 'max-w-3xl' : 'max-w-7xl'}`}>
				{/* 顶部并列：Logo + Survey 标题/描述 */}
				{survey && (
					<div className='flex items-center gap-3 mb-3'>
						<img
							src={survey.company?.logoUrl || '/SigmaQ-logo.svg'}
							alt={(survey.company?.name || 'SigmaQ') + ' Logo'}
							className='h-8 md:h-10 w-auto object-contain'
							onError={e => {
								if (!e.currentTarget.src.includes('/SigmaQ-logo.svg')) {
									e.currentTarget.src = '/SigmaQ-logo.svg';
								} else {
									e.currentTarget.remove();
								}
							}}
						/>
						<div className='min-w-0'>
							<h1 className='text-xl md:text-2xl font-semibold text-[#484848] truncate'>
								{survey.title}
							</h1>
							{survey.description && (
								<p className='text-sm text-[#767676] truncate'>
									{survey.description}
								</p>
							)}
						</div>
					</div>
				)}

				{!slug && (
					<div className='mb-12'>
						<div className='relative'>
							<button
								onClick={() => navigate('/admin/login')}
								className='absolute top-0 right-0 btn-outline'
							>
								🔑 Admin Login
							</button>
							<div className='text-center mb-12'>
								<h1 className='heading-xl mb-6'>Available Surveys</h1>
								<p className='body-xl max-w-2xl mx-auto'>
									Choose a survey to participate in and share your valuable
									insights
								</p>
							</div>
						</div>

						{surveys.length === 0 ? (
							<div className='card text-center max-w-md mx-auto'>
								<div className='text-[#767676] text-6xl mb-4'>📝</div>
								<h3 className='heading-sm mb-3 text-[#484848]'>
									No Surveys Available
								</h3>
								<p className='body-md'>
									There are currently no active surveys to participate in.
								</p>
							</div>
						) : (
							<div className='grid gap-8 md:grid-cols-2 xl:grid-cols-3'>
								{surveys.map(s => (
									<div key={s._id} className='card-hover group'>
										<div className='mb-6'>
											<div className='flex items-start justify-between mb-3'>
												<h3 className='heading-sm flex-1 group-hover:text-[#FF5A5F] transition-colors'>
													{s.title}
												</h3>
												<span
													className={`px-3 py-1 text-xs font-medium rounded-full ml-3 flex-shrink-0 ${
														s.type === 'assessment'
															? 'bg-[#00A699] bg-opacity-10 text-[#00A699]'
															: s.type === 'quiz'
																? 'bg-[#FC642D] bg-opacity-10 text-[#FC642D]'
																: s.type === 'iq'
																	? 'bg-[#FF5A5F] bg-opacity-10 text-[#FF5A5F]'
																	: 'bg-[#EBEBEB] text-[#767676]'
													}`}
												>
													{s.type === 'assessment'
														? '📊 Assessment'
														: s.type === 'quiz'
															? '🧠 Quiz'
															: s.type === 'iq'
																? '🎯 IQ Test'
																: '📋 Survey'}
												</span>
											</div>
											{s.description && (
												<p className='body-md line-clamp-3'>
													{s.description}
												</p>
											)}
										</div>
										<div className='space-y-3'>
											{/* Enhanced Assessment Interface for quiz/assessment/iq */}
											{TYPES_REQUIRING_ANSWERS.includes(s.type) && (
												<button
													onClick={() =>
														navigate(`/assessment/${s.slug || s._id}`)
													}
													className='w-full btn-primary'
												>
													🚀 Start Enhanced Assessment
												</button>
											)}
											{/* Regular Interface */}
											<button
												onClick={() =>
													navigate(`/survey/${s.slug || s._id}`)
												}
												className='w-full btn-secondary'
											>
												{s.type === 'assessment'
													? '📊 Classic Assessment'
													: s.type === 'quiz'
														? '🧠 Classic Quiz'
														: s.type === 'iq'
															? '🎯 Classic IQ Test'
															: '📋 Start Survey'}
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{survey && !submitted && (
					<div className='bg-white rounded-xl border border-[#EBEBEB] p-6'>
						<form
							onSubmit={handleSubmit}
							className={`space-y-8 ${antiCheatEnabled && isAssessmentType ? 'anti-cheat-container' : ''}`}
						>
							{!(
								survey?.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE &&
								infoStepDone
							) && (
								<div className='grid md:grid-cols-2 gap-6 animate-slide-down'>
									<div>
										<label className='block mb-3 font-medium text-[#484848]'>
											👤 Full Name *
										</label>
										<input
											className='input-field'
											value={form.name}
											onChange={e =>
												setForm({ ...form, name: e.target.value })
											}
											required
											placeholder='Enter your full name'
											{...getInputProps()}
										/>
									</div>
									<div>
										<label className='block mb-3 font-medium text-[#484848]'>
											✉️ Email Address *
										</label>
										<input
											type='email'
											className='input-field'
											value={form.email}
											onChange={e => handleEmailChange(e.target.value)}
											required
											placeholder='Enter your email address'
											{...getInputProps()}
										/>
										{survey?.sourceType === 'question_bank' &&
											form.email &&
											!questionsLoaded && (
											<div className='text-sm text-[#00A699] mt-2 flex items-center gap-2'>
												<div className='w-4 h-4 border-2 border-[#00A699] border-t-transparent rounded-full animate-spin'></div>
													Loading randomized questions...
											</div>
										)}
									</div>
								</div>
							)}

							{(() => {
								return (
									questionsLoaded &&
									(survey.navigationMode !==
										NAVIGATION_MODE.ONE_QUESTION_PER_PAGE ||
										infoStepDone ||
										survey.sourceType === SOURCE_TYPE.QUESTION_BANK)
								);
							})() &&
								(survey.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE ? (
									<OneQuestionPerPageView
										questions={questions}
										answers={form.answers}
										onAnswerChange={handleAnswerChange}
										onSubmit={handleSubmit}
										loading={loading}
										antiCheatEnabled={antiCheatEnabled && isAssessmentType}
										getInputProps={getInputProps}
									/>
								) : (
									<div className='space-y-8'>
										<div className='flex items-center justify-between border-b border-[#EBEBEB] pb-4'>
											<h3 className='heading-sm'>📝 Survey Questions</h3>
											{survey.sourceType === 'question_bank' && (
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
													<label className='block mb-5 font-medium text-[#484848] text-lg leading-relaxed'>
														<span className='inline-flex items-center justify-center w-7 h-7 bg-[#FF5A5F] bg-opacity-10 text-[#FF5A5F] rounded-full text-sm font-bold mr-3'>
															{index + 1}
														</span>
														{q.text}
													</label>

													{/* Question Description (Markdown) */}
													{q.description && (
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
																				a: [
																					'href',
																					'title',
																					'rel',
																					'target',
																				],
																				code: ['className'],
																				span: ['className'],
																			},
																		},
																	],
																]}
															>
																{q.description}
															</ReactMarkdown>
														</div>
													)}

													{/* Main question image */}
													{q.imageUrl && (
														<div className='mb-4'>
															<img
																src={q.imageUrl}
																alt='Question image'
																className='max-w-full h-auto rounded-lg border border-gray-200'
																onLoad={() => {}}
																onError={e => {
																	e.currentTarget.style.display =
																		'none';
																}}
															/>
														</div>
													)}

													{/* Description image */}
													{q.descriptionImage && (
														<div className='mb-4'>
															<img
																src={q.descriptionImage}
																alt='Question illustration'
																className='max-w-full h-auto rounded-lg border border-gray-300'
																onLoad={() => {}}
																onError={e => {
																	e.currentTarget.style.display =
																		'none';
																}}
															/>
														</div>
													)}
													{/* image debug removed */}
													{q.type === QUESTION_TYPE.SHORT_TEXT ? (
														<div className='space-y-4'>
															<textarea
																className='input-field resize-none'
																placeholder='Share your thoughts here...'
																rows={5}
																value={form.answers[q._id] || ''}
																onChange={e =>
																	handleAnswerChange(
																		q._id,
																		e.target.value
																	)
																}
																required
																{...getInputProps()}
															/>
														</div>
													) : (
														<div className='space-y-4'>
															{q.options &&
																q.options.map((opt, optIndex) => {
																	const optionValue =
																		typeof opt === 'string'
																			? opt
																			: opt.text;
																	const optionText =
																		typeof opt === 'string'
																			? opt
																			: opt.text;
																	const optionImage =
																		typeof opt === 'object'
																			? opt.imageUrl
																			: null;
																	const isSelected =
																		form.answers[q._id] ===
																		optionValue;
																	return (
																		<label
																			key={`${q._id}-${optIndex}-${optionText}`}
																			className={`group flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
																				isSelected
																					? 'border-[#FF5A5F] bg-[#FFF5F5]'
																					: 'border-[#EBEBEB] bg-white hover:border-[#FF5A5F] hover:border-opacity-20'
																			}`}
																		>
																			<div className='flex items-center justify-center relative'>
																				<input
																					type='radio'
																					name={q._id}
																					className='sr-only'
																					value={
																						optionValue
																					}
																					checked={
																						isSelected
																					}
																					onChange={() =>
																						handleAnswerChange(
																							q._id,
																							optionValue
																						)
																					}
																					required
																				/>
																				<div
																					className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${
																						isSelected
																							? 'border-[#FF5A5F] bg-[#FF5A5F]'
																							: 'border-[#DDDDDD] group-hover:border-[#FF5A5F]'
																					}`}
																				>
																					{isSelected && (
																						<div className='w-1.5 h-1.5 rounded-full bg-white'></div>
																					)}
																				</div>
																			</div>
																			<div className='flex-1'>
																				{optionText && (
																					<span
																						className={`block text-base leading-relaxed font-medium transition-colors ${
																							isSelected
																								? 'text-[#484848] font-semibold'
																								: 'text-[#484848] group-hover:text-[#FF5A5F]'
																						}`}
																					>
																						{optionText}
																					</span>
																				)}
																				{optionImage && (
																					<div className='mt-3'>
																						<img
																							src={
																								optionImage
																							}
																							alt={`Option ${optIndex + 1}`}
																							className='max-w-full h-auto rounded-lg border border-[#EBEBEB]'
																							style={{
																								maxHeight:
																									'200px',
																							}}
																							onLoad={() => {}}
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
												<div className='text-gray-500 text-4xl mb-4'>
													⚠️
												</div>
												<h3 className='text-lg font-semibold text-gray-700 mb-2'>
													No Questions Available
												</h3>
												<p className='text-gray-500'>
													{loading
														? 'Loading questions...'
														: 'Questions could not be loaded.'}
												</p>
											</div>
										)}
									</div>
								))}

							{/* Start button for one-question-per-page before entering questions */}
							{survey?.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE &&
								!infoStepDone && (
								<div className='flex justify-center pt-4'>
									<button
										type='button'
										onClick={handleStart}
										disabled={!canStart()}
										className='btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed'
									>
											Start
									</button>
								</div>
							)}

							{/* Submit button - only show for non-one-question-per-page modes */}
							{survey?.navigationMode !== NAVIGATION_MODE.ONE_QUESTION_PER_PAGE && (
								<div className='flex justify-center pt-8 border-t border-[#EBEBEB] mt-8'>
									<button
										className='btn-primary px-8 py-3 text-base font-medium'
										type='submit'
										disabled={
											loading ||
											(isBankBasedSource(survey?.sourceType)
												? !form.email
												: !questionsLoaded)
										}
										onClick={e => {
											// For bank-based sources, if questions aren't loaded yet, load them on button click
											if (
												survey &&
												isBankBasedSource(survey.sourceType) &&
												!questionsLoaded
											) {
												e.preventDefault();
												if (form.email) {
													void loadQuestions(survey, form.email);
												}
											}
										}}
									>
										{loading
											? '✨ Submitting...'
											: isBankBasedSource(survey?.sourceType) &&
												  !questionsLoaded
												? '🎲 Load Questions'
												: !questionsLoaded
													? '🎲 Loading...'
													: '🚀 Submit Response'}
									</button>
								</div>
							)}
						</form>
					</div>
				)}

				{submitted && (
					<div className='card animate-fade-in'>
						{TYPES_REQUIRING_ANSWERS.includes(survey?.type || '') &&
						assessmentResults.length > 0 &&
						scoringResult &&
						survey?.scoringSettings?.showScore !== false ? (
								<div>
									<div className='text-center mb-6'>
										<div
											className={`text-6xl mb-4 ${scoringResult.passed ? 'text-green-500' : 'text-red-500'}`}
										>
											{scoringResult.passed ? '🎉' : '📊'}
										</div>
										<h2 className='text-3xl font-bold text-gray-800 mb-2'>
											{scoringResult.passed
												? 'Congratulations! You Passed!'
												: 'Assessment Results'}
										</h2>
										<div className='space-y-2 mb-4'>
											<div
												className={`text-2xl font-bold ${scoringResult.passed ? 'text-green-600' : 'text-red-600'}`}
											>
												{scoringResult.scoringMode === 'percentage'
													? `${scoringResult.displayScore} points`
													: `${scoringResult.displayScore} / ${scoringResult.maxPossiblePoints} points`}
											</div>
											<div className='text-sm text-gray-600'>
												{scoringResult.scoringDescription}
											</div>
											<div className='text-sm text-gray-600'>
											Correct answers: {scoringResult.correctAnswers} /{' '}
												{scoringResult.correctAnswers +
												scoringResult.wrongAnswers}
											</div>
										</div>
									</div>

									{survey?.scoringSettings?.showScoreBreakdown && (
										<div className='space-y-4 mb-6'>
											{assessmentResults.map((result, index) => (
												<div
													key={result.questionId}
													className={`p-4 rounded-lg border-2 ${result.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}
												>
													<div className='flex items-center justify-between mb-2'>
														<div className='flex items-center gap-2'>
															<span
																className={`text-2xl ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}
															>
																{result.isCorrect ? '✅' : '❌'}
															</span>
															<div className='font-semibold text-gray-800'>
																{index + 1}. {result.questionText}
															</div>
														</div>
														<div
															className={`text-sm font-medium px-2 py-1 rounded ${result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
														>
															{result.pointsAwarded}/{result.maxPoints}{' '}
														pts
														</div>
													</div>

													{/* Question Description (Markdown) */}
													{result.questionDescription && (
														<div className='mb-4 prose prose-sm max-w-none'>
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
																				a: [
																					'href',
																					'title',
																					'rel',
																					'target',
																				],
																				code: ['className'],
																				span: ['className'],
																			},
																		},
																	],
																]}
															>
																{result.questionDescription}
															</ReactMarkdown>
														</div>
													)}

													{/* Description Image */}
													{result.descriptionImage && (
														<div className='mb-4'>
															<img
																src={result.descriptionImage}
																alt='Question illustration'
																className='max-w-full h-auto rounded-lg border border-gray-300'
																onError={e => {
																	e.currentTarget.style.display =
																	'none';
																}}
															/>
														</div>
													)}

													<div className='space-y-1 text-sm'>
														<div className='text-gray-700'>
															<span className='font-medium'>
															Your answer:
															</span>{' '}
															{result.userAnswer}
														</div>
														{!result.isCorrect &&
														survey?.scoringSettings
															?.showCorrectAnswers && (
															<div className='text-green-700'>
																<span className='font-medium'>
																	Correct answer:
																</span>{' '}
																{result.correctAnswer}
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							) : TYPES_REQUIRING_ANSWERS.includes(survey?.type || '') &&
						  assessmentResults.length > 0 &&
						  scoringResult &&
						  survey?.scoringSettings?.showScore === false ? (
							// Assessment completed but scores are hidden
									<div className='text-center py-8'>
										<div className='text-[#00A699] text-8xl mb-6 animate-bounce'>
									🎉
										</div>
										<h2 className='heading-lg mb-6 gradient-text'>
											{t(
												'survey.assessment.completed.title',
												'Assessment Completed!'
											)}
										</h2>
										<p className='body-lg mb-8 max-w-2xl mx-auto'>
											{t(
												'survey.assessment.completed.message',
												'Thank you for completing the assessment. Your responses have been submitted successfully.'
											)}
										</p>
										<div className='inline-flex items-center gap-3 bg-[#00A699] bg-opacity-10 text-[#00A699] px-6 py-3 rounded-xl font-medium'>
											<svg
												className='w-5 h-5'
												fill='currentColor'
												viewBox='0 0 20 20'
											>
												<path
													fillRule='evenodd'
													d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
													clipRule='evenodd'
												/>
											</svg>
											{t(
												'survey.assessment.completed.success',
												'Submission Successful'
											)}
										</div>
									</div>
								) : (
									<div className='text-center py-8'>
										<div className='text-[#FF5A5F] text-7xl mb-6'>🎉</div>
										<h2 className='heading-lg mb-4 gradient-text'>Thank You!</h2>
										<p className='body-lg mb-2 max-w-2xl mx-auto'>
									Your response has been submitted successfully.
										</p>
										<p className='body-md text-[#767676] max-w-2xl mx-auto'>
									We truly appreciate your time and valuable insights!
										</p>
									</div>
								)}
					</div>
				)}
			</div>
		</div>
	);
};

export default TakeSurvey;
