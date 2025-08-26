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
import OneQuestionPerPageView from './components/survey/OneQuestionPerPageView';
import './styles/antiCheating.css';
import { SOURCE_TYPE, NAVIGATION_MODE, type SourceType } from './constants';
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

interface OnboardingProgress {
	currentSection: number;
	completedSections: number[];
	learningPath: any;
	timeTracking: {
		startedAt: Date;
		sectionTimes: number[];
	};
	lastActivity?: Date;
}

interface OnboardingQuestion extends Question {
	onboarding?: {
		learningContext?: {
			background?: string;
			keyConcepts?: string[];
			relatedTopics?: string[];
		};
		hints?: Array<{
			order: number;
			content: string;
			showAfterAttempts: number;
			isProgressive: boolean;
		}>;
		learningObjectives?: string[];
		difficulty?: 'beginner' | 'intermediate' | 'advanced';
		maxAttempts?: number;
		learningResources?: Array<{
			type: 'document' | 'video' | 'link' | 'image';
			title: string;
			url: string;
			description: string;
			order: number;
		}>;
	};
}

type StepType = 'instructions' | 'questions' | 'results';

const TakeOnboarding: React.FC = () => {
	const { slug, companySlug } = useParams<{ slug: string; companySlug?: string }>();
	const navigate = useNavigate();

	// Helper function to generate API paths with multi-tenant support
	const getApiPath = (path: string) => {
		return companySlug ? `/${companySlug}/api${path}` : `/api${path}`;
	};

	// State
	const [survey, setSurvey] = useState<Survey | null>(null);
	const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
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
	const [onboardingMeta, setOnboardingMeta] = useState<{
		responseId?: string;
		onboardingSettings?: any;
	}>({});
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);

	// Question timing tracking
	const [questionTimings, setQuestionTimings] = useState<Record<number, QuestionTiming>>({});
	const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number | null>(null);
	const [questionAttempts, setQuestionAttempts] = useState<Record<string, number>>({});
	const [availableHints, setAvailableHints] = useState<Record<string, any[]>>({});

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
				const response = await axios.get(
					getApiPath(`/onboarding/${survey.slug}/questions`),
					{
						params: { email: userEmail },
					}
				);
				setQuestions(response.data.questions);
			} catch {
				setError('Failed to load questions');
			}
		} else {
			// For manual surveys, use the questions from the survey object
			setQuestions(survey.questions as OnboardingQuestion[]);
		}
		setQuestionsLoaded(true);
	};

	const loadSurvey = async () => {
		try {
			setLoading(true);
			const response = await axios.get(getApiPath(`/onboarding/${slug}`));
			const surveyData = response.data;

			if (surveyData.type !== 'onboarding') {
				setError('This is not an onboarding survey');
				return;
			}

			setSurvey(surveyData);

			// Set timer if time limit exists
			if (surveyData.timeLimit) {
				setTimer({
					timeLeft: surveyData.timeLimit * 60,
					isActive: false,
					isExpired: false,
				});
			}
		} catch (err: any) {
			if (err.response?.status === 404) {
				setError('Onboarding not found');
			} else {
				setError(err.response?.data?.error || 'Failed to load onboarding');
			}
		} finally {
			setLoading(false);
		}
	};

	const startOnboarding = async () => {
		if (!form.name || !form.email) {
			setError('Please provide your name and email');
			return;
		}

		try {
			setLoading(true);
			const response = await axios.post(getApiPath(`/onboarding/${slug}/start`), {
				name: form.name,
				email: form.email,
				attempt: 1,
			});

			const {
				responseId,
				questions: onboardingQuestions,
				onboardingSettings,
			} = response.data;

			setOnboardingMeta({ responseId, onboardingSettings });
			setQuestions(onboardingQuestions);
			setQuestionsLoaded(true);
			setCurrentStep('questions');
			setStartTime(new Date());

			// Initialize progress tracking
			setOnboardingProgress({
				currentSection: 0,
				completedSections: [],
				learningPath: onboardingSettings?.learningPath || {},
				timeTracking: {
					startedAt: new Date(),
					sectionTimes: [],
				},
			});

			// Start timer if exists
			if (survey?.timeLimit) {
				setTimer(prev => ({ ...prev, isActive: true }));
			}

			// Start timing first question
			setCurrentQuestionStartTime(Date.now());
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to start onboarding');
		} finally {
			setLoading(false);
		}
	};

	const submitAnswer = async (questionId: string, answer: any) => {
		if (!onboardingMeta.responseId) return;

		const currentAttempts = questionAttempts[questionId] || 0;
		const newAttempts = currentAttempts + 1;

		try {
			const response = await axios.post(getApiPath(`/onboarding/${slug}/submit-answer`), {
				responseId: onboardingMeta.responseId,
				questionId,
				answer,
				attemptNumber: newAttempts,
			});

			const {
				isCorrect,
				availableHints: hints,
				explanation,
				learningContext,
				learningResources,
				canProceed,
			} = response.data;

			// Update question attempts
			setQuestionAttempts(prev => ({ ...prev, [questionId]: newAttempts }));

			// Update available hints
			setAvailableHints(prev => ({ ...prev, [questionId]: hints }));

			// Update form with answer
			setForm(prev => ({
				...prev,
				answers: { ...prev.answers, [questionId]: answer },
			}));

			// Record question timing
			if (currentQuestionStartTime) {
				const duration = Date.now() - currentQuestionStartTime;
				setQuestionTimings(prev => ({
					...prev,
					[currentQuestionIndex]: {
						...prev[currentQuestionIndex],
						endTime: Date.now(),
						duration,
					},
				}));
			}

			// Move to next question or complete section
			if (canProceed) {
				await completeSection(currentQuestionIndex);
				if (currentQuestionIndex < questions.length - 1) {
					setCurrentQuestionIndex(prev => prev + 1);
					setCurrentQuestionStartTime(Date.now());
				} else {
					// All questions completed
					await completeOnboarding();
				}
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to submit answer');
		}
	};

	const completeSection = async (sectionIndex: number) => {
		if (!onboardingMeta.responseId) return;

		try {
			const timeSpent = questionTimings[sectionIndex]?.duration || 0;

			await axios.post(getApiPath(`/onboarding/${slug}/complete-section`), {
				responseId: onboardingMeta.responseId,
				sectionIndex,
				timeSpent,
			});

			// Update local progress
			setOnboardingProgress(prev => {
				if (!prev) return prev;
				return {
					...prev,
					completedSections: [...prev.completedSections, sectionIndex],
					currentSection: Math.max(prev.currentSection, sectionIndex + 1),
					timeTracking: {
						...prev.timeTracking,
						sectionTimes: {
							...prev.timeTracking.sectionTimes,
							[sectionIndex]: timeSpent,
						},
					},
				};
			});
		} catch (err: any) {
			console.error('Failed to complete section:', err);
		}
	};

	const completeOnboarding = async () => {
		if (!onboardingMeta.responseId) return;

		try {
			setLoading(true);
			const response = await axios.post(getApiPath(`/onboarding/${slug}/complete`), {
				responseId: onboardingMeta.responseId,
			});

			const {
				score,
				percentageScore,
				isPassing,
				completionTime,
				onboardingProgress: finalProgress,
			} = response.data;

			// Set results
			setScoringResult({
				score,
				percentageScore,
				isPassing,
				totalQuestions: questions.length,
				correctAnswers: Math.round((percentageScore / 100) * questions.length),
				timeSpent: startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0,
			});

			setOnboardingProgress(finalProgress);
			setCurrentStep('results');
			setSubmitted(true);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to complete onboarding');
		} finally {
			setLoading(false);
		}
	};

	const handleAnswerChange = (questionId: string, answer: any) => {
		setForm(prev => ({
			...prev,
			answers: { ...prev.answers, [questionId]: answer },
		}));
	};

	const handleNextQuestion = () => {
		if (currentQuestionIndex < questions.length - 1) {
			// Complete current section
			completeSection(currentQuestionIndex);

			// Move to next question
			setCurrentQuestionIndex(prev => prev + 1);
			setCurrentQuestionStartTime(Date.now());
		}
	};

	const handlePreviousQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(prev => prev - 1);
		}
	};

	// Timer effect
	useEffect(() => {
		if (timer.isActive && timer.timeLeft > 0) {
			timerRef.current = setInterval(() => {
				setTimer(prev => {
					if (prev.timeLeft <= 1) {
						clearInterval(timerRef.current!);
						return { ...prev, timeLeft: 0, isActive: false, isExpired: true };
					}
					return { ...prev, timeLeft: prev.timeLeft - 1 };
				});
			}, 1000);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [timer.isActive, timer.timeLeft]);

	// Auto-submit when timer expires
	useEffect(() => {
		if (timer.isExpired && !autoSubmitRef.current) {
			autoSubmitRef.current = true;
			completeOnboarding();
		}
	}, [timer.isExpired]);

	// Load survey on mount
	useEffect(() => {
		if (slug) {
			loadSurvey();
		}
	}, [slug]);

	// Format time for display
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	if (loading && !survey) {
		return <LoadingScreen />;
	}

	if (error) {
		return <ErrorCard error={error} onRetry={() => loadSurvey()} />;
	}

	if (!survey) {
		return <UnavailableCard />;
	}

	if (currentStep === 'instructions') {
		return (
			<div className='min-h-screen bg-gray-50'>
				<HeaderWithLogo companySlug={companySlug} />

				<div className='max-w-4xl mx-auto px-4 py-8'>
					<div className='bg-white rounded-lg shadow-lg p-8'>
						<h1 className='text-3xl font-bold text-gray-900 mb-6'>{survey.title}</h1>

						{survey.description && (
							<div className='prose max-w-none mb-6'>
								<SafeMarkdown content={survey.description} />
							</div>
						)}

						{survey.instructions && (
							<div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
								<h3 className='text-lg font-semibold text-blue-900 mb-2'>
									Instructions
								</h3>
								<SafeMarkdown content={survey.instructions} />
							</div>
						)}

						{survey.timeLimit && (
							<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
								<h3 className='text-lg font-semibold text-yellow-900 mb-2'>
									Time Limit
								</h3>
								<p className='text-yellow-800'>
									You have {survey.timeLimit} minutes to complete this onboarding.
								</p>
							</div>
						)}

						{survey.maxAttempts && survey.maxAttempts > 1 && (
							<div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
								<h3 className='text-lg font-semibold text-green-900 mb-2'>
									Attempts
								</h3>
								<p className='text-green-800'>
									You can attempt this onboarding up to {survey.maxAttempts}{' '}
									times.
								</p>
							</div>
						)}

						<div className='bg-gray-50 rounded-lg p-6'>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								Enter Your Information
							</h3>
							<div className='space-y-4'>
								<div>
									<label
										htmlFor='name'
										className='block text-sm font-medium text-gray-700 mb-1'
									>
										Full Name *
									</label>
									<input
										type='text'
										id='name'
										value={form.name}
										onChange={e =>
											setForm(prev => ({ ...prev, name: e.target.value }))
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Enter your full name'
										required
									/>
								</div>
								<div>
									<label
										htmlFor='email'
										className='block text-sm font-medium text-gray-700 mb-1'
									>
										Email Address *
									</label>
									<input
										type='email'
										id='email'
										value={form.email}
										onChange={e =>
											setForm(prev => ({ ...prev, email: e.target.value }))
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Enter your email address'
										required
									/>
								</div>
							</div>

							<button
								onClick={startOnboarding}
								disabled={!form.name || !form.email || loading}
								className='mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{loading ? 'Starting...' : 'Start Onboarding'}
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (currentStep === 'questions') {
		return (
			<div className='min-h-screen bg-gray-50'>
				<HeaderWithLogo companySlug={companySlug} />

				{/* Progress Bar */}
				{onboardingProgress && (
					<div className='bg-white border-b border-gray-200'>
						<div className='max-w-4xl mx-auto px-4 py-4'>
							<div className='flex items-center justify-between mb-2'>
								<span className='text-sm font-medium text-gray-700'>
									Progress: {onboardingProgress.completedSections.length} /{' '}
									{questions.length} sections
								</span>
								{survey.timeLimit && (
									<span className='text-sm font-medium text-gray-700'>
										Time Left: {formatTime(timer.timeLeft)}
									</span>
								)}
							</div>
							<div className='w-full bg-gray-200 rounded-full h-2'>
								<div
									className='bg-blue-600 h-2 rounded-full transition-all duration-300'
									style={{
										width: `${(onboardingProgress.completedSections.length / questions.length) * 100}%`,
									}}
								/>
							</div>
						</div>
					</div>
				)}

				<div className='max-w-4xl mx-auto px-4 py-8'>
					{questions.length > 0 && (
						<OneQuestionPerPageView
							question={questions[currentQuestionIndex]}
							questionIndex={currentQuestionIndex}
							totalQuestions={questions.length}
							answer={form.answers[questions[currentQuestionIndex]._id || '']}
							onAnswerChange={answer =>
								handleAnswerChange(
									questions[currentQuestionIndex]._id || '',
									answer
								)
							}
							onNext={handleNextQuestion}
							onPrevious={handlePreviousQuestion}
							onSubmit={() =>
								submitAnswer(
									questions[currentQuestionIndex]._id || '',
									form.answers[questions[currentQuestionIndex]._id || '']
								)
							}
							showSubmitButton={false}
							showNavigation={true}
							canGoNext={true}
							canGoPrevious={currentQuestionIndex > 0}
							{...getInputProps()}
						/>
					)}

					{/* Learning Context Panel */}
					{questions[currentQuestionIndex]?.onboarding?.learningContext && (
						<div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
							<h3 className='text-lg font-semibold text-blue-900 mb-3'>
								Learning Context
							</h3>
							{questions[currentQuestionIndex].onboarding?.learningContext
								?.background && (
								<div className='mb-3'>
									<h4 className='text-sm font-medium text-blue-800 mb-1'>
										Background
									</h4>
									<p className='text-blue-700 text-sm'>
										{
											questions[currentQuestionIndex].onboarding
												?.learningContext?.background
										}
									</p>
								</div>
							)}
							{questions[currentQuestionIndex].onboarding?.learningContext
								?.keyConcepts && (
								<div className='mb-3'>
									<h4 className='text-sm font-medium text-blue-800 mb-1'>
										Key Concepts
									</h4>
									<div className='flex flex-wrap gap-2'>
										{questions[
											currentQuestionIndex
										].onboarding?.learningContext?.keyConcepts?.map(
											(concept, index) => (
												<span
													key={index}
													className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'
												>
													{concept}
												</span>
											)
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Available Hints */}
					{availableHints[questions[currentQuestionIndex]._id || '']?.length > 0 && (
						<div className='mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
							<h3 className='text-lg font-semibold text-yellow-900 mb-3'>
								Available Hints
							</h3>
							<div className='space-y-2'>
								{availableHints[questions[currentQuestionIndex]._id || ''].map(
									(hint, index) => (
										<div key={index} className='bg-yellow-100 p-3 rounded'>
											<p className='text-yellow-800 text-sm'>
												{hint.content}
											</p>
										</div>
									)
								)}
							</div>
						</div>
					)}

					{/* Learning Resources */}
					{questions[currentQuestionIndex]?.onboarding?.learningResources?.length > 0 && (
						<div className='mt-4 bg-green-50 border border-green-200 rounded-lg p-4'>
							<h3 className='text-lg font-semibold text-green-900 mb-3'>
								Learning Resources
							</h3>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
								{questions[currentQuestionIndex].onboarding?.learningResources?.map(
									(resource, index) => (
										<div key={index} className='bg-green-100 p-3 rounded'>
											<h4 className='text-sm font-medium text-green-800 mb-1'>
												{resource.title}
											</h4>
											<p className='text-green-700 text-xs mb-2'>
												{resource.description}
											</p>
											<a
												href={resource.url}
												target='_blank'
												rel='noopener noreferrer'
												className='inline-block bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700'
											>
												View {resource.type}
											</a>
										</div>
									)
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	if (currentStep === 'results') {
		return (
			<div className='min-h-screen bg-gray-50'>
				<HeaderWithLogo companySlug={companySlug} />

				<div className='max-w-4xl mx-auto px-4 py-8'>
					<AssessmentResults
						results={assessmentResults}
						scoringResult={scoringResult}
						survey={survey}
						onBackToSurvey={() => navigate(`/${companySlug || ''}/surveys`)}
						showBackButton={true}
					/>
				</div>
			</div>
		);
	}

	return null;
};

export default TakeOnboarding;
