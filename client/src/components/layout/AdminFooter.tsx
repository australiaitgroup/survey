import React from 'react';

const AdminFooter: React.FC = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className='bg-white border-t border-gray-200 py-6'>
			<div className='max-w-7xl mx-auto px-4'>
				<div className='flex flex-col md:flex-row justify-between items-center text-sm text-gray-600'>
					<div className='flex items-center space-x-6'>
						<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-6' />
						<span>© {currentYear} SigmaQ. All rights reserved.</span>
						<span className='text-xs text-gray-500'>
							by{' '}
							<a 
								href='https://jracademy.ai' 
								target='_blank' 
								rel='noopener noreferrer'
								className='text-blue-600 hover:text-blue-700 font-medium'
							>
								JR Academy
							</a>
						</span>
					</div>
					
					<div className='flex items-center space-x-6 mt-4 md:mt-0'>
						<a 
							href='/help' 
							className='hover:text-gray-800 transition-colors'
						>
							Help Center
						</a>
						<a 
							href='/privacy' 
							className='hover:text-gray-800 transition-colors'
						>
							Privacy
						</a>
						<a 
							href='/terms' 
							className='hover:text-gray-800 transition-colors'
						>
							Terms
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default AdminFooter;