import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../survey/LoadingScreen';
import ErrorCard from '../survey/ErrorCard';
import HeaderWithLogo from '../survey/HeaderWithLogo';
import { OnboardingContext } from './OnboardingContext';
import OnboardingProgress from './OnboardingProgress';
import QuestionRenderer from './QuestionRenderer';
import OnboardingComplete from './OnboardingComplete';

// Types
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
	currentSectionIndex: number;
	currentQuestionIndex: number;
	answers: Record<string, any>;
	attempts: Record<string, number>;
	completedSections: string[];
	startedAt: Date | null;
	status: 'loading' | 'not_started' | 'in_progress' | 'completed' | 'failed';
	error: string | null;
}

const EmployeeTraining: React.FC = () => {
	const { templateId, slug, companySlug } = useParams<{ templateId?: string; slug?: string; companySlug?: string }>();
	const navigate = useNavigate();

	// Use templateId or slug as the template identifier
	const templateIdentifier = templateId || slug;

	// State
	const [onboardingState, setOnboardingState] = useState<OnboardingState>({
		template: null,
		currentSectionIndex: 0,
		currentQuestionIndex: 0,
		answers: {},
		attempts: {},
		completedSections: [],
		startedAt: null,
		status: 'loading',
		error: null,
	});

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

	// Load onboarding template and progress
	const loadOnboarding = useCallback(async () => {
		if (!templateIdentifier) return;

		try {
			setOnboardingState(prev => ({ ...prev, status: 'loading' }));

			// Get employee ID
			const employeeId = getEmployeeId();

			// Check if onboarding is in progress
			const progressResponse = await axios.get(
				getApiPath(`/onboarding/${templateIdentifier}/employee-training/progress`),
				{
					params: { employeeId },
				}
			);

			if (progressResponse.data.status === 'in_progress') {
				// Resume existing onboarding
				const {
					template,
					currentSection,
					currentQuestion,
					answers,
					attempts,
					completedSections,
				} = progressResponse.data;

				setOnboardingState({
					template,
					currentSectionIndex: template.onboardingSettings?.sections?.findIndex(
						s => s.id === currentSection
					) ?? 0,
					currentQuestionIndex: currentQuestion,
					answers: answers || {},
					attempts: attempts || {},
					completedSections: completedSections || [],
					startedAt: new Date(progressResponse.data.startedAt),
					status: 'in_progress',
					error: null,
				});
			} else {
				// Start new onboarding
				const startResponse = await axios.post(
					getApiPath(`/onboarding/${templateIdentifier}/employee-training/start`),
					{
						employeeId,
						name: 'Employee Name', // TODO: 从认证获取
						email: 'employee@company.com', // TODO: 从认证获取
					}
				);

				const { template } = startResponse.data;

				setOnboardingState({
					template,
					currentSectionIndex: 0,
					currentQuestionIndex: 0,
					answers: {},
					attempts: {},
					completedSections: [],
					startedAt: new Date(),
					status: 'not_started',
					error: null,
				});
			}
		} catch (error: any) {
			console.error('Failed to load onboarding:', error);
			setOnboardingState(prev => ({
				...prev,
				status: 'failed',
				error: error.response?.data?.message || 'Failed to load onboarding',
			}));
		}
	}, [templateIdentifier, companySlug, getApiPath, getEmployeeId]);

	// Load onboarding on mount
	useEffect(() => {
		loadOnboarding();
	}, [loadOnboarding]);

	// Handle answer submission
	const handleAnswerSubmit = useCallback(
		async (questionId: string, answer: any) => {
			if (!onboardingState.template) return;

			try {
				const employeeId = getEmployeeId();

				const response = await axios.post(
					getApiPath(`/onboarding/${templateIdentifier}/submit-answer`),
					{
						employeeId,
						questionId,
						answer,
						sectionIndex: onboardingState.currentSectionIndex,
						questionIndex: onboardingState.currentQuestionIndex,
					}
				);

				const { isCorrect, explanation, nextQuestion, nextSection, completed } =
					response.data;

				// Update state
				setOnboardingState(prev => ({
					...prev,
					answers: { ...prev.answers, [questionId]: answer },
					attempts: {
						...prev.attempts,
						[questionId]: (prev.attempts[questionId] || 0) + 1,
					},
				}));

				// Handle navigation
				if (nextQuestion !== undefined) {
					setOnboardingState(prev => ({
						...prev,
						currentQuestionIndex: nextQuestion,
					}));
				}

				if (nextSection !== undefined) {
					setOnboardingState(prev => ({
						...prev,
						currentSectionIndex: nextSection,
						currentQuestionIndex: 0,
						completedSections: [
							...prev.completedSections,
							prev.template?.onboardingSettings.sections[prev.currentSectionIndex]
								?.id || '',
						],
					}));
				}

				// Check if onboarding is completed
				if (completed) {
					setOnboardingState(prev => ({ ...prev, status: 'completed' }));
				}
			} catch (error: any) {
				console.error('Failed to submit answer:', error);
				setOnboardingState(prev => ({
					...prev,
					error: error.response?.data?.message || 'Failed to submit answer',
				}));
			}
		},
		[onboardingState, templateIdentifier, companySlug, getApiPath, getEmployeeId]
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

	// Render onboarding complete state
	if (onboardingState.status === 'completed') {
		return (
			<OnboardingComplete template={onboardingState.template!} onRestart={loadOnboarding} />
		);
	}

	// Render main onboarding interface
	if (!onboardingState.template) {
		return (
			<ErrorCard message='Template not found' onHome={() => (window.location.href = '/')} />
		);
	}

	const currentSection =
		onboardingState.template.onboardingSettings?.sections?.[onboardingState.currentSectionIndex];
	const currentQuestion =
		onboardingState.template.questions?.[onboardingState.currentQuestionIndex];

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
			<div className='min-h-screen bg-gray-50'>
				{/* Simple Header */}
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
					{/* Progress Bar */}
					<OnboardingProgress
						currentSection={onboardingState.currentSectionIndex}
						totalSections={onboardingState.template.onboardingSettings?.sections?.length || 0}
						completedSections={onboardingState.completedSections}
					/>

					{/* Current Question */}
					{currentQuestion && currentSection && (
						<QuestionRenderer
							question={currentQuestion}
							section={currentSection}
							questionIndex={onboardingState.currentQuestionIndex}
							totalQuestions={onboardingState.template.questions?.length || 0}
							attempts={onboardingState.attempts[currentQuestion._id] || 0}
							onAnswerSubmit={handleAnswerSubmit}
						/>
					)}
				</div>
			</div>
		</OnboardingContext.Provider>
	);
};

export default EmployeeTraining;
