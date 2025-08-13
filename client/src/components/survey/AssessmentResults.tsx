import React from 'react';
import { useTranslation } from 'react-i18next';
import SafeMarkdown from './SafeMarkdown';
import type { AssessmentResult, ScoringResult, Survey } from './takeSurveyTypes';
import { TYPES_REQUIRING_ANSWERS } from '../../constants';

interface AssessmentResultsProps {
	survey?: Survey | null;
	assessmentResults: AssessmentResult[];
	scoringResult: ScoringResult | null;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({
	survey,
	assessmentResults,
	scoringResult,
}) => {
	const { t } = useTranslation();

	if (!survey) return null;

	return (
		<div className='card animate-fade-in break-words'>
			{TYPES_REQUIRING_ANSWERS.includes((survey?.type as any) || '') &&
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
									{scoringResult.correctAnswers + scoringResult.wrongAnswers}
								</div>
							</div>
						</div>

						{survey?.scoringSettings?.showScoreBreakdown && (
							<div className='space-y-4 mb-6'>
								{assessmentResults.map((result, index) => (
									<div
										key={result.questionId || `question-${index}`}
										className={`p-4 rounded-lg border-2 break-words ${result.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}
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
												{result.pointsAwarded}/{result.maxPoints} pts
											</div>
										</div>

										{result.questionDescription && (
											<SafeMarkdown
												content={result.questionDescription}
												className='mb-4 prose prose-sm max-w-none'
											/>
										)}

										{result.descriptionImage && (
											<div className='mb-4'>
												<img
													src={result.descriptionImage}
													alt='Question illustration'
													className='max-w-full h-auto rounded-lg border border-gray-300'
													onError={e => {
														e.currentTarget.style.display = 'none';
													}}
												/>
											</div>
										)}

										<div className='space-y-1 text-sm'>
											<div className='text-gray-700 break-words'>
												<span className='font-medium'>Your answer:</span>{' '}
												{result.userAnswer}
											</div>
											{!result.isCorrect &&
											survey?.scoringSettings?.showCorrectAnswers && (
												<div className='text-green-700 break-words'>
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
				) : TYPES_REQUIRING_ANSWERS.includes((survey?.type as any) || '') &&
			  assessmentResults.length > 0 &&
			  scoringResult &&
			  survey?.scoringSettings?.showScore === false ? (
						<div className='text-center py-8'>
							<div className='text-[#00A699] text-8xl mb-6 animate-bounce'>🎉</div>
							<h2 className='heading-lg mb-6 gradient-text'>
								{t('survey.assessment.completed.title', 'Assessment Completed!')}
							</h2>
							<p className='body-lg mb-8 max-w-2xl mx-auto'>
								{t(
									'survey.assessment.completed.message',
									'Thank you for completing the assessment. Your responses have been submitted successfully.'
								)}
							</p>
							<div className='inline-flex items-center gap-3 bg-[#00A699] bg-opacity-10 text-[#00A699] px-6 py-3 rounded-xl font-medium'>
								<svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fillRule='evenodd'
										d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
										clipRule='evenodd'
									/>
								</svg>
								{t('survey.assessment.completed.success', 'Submission Successful')}
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
	);
};

export default AssessmentResults;
