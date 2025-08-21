import React from 'react';
import type { Survey } from '../../../types/admin';
import { NAVIGATION_MODE, SCORING_MODE, TYPES_REQUIRING_ANSWERS } from '../../../constants';

interface Props {
	survey: Survey;
	onEditScoring: () => void;
}

const SurveyAssessmentConfig: React.FC<Props> = ({ survey, onEditScoring }) => {
	const s = survey;
	return (
		<>
			{(s.timeLimit ||
				s.maxAttempts !== 1 ||
				s.instructions ||
				s.navigationMode !== NAVIGATION_MODE.STEP_BY_STEP) && (
				<div className='bg-blue-50 rounded-lg p-3 mb-3'>
					<h5 className='font-medium text-gray-800 mb-2'>Assessment Configuration</h5>
					<div className='grid grid-cols-2 gap-2 text-sm'>
						{s.timeLimit && (
							<div className='flex justify-between'>
								<span className='text-gray-600'>Time Limit:</span>
								<span className='font-medium text-blue-600'>
									{s.timeLimit} minutes
								</span>
							</div>
						)}
						{s.maxAttempts !== 1 && (
							<div className='flex justify-between'>
								<span className='text-gray-600'>Max Attempts:</span>
								<span className='font-medium text-blue-600'>
									{s.maxAttempts} times
								</span>
							</div>
						)}
						{s.navigationMode !== NAVIGATION_MODE.STEP_BY_STEP && (
							<div className='flex justify-between'>
								<span className='text-gray-600'>Navigation Mode:</span>
								<span className='font-medium text-blue-600'>
									{s.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE
										? 'One Question Per Page'
										: 'Step-by-step'}
								</span>
							</div>
						)}
					</div>
					{s.instructions && (
						<div className='mt-2 pt-2 border-t border-blue-200'>
							<div className='text-xs text-gray-600 mb-1'>Special Instructions:</div>
							<div className='text-sm text-gray-700'>{s.instructions}</div>
						</div>
					)}
				</div>
			)}

			{TYPES_REQUIRING_ANSWERS.includes(s.type as any) && s.scoringSettings && (
				<div className='bg-green-50 rounded-lg p-3 mb-3'>
					<div className='flex items-center justify-between mb-2'>
						<h5 className='font-medium text-gray-800'>Scoring Rules</h5>
						<button className='btn-outline btn-small' onClick={onEditScoring}>
							Edit Scoring Rules
						</button>
					</div>
					<div className='grid grid-cols-2 gap-2 text-sm'>
						<div className='flex justify-between'>
							<span className='text-gray-600'>Scoring Mode:</span>
							<span className='font-medium text-green-600'>
								{s.scoringSettings.scoringMode === SCORING_MODE.PERCENTAGE
									? 'Percentage'
									: 'Accumulated'}
							</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-600'>Passing Threshold:</span>
							<span className='font-medium text-green-600'>
								{s.scoringSettings.passingThreshold} points
							</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-600'>Total Score:</span>
							<span className='font-medium text-green-600'>
								{s.scoringSettings.scoringMode === SCORING_MODE.PERCENTAGE
									? '100'
									: s.scoringSettings.totalPoints}{' '}
								points
							</span>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default SurveyAssessmentConfig;
