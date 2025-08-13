import React from 'react';
import { useTranslation } from 'react-i18next';
import { Survey } from '../../types/admin';
import { getSurveyUrl } from '../../utils/config';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';

interface SurveyCardProps {
	survey: Survey;
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey }) => {
	const { t } = useTranslation();
	const { showQR, setShowQR, copyToClipboard } = useAdmin();
	const { toggleSurveyStatus, deleteSurvey, handleSurveyClick, openEditModal, duplicateSurvey } =
		useSurveys();

	// Add safety checks for survey data
	if (!survey) {
		return <div className='card'>Invalid survey data</div>;
	}

	const surveyUrl = getSurveyUrl(survey.slug || '');

	const toggleQR = (surveyId: string) => {
		setShowQR(prev => ({
			...prev,
			[surveyId]: !prev[surveyId],
		}));
	};

	return (
		<div className='card hover:shadow-lg transition-shadow'>
			<div className='flex justify-between items-start gap-4'>
				{/* Left side: Survey content */}
				<div className='flex-1 min-w-0'>
					<div className='flex flex-wrap items-center gap-2 mb-2'>
						<h3
							className='text-base sm:text-lg font-bold text-gray-800 cursor-pointer hover:text-[#FF5A5F] transition-colors'
							onClick={() => handleSurveyClick(survey)}
						>
							{survey.title}
						</h3>
						<span
							className={`px-2 py-1 text-xs font-medium rounded-full ${
								survey.type === 'survey'
									? 'bg-blue-100 text-blue-800'
									: survey.type === 'assessment'
										? 'bg-green-100 text-green-800'
										: survey.type === 'quiz'
											? 'bg-purple-100 text-purple-800'
											: 'bg-orange-100 text-orange-800'
							}`}
						>
							{survey.type
								? survey.type.charAt(0).toUpperCase() + survey.type.slice(1)
								: 'Unknown'}
						</span>
						{survey.sourceType === 'question_bank' && (
							<span className='px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800'>
								Question Bank
							</span>
						)}
						<span
							className={`px-2 py-1 text-xs font-medium rounded-full ${
								survey.status === 'active'
									? 'bg-green-100 text-green-800'
									: survey.status === 'draft'
										? 'bg-yellow-100 text-yellow-800'
										: 'bg-red-100 text-red-800'
							}`}
						>
							{survey.status === 'active'
								? 'Active'
								: survey.status === 'draft'
									? 'Draft'
									: 'Closed'}
						</span>
					</div>
					<p className='text-gray-600 mb-2 text-sm'>
						{survey.description || 'No description'}
					</p>
					<div className='flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500'>
						<span>
							{survey.questions?.length || 0}{' '}
							{t('survey.questions.title', 'Questions')}
						</span>
						<span>
							{survey.responseCount || 0} {t('survey.responses', 'Responses')}
						</span>
						<span className='hidden sm:inline'>
							Created:{' '}
							{survey.createdAt
								? new Date(survey.createdAt).toLocaleDateString()
								: 'Unknown'}
						</span>
						{survey.lastActivity ? (
							<span className='hidden md:inline'>
								{t('survey.lastActivity', 'Last activity')}:{' '}
								{new Date(survey.lastActivity).toLocaleDateString()}
							</span>
						) : (
							<span className='hidden md:inline'>
								{t('survey.noActivity', 'No recent activity')}
							</span>
						)}
						{survey.timeLimit && (
							<span className='hidden lg:inline'>
								Time limit: {survey.timeLimit} minutes
							</span>
						)}
					</div>
				</div>

				{/* Right side: Action buttons */}
				<div className='flex flex-col sm:flex-row gap-2 flex-shrink-0'>
					<button
						className='btn-primary btn-small'
						onClick={() => handleSurveyClick(survey)}
					>
						Manage
					</button>
					<button
						className='btn-outline btn-small'
						onClick={() => duplicateSurvey(survey._id)}
					>
						{t('buttons.duplicate', 'Duplicate')}
					</button>
					<button
						className='btn-outline btn-small text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500'
						onClick={() => deleteSurvey(survey._id)}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

export default SurveyCard;
