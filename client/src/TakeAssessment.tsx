import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAntiCheating } from './hooks/useAntiCheating';
import { useSimpleAntiCheating } from './hooks/useSimpleAntiCheating';
import { useAggressiveAntiCheating } from './hooks/useAggressiveAntiCheating';
import { useWorkingAntiCheating } from './hooks/useWorkingAntiCheating';
import LoadingScreen from './components/survey/LoadingScreen';
import ErrorCard from './components/survey/ErrorCard';
import UnavailableCard from './components/survey/UnavailableCard';
import HeaderWithLogo from './components/survey/HeaderWithLogo';
import SafeMarkdown from './components/survey/SafeMarkdown';
import AssessmentResults from './components/survey/AssessmentResults';
import './styles/antiCheating.css';
// Server-side submission for assessments; local SurveyResponse not used here
import { SOURCE_TYPE, type SourceType } from './constants';
import type {
	Survey,
	Question,
	AssessmentResult,
	ScoringResult,
	FormState,
} from './components/survey/takeSurveyTypes';

interface QuestionTiming {
	startTime: number;
	endTime?: number;
	duration?: number;
}

interface TimerState {
	timeLeft: number;
	isActive: boolean;
	isExpired: boolean;
}

type StepType = 'instructions' | 'questions' | 'results';

const TakeAssessment: React.FC = () => {
	const { slug, companySlug } = useParams<{ slug: string; companySlug?: string }>();
	const navigate = useNavigate();

	// Helper function to generate API paths with multi-tenant support
	const getApiPath = (path: string) => {
		return companySlug ? `/${companySlug}/api${path}` : `/api${path}`;
	};

	// State
	const [survey, setSurvey] = useState<Survey | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [questionsLoaded, setQuestionsLoaded] = useState(false);
	const [form, setForm] = useState<FormState>({ name: '', email: '', answers: {} });
	const [currentStep, setCurrentStep] = useState<StepType>('instructions');
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [timer, setTimer] = useState<TimerState>({
		timeLeft: 0,
		isActive: false,
		isExpired: false,
	});
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
	const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
	const [assessmentMeta, setAssessmentMeta] = useState<{ responseId?: string }>({});
	const [startTime, setStartTime] = useState<Date | null>(null);

	// Question timing tracking
	const [questionTimings, setQuestionTimings] = useState<Record<number, QuestionTiming>>({});
	const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number | null>(null);

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const autoSubmitRef = useRef(false);

	// Enable anti-cheating measures based on survey settings
	const antiCheatEnabled = survey?.securitySettings?.antiCheatEnabled || false;

	// Helper to check if survey questions come from any bank-based source
	const isBankBasedSource = (sourceType: SourceType | undefined) =>
		sourceType === SOURCE_TYPE.QUESTION_BANK ||
		sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK ||
		sourceType === SOURCE_TYPE.MANUAL_SELECTION;

	// Use both hooks for comprehensive protection
	const { getInputProps } = useAntiCheating({
		enabled: antiCheatEnabled,
		disableCopy: true,
		disablePaste: true,
		disableRightClick: true,
		disableSelectAll: true,
		disableDevTools: true,
		showWarnings: true,
	});

	// Disable all React hook versions - using direct script instead
	useSimpleAntiCheating(antiCheatEnabled);
	useAggressiveAntiCheating(antiCheatEnabled);
	useWorkingAntiCheating(antiCheatEnabled);

	const loadQuestions = async (survey: Survey, userEmail?: string) => {
		if (isBankBasedSource(survey.sourceType)) {
			try {
				const response = await axios.get(getApiPath(`/survey/${survey.slug}/questions`), {
					params: { email: userEmail },
				});
				setQuestions(response.data.questions);
			} catch {
				setError('Failed to load questions');
			}
		} else {
			// For manual surveys, use the questions from the survey object
			setQuestions(survey.questions);
		}
		// Questions loaded
		setQuestionsLoaded(true);
	};

	// Timer management
	useEffect(() => {
		if (timer.isActive && timer.timeLeft > 0) {
			timerRef.current = setTimeout(() => {
				setTimer(prev => ({
					...prev,
					timeLeft: prev.timeLeft - 1,
				}));
			}, 1000);
		} else if (timer.isActive && timer.timeLeft <= 0) {
			setTimer(prev => ({ ...prev, isExpired: true, isActive: false }));

			// Handle auto-submit directly here to avoid stale closure issues
			if (!autoSubmitRef.current) {
				autoSubmitRef.current = true;
				console.log('Timer expired - attempting auto-submit');

				// Use a timeout to ensure the state update has been processed
				setTimeout(() => {
					handleSubmit(null, true)
						.then(() => {
							console.log('Auto-submit successful');
						})
						.catch(error => {
							console.error('Auto-submit failed:', error);
						});
				}, 100);
			}
		}

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [
		timer.isActive,
		timer.timeLeft,
		survey,
		questionsLoaded,
		submitted,
		questions,
		form,
		currentStep,
		currentQuestionStartTime,
		questionTimings,
		currentQuestionIndex,
		startTime,
		assessmentMeta,
		slug,
	]);

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	useEffect(() => {
		// If slug is provided, fetch that specific assessment
		if (slug) {
			setLoading(true);
			const apiUrl = getApiPath(`/assessment/${slug}`);
			
			
			axios
				.get<Survey>(apiUrl)
				.then(res => {
					
					// Verify it's an assessment type
					if (res.data.type !== 'assessment') {
						setError('This is not an assessment. Please use the survey interface instead.');
						return;
					}
					setSurvey(res.data);

					// Initialize timer
					if (res.data.timeLimit) {
						setTimer({
							timeLeft: res.data.timeLimit * 60,
							isActive: false,
							isExpired: false,
						});
					}

					// Do not pre-load any questions for assessments
				})
				.catch((error) => {
					console.error('Assessment API Error:', error);
					setError('Assessment not found');
				})
				.finally(() => setLoading(false));
		}
	}, [slug]);

	const startAssessment = async () => {
		if (!survey) return;

		setCurrentStep('questions');
		setStartTime(new Date());

		// Start assessment - lock questions server-side and return masked list
		try {
			const startResp = await axios.post(getApiPath(`/assessment/${slug}/start`), {
				name: form.name,
				email: form.email,
			});
			setQuestions(startResp.data.questions || []);
			setQuestionsLoaded(true);
			setAssessmentMeta({ responseId: startResp.data.responseId });
		} catch (e) {
			console.error('Failed to start assessment:', e);
		}

		// Start timing for the first question (index-based)
		if ((questionsLoaded ? questions : survey.questions)?.length > 0) {
			const startTimeMs = Date.now();
			setCurrentQuestionStartTime(startTimeMs);
			setQuestionTimings(prev => ({
				...prev,
				[0]: { startTime: startTimeMs },
			}));
		}

		if (survey.timeLimit) {
			setTimer(prev => ({ ...prev, isActive: true }));
		}
	};

	const handleAnswerChange = (questionIndex: number, value: string | string[]) => {
		setForm(prev => ({
			...prev,
			answers: {
				...prev.answers,
				[questionIndex]: value,
			},
		}));
	};

	const nextQuestion = (isSkip = false) => {
		const currentQuestions = questionsLoaded ? questions : survey?.questions || [];
		if (!currentQuestions.length) return;

		// Record end time for current question
		const currentQuestion = currentQuestions[currentQuestionIndex];
		if (currentQuestion && currentQuestionStartTime) {
			const endTime = Date.now();
			const duration = Math.round((endTime - currentQuestionStartTime) / 1000);

			setQuestionTimings(prev => ({
				...prev,
				[currentQuestionIndex]: {
					...prev[currentQuestionIndex],
					endTime,
					duration,
				},
			}));

			// If this is a skip, mark the answer as skipped (empty)
			if (isSkip && !form.answers[currentQuestionIndex]) {
				setForm(prev => ({
					...prev,
					answers: {
						...prev.answers,
						[currentQuestionIndex]: '', // Empty answer for skipped questions
					},
				}));
			}
		}

		if (currentQuestionIndex < currentQuestions.length - 1) {
			const nextIndex = currentQuestionIndex + 1;
			setCurrentQuestionIndex(nextIndex);

			// Start timing for next question
			const nextQuestion = currentQuestions[nextIndex];
			const startTime = Date.now();
			setCurrentQuestionStartTime(startTime);
			setQuestionTimings(prev => ({
				...prev,
				[nextIndex]: { startTime },
			}));
		}
	};

	const skipQuestion = () => {
		nextQuestion(true);
	};

	const prevQuestion = () => {
		const currentQuestions = questionsLoaded ? questions : survey?.questions || [];
		if (!currentQuestions.length || currentQuestionIndex <= 0) return;

		// Record end time for current question
		const currentQuestion = currentQuestions[currentQuestionIndex];
		if (currentQuestion && currentQuestionStartTime) {
			const endTime = Date.now();
			const duration = Math.round((endTime - currentQuestionStartTime) / 1000);

			setQuestionTimings(prev => ({
				...prev,
				[currentQuestionIndex]: {
					...prev[currentQuestionIndex],
					endTime,
					duration: (prev[currentQuestionIndex]?.duration || 0) + duration,
				},
			}));
		}

		const prevIndex = currentQuestionIndex - 1;
		setCurrentQuestionIndex(prevIndex);

		// Start timing for previous question
		const prevQuestion = currentQuestions[prevIndex];
		const startTime = Date.now();
		setCurrentQuestionStartTime(startTime);
		setQuestionTimings(prev => ({
			...prev,
			[prevIndex]: {
				...prev[prevIndex],
				startTime,
			},
		}));
	};

	const handleSubmit = async (e: React.FormEvent | null = null, isAutoSubmit = false) => {
		if (e) e.preventDefault();

		console.log('handleSubmit called', {
			isAutoSubmit,
			survey: !!survey,
			questionsLoaded,
			submitted,
		});

		if (!survey || !questionsLoaded || submitted) {
			console.log('handleSubmit early return', {
				survey: !!survey,
				questionsLoaded,
				submitted,
			});
			return;
		}

		setLoading(true);
		autoSubmitRef.current = true;

		try {
			// Record end time for the last question if we're still on a question
			let finalQuestionTimings = { ...questionTimings };
			if (currentStep === 'questions' && currentQuestionStartTime) {
				const currentQuestions = questionsLoaded ? questions : survey?.questions || [];
				const currentQuestion = currentQuestions[currentQuestionIndex];
				if (currentQuestion) {
					const endTime = Date.now();
					const duration = Math.round((endTime - currentQuestionStartTime) / 1000);

					finalQuestionTimings = {
						...finalQuestionTimings,
						[currentQuestionIndex]: {
							...finalQuestionTimings[currentQuestionIndex],
							endTime,
							duration:
								(finalQuestionTimings[currentQuestionIndex]?.duration || 0) +
								duration,
						},
					};
				}
			}

			const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;

			// Submit to assessment endpoint for server-side scoring
			const answersArray = questions.map((_, idx) => form.answers[idx]);
			const submitData = {
				responseId: assessmentMeta.responseId,
				answers: answersArray,
				timeSpent,
				isAutoSubmit,
				answerDurations: Object.fromEntries(
					Object.entries(finalQuestionTimings).map(([idx, v]) => [idx, v.duration || 0])
				),
			};

			console.log('Submitting to API', {
				url: getApiPath(`/assessment/${slug}/submit`),
				data: submitData,
			});
			const submitResp = await axios.post(
				getApiPath(`/assessment/${slug}/submit`),
				submitData
			);

			const apiScore = submitResp.data.score;
			const apiResults = submitResp.data.questionResults || [];

			console.log('API submission successful', { apiScore, apiResults });

			setAssessmentResults(apiResults);
			setScoringResult({
				totalPoints: apiScore.totalPoints,
				maxPossiblePoints: apiScore.maxPossiblePoints,
				correctAnswers: apiScore.correctAnswers,
				wrongAnswers: apiScore.wrongAnswers,
				displayScore: apiScore.displayScore,
				passed: apiScore.passed,
				scoringMode: apiScore.scoringMode,
				scoringDescription: apiScore.scoringDescription,
			});
			setSubmitted(true);
			setCurrentStep('results');

			// Stop timer
			setTimer(prev => ({ ...prev, isActive: false }));
		} catch (error) {
			console.error('handleSubmit error:', error);
			setError('Failed to submit assessment. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <LoadingScreen />;
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
				<ErrorCard message={error} onHome={() => navigate('/')} />
			</div>
		);
	}

	// Check if survey is not active
	if (survey && survey.status && survey.status !== 'active') {
		return <UnavailableCard status={survey.status} onHome={() => navigate('/')} />;
	}

	// For assessment: 不再使用 Survey 的“无题目卡片”逻辑，题目在 start 后返回

	// No survey found
	if (!survey) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8'>
					<div className='text-gray-400 text-6xl mb-4'>📝</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>Assessment Not Found</h2>
					<p className='text-gray-600 mb-4'>
						The assessment you're looking for doesn't exist or is no longer available.
					</p>
					<button onClick={() => navigate('/')} className='btn-primary'>
						Return Home
					</button>
				</div>
			</div>
		);
	}

	const currentQuestions = questionsLoaded ? questions : survey.questions || [];
	const currentQuestion = currentQuestions[currentQuestionIndex];
	const totalQuestions = currentQuestions.length;
	const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
			<div className='w-full mx-auto px-4 py-8' style={{ maxWidth: '1440px' }}>
				{/* Header with Logo */}
				{survey && <HeaderWithLogo survey={survey} />}

				{/* Instructions Step */}
				{currentStep === 'instructions' && (
					<div className='w-full bg-white rounded-xl border border-[#EBEBEB] p-8'>
						<div className='text-center mb-8'>
							<h1 className='text-2xl font-bold text-gray-800 mb-4'>
								Assessment Instructions
							</h1>
							<p className='text-gray-600'>
								Please read the instructions carefully before starting.
							</p>
						</div>

						{/* Two Column Layout - Left: Instructions, Right: Candidate Information */}
						<div className='grid lg:grid-cols-2 gap-8 mb-8'>
							{/* Left Column - Instructions and Assessment Information */}
							<div className='space-y-6'>
								{/* Instructions */}
								{survey.instructions && (
									<div className='bg-blue-50 rounded-lg p-6'>
										<h3 className='font-medium text-blue-800 mb-3 flex items-center'>
											<span className='text-xl mr-2'>📋</span>
											Instructions
										</h3>
										<p className='text-blue-700 text-sm leading-relaxed'>
											{survey.instructions}
										</p>
									</div>
								)}

								{/* Assessment Information Grid */}
								<div className='grid gap-4'>
									{/* Time Limit */}
									{survey.timeLimit && (
										<div className='bg-yellow-50 rounded-lg p-6'>
											<div className='flex items-center mb-3'>
												<span className='text-yellow-600 text-xl mr-2'>
													⏱️
												</span>
												<h3 className='font-medium text-yellow-800'>
													Time Limit
												</h3>
											</div>
											<p className='text-yellow-700 text-sm leading-relaxed'>
												You have <strong>{survey.timeLimit} minutes</strong>{' '}
												to complete this assessment. The timer will start
												when you begin the first question.
											</p>
										</div>
									)}

									{/* Question Count */}
									<div className='bg-green-50 rounded-lg p-6'>
										<div className='flex items-center mb-3'>
											<span className='text-green-600 text-xl mr-2'>📝</span>
											<h3 className='font-medium text-green-800'>
												Questions
											</h3>
										</div>
										<p className='text-green-700 text-sm leading-relaxed'>
											This assessment contains{' '}
											<strong>{totalQuestions} questions</strong>. You can
											navigate back and forth between questions at any time.
										</p>
									</div>
								</div>

								{/* Assessment Rules */}
								<div className='bg-gray-50 rounded-lg p-6'>
									<h3 className='font-medium text-gray-800 mb-4 flex items-center'>
										<span className='text-xl mr-2'>📚</span>
										Assessment Rules
									</h3>
									<ul className='text-gray-700 text-sm space-y-2 leading-relaxed'>
										<li className='flex items-start'>
											<span className='text-blue-500 mr-2 mt-1'>•</span>
											Please ensure you have a stable internet connection
										</li>
										<li className='flex items-start'>
											<span className='text-blue-500 mr-2 mt-1'>•</span>
											Answer all questions to the best of your ability
										</li>
										<li className='flex items-start'>
											<span className='text-blue-500 mr-2 mt-1'>•</span>
											You can navigate between questions using the
											Previous/Next buttons
										</li>
										<li className='flex items-start'>
											<span className='text-green-500 mr-2 mt-1'>•</span>
											You can skip difficult questions using the Skip button
											(skipped questions count as incorrect)
										</li>
										<li className='flex items-start'>
											<span className='text-blue-500 mr-2 mt-1'>•</span>
											Your progress will be saved automatically as you go
										</li>
										{survey.timeLimit && (
											<li className='flex items-start'>
												<span className='text-red-500 mr-2 mt-1'>•</span>
												The assessment will auto-submit when time expires
											</li>
										)}
										<li className='flex items-start'>
											<span className='text-orange-500 mr-2 mt-1'>•</span>
											Once submitted, you cannot modify your answers
										</li>
									</ul>
								</div>
							</div>

							{/* Right Column - Candidate Information */}
							<div className='space-y-6'>
								{/* Candidate Information Form */}
								<div className='bg-blue-50 border border-blue-200 rounded-lg p-6 h-fit sticky top-4'>
									<h3 className='font-medium text-blue-800 mb-6 flex items-center text-lg'>
										<span className='text-xl mr-2'>👤</span>
										Candidate Information
									</h3>
									<div className='space-y-4'>
										<div>
											<label className='block mb-2 font-medium text-gray-700'>
												Full Name *
											</label>
											<input
												type='text'
												className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
												value={form.name}
												onChange={e =>
													setForm(prev => ({
														...prev,
														name: e.target.value,
													}))
												}
												required
												placeholder='Enter your full name'
												{...getInputProps()}
											/>
										</div>
										<div>
											<label className='block mb-2 font-medium text-gray-700'>
												Email Address *
											</label>
											<input
												type='email'
												className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
												value={form.email}
												onChange={e =>
													setForm(prev => ({
														...prev,
														email: e.target.value,
													}))
												}
												required
												placeholder='Enter your email address'
												{...getInputProps()}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Start Button */}
						<div className='text-center'>
							<button
								onClick={startAssessment}
								disabled={!form.name || !form.email || loading}
								className='btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{loading ? 'Loading...' : 'Start Assessment'}
							</button>
						</div>
					</div>
				)}

				{/* Questions Step - Step by Step Navigation */}
				{currentStep === 'questions' && currentQuestion && questionsLoaded && (
					<div className='w-full bg-white rounded-xl border border-[#EBEBEB] p-6'>
						{/* Time expired notice */}
						{timer.isExpired && (
							<div className='mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm font-medium'>
								Time is up. Auto-submitting your assessment...
							</div>
						)}
						{/* Header with centered progress bar and right-side timer */}
						<div className='flex items-center mb-6'>
							<div className='flex-1' />
							<div className='flex items-center gap-3 justify-center'>
								<span className='text-xs text-gray-600'>
									Question {currentQuestionIndex + 1} of {totalQuestions}
								</span>
								<div className='w-44 bg-gray-200 rounded-full h-2'>
									<div
										className='bg-blue-600 h-2 rounded-full transition-all duration-300'
										style={{ width: `${progress}%` }}
									/>
								</div>
							</div>
							<div className='flex-1 flex justify-end'>
								{timer.isActive && (
									<div
										className={`text-sm font-medium ${
											timer.timeLeft < 60 ? 'text-red-600' : 'text-gray-600'
										}`}
									>
										⏱️ {formatTime(timer.timeLeft)}
									</div>
								)}
							</div>
						</div>

						{/* Question Content - Left-Right Split Layout */}
						<div className='mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]'>
							{/* Left Side - Question */}
							<div className='p-6'>
								<h2 className='text-xl font-semibold text-gray-800 mb-4'>
									{currentQuestion.text}
								</h2>

								{/* Question Description with Markdown Support */}
								{currentQuestion.description && (
									<div className='mb-4'>
										<SafeMarkdown
											content={currentQuestion.description}
											className='prose prose-sm max-w-none text-gray-700'
										/>
									</div>
								)}

								{/* Question Image */}
								{currentQuestion.descriptionImage && (
									<div className='mb-4'>
										<img
											src={currentQuestion.descriptionImage}
											alt='Question'
											className='max-w-full h-auto rounded-lg border border-gray-300'
											style={{ maxHeight: '300px' }}
										/>
									</div>
								)}
							</div>

							{/* Right Side - Answer Options */}
							<div className='flex flex-col'>
								{/* Answer Options */}
								{currentQuestion.type !== 'short_text' &&
									currentQuestion.options && (
									<div className='space-y-3 flex-1'>
										{currentQuestion.options.map((option, index) => {
											const optionText =
													typeof option === 'string'
														? option
														: option.text || '';
											const optionImage =
													typeof option === 'object'
														? option.imageUrl
														: null;
											const isSelected =
													currentQuestion.type === 'single_choice'
														? form.answers[currentQuestionIndex] ===
															optionText
														: Array.isArray(
															form.answers[currentQuestionIndex]
														) &&
															form.answers[
																currentQuestionIndex
															].includes(optionText);

											return (
												<label
													key={index}
													className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors duration-150 ${
														isSelected
															? 'border-blue-500 bg-blue-50'
															: 'border-gray-200 hover:border-blue-300/60'
													}`}
												>
													<input
														type={
															currentQuestion.type ===
																'single_choice'
																? 'radio'
																: 'checkbox'
														}
														name={`q_${currentQuestionIndex}`}
														className='mt-1 mr-3'
														checked={isSelected}
														onChange={() => {
															if (
																currentQuestion.type ===
																	'single_choice'
															) {
																handleAnswerChange(
																	currentQuestionIndex,
																	optionText
																);
															} else {
																const currentAnswers =
																		(form.answers[
																			currentQuestionIndex
																		] as string[]) || [];
																if (isSelected) {
																	handleAnswerChange(
																		currentQuestionIndex,
																		currentAnswers.filter(
																			a =>
																				a !== optionText
																		)
																	);
																} else {
																	handleAnswerChange(
																		currentQuestionIndex,
																		[
																			...currentAnswers,
																			optionText,
																		]
																	);
																}
															}
														}}
														disabled={
															timer.isExpired ||
																loading ||
																submitted
														}
														{...getInputProps()}
													/>
													<div className='flex-1'>
														{optionText && (
															<span className='text-gray-700 block mb-2'>
																{optionText}
															</span>
														)}
														{optionImage && (
															<img
																src={optionImage}
																alt={`Option ${index + 1}`}
																className='max-w-full h-auto rounded border border-gray-200'
																style={{ maxHeight: '200px' }}
															/>
														)}
													</div>
												</label>
											);
										})}
									</div>
								)}

								{/* Short Text Input */}
								{currentQuestion.type === 'short_text' && (
									<div className='flex-1'>
										<textarea
											className='w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
											value={form.answers[currentQuestionIndex] || ''}
											onChange={e =>
												handleAnswerChange(
													currentQuestionIndex,
													e.target.value
												)
											}
											placeholder='Enter your answer here...'
											disabled={timer.isExpired || loading || submitted}
											{...getInputProps()}
										/>
									</div>
								)}
							</div>
						</div>

						{/* Navigation + Center Progress */}
						<div className='flex justify-between items-center pt-4'>
							<button
								onClick={prevQuestion}
								disabled={
									currentQuestionIndex === 0 ||
									timer.isExpired ||
									loading ||
									submitted
								}
								className='btn-secondary disabled:opacity-50 disabled:cursor-not-allowed'
							>
								Previous
							</button>

							<div className='flex gap-3'>
								{/* Skip Button on the right side */}
								{currentQuestionIndex < totalQuestions - 1 && (
									<button
										onClick={skipQuestion}
										disabled={timer.isExpired || loading || submitted}
										className='btn-outline text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
									>
										Skip Question
									</button>
								)}

								{currentQuestionIndex === totalQuestions - 1 ? (
									<button
										onClick={() => handleSubmit()}
										disabled={loading || timer.isExpired || submitted}
										className='btn-primary disabled:opacity-50'
									>
										{loading ? 'Submitting...' : 'Submit Assessment'}
									</button>
								) : (
									<button
										onClick={() => nextQuestion(false)}
										disabled={timer.isExpired || loading || submitted}
										className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
									>
										Next
									</button>
								)}
							</div>
						</div>

						{/* Navigation Tip */}
						<div className='text-center mt-3 text-xs text-gray-500'>
							💡 Tip: You can navigate between questions or skip difficult ones before
							submitting
						</div>
					</div>
				)}

				{/* Results Step */}
				{currentStep === 'results' && submitted && (
					<AssessmentResults
						survey={survey}
						assessmentResults={assessmentResults}
						scoringResult={scoringResult}
					/>
				)}

				{/* Powered by SigmaQ Footer */}
				<div className='mt-8 text-center'>
					<div className='inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm text-gray-600 hover:shadow-md transition-shadow duration-200'>
						<span>Powered by</span>
						<a
							href='https://sigma.jiangren.com.au'
							target='_blank'
							rel='noopener noreferrer'
							className='font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200'
						>
							SigmaQ
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TakeAssessment;
