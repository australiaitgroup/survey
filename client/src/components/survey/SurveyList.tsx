import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TYPES_REQUIRING_ANSWERS } from '../../constants';
import type { Survey } from './takeSurveyTypes';

interface SurveyListProps {
	surveys: Survey[];
}

const SurveyList: React.FC<SurveyListProps> = ({ surveys }) => {
	const navigate = useNavigate();

	if (surveys.length === 0) {
		return (
			<div className='card text-center max-w-md mx-auto'>
				<div className='text-[#767676] text-6xl mb-4'>📝</div>
				<h3 className='heading-sm mb-3 text-[#484848]'>No Surveys Available</h3>
				<p className='body-md'>There are currently no active surveys to participate in.</p>
			</div>
		);
	}

	return (
		<div className='grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3'>
			{surveys.map(s => (
				<div key={s._id} className='card-hover group'>
					<div className='mb-6'>
						<div className='flex items-start justify-between mb-3'>
							<h3 className='heading-sm flex-1 group-hover:text-[#FF5A5F] transition-colors break-words'>
								{s.title}
							</h3>
							<span
								className={`px-3 py-1 text-xs font-medium rounded-full ml-3 flex-shrink-0 ${
									s.type === 'assessment'
										? 'bg-[#00A699] bg-opacity-10 text-[#00A699]'
										: s.type === 'quiz'
											? 'bg-[#FC642D] bg-opacity-10 text-[#FC642D]'
											: s.type === 'iq'
												? 'bg-[#FF5A5F] bg-opacity-10 text-[#FF5A5F]'
												: 'bg-[#EBEBEB] text-[#767676]'
								}`}
							>
								{s.type === 'assessment'
									? '📊 Assessment'
									: s.type === 'quiz'
										? '🧠 Quiz'
										: s.type === 'iq'
											? '🎯 IQ Test'
											: '📋 Survey'}
							</span>
						</div>
						{s.description && <p className='body-md line-clamp-3'>{s.description}</p>}
					</div>
					<div className='space-y-3'>
						{TYPES_REQUIRING_ANSWERS.includes(s.type as any) && (
							<button
								onClick={() => navigate(`/assessment/${s.slug || s._id}`)}
								className='w-full btn-primary'
							>
								🚀 Start Enhanced Assessment
							</button>
						)}
						<button
							onClick={() => navigate(`/survey/${s.slug || s._id}`)}
							className='w-full btn-secondary'
						>
							{s.type === 'assessment'
								? '📊 Classic Assessment'
								: s.type === 'quiz'
									? '🧠 Classic Quiz'
									: s.type === 'iq'
										? '🎯 Classic IQ Test'
										: '📋 Start Survey'}
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

export default SurveyList;
