import React from 'react';

const LoadingScreen: React.FC = () => (
	<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
		<div className='text-center'>
			<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
			<p className='text-gray-600'>Loading survey...</p>
		</div>
		<div className='mt-8 py-6 text-center text-xs text-[#767676]'>
			Powered by{' '}
			<a
				href='https://sigmaq.ai'
				target='_blank'
				rel='noopener noreferrer'
				className='text-[#FF5A5F] hover:underline'
			>
				SigmaQ
			</a>
		</div>
	</div>
);

export default LoadingScreen;
