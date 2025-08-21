import React from 'react';

interface ErrorCardProps {
	message: string;
	onHome: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ message, onHome }) => (
	<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
		<div className='card max-w-md mx-auto text-center'>
			<div className='text-red-500 text-6xl mb-4'>⚠️</div>
			<h2 className='text-2xl font-bold text-gray-800 mb-2'>Survey Not Found</h2>
			<p className='text-gray-600 mb-6'>{message}</p>
			<button onClick={onHome} className='btn-primary'>
				Go to Home
			</button>
		</div>
	</div>
);

export default ErrorCard;
