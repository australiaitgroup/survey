import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAntiCheating } from './hooks/useAntiCheating';
import { useSimpleAntiCheating } from './hooks/useSimpleAntiCheating';
import { useAggressiveAntiCheating } from './hooks/useAggressiveAntiCheating';
import { useWorkingAntiCheating } from './hooks/useWorkingAntiCheating';
import OneQuestionPerPageView from './components/survey/OneQuestionPerPageView';
import LoadingScreen from './components/survey/LoadingScreen';
import ErrorCard from './components/survey/ErrorCard';
import UnavailableCard from './components/survey/UnavailableCard';
import ManualNoQuestionsCard from './components/survey/ManualNoQuestionsCard';
import HeaderWithLogo from './components/survey/HeaderWithLogo';
import SurveyList from './components/survey/SurveyList';
import RespondentInfoForm from './components/survey/RespondentInfoForm';
import QuestionList from './components/survey/QuestionList';
import AssessmentResults from './components/survey/AssessmentResults';
import './styles/antiCheating.css';
import type { SurveyResponse } from '../../shared/surveyResponse';
import { SOURCE_TYPE, NAVIGATION_MODE, type SourceType, type SurveyType } from './constants';
import type {
	Survey,
	Question,
	AssessmentResult,
	ScoringResult,
	FormState,
} from './components/survey/takeSurveyTypes';

const TakeSurvey: React.FC = () => {
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
	// No longer need assessment-specific state since assessments use TakeAssessment component

	// Enable anti-cheating measures for assessments and quizzes
	const surveyTypeSafe: SurveyType | undefined = survey?.type as SurveyType | undefined;
	const isAssessmentType = Boolean(surveyTypeSafe && surveyTypeSafe !== 'survey');

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

	// For survey type, use the configured navigation mode
	// Assessment type surveys should use TakeAssessment component instead
	const effectiveNavigationMode = survey?.navigationMode;

	// Reset info step when survey or navigation mode changes
	useEffect(() => {
		if (effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE) {
			setInfoStepDone(false);
		} else {
			setInfoStepDone(true);
		}
	}, [effectiveNavigationMode, survey?._id]);

	// Assessment types should use the TakeAssessment component via routing
	// No redirect needed as routing handles this directly

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

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!survey || !questionsLoaded) return;

		setLoading(true);
		try {
			const payload: SurveyResponse = {
				name: form.name,
				email: form.email,
				surveyId: survey._id,
				answers: questions.map(q => form.answers[q._id]),
			};
			await axios.post(getApiPath(`/surveys/${survey._id}/responses`), payload);

			// Calculate assessment results if this is an assessment or live quiz
			if ((survey.type as SurveyType) !== 'survey') {
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
								const userOptionIndex = (q.options ?? []).findIndex(opt =>
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
									(q.options ?? []).findIndex(opt =>
										typeof opt === 'string' ? opt === ans : opt.text === ans
									)
								)
								.filter((idx): idx is number => idx !== -1);
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
					const maxPoints: number =
						(typeof q.points === 'number' && q.points > 0
							? q.points
							: survey.scoringSettings?.customScoringRules?.defaultQuestionPoints) ??
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
		} catch {
			setError('Failed to submit survey. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <LoadingScreen />;
	}

	if (error) {
		return <ErrorCard message={error} onHome={() => navigate('/')} />;
	}

	// Check if survey is not active
	if (survey && survey.status && survey.status !== 'active') {
		return <UnavailableCard status={survey.status} onHome={() => navigate('/')} />;
	}

	// Check if survey has no questions (for manual surveys) or questions haven't loaded yet
	if (
		survey &&
		survey.sourceType === SOURCE_TYPE.MANUAL &&
		(!survey.questions || survey.questions.length === 0)
	) {
		return (
			<ManualNoQuestionsCard
				surveyLoaded={Boolean(survey)}
				questionsCount={survey?.questions?.length}
				status={survey?.status}
				onHome={() => navigate('/')}
			/>
		);
	}

	// Removed unused CompanyLogo component

	return (
		<div className='min-h-screen bg-[#F7F7F7] py-6 sm:py-12'>
			<div className={`mx-auto px-3 sm:px-4 ${slug ? 'max-w-5xl' : 'max-w-7xl'}`}>
				{survey && <HeaderWithLogo survey={survey} />}

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

						<SurveyList surveys={surveys} />
					</div>
				)}

				{survey && !submitted && (
					<div className='bg-white rounded-xl border border-[#EBEBEB] p-6'>
						<form
							onSubmit={handleSubmit}
							className={`space-y-8 ${antiCheatEnabled && isAssessmentType ? 'anti-cheat-container' : ''}`}
						>
							{!(
								effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE &&
								infoStepDone
							) && (
								<RespondentInfoForm
									name={form.name}
									email={form.email}
									onNameChange={v => setForm({ ...form, name: v })}
									onEmailChange={handleEmailChange}
									showLoading={
										survey?.sourceType === 'question_bank' &&
										Boolean(form.email) &&
										!questionsLoaded
									}
									getInputProps={getInputProps}
								/>
							)}

							{/* Assessment type now handled by TakeAssessment component */}

							{/* Questions */}
							{questionsLoaded &&
								(effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE
									? infoStepDone
									: true
								) &&
								(effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE ? (
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
									<QuestionList
										questions={questions}
										answers={form.answers}
										onAnswerChange={handleAnswerChange}
										antiCheatEnabled={antiCheatEnabled}
										isAssessmentType={Boolean(isAssessmentType)}
										getInputProps={getInputProps}
										sourceType={survey.sourceType}
									/>
								))}

							{/* Start button for one-question-per-page before entering questions */}
							{effectiveNavigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE &&
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
							{effectiveNavigationMode !== NAVIGATION_MODE.ONE_QUESTION_PER_PAGE && (
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
					<AssessmentResults
						survey={survey}
						assessmentResults={assessmentResults}
						scoringResult={scoringResult}
					/>
				)}
			</div>
		</div>
	);
};

export default TakeSurvey;
