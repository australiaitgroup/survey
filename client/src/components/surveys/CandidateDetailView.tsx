import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/axiosConfig';
import { QUESTION_TYPE } from '../../constants';
import PerQuestionTimeLineChart from './PerQuestionTimeLineChart';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface CandidateDetailViewProps {
	responseId: string;
	onBack: () => void;
}

interface CandidateData {
	_id: string;
	candidateInfo: {
		name: string;
		email: string;
		submittedAt: string;
		metadata: {
			userAgent?: string;
			ipAddress?: string;
			deviceType?: string;
		};
	};
	surveyInfo: {
		_id: string;
		title: string;
		type: string;
		description?: string;
	};
	statistics: {
		completion: {
			totalQuestions: number;
			answeredQuestions: number;
			skippedQuestions: number;
			completionRate: number;
		};
		timing: {
			totalTimeSpent: number;
			averageTimePerQuestion: number;
			isAutoSubmit: boolean;
			questionTimeStats?: {
				fastest: number;
				slowest: number;
				average: number;
				median: number;
			};
		};
	};
	score?: {
		totalPoints: number;
		maxPossiblePoints: number;
		correctAnswers: number;
		wrongAnswers: number;
		percentage: number;
		displayScore: number;
		scoringMode: string;
		passed: boolean;
	};
	questionDetails: Array<{
		questionIndex: number;
		questionText: string;
		questionType: string;
		options: string[];
		userAnswer: any;
		correctAnswer: any;
		isCorrect: boolean;
		pointsAwarded: number;
		maxPoints: number;
		timeSpent: number;
		difficulty: string;
		tags: string[];
		explanation?: string;
	}>;
}

const CandidateDetailView: React.FC<CandidateDetailViewProps> = ({ responseId, onBack }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();
	const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'overview' | 'answers' | 'analysis'>('overview');

	// Sync active tab with URL suffix /overview | /answers | /analysis
	useEffect(() => {
		if (location.pathname.endsWith('/answers')) setActiveTab('answers');
		else if (location.pathname.endsWith('/analysis')) setActiveTab('analysis');
		else setActiveTab('overview');
	}, [location.pathname]);

	useEffect(() => {
		loadCandidateData();
	}, [responseId]);

	const loadCandidateData = async () => {
		try {
			setLoading(true);
			setError(null);
			console.log('Loading candidate data for response ID:', responseId);

			if (!responseId) {
				throw new Error('No response ID provided');
			}

			const response = await api.get(`/admin/responses/${responseId}`);
			console.log('API response received:', response.data);

			if (!response.data) {
				throw new Error('No data received from API');
			}

			setCandidateData(response.data);
		} catch (err: any) {
			console.error('Error loading candidate data:', err);
			const errorMessage =
				err.response?.data?.error ||
				err.response?.data?.message ||
				err.message ||
				'Failed to load candidate data';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const formatTime = (seconds: number): string => {
		if (seconds < 60) {
			return `${Math.round(seconds)}s`;
		}
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.round(seconds % 60);
		return `${minutes}m ${remainingSeconds}s`;
	};

	const formatDateTime = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			timeZoneName: 'short',
		});
	};

	const getDifficultyColor = (difficulty: string): string => {
		switch (difficulty) {
			case 'easy':
				return 'text-green-600';
			case 'medium':
				return 'text-yellow-600';
			case 'hard':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	};

	const getScoreColor = (percentage: number): string => {
		if (percentage >= 80) return 'text-green-600';
		if (percentage >= 60) return 'text-yellow-600';
		return 'text-red-600';
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (error || !candidateData || !candidateData.candidateInfo) {
		return (
			<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
				<p className='text-red-600'>{error || 'Failed to load candidate data'}</p>
				<button onClick={onBack} className='mt-2 text-blue-600 hover:underline'>
					Go back
				</button>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='bg-white rounded-lg shadow-sm p-6'>
				<div className='flex items-center justify-between mb-4'>
					<button
						onClick={onBack}
						className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
					>
						<svg
							className='w-5 h-5'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M10 19l-7-7m0 0l7-7m-7 7h18'
							/>
						</svg>
						Back to Statistics
					</button>
				</div>

				<div className='flex items-start justify-between'>
					<div>
						<h2 className='text-2xl font-bold text-gray-900'>
							{candidateData.candidateInfo?.name || 'Unknown Candidate'}
						</h2>
						<p className='text-gray-600'>
							{candidateData.candidateInfo?.email || 'No email provided'}
						</p>
						{candidateData.candidateInfo?.submittedAt && (
							<p className='text-sm text-gray-500 mt-1'>
								Submitted: {formatDateTime(candidateData.candidateInfo.submittedAt)}
							</p>
						)}
					</div>
					{candidateData.score && (
						<div className='text-right'>
							<div
								className={`text-3xl font-bold ${getScoreColor(candidateData.score.percentage)}`}
							>
								{candidateData.score.displayScore}
								{candidateData.score.scoringMode === 'percentage'
									? '%'
									: ` / ${candidateData.score.maxPossiblePoints}`}
							</div>
							<div
								className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
									candidateData.score.passed
										? 'bg-green-100 text-green-800'
										: 'bg-red-100 text-red-800'
								}`}
							>
								{candidateData.score.passed ? 'Passed' : 'Failed'}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div className='bg-white rounded-lg shadow-sm'>
				<div className='border-b border-gray-200'>
					<nav className='flex -mb-px'>
						<button
							onClick={() =>
								navigate(
									`/admin/survey/${params.surveyId}/candidate/${responseId}/overview`
								)
							}
							className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
								activeTab === 'overview'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700'
							}`}
						>
							Overview
						</button>
						<button
							onClick={() =>
								navigate(
									`/admin/survey/${params.surveyId}/candidate/${responseId}/answers`
								)
							}
							className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
								activeTab === 'answers'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700'
							}`}
						>
							Answer Details
						</button>
						<button
							onClick={() =>
								navigate(
									`/admin/survey/${params.surveyId}/candidate/${responseId}/analysis`
								)
							}
							className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
								activeTab === 'analysis'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700'
							}`}
						>
							Performance Analysis
						</button>
					</nav>
				</div>

				<div className='p-6'>
					{/* Overview Tab */}
					{activeTab === 'overview' && (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{/* Completion Statistics */}
							<div className='bg-gray-50 rounded-lg p-4'>
								<h3 className='font-semibold text-gray-900 mb-3'>
									Completion Statistics
								</h3>
								<div className='space-y-2'>
									<div className='flex justify-between'>
										<span className='text-gray-600'>Total Questions:</span>
										<span className='font-medium'>
											{candidateData.statistics?.completion?.totalQuestions ||
												0}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600'>Answered:</span>
										<span className='font-medium text-green-600'>
											{candidateData.statistics?.completion
												?.answeredQuestions || 0}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600'>Skipped:</span>
										<span className='font-medium text-red-600'>
											{candidateData.statistics?.completion
												?.skippedQuestions || 0}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600'>Completion Rate:</span>
										<span className='font-medium'>
											{candidateData.statistics?.completion?.completionRate ||
												0}
											%
										</span>
									</div>
								</div>
							</div>

							{/* Time Statistics */}
							<div className='bg-gray-50 rounded-lg p-4'>
								<h3 className='font-semibold text-gray-900 mb-3'>
									Time Statistics
								</h3>
								<div className='space-y-2'>
									<div className='flex justify-between'>
										<span className='text-gray-600'>Total Time:</span>
										<span className='font-medium'>
											{formatTime(
												candidateData.statistics?.timing?.totalTimeSpent ||
													0
											)}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600'>Avg. per Question:</span>
										<span className='font-medium'>
											{formatTime(
												candidateData.statistics?.timing
													?.averageTimePerQuestion || 0
											)}
										</span>
									</div>
									{candidateData.statistics?.timing?.questionTimeStats && (
										<>
											<div className='flex justify-between'>
												<span className='text-gray-600'>
													Fastest Question:
												</span>
												<span className='font-medium text-green-600'>
													{formatTime(
														candidateData.statistics.timing
															.questionTimeStats.fastest
													)}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>
													Slowest Question:
												</span>
												<span className='font-medium text-red-600'>
													{formatTime(
														candidateData.statistics.timing
															.questionTimeStats.slowest
													)}
												</span>
											</div>
										</>
									)}
									{candidateData.statistics?.timing?.isAutoSubmit && (
										<div className='mt-2 text-orange-600 text-sm'>
											⚠️ Auto-submitted due to time limit
										</div>
									)}
								</div>
							</div>

							{/* Score Breakdown */}
							{candidateData.score && (
								<div className='bg-gray-50 rounded-lg p-4'>
									<h3 className='font-semibold text-gray-900 mb-3'>
										Score Breakdown
									</h3>
									<div className='space-y-2'>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Correct Answers:</span>
											<span className='font-medium text-green-600'>
												{candidateData.score.correctAnswers}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Wrong Answers:</span>
											<span className='font-medium text-red-600'>
												{candidateData.score.wrongAnswers}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Total Points:</span>
											<span className='font-medium'>
												{candidateData.score.totalPoints} /{' '}
												{candidateData.score.maxPossiblePoints}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Percentage:</span>
											<span
												className={`font-medium ${getScoreColor(candidateData.score.percentage)}`}
											>
												{candidateData.score.percentage}%
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Device Information */}
							{candidateData.candidateInfo.metadata &&
								Object.keys(candidateData.candidateInfo.metadata).length > 0 && (
								<div className='bg-gray-50 rounded-lg p-4'>
									<h3 className='font-semibold text-gray-900 mb-3'>
											Device Information
									</h3>
									<div className='space-y-2'>
										{candidateData.candidateInfo.metadata.ipAddress && (
											<div className='flex justify-between'>
												<span className='text-gray-600'>
														IP Address:
												</span>
												<span className='font-medium'>
													{
														candidateData.candidateInfo.metadata
															.ipAddress
													}
												</span>
											</div>
										)}
										{candidateData.candidateInfo.metadata.deviceType && (
											<div className='flex justify-between'>
												<span className='text-gray-600'>
														Device Type:
												</span>
												<span className='font-medium'>
													{
														candidateData.candidateInfo.metadata
															.deviceType
													}
												</span>
											</div>
										)}
										{candidateData.candidateInfo.metadata.userAgent && (
											<div className='text-sm mt-2'>
												<span className='text-gray-600'>
														User Agent:
												</span>
												<div className='text-xs text-gray-500 mt-1 break-all'>
													{
														candidateData.candidateInfo.metadata
															.userAgent
													}
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Time per Question (line chart) - Overview only */}
							{candidateData.questionDetails &&
								candidateData.questionDetails.length > 0 && (
								<div className='md:col-span-2 bg-white rounded-lg p-4 border border-gray-200'>
									<div className='flex items-center justify-between mb-2'>
										<h3 className='font-semibold text-gray-900'>
												Time per Question
										</h3>
										<div className='text-xs text-gray-500'>
												Seconds spent on each question
										</div>
									</div>
									<PerQuestionTimeLineChart
										times={candidateData.questionDetails.map(
											q => q.timeSpent ?? 0
										)}
									/>
								</div>
							)}
						</div>
					)}

					{/* Answer Details Tab */}
					{activeTab === 'answers' && (
						<div className='space-y-4'>
							{candidateData.questionDetails &&
							candidateData.questionDetails.length > 0 ? (
									candidateData.questionDetails.map((question, index) => (
										<div
											key={index}
											className={`border rounded-lg p-4 ${
												question.isCorrect
													? 'border-green-200 bg-green-50'
													: question.userAnswer
														? 'border-red-200 bg-red-50'
														: 'border-gray-200 bg-gray-50'
											}`}
										>
											<div className='flex items-start justify-between mb-2'>
												<div className='flex-1'>
													<div className='flex items-center gap-2 mb-1'>
														<span className='font-semibold text-gray-900'>
														Question {question.questionIndex + 1}
														</span>
														<span
															className={`text-sm ${getDifficultyColor(question.difficulty)}`}
														>
														({question.difficulty})
														</span>
														{question.tags.length > 0 && (
															<div className='flex gap-1'>
																{question.tags.map((tag, i) => (
																	<span
																		key={i}
																		className='text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded'
																	>
																		{tag}
																	</span>
																))}
															</div>
														)}
													</div>
													<p className='text-gray-800 mb-2'>
														{question.questionText}
													</p>
												</div>
												<div className='text-right ml-4'>
													{candidateData.score && (
														<div className='text-sm font-medium'>
															{question.pointsAwarded} /{' '}
															{question.maxPoints} pts
														</div>
													)}
													{question.timeSpent > 0 && (
														<div className='text-xs text-gray-500 mt-1'>
														Time: {formatTime(question.timeSpent)}
														</div>
													)}
												</div>
											</div>

											{/* Options for choice questions */}
											{(question.questionType === QUESTION_TYPE.SINGLE_CHOICE ||
											question.questionType ===
												QUESTION_TYPE.MULTIPLE_CHOICE) &&
											question.options &&
											question.options.length > 0 && (
												<div className='space-y-1 mb-3'>
													{question.options.map((option, optIndex) => {
														const optionText =
															typeof option === 'string'
																? option
																: option?.text ||
																	`Option ${optIndex + 1}`;
														const isUserAnswer = Array.isArray(
															question.userAnswer
														)
															? question.userAnswer.includes(
																optionText
															)
															: question.userAnswer === optionText;
														const isCorrectAnswer = Array.isArray(
															question.correctAnswer
														)
															? question.correctAnswer.includes(
																optIndex
															)
															: question.correctAnswer === optIndex;

														return (
															<div
																key={optIndex}
																className={`px-3 py-2 rounded ${
																	isUserAnswer && isCorrectAnswer
																		? 'bg-green-100 border border-green-300'
																		: isUserAnswer
																			? 'bg-red-100 border border-red-300'
																			: isCorrectAnswer &&
																				  candidateData.score
																				? 'bg-green-50 border border-green-200'
																				: 'bg-white border border-gray-200'
																}`}
															>
																<div className='flex items-center gap-2'>
																	{isUserAnswer && (
																		<span className='text-sm'>
																			{isCorrectAnswer
																				? '✅'
																				: '❌'}
																		</span>
																	)}
																	{!isUserAnswer &&
																		isCorrectAnswer &&
																		candidateData.score && (
																		<span className='text-sm'>
																				✓
																		</span>
																	)}
																	<span className='text-sm'>
																		{optionText}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											)}

											{/* Text answer */}
											{question.questionType === QUESTION_TYPE.SHORT_TEXT && (
												<div className='mb-3'>
													<div className='text-sm text-gray-600 mb-1'>
													Your Answer:
													</div>
													<div className='px-3 py-2 bg-white border rounded'>
														{question.userAnswer || (
															<span className='text-gray-400'>
															No answer
															</span>
														)}
													</div>
													{candidateData.score &&
													!question.isCorrect &&
													question.correctAnswer && (
														<>
															<div className='text-sm text-gray-600 mb-1 mt-2'>
																Correct Answer:
															</div>
															<div className='px-3 py-2 bg-green-50 border border-green-200 rounded'>
																{question.correctAnswer}
															</div>
														</>
													)}
												</div>
											)}

											{/* Explanation */}
											{question.explanation && candidateData.score && (
												<div className='mt-3 pt-3 border-t border-gray-200'>
													<div className='text-sm text-gray-600 mb-1'>
													Explanation:
													</div>
													<div className='text-sm text-gray-700'>
														{question.explanation}
													</div>
												</div>
											)}
										</div>
									))
								) : (
									<div className='text-center py-8 text-gray-500'>
										<p>No question details available</p>
									</div>
								)}
						</div>
					)}

					{/* Performance Analysis Tab */}
					{activeTab === 'analysis' && (
						<div className='space-y-6'>
							{/* Question Performance Chart */}
							<div className='bg-gray-50 rounded-lg p-4'>
								<h3 className='font-semibold text-gray-900 mb-4'>
									Question Performance
								</h3>
								<div className='space-y-2'>
									{candidateData.questionDetails &&
									candidateData.questionDetails.length > 0 ? (
											candidateData.questionDetails.map((question, index) => (
												<div key={index} className='flex items-center gap-3'>
													<span className='text-sm text-gray-600 w-16'>
													Q{index + 1}
													</span>
													<div className='flex-1'>
														<div className='h-6 bg-gray-200 rounded-full overflow-hidden'>
															<div
																className={`h-full transition-all duration-500 ${
																	question.isCorrect
																		? 'bg-green-500'
																		: 'bg-red-500'
																}`}
																style={{
																	width: `${(question.pointsAwarded / question.maxPoints) * 100}%`,
																}}
															></div>
														</div>
													</div>
													<span className='text-sm font-medium w-20 text-right'>
														{question.pointsAwarded}/{question.maxPoints}{' '}
													pts
													</span>
													{question.timeSpent > 0 && (
														<span className='text-xs text-gray-500 w-16 text-right'>
															{formatTime(question.timeSpent)}
														</span>
													)}
												</div>
											))
										) : (
											<div className='text-center py-8 text-gray-500'>
												<p>No performance data available</p>
											</div>
										)}
								</div>
							</div>

							{/* Difficulty Analysis */}
							<div className='bg-gray-50 rounded-lg p-4'>
								<h3 className='font-semibold text-gray-900 mb-4'>
									Performance by Difficulty
								</h3>
								<div className='grid grid-cols-3 gap-4'>
									{['easy', 'medium', 'hard'].map(difficulty => {
										const questionsOfDifficulty =
											candidateData.questionDetails.filter(
												q => q.difficulty === difficulty
											);
										const correctOfDifficulty = questionsOfDifficulty.filter(
											q => q.isCorrect
										).length;
										const percentage =
											questionsOfDifficulty.length > 0
												? (correctOfDifficulty /
														questionsOfDifficulty.length) *
													100
												: 0;

										return (
											<div key={difficulty} className='text-center'>
												<div
													className={`text-2xl font-bold ${getDifficultyColor(difficulty)}`}
												>
													{Math.round(percentage)}%
												</div>
												<div className='text-sm text-gray-600 capitalize'>
													{difficulty}
												</div>
												<div className='text-xs text-gray-500'>
													{correctOfDifficulty}/
													{questionsOfDifficulty.length} correct
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Time Analysis */}
							{candidateData.statistics.timing.questionTimeStats && (
								<div className='bg-gray-50 rounded-lg p-4'>
									<h3 className='font-semibold text-gray-900 mb-4'>
										Time Distribution
									</h3>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
										<div className='text-center'>
											<div className='text-xl font-bold text-green-600'>
												{formatTime(
													candidateData.statistics.timing
														.questionTimeStats.fastest
												)}
											</div>
											<div className='text-sm text-gray-600'>Fastest</div>
										</div>
										<div className='text-center'>
											<div className='text-xl font-bold text-blue-600'>
												{formatTime(
													candidateData.statistics.timing
														.questionTimeStats.average
												)}
											</div>
											<div className='text-sm text-gray-600'>Average</div>
										</div>
										<div className='text-center'>
											<div className='text-xl font-bold text-yellow-600'>
												{formatTime(
													candidateData.statistics.timing
														.questionTimeStats.median
												)}
											</div>
											<div className='text-sm text-gray-600'>Median</div>
										</div>
										<div className='text-center'>
											<div className='text-xl font-bold text-red-600'>
												{formatTime(
													candidateData.statistics.timing
														.questionTimeStats.slowest
												)}
											</div>
											<div className='text-sm text-gray-600'>Slowest</div>
										</div>
									</div>
								</div>
							)}

							{/* Tag Performance */}
							{(() => {
								const tagPerformance: Record<
									string,
									{ correct: number; total: number }
								> = {};
								candidateData.questionDetails.forEach(q => {
									q.tags.forEach(tag => {
										if (!tagPerformance[tag]) {
											tagPerformance[tag] = { correct: 0, total: 0 };
										}
										tagPerformance[tag].total++;
										if (q.isCorrect) {
											tagPerformance[tag].correct++;
										}
									});
								});

								return Object.keys(tagPerformance).length > 0 ? (
									<div className='bg-gray-50 rounded-lg p-4'>
										<h3 className='font-semibold text-gray-900 mb-4'>
											Performance by Topic
										</h3>
										<div className='space-y-2'>
											{Object.entries(tagPerformance).map(([tag, stats]) => {
												const percentage =
													(stats.correct / stats.total) * 100;
												return (
													<div
														key={tag}
														className='flex items-center gap-3'
													>
														<span className='text-sm text-gray-600 w-32'>
															{tag}
														</span>
														<div className='flex-1'>
															<div className='h-6 bg-gray-200 rounded-full overflow-hidden'>
																<div
																	className={`h-full transition-all duration-500 ${
																		percentage >= 70
																			? 'bg-green-500'
																			: percentage >= 50
																				? 'bg-yellow-500'
																				: 'bg-red-500'
																	}`}
																	style={{
																		width: `${percentage}%`,
																	}}
																></div>
															</div>
														</div>
														<span className='text-sm font-medium w-20 text-right'>
															{stats.correct}/{stats.total}
														</span>
														<span className='text-sm text-gray-500 w-12 text-right'>
															{Math.round(percentage)}%
														</span>
													</div>
												);
											})}
										</div>
									</div>
								) : null;
							})()}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CandidateDetailView;
