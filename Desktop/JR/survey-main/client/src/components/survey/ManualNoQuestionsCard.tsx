import React from 'react';

interface ManualNoQuestionsCardProps {
	surveyLoaded: boolean;
	questionsCount?: number;
	status?: string;
	onHome: () => void;
}

const ManualNoQuestionsCard: React.FC<ManualNoQuestionsCardProps> = ({
	surveyLoaded,
	questionsCount,
	status,
	onHome,
}) => (
	<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
		<div className='card max-w-md mx-auto text-center'>
			<div className='text-orange-500 text-6xl mb-4'>📝</div>
			<h2 className='text-2xl font-bold text-gray-800 mb-2'>Survey In Progress</h2>
			<p className='text-gray-600 mb-6'>
				This survey is still being prepared. Please check back later.
			</p>
			<div className='mb-4 p-3 bg-gray-100 rounded text-left text-xs'>
				<strong>Debug Info:</strong>
				<br />
				Survey: {surveyLoaded ? 'loaded' : 'null'}
				<br />
				Questions: {questionsCount !== undefined ? `array(${questionsCount})` : 'undefined'}
				<br />
				Status: {status || 'undefined'}
			</div>
			<button onClick={onHome} className='btn-primary'>
				Go to Home
			</button>
		</div>
	</div>
);

export default ManualNoQuestionsCard;
