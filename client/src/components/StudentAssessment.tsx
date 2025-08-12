import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type {
	Survey,
	Question,
	Company,
	Invitation,
	ResponseCreateRequest,
	AssessmentAccessResponse,
	ApiResponse,
} from '../types/api';

// Note: We'll use axios directly with getApiPath instead of api instance for multi-tenant support

const isInvitationCode = (str: string): boolean => /^[a-f0-9]{32}$/i.test(str);

interface FormState {
	name: string;
	email: string;
	answers: Record<string, string | string[]>;
}

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

interface AssessmentResult {
	questionId: string;
	questionText: string;
	userAnswer: string;
	correctAnswer: string;
	isCorrect: boolean;
	pointsAwarded: number;
	maxPoints: number;
	durationInSeconds?: number;
}

type StepType = 'instructions' | 'questions' | 'results';

const StudentAssessment: React.FC = () => {
	const { slug, companySlug } = useParams<{ slug: string; companySlug?: string }>();

	// Helper function to generate API paths with multi-tenant support
	const getApiPath = (path: string) => {
		return companySlug ? `/${companySlug}/api${path}` : `/api${path}`;
	};
	const navigate = useNavigate();

	// State
	const [survey, setSurvey] = useState<Survey | null>(null);
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
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [invitationInfo, setInvitationInfo] = useState<Invitation | null>(null);

	// Question timing tracking
	const [questionTimings, setQuestionTimings] = useState<Record<string, QuestionTiming>>({});
	const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number | null>(null);

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const autoSubmitRef = useRef(false);

	// Company Logo (left, fallback to SigmaQ)
	const CompanyLogo: React.FC<{ company?: Company }> = ({ company }) => {
		const src = company?.logoUrl || '/SigmaQ-logo.svg';
		return (
			<div className='flex items-center gap-3 mb-4'>
				<img
					src={src}
					alt={(company?.name || 'SigmaQ') + ' Logo'}
					className='h-8 md:h-10 w-auto object-contain'
					onError={e => {
						if (!e.currentTarget.src.includes('/SigmaQ-logo.svg')) {
							e.currentTarget.src = '/SigmaQ-logo.svg';
						} else {
							e.currentTarget.remove();
						}
					}}
				/>
				{survey && (
					<div className='min-w-0'>
						<h1 className='text-xl md:text-2xl font-semibold text-[#484848] truncate'>
							{survey.title}
						</h1>
						{survey.description && (
							<p className='text-sm text-[#767676] truncate'>{survey.description}</p>
						)}
					</div>
				)}
			</div>
		);
	};

	// Load survey data and questions (supports invitation code and slug)
	useEffect(() => {
		if (!slug) return;
		setLoading(true);
		setError('');
		setInvitationInfo(null);

		const loadSurveyAndQuestions = async (
			surveyData: Survey,
			invitationData: Invitation | null = null
		) => {
			try {
				setSurvey(surveyData);
				setInvitationInfo(invitationData);

				if (surveyData.timeLimit) {
					setTimer({
						timeLeft: surveyData.timeLimit * 60,
						isActive: false,
						isExpired: false,
					});
				}

				// For question bank based surveys, defer fetching questions until the user
				// provides a real email and starts the assessment. This ensures the backend
				// locks selected questions to the correct email for consistent scoring.

				setLoading(false);
			} catch (error) {
				console.error('Error in loadSurveyAndQuestions:', error);
				setError('Failed to load survey data');
				setLoading(false);
			}
		};

		const fetchSurveyData = async () => {
			try {
				if (isInvitationCode(slug)) {
					// Access through invitation code
					const response = await axios.get<AssessmentAccessResponse>(
						getApiPath(`/invitations/access/${slug}`)
					);
					await loadSurveyAndQuestions(response.data.survey, response.data.invitation);
				} else {
					// Access directly through slug
					const response = await axios.get<Survey>(getApiPath(`/survey/${slug}`));
					await loadSurveyAndQuestions(response.data);
				}
			} catch (error: any) {
				console.error('Error fetching survey:', error);
				if (error.response?.status === 404) {
					setError('Assessment not found');
				} else if (error.response?.status === 403) {
					setError('You do not have access to this assessment');
				} else {
					setError('Failed to load assessment');
				}
				setLoading(false);
			}
		};

		fetchSurveyData();
	}, [slug]);

	// Timer management
	useEffect(() => {
		if (timer.isActive && timer.timeLeft > 0) {
			timerRef.current = setTimeout(() => {
				setTimer(prev => ({
					...prev,
					timeLeft: prev.timeLeft - 1,
				}));
			}, 1000);
		} else if (timer.isActive && timer.timeLeft <= 0 && !autoSubmitRef.current) {
			setTimer(prev => ({ ...prev, isExpired: true, isActive: false }));
			autoSubmitRef.current = true;
			handleAutoSubmit();
		}

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [timer.isActive, timer.timeLeft]);

	const handleAutoSubmit = useCallback(async () => {
		if (autoSubmitRef.current) return;
		autoSubmitRef.current = true;

		try {
			await handleSubmit(null, true);
		} catch (error) {
			console.error('Auto-submit failed:', error);
		}
	}, []);

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const startAssessment = async () => {
		setCurrentStep('questions');
		setStartTime(new Date());

		// If question bank survey and questions not loaded yet, fetch now using email
		if (
			survey?.sourceType === 'question_bank' &&
			(!survey.questions || survey.questions.length === 0)
		) {
			try {
				const questionsResponse = await axios.get(getApiPath(`/survey/${slug}/questions`), {
					params: { email: form.email },
				});
				setSurvey(prev =>
					prev ? { ...prev, questions: questionsResponse.data.questions || [] } : null
				);
			} catch (e) {
				console.error('Failed to load questions before start:', e);
			}
		}

		// Start timing for the first question
		if (survey?.questions && survey.questions.length > 0) {
			const firstQuestionId = survey.questions[0]._id;
			const startTime = Date.now();
			setCurrentQuestionStartTime(startTime);
			setQuestionTimings(prev => ({
				...prev,
				[firstQuestionId]: { startTime },
			}));
		}

		if (survey?.timeLimit) {
			setTimer(prev => ({ ...prev, isActive: true }));
		}
	};

	const handleAnswerChange = (questionId: string, value: string | string[]) => {
		setForm(prev => ({
			...prev,
			answers: {
				...prev.answers,
				[questionId]: value,
			},
		}));
	};

	const nextQuestion = () => {
		if (!survey) return;

		// Record end time for current question
		const currentQuestion = survey.questions[currentQuestionIndex];
		if (currentQuestion && currentQuestionStartTime) {
			const endTime = Date.now();
			const duration = Math.round((endTime - currentQuestionStartTime) / 1000); // Convert to seconds

			setQuestionTimings(prev => ({
				...prev,
				[currentQuestion._id]: {
					...prev[currentQuestion._id],
					endTime,
					duration,
				},
			}));
		}

		if (currentQuestionIndex < survey.questions.length - 1) {
			const nextIndex = currentQuestionIndex + 1;
			setCurrentQuestionIndex(nextIndex);

			// Start timing for next question
			const nextQuestion = survey.questions[nextIndex];
			const startTime = Date.now();
			setCurrentQuestionStartTime(startTime);
			setQuestionTimings(prev => ({
				...prev,
				[nextQuestion._id]: { startTime },
			}));
		} else {
			// Last question, can show submit button or auto-submit
			setCurrentStep('results');
		}
	};

	const prevQuestion = () => {
		if (!survey || currentQuestionIndex <= 0) return;

		// Record end time for current question (but don't finalize duration since user might come back)
		const currentQuestion = survey.questions[currentQuestionIndex];
		if (currentQuestion && currentQuestionStartTime) {
			const endTime = Date.now();
			const duration = Math.round((endTime - currentQuestionStartTime) / 1000);

			setQuestionTimings(prev => ({
				...prev,
				[currentQuestion._id]: {
					...prev[currentQuestion._id],
					endTime,
					duration: (prev[currentQuestion._id]?.duration || 0) + duration, // Accumulate time
				},
			}));
		}

		const prevIndex = currentQuestionIndex - 1;
		setCurrentQuestionIndex(prevIndex);

		// Start timing for previous question (user might modify their answer)
		const prevQuestion = survey.questions[prevIndex];
		const startTime = Date.now();
		setCurrentQuestionStartTime(startTime);
		setQuestionTimings(prev => ({
			...prev,
			[prevQuestion._id]: {
				...prev[prevQuestion._id],
				startTime, // Update start time for re-entry
			},
		}));
	};

	const handleSubmit = async (e: React.FormEvent | null, isAutoSubmit = false) => {
		if (e) e.preventDefault();
		if (!survey || submitted) return;

		setLoading(true);
		autoSubmitRef.current = true;

		try {
			// Record end time for the last question if we're still on a question
			let finalQuestionTimings = { ...questionTimings };
			if (currentStep === 'questions' && currentQuestionStartTime) {
				const currentQuestion = survey.questions[currentQuestionIndex];
				if (currentQuestion) {
					const endTime = Date.now();
					const duration = Math.round((endTime - currentQuestionStartTime) / 1000);

					finalQuestionTimings = {
						...finalQuestionTimings,
						[currentQuestion._id]: {
							...finalQuestionTimings[currentQuestion._id],
							endTime,
							duration:
								(finalQuestionTimings[currentQuestion._id]?.duration || 0) +
								duration,
						},
					};
				}
			}

			const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;

			// Calculate results
			const results: AssessmentResult[] = survey.questions.map((q, index) => {
				const userAnswer = form.answers[q._id];
				let isCorrect = false;
				let pointsAwarded = 0;
				const maxPoints = q.points || 1;

				if (q.correctAnswer !== undefined && userAnswer !== undefined) {
					if (q.type === 'single_choice') {
						const userOptionIndex = q.options?.findIndex(opt =>
							typeof opt === 'string' ? opt === userAnswer : opt.text === userAnswer
						);
						isCorrect = userOptionIndex === q.correctAnswer;
					} else if (
						q.type === 'multiple_choice' &&
						Array.isArray(userAnswer) &&
						Array.isArray(q.correctAnswer)
					) {
						const userOptionIndices = userAnswer
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
					} else if (q.type === 'short_text') {
						isCorrect = userAnswer === q.correctAnswer;
					}

					if (isCorrect) {
						pointsAwarded = maxPoints;
					}
				}

				return {
					questionId: q._id,
					questionText: q.text,
					userAnswer: Array.isArray(userAnswer)
						? userAnswer.join(', ')
						: String(userAnswer || 'No answer'),
					correctAnswer:
						typeof q.correctAnswer === 'number'
							? q.options?.[q.correctAnswer]
								? typeof q.options[q.correctAnswer] === 'string'
									? (q.options[q.correctAnswer] as string)
									: (q.options[q.correctAnswer] as any).text || 'N/A'
								: 'N/A'
							: String(q.correctAnswer || 'N/A'),
					isCorrect,
					pointsAwarded,
					maxPoints,
					durationInSeconds: finalQuestionTimings[q._id]?.duration || 0,
				};
			});

			setAssessmentResults(results);

			// Prepare answer durations for API
			const answerDurations: Record<string, number> = {};
			Object.keys(finalQuestionTimings).forEach(questionId => {
				const timing = finalQuestionTimings[questionId];
				if (timing.duration !== undefined) {
					answerDurations[questionId] = timing.duration;
				}
			});

			// Submit to backend
			const responseData: ResponseCreateRequest = {
				name: form.name,
				email: form.email,
				surveyId: survey._id,
				// Ensure payload uses string keys matching question `_id`
				answers: Object.fromEntries(
					Object.entries(form.answers).map(([k, v]) => [String(k), v])
				),
				timeSpent,
				isAutoSubmit,
				answerDurations,
			};

			await axios.post(getApiPath(`/surveys/${survey._id}/responses`), responseData);

			// Mark invitation as completed (if accessed through invitation code)
			if (isInvitationCode(slug) && invitationInfo) {
				try {
					await axios.post(getApiPath(`/invitations/complete/${slug}`), {
						email: form.email,
					});
				} catch (completeError) {
					console.error('Failed to mark invitation as completed:', completeError);
				}
			}

			setSubmitted(true);
			setCurrentStep('results');

			// Stop timer
			setTimer(prev => ({ ...prev, isActive: false }));
		} catch (error: any) {
			console.error('Submit error:', error);
			setError(error.response?.data?.error || 'Failed to submit assessment');
		} finally {
			setLoading(false);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Loading assessment...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8'>
					<div className='text-red-500 text-6xl mb-4'>⚠️</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>Error</h2>
					<p className='text-gray-600 mb-4'>{error}</p>
					<button onClick={() => navigate('/')} className='btn-primary'>
						Return Home
					</button>
				</div>
			</div>
		);
	}

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

	const currentQuestion = survey.questions[currentQuestionIndex];
	const totalQuestions = survey.questions.length;
	const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
			<div className='container mx-auto px-4 py-8'>
				{/* Display company logo */}
				<CompanyLogo company={survey.company} />

				{/* Instructions Step */}
				{currentStep === 'instructions' && (
					<div className='max-w-2xl mx-auto bg-white rounded-xl border border-[#EBEBEB] p-6'>
						<div className='text-center mb-8'>
							<div className='text-sm text-[#767676]'>
								Please read the instructions carefully before starting.
							</div>
						</div>

						{survey.instructions && (
							<div className='bg-blue-50 rounded-lg p-3 mb-5'>
								<h3 className='font-medium text-blue-800 mb-1'>Instructions</h3>
								<p className='text-blue-700 text-sm leading-relaxed'>
									{survey.instructions}
								</p>
							</div>
						)}

						<div className='grid md:grid-cols-2 gap-6 mb-8'>
							<div>
								<label className='block mb-2 font-medium text-gray-700'>
									Full Name *
								</label>
								<input
									type='text'
									className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									value={form.name}
									onChange={e =>
										setForm(prev => ({ ...prev, name: e.target.value }))
									}
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
									onChange={e =>
										setForm(prev => ({ ...prev, email: e.target.value }))
									}
									required
									placeholder='Enter your email address'
								/>
							</div>
						</div>

						{survey.timeLimit && (
							<div className='bg-yellow-50 rounded-lg p-3 mb-5'>
								<div className='flex items-center'>
									<span className='text-yellow-600 text-base mr-2'>⏱️</span>
									<div className='text-sm'>
										<p className='font-medium text-yellow-800'>Time Limit</p>
										<p className='text-yellow-700'>
											You have {survey.timeLimit} minutes in total.
										</p>
									</div>
								</div>
							</div>
						)}

						<div className='text-center'>
							<button
								onClick={startAssessment}
								disabled={!form.name || !form.email}
								className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
							>
								Start Assessment
							</button>
						</div>
					</div>
				)}

				{/* Questions Step */}
				{currentStep === 'questions' && currentQuestion && (
					<div className='max-w-2xl mx-auto bg-white rounded-xl border border-[#EBEBEB] p-6'>
						{/* Header with steps, progress and timer */}
						<div className='flex items-center justify-between mb-4'>
							<div className='flex-1'>
								<div className='flex items-center justify-center gap-2 mb-2'>
									{survey.questions.map((_, i) => (
										<span
											key={`step-${i}`}
											className={
												'rounded-full transition-all ' +
												(i === currentQuestionIndex
													? 'bg-blue-600 h-2.5 w-6'
													: i < currentQuestionIndex
														? 'bg-blue-500 bg-opacity-30 h-2 w-5'
														: 'bg-gray-200 h-2 w-4')
											}
											aria-hidden='true'
										/>
									))}
								</div>
								<div className='flex items-center justify-center gap-3'>
									<span className='text-xs text-gray-600'>
										Question {currentQuestionIndex + 1} of {totalQuestions}
									</span>
									<div className='w-40 bg-gray-200 rounded-full h-2'>
										<div
											className='bg-blue-600 h-2 rounded-full transition-all duration-300'
											style={{ width: `${progress}%` }}
										/>
									</div>
								</div>
							</div>
							{timer.isActive && (
								<div
									className={`ml-4 text-sm font-medium ${
										timer.timeLeft < 60 ? 'text-red-600' : 'text-gray-600'
									}`}
								>
									⏱️ {formatTime(timer.timeLeft)}
								</div>
							)}
						</div>

						{/* Question */}
						<div className='mb-6 animate-slide-down'>
							<h2 className='text-xl font-semibold text-gray-800 mb-3'>
								{currentQuestion.text}
							</h2>

							{/* Question Image */}
							{currentQuestion.imageUrl && (
								<div className='mb-4'>
									<img
										src={currentQuestion.imageUrl}
										alt='Question'
										className='max-w-full h-auto rounded-lg border border-gray-300'
										style={{ maxHeight: '300px' }}
									/>
								</div>
							)}

							{/* Options */}
							{currentQuestion.type !== 'short_text' && currentQuestion.options && (
								<div className='space-y-3'>
									{currentQuestion.options.map((option, index) => {
										const optionText =
											typeof option === 'string' ? option : option.text || '';
										const optionImage =
											typeof option === 'object' ? option.imageUrl : null;
										const isSelected =
											currentQuestion.type === 'single_choice'
												? form.answers[currentQuestion._id] === optionText
												: Array.isArray(
													form.answers[currentQuestion._id]
												) &&
													form.answers[currentQuestion._id].includes(
														optionText
													);

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
														currentQuestion.type === 'single_choice'
															? 'radio'
															: 'checkbox'
													}
													name={currentQuestion._id}
													className='mt-1 mr-3'
													checked={isSelected}
													onChange={() => {
														if (
															currentQuestion.type === 'single_choice'
														) {
															handleAnswerChange(
																currentQuestion._id,
																optionText
															);
														} else {
															const currentAnswers =
																(form.answers[
																	currentQuestion._id
																] as string[]) || [];
															if (isSelected) {
																handleAnswerChange(
																	currentQuestion._id,
																	currentAnswers.filter(
																		a => a !== optionText
																	)
																);
															} else {
																handleAnswerChange(
																	currentQuestion._id,
																	[...currentAnswers, optionText]
																);
															}
														}
													}}
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
								<textarea
									className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									rows={4}
									value={form.answers[currentQuestion._id] || ''}
									onChange={e =>
										handleAnswerChange(currentQuestion._id, e.target.value)
									}
									placeholder='Enter your answer here...'
								/>
							)}
						</div>

						{/* Navigation */}
						<div className='flex justify-between pt-2'>
							<button
								onClick={prevQuestion}
								disabled={currentQuestionIndex === 0}
								className='btn-secondary disabled:opacity-50 disabled:cursor-not-allowed'
							>
								Previous
							</button>

							{currentQuestionIndex === totalQuestions - 1 ? (
								<button
									onClick={handleSubmit}
									disabled={loading}
									className='btn-primary disabled:opacity-50'
								>
									{loading ? 'Submitting...' : 'Submit Assessment'}
								</button>
							) : (
								<button onClick={nextQuestion} className='btn-primary'>
									Next
								</button>
							)}
						</div>
						<div className='text-center mt-3 text-xs text-gray-500'>
							Tip: Press Enter to proceed to the next question
						</div>
					</div>
				)}

				{/* Results Step */}
				{currentStep === 'results' && submitted && (
					<div className='max-w-2xl mx-auto bg-white rounded-xl border border-[#EBEBEB] p-6'>
						<div className='text-center mb-8'>
							<div className='text-green-500 text-6xl mb-4'>✅</div>
							<h1 className='text-3xl font-bold text-gray-800 mb-2'>
								Assessment Completed!
							</h1>
							<p className='text-gray-600'>Thank you for taking the assessment.</p>
						</div>

						{/* Score Summary (for quiz/assessment/iq types) */}
						{['quiz', 'assessment', 'iq'].includes(survey.type) && (
							<div className='bg-blue-50 rounded-lg p-4 mb-5'>
								<h3 className='font-medium text-blue-800 mb-3'>Your Results</h3>
								<div className='grid grid-cols-3 gap-3 text-center'>
									<div>
										<div className='text-2xl font-bold text-green-600'>
											{assessmentResults.filter(r => r.isCorrect).length}
										</div>
										<div className='text-sm text-gray-600'>Correct</div>
									</div>
									<div>
										<div className='text-2xl font-bold text-red-600'>
											{assessmentResults.filter(r => !r.isCorrect).length}
										</div>
										<div className='text-sm text-gray-600'>Incorrect</div>
									</div>
									<div>
										<div className='text-2xl font-bold text-blue-600'>
											{Math.round(
												(assessmentResults.filter(r => r.isCorrect).length /
													assessmentResults.length) *
													100
											)}
											%
										</div>
										<div className='text-sm text-gray-600'>Score</div>
									</div>
								</div>
							</div>
						)}

						{/* Detailed Results */}
						{survey.scoringSettings?.showCorrectAnswers && (
							<div className='space-y-3 mb-5'>
								<h3 className='font-medium text-gray-800'>Detailed Results</h3>
								{assessmentResults.map((result, index) => (
									<div
										key={result.questionId}
										className={`p-3 rounded-lg border ${
											result.isCorrect
												? 'border-green-200 bg-green-50'
												: 'border-red-200 bg-red-50'
										}`}
									>
										<div className='flex justify-between items-start mb-2'>
											<div className='font-medium text-gray-800'>
												Question {index + 1}: {result.questionText}
											</div>
											{result.durationInSeconds !== undefined && (
												<div className='flex items-center text-sm text-gray-500 ml-4'>
													<svg
														className='w-4 h-4 mr-1'
														fill='none'
														stroke='currentColor'
														viewBox='0 0 24 24'
													>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															strokeWidth={2}
															d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
														/>
													</svg>
													<span
														className={
															result.durationInSeconds > 90
																? 'text-red-500 font-medium'
																: ''
														}
													>
														用时: {result.durationInSeconds}秒
													</span>
													{result.durationInSeconds > 90 && (
														<svg
															className='w-4 h-4 ml-1 text-red-500'
															fill='currentColor'
															viewBox='0 0 20 20'
														>
															<path
																fillRule='evenodd'
																d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
																clipRule='evenodd'
															/>
														</svg>
													)}
												</div>
											)}
										</div>
										<div className='grid md:grid-cols-2 gap-4 text-sm'>
											<div>
												<span className='font-medium text-gray-600'>
													Your Answer:
												</span>
												<p
													className={
														result.isCorrect
															? 'text-green-700'
															: 'text-red-700'
													}
												>
													{result.userAnswer}
												</p>
											</div>
											<div>
												<span className='font-medium text-gray-600'>
													Correct Answer:
												</span>
												<p className='text-green-700'>
													{result.correctAnswer}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						<div className='text-center'>
							<button onClick={() => navigate('/')} className='btn-primary'>
								Return Home
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default StudentAssessment;
