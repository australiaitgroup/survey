import React from 'react';
import type { Survey } from './takeSurveyTypes';

interface HeaderWithLogoProps {
	survey?: Survey | null;
}

const HeaderWithLogo: React.FC<HeaderWithLogoProps> = ({ survey }) => {
	if (!survey) return null;

	return (
		<div className='flex items-center gap-3 mb-3 min-w-0'>
			<img
				src={survey.company?.logoUrl || '/SigmaQ-logo.svg'}
				alt={(survey.company?.name || 'SigmaQ') + ' Logo'}
				className='h-8 md:h-10 w-auto max-w-[40%] sm:max-w-[30%] object-contain'
				onError={e => {
					if (!e.currentTarget.src.includes('/SigmaQ-logo.svg')) {
						e.currentTarget.src = '/SigmaQ-logo.svg';
					} else {
						e.currentTarget.remove();
					}
				}}
			/>
			<div className='min-w-0 flex-1'>
				<h1 className='text-xl md:text-2xl font-semibold text-[#484848] truncate'>
					{survey.title}
				</h1>
				{survey.description && (
					<p className='text-sm text-[#767676] truncate'>{survey.description}</p>
				)}
			</div>
		</div>
	);
};

export default HeaderWithLogo;
