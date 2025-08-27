import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../survey/LoadingScreen';
import ErrorCard from '../survey/ErrorCard';
import HeaderWithLogo from '../survey/HeaderWithLogo';
import SafeMarkdown from '../survey/SafeMarkdown';
import { OnboardingContext } from './OnboardingContext';
import OnboardingProgress from './OnboardingProgress';
import QuestionRenderer from './QuestionRenderer';
import OnboardingComplete from './OnboardingComplete';

// Types  
type StepType = 'instructions' | 'questions' | 'results';

interface OnboardingTemplate {
	_id: string;
	title: string;
	description?: string;
	instructions?: string;
	onboardingSettings: {
		sections: Array<{
			id: string;
			title: string;
			description: string;
			required: boolean;
			order: number;
		}>;
		learningPath: {
			type: 'sequential' | 'adaptive';
			allowSkipping: boolean;
			requireCompletion: boolean;
		};
		compliance: {
			required: boolean;
			minimumScore: number;
			certificateRequired: boolean;
		};
	};
	questions: Array<{
		_id: string;
		text: string;
		description?: string;
		type: 'single_choice' | 'multiple_choice' | 'short_text';
		options?: Array<{ text: string; imageUrl?: string }>;
		correctAnswer: any;
		explanation?: string;
		points: number;
		onboarding?: {
			hints: Array<{
				order: number;
				content: string;
				showAfterAttempts: number;
				isProgressive: boolean;
			}>;
			learningContext?: {
				background?: string;
				keyConcepts?: string[];
				relatedTopics?: string[];
			};
			learningObjectives?: string[];
			difficulty?: 'beginner' | 'intermediate' | 'advanced';
			maxAttempts?: number;
		};
	}>;
	timeLimit?: number;
	maxAttempts?: number;
}

interface OnboardingState {
	template: OnboardingTemplate | null;
	responseId: string | null;
	currentSectionIndex: number;
	currentQuestionIndex: number;
	answers: Record<string, any>;
	attempts: Record<string, number>;
	completedSections: string[];
	startedAt: Date | null;
	status: 'loading' | 'not_started' | 'in_progress' | 'completed' | 'failed';
	error: string | null;
}

interface FormState {
	name: string;
	email: string;
}

const EmployeeTraining: React.FC = () => {
	const { templateId, slug, companySlug } = useParams<{ templateId?: string; slug?: string; companySlug?: string }>();
	const navigate = useNavigate();

	// Use templateId or slug as the template identifier
	const templateIdentifier = templateId || slug;

	// State
	const [onboardingState, setOnboardingState] = useState<OnboardingState>({
		template: null,
		responseId: null,
		currentSectionIndex: 0,
		currentQuestionIndex: 0,
		answers: {},
		attempts: {},
		completedSections: [],
		startedAt: null,
		status: 'loading',
		error: null,
	});

	const [currentStep, setCurrentStep] = useState<StepType>('instructions');
	const [form, setForm] = useState<FormState>({ name: '', email: '' });

	// Helper function to generate API paths
	const getApiPath = useCallback(
		(path: string) => {
			const backendPort = '5050'; // 明确指定后端端口
			const base = companySlug ? `/${companySlug}/api` : '/api';
			return `http://localhost:${backendPort}${base}${path}`;
		},
		[companySlug]
	);

	// Get current employee ID (from context or localStorage)
	const getEmployeeId = useCallback(() => {
		// TODO: 从认证上下文或本地存储获取员工ID
		return localStorage.getItem('employeeId') || 'temp-employee-id';
	}, []);

	// Load onboarding template metadata
	const loadOnboarding = useCallback(async () => {
		if (!templateIdentifier) return;

		try {
			setOnboardingState(prev => ({ ...prev, status: 'loading' }));

			// Get survey metadata only
			const metadataResponse = await axios.get(
				getApiPath(`/onboarding/${templateIdentifier}`)
			);
			
			const surveyMetadata = metadataResponse.data;
			
			// Create template object from metadata
			const template = {
				_id: templateIdentifier,
				title: surveyMetadata.title || 'Employee Training',
				description: surveyMetadata.description || 'Employee training module',
				instructions: surveyMetadata.instructions || 'Please complete all questions in this training module.',
				questions: [], // Will be loaded when starting
				onboardingSettings: surveyMetadata.onboardingSettings,
				scoringSettings: surveyMetadata.scoringSettings,
				timeLimit: surveyMetadata.timeLimit,
				maxAttempts: surveyMetadata.maxAttempts
			};

			setOnboardingState({
				template,
				responseId: null,
				currentSectionIndex: 0,
				currentQuestionIndex: 0,
				answers: {},
				attempts: {},
				completedSections: [],
				startedAt: null,
				status: 'not_started',
				error: null,
			});
		} catch (error: any) {
			console.error('Failed to load onboarding:', error);
			setOnboardingState(prev => ({
				...prev,
				status: 'failed',
				error: error.response?.data?.message || 'Failed to load onboarding',
			}));
		}
	}, [templateIdentifier, companySlug, getApiPath]);

	// Load onboarding on mount
	useEffect(() => {
		loadOnboarding();
	}, [loadOnboarding]);

	// Start training function
	const startTraining = useCallback(async () => {
		if (!templateIdentifier || !form.name || !form.email) return;

		try {
			setOnboardingState(prev => ({ ...prev, status: 'loading' }));

			// Start the onboarding using the standard start endpoint
			const startResponse = await axios.post(
				getApiPath(`/onboarding/${templateIdentifier}/start`),
				{
					name: form.name,
					email: form.email,
				}
			);

			const { responseId, questions, onboardingSettings, scoringSettings, timeLimit, maxAttempts } = startResponse.data;
			
			// Update template with questions
			setOnboardingState(prev => ({
				...prev,
				responseId: responseId,
				template: prev.template ? {
					...prev.template,
					questions: questions,
					onboardingSettings,
					scoringSettings,
					timeLimit,
					maxAttempts
				} : null,
				startedAt: new Date(),
				status: 'in_progress',
				error: null,
			}));

			// Move to questions step
			setCurrentStep('questions');
		} catch (error: any) {
			console.error('Failed to start training:', error);
			setOnboardingState(prev => ({
				...prev,
				status: 'failed',
				error: error.response?.data?.message || 'Failed to start training',
			}));
		}
	}, [templateIdentifier, form.name, form.email, getApiPath]);

	// Handle answer submission
	const handleAnswerSubmit = useCallback(
		async (questionId: string, answer: any) => {
			if (!onboardingState.template || !onboardingState.responseId) return;

			try {
				const attemptNumber = (onboardingState.attempts[questionId] || 0) + 1;

				const response = await axios.post(
					getApiPath(`/onboarding/${templateIdentifier}/submit-answer`),
					{
						responseId: onboardingState.responseId,
						questionId,
						answer,
						attemptNumber,
					}
				);

				const { isCorrect, availableHints, explanation, learningContext, learningResources, canProceed } =
					response.data;

				// Update state
				setOnboardingState(prev => ({
					...prev,
					answers: { ...prev.answers, [questionId]: answer },
					attempts: {
						...prev.attempts,
						[questionId]: attemptNumber,
					},
				}));

				// For now, just move to next question if answer is correct
				// TODO: Implement proper navigation based on onboarding flow
				if (isCorrect) {
					const nextQuestionIndex = onboardingState.currentQuestionIndex + 1;
					if (nextQuestionIndex < (onboardingState.template.questions?.length || 0)) {
						setOnboardingState(prev => ({
							...prev,
							currentQuestionIndex: nextQuestionIndex,
						}));
					} else {
						// All questions completed
						setOnboardingState(prev => ({ ...prev, status: 'completed' }));
						setCurrentStep('results');
					}
				}
			} catch (error: any) {
				console.error('Failed to submit answer:', error);
				setOnboardingState(prev => ({
					...prev,
					error: error.response?.data?.message || 'Failed to submit answer',
				}));
			}
		},
		[onboardingState, templateIdentifier, getApiPath]
	);

	// Handle section completion
	const handleSectionComplete = useCallback(
		async (sectionId: string) => {
			if (!onboardingState.template) return;

			try {
				const employeeId = getEmployeeId();

				await axios.post(getApiPath(`/onboarding/${templateIdentifier}/complete-section`), {
					employeeId,
					sectionId,
					sectionIndex: onboardingState.currentSectionIndex,
				});

				// Move to next section
				const nextSectionIndex = onboardingState.currentSectionIndex + 1;

				if (
					nextSectionIndex < (onboardingState.template.onboardingSettings?.sections?.length || 0)
				) {
					setOnboardingState(prev => ({
						...prev,
						currentSectionIndex: nextSectionIndex,
						currentQuestionIndex: 0,
						completedSections: [...prev.completedSections, sectionId],
					}));
				} else {
					// All sections completed
					setOnboardingState(prev => ({ ...prev, status: 'completed' }));
				}
			} catch (error: any) {
				console.error('Failed to complete section:', error);
				setOnboardingState(prev => ({
					...prev,
					error: error.response?.data?.message || 'Failed to complete section',
				}));
			}
		},
		[onboardingState, templateIdentifier, companySlug, getApiPath, getEmployeeId]
	);

	// Render loading state
	if (onboardingState.status === 'loading') {
		return <LoadingScreen />;
	}

	// Render error state
	if (onboardingState.status === 'failed') {
		return (
			<ErrorCard
				message={onboardingState.error || 'Unknown error'}
				onHome={() => (window.location.href = '/')}
			/>
		);
	}

	// Render completed state
	if (currentStep === 'results' && onboardingState.status === 'completed') {
		return (
			<OnboardingComplete template={onboardingState.template!} onRestart={loadOnboarding} />
		);
	}

	// Check if template is loaded
	if (!onboardingState.template && onboardingState.status !== 'loading') {
		return (
			<ErrorCard message='Template not found' onHome={() => (window.location.href = '/')} />
		);
	}

	const template = onboardingState.template;
	const currentSection =
		template?.onboardingSettings?.sections?.[onboardingState.currentSectionIndex];
	const currentQuestion =
		template?.questions?.[onboardingState.currentQuestionIndex];
	const totalQuestions = template?.questions?.length || 0;

	return (
		<OnboardingContext.Provider
			value={{
				state: onboardingState,
				actions: {
					submitAnswer: handleAnswerSubmit,
					completeSection: handleSectionComplete,
					loadOnboarding,
				},
			}}
		>
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
				{/* Header */}
				<div className='bg-white border-b border-gray-200 px-4 py-3'>
					<div className='max-w-6xl mx-auto flex items-center justify-between'>
						<div className='flex items-center space-x-3'>
							<img src='/SigmaQ-logo.svg' alt='SigmaQ Logo' className='h-8 w-auto' />
							<h1 className='text-xl font-semibold text-gray-900'>
								Employee Training
							</h1>
						</div>
						{companySlug && (
							<div className='text-sm text-gray-500'>Company: {companySlug}</div>
						)}
					</div>
				</div>

				<div className='max-w-6xl mx-auto px-4 py-8'>
					{/* Instructions Step */}
					{currentStep === 'instructions' && template && (
						<div className='w-full bg-white rounded-xl border border-[#EBEBEB] p-8'>
							<div className='text-center mb-8'>
								<h1 className='text-2xl font-bold text-gray-800 mb-4'>
									{template.title}
								</h1>
								<p className='text-gray-600'>
									{template.description || 'Please read the instructions carefully before starting.'}
								</p>
							</div>

							{/* Two Column Layout - Left: Instructions, Right: Employee Information */}
							<div className='grid lg:grid-cols-2 gap-8 mb-8'>
								{/* Left Column - Instructions and Training Information */}
								<div className='space-y-6'>
									{/* Instructions */}
									{template.instructions && (
										<div className='bg-blue-50 rounded-lg p-6'>
											<h3 className='font-medium text-blue-800 mb-3 flex items-center'>
												<span className='text-xl mr-2'>📋</span>
												Instructions
											</h3>
											<div className='text-blue-700 text-sm leading-relaxed prose prose-sm max-w-none'>
												<SafeMarkdown content={template.instructions} />
											</div>
										</div>
									)}

									{/* Training Information Grid */}
									<div className='grid gap-4'>
										{/* Time Limit */}
										{template.timeLimit && (
											<div className='bg-yellow-50 rounded-lg p-6'>
												<div className='flex items-center mb-3'>
													<span className='text-yellow-600 text-xl mr-2'>⏱️</span>
													<h3 className='font-medium text-yellow-800'>Time Limit</h3>
												</div>
												<p className='text-yellow-700 text-sm leading-relaxed'>
													You have <strong>{template.timeLimit} minutes</strong> to complete this training module.
												</p>
											</div>
										)}

										{/* Question Count */}
										{totalQuestions > 0 && (
											<div className='bg-green-50 rounded-lg p-6'>
												<div className='flex items-center mb-3'>
													<span className='text-green-600 text-xl mr-2'>📝</span>
													<h3 className='font-medium text-green-800'>Questions</h3>
												</div>
												<p className='text-green-700 text-sm leading-relaxed'>
													This training contains <strong>{totalQuestions} questions</strong>. 
													You can navigate back and forth between questions at any time.
												</p>
											</div>
										)}
									</div>

									{/* Training Rules */}
									<div className='bg-gray-50 rounded-lg p-6'>
										<h3 className='font-medium text-gray-800 mb-4 flex items-center'>
											<span className='text-xl mr-2'>📚</span>
											Training Rules
										</h3>
										<ul className='text-gray-700 text-sm space-y-2 leading-relaxed'>
											<li className='flex items-start'>
												<span className='text-blue-500 mr-2 mt-1'>•</span>
												Please ensure you have a stable internet connection
											</li>
											<li className='flex items-start'>
												<span className='text-green-500 mr-2 mt-1'>•</span>
												You can take your time to complete each question
											</li>
											<li className='flex items-start'>
												<span className='text-purple-500 mr-2 mt-1'>•</span>
												Review your answers before submitting
											</li>
										</ul>
									</div>
								</div>

								{/* Right Column - Employee Information */}
								<div className='space-y-6'>
									<div className='bg-blue-50 border border-blue-200 rounded-lg p-6 h-fit sticky top-4'>
										<h3 className='font-medium text-blue-800 mb-6 flex items-center text-lg'>
											<span className='text-xl mr-2'>👤</span>
											Employee Information
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
													onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
													required
													placeholder='Enter your full name'
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
													onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
													required
													placeholder='Enter your email address'
												/>
											</div>
											<button
												onClick={startTraining}
												disabled={!form.name || !form.email || onboardingState.status === 'loading'}
												className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
											>
												{onboardingState.status === 'loading' ? 'Starting...' : 'Start Training'}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Questions Step */}
					{currentStep === 'questions' && currentQuestion && template && (
						<div className='w-full bg-white rounded-xl border border-[#EBEBEB] p-6'>
							{/* Progress Bar */}
							<OnboardingProgress
								currentSection={onboardingState.currentSectionIndex}
								totalSections={template.onboardingSettings?.sections?.length || 0}
								completedSections={onboardingState.completedSections}
							/>

							{/* Current Question */}
							<QuestionRenderer
								question={currentQuestion}
								section={currentSection}
								questionIndex={onboardingState.currentQuestionIndex}
								totalQuestions={totalQuestions}
								attempts={onboardingState.attempts[currentQuestion._id] || 0}
								onAnswerSubmit={handleAnswerSubmit}
							/>
						</div>
					)}
				</div>
			</div>
		</OnboardingContext.Provider>
	);
};

export default EmployeeTraining;
