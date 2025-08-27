import React from 'react';
import SafeMarkdown from '../survey/SafeMarkdown';

interface Question {
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
}

interface OnboardingTemplate {
	_id: string;
	title: string;
	description?: string;
	instructions?: string;
	onboardingSettings: {
		trainingModule: {
			level: string;
			prerequisites: string[];
		};
		learningPath: {
			enabled: boolean;
			sequential: boolean;
			allowSkip: boolean;
			requiredSections: string[];
		};
		compliance: {
			required: boolean;
			regulations: string[];
			certificationRequired: boolean;
		};
		trainingMetadata: {
			skills: string[];
			tags: string[];
		};
		learningResources: any[];
	};
	scoringSettings?: {
		passingThreshold?: number;
	};
	questions: Question[];
	timeLimit?: number;
	maxAttempts?: number;
}

interface TrainingResult {
	questionId: string;
	questionText: string;
	questionDescription?: string;
	userAnswer: any;
	correctAnswer: any;
	isCorrect: boolean;
	pointsAwarded: number;
	maxPoints: number;
	attemptsUsed: number;
	explanation?: string;
	learningContext?: any;
	learningResources?: any[];
}

interface EmployeeTrainingCompleteProps {
	template: OnboardingTemplate;
	results: TrainingResult[];
	totalScore: number;
	maxPossibleScore: number;
	completionTime: string;
	onRetakeTraining: () => void;
}

const EmployeeTrainingComplete: React.FC<EmployeeTrainingCompleteProps> = ({
	template,
	results,
	totalScore,
	maxPossibleScore,
	completionTime,
	onRetakeTraining,
}) => {
	const correctAnswers = results.filter(r => r.isCorrect).length;
	const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
	const isPassing = percentageScore >= (template.scoringSettings?.passingThreshold || 60);

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
			<div className='max-w-6xl mx-auto px-4 py-8'>
				{/* Header */}
				<div className='bg-white border-b border-gray-200 px-4 py-3 rounded-t-xl'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center space-x-3'>
							<img src='/SigmaQ-logo.svg' alt='SigmaQ Logo' className='h-8 w-auto' />
							<h1 className='text-xl font-semibold text-gray-900'>
								Employee Training Complete
							</h1>
						</div>
					</div>
				</div>

				{/* Main Results Card */}
				<div className='bg-white rounded-b-xl border border-gray-200 p-8 mb-8'>
					{/* Congratulations Section */}
					<div className='text-center mb-8'>
						<div className='text-6xl mb-4'>
							{isPassing ? '🎉' : '📚'}
						</div>
						<h2 className='text-3xl font-bold text-gray-800 mb-2'>
							{isPassing 
								? 'Congratulations! Training Completed!' 
								: 'Training Completed!'}
						</h2>
						<p className='text-xl text-gray-600 mb-4'>
							You have successfully completed the "{template.title}" training program
						</p>
						
						{/* Score Display */}
						<div className='space-y-2 mb-6'>
							<div className={`text-2xl font-bold ${isPassing ? 'text-green-600' : 'text-blue-600'}`}>
								{totalScore} / {maxPossibleScore} points ({percentageScore}%)
							</div>
							<div className='text-sm text-gray-600'>
								Correct answers: {correctAnswers} / {results.length}
							</div>
							{template.onboardingSettings?.compliance?.required && (
								<div className={`text-sm font-medium ${isPassing ? 'text-green-600' : 'text-amber-600'}`}>
									{isPassing 
										? '✅ Compliance requirement met' 
										: `⚠️ Minimum score: ${template.scoringSettings?.passingThreshold || 60}%`}
								</div>
							)}
						</div>
					</div>

					{/* Training Summary */}
					<div className='grid lg:grid-cols-2 gap-8 mb-8'>
						{/* Training Details */}
						<div className='bg-gray-50 rounded-lg p-6'>
							<h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
								<span className='text-xl mr-2'>📋</span>
								Training Overview
							</h3>
							<div className='space-y-3 text-sm'>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Training Program:</span>
									<span className='font-medium text-gray-900'>{template.title}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Total Questions:</span>
									<span className='font-medium text-gray-900'>{results.length}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Training Level:</span>
									<span className='font-medium text-gray-900'>{template.onboardingSettings?.trainingModule?.level || 'beginner'}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Completion Time:</span>
									<span className='font-medium text-gray-900'>{completionTime}</span>
								</div>
								{template.timeLimit && (
									<div className='flex justify-between'>
										<span className='text-gray-600'>Time Limit:</span>
										<span className='font-medium text-gray-900'>{template.timeLimit} minutes</span>
									</div>
								)}
							</div>
						</div>

						{/* Performance Summary */}
						<div className='bg-blue-50 rounded-lg p-6'>
							<h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
								<span className='text-xl mr-2'>📊</span>
								Performance Summary
							</h3>
							<div className='space-y-3'>
								{/* Progress Bar */}
								<div>
									<div className='flex justify-between text-sm mb-1'>
										<span>Overall Score</span>
										<span>{percentageScore}%</span>
									</div>
									<div className='w-full bg-gray-200 rounded-full h-3'>
										<div 
											className={`h-3 rounded-full transition-all duration-500 ${isPassing ? 'bg-green-500' : 'bg-blue-500'}`}
											style={{ width: `${percentageScore}%` }}
										></div>
									</div>
								</div>

								{/* Question Breakdown */}
								<div className='grid grid-cols-2 gap-4 mt-4'>
									<div className='text-center p-3 bg-green-100 rounded-lg'>
										<div className='text-2xl font-bold text-green-600'>{correctAnswers}</div>
										<div className='text-sm text-green-700'>Correct</div>
									</div>
									<div className='text-center p-3 bg-red-100 rounded-lg'>
										<div className='text-2xl font-bold text-red-600'>{results.length - correctAnswers}</div>
										<div className='text-sm text-red-700'>Incorrect</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Detailed Question Results */}
					<div className='mb-8'>
						<h3 className='text-xl font-semibold text-gray-900 mb-6 flex items-center'>
							<span className='text-xl mr-2'>📝</span>
							Question Results
						</h3>
						<div className='space-y-4'>
							{results.map((result, index) => (
								<div
									key={result.questionId}
									className={`p-6 rounded-lg border-2 ${result.isCorrect 
										? 'border-green-300 bg-green-50' 
										: 'border-red-300 bg-red-50'}`}
								>
									<div className='flex items-center justify-between mb-4'>
										<div className='flex items-center gap-3'>
											<span className={`text-2xl ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
												{result.isCorrect ? '✅' : '❌'}
											</span>
											<div>
												<div className='font-semibold text-gray-800'>
													Question {index + 1}: {result.questionText}
												</div>
												{result.questionDescription && (
													<div className='text-sm text-gray-600 mt-1'>
														<SafeMarkdown 
															content={result.questionDescription} 
															className='prose prose-sm max-w-none'
														/>
													</div>
												)}
											</div>
										</div>
										<div className={`text-sm font-medium px-3 py-1 rounded-full ${
											result.isCorrect 
												? 'bg-green-100 text-green-800' 
												: 'bg-red-100 text-red-800'
										}`}>
											{result.pointsAwarded}/{result.maxPoints} pts
										</div>
									</div>

									<div className='grid md:grid-cols-2 gap-4 text-sm'>
										<div className='space-y-2'>
											<div>
												<span className='font-medium text-gray-700'>Your Answer:</span>
												<div className='text-gray-900 mt-1 p-2 bg-white rounded border'>
													{Array.isArray(result.userAnswer) 
														? result.userAnswer.join(', ') 
														: result.userAnswer}
												</div>
											</div>
											{!result.isCorrect && (
												<div>
													<span className='font-medium text-gray-700'>Correct Answer:</span>
													<div className='text-green-700 mt-1 p-2 bg-green-100 rounded border'>
														{Array.isArray(result.correctAnswer) 
															? result.correctAnswer.join(', ') 
															: result.correctAnswer}
													</div>
												</div>
											)}
										</div>

										<div className='space-y-2'>
											{result.attemptsUsed > 1 && (
												<div>
													<span className='font-medium text-gray-700'>Attempts Used:</span>
													<span className='ml-2 text-gray-900'>{result.attemptsUsed}</span>
												</div>
											)}
											{result.explanation && (
												<div>
													<span className='font-medium text-gray-700'>Explanation:</span>
													<div className='text-gray-700 mt-1 p-2 bg-blue-50 rounded border text-xs'>
														{result.explanation}
													</div>
												</div>
											)}
											{result.learningContext && result.learningContext.keyConcepts?.length > 0 && (
												<div>
													<span className='font-medium text-gray-700'>Key Concepts:</span>
													<div className='mt-1 flex flex-wrap gap-1'>
														{result.learningContext.keyConcepts.map((concept: string, i: number) => (
															<span key={i} className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs'>
																{concept}
															</span>
														))}
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Training Instructions */}
					{template.instructions && (
						<div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
							<h3 className='text-lg font-medium text-blue-800 mb-3 flex items-center'>
								<span className='text-xl mr-2'>📋</span>
								Training Instructions
							</h3>
							<div className='text-blue-700'>
								<SafeMarkdown content={template.instructions} className='prose prose-sm max-w-none' />
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<button
							onClick={onRetakeTraining}
							className='px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2'
						>
							<span>🔄</span>
							Retake Training
						</button>

						<button
							onClick={() => window.print()}
							className='px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2'
						>
							<span>🖨️</span>
							Print Certificate
						</button>

						<button
							onClick={() => window.close()}
							className='px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2'
						>
							<span>🚪</span>
							Close Training
						</button>
					</div>
				</div>

				{/* Footer */}
				<div className='text-center text-sm text-gray-500'>
					<p>Training completed successfully. Your progress has been saved.</p>
					<p className='mt-1'>
						If you have any questions about this training, please contact your training administrator.
					</p>
				</div>

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

export default EmployeeTrainingComplete;