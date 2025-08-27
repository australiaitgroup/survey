import React from 'react';

interface OnboardingProgressProps {
	currentSection: number;
	totalSections: number;
	completedSections: string[];
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
	currentSection,
	totalSections,
	completedSections,
}) => {
	const progressPercentage =
		totalSections > 0 ? (completedSections.length / totalSections) * 100 : 0;
	const currentSectionNumber = currentSection + 1;

	return (
		<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<div>
					<h2 className='text-lg font-semibold text-gray-900'>Training Progress</h2>
					<p className='text-sm text-gray-600'>
						Section {currentSectionNumber} of {totalSections}
					</p>
				</div>

				<div className='text-right'>
					<div className='text-2xl font-bold text-blue-600'>
						{Math.round(progressPercentage)}%
					</div>
					<div className='text-sm text-gray-500'>Completed</div>
				</div>
			</div>

			{/* Progress Bar */}
			<div className='w-full bg-gray-200 rounded-full h-3 mb-4'>
				<div
					className='bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out'
					style={{ width: `${progressPercentage}%` }}
				/>
			</div>

			{/* Section Indicators */}
			<div className='flex items-center justify-between'>
				{Array.from({ length: totalSections }, (_, index) => {
					const isCompleted = completedSections.includes(index.toString());
					const isCurrent = index === currentSection;
					const isFuture = index > currentSection;

					return (
						<div
							key={index}
							className={`flex flex-col items-center ${
								isCompleted
									? 'text-green-600'
									: isCurrent
										? 'text-blue-600'
										: 'text-gray-400'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
									isCompleted
										? 'bg-green-100 border-2 border-green-500'
										: isCurrent
											? 'bg-blue-100 border-2 border-blue-500'
											: 'bg-gray-100 border-2 border-gray-300'
								}`}
							>
								{isCompleted ? (
									<svg
										className='w-4 h-4 text-green-600'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
											clipRule='evenodd'
										/>
									</svg>
								) : (
									index + 1
								)}
							</div>
							<div className='text-xs text-center max-w-16'>Section {index + 1}</div>
						</div>
					);
				})}
			</div>

			{/* Progress Stats */}
			<div className='mt-6 pt-4 border-t border-gray-200'>
				<div className='grid grid-cols-3 gap-4 text-center'>
					<div>
						<div className='text-lg font-semibold text-gray-900'>
							{completedSections.length}
						</div>
						<div className='text-sm text-gray-500'>Completed</div>
					</div>
					<div>
						<div className='text-lg font-semibold text-gray-900'>
							{totalSections - completedSections.length}
						</div>
						<div className='text-sm text-gray-500'>Remaining</div>
					</div>
					<div>
						<div className='text-lg font-semibold text-gray-900'>{totalSections}</div>
						<div className='text-sm text-gray-500'>Total</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default OnboardingProgress;
