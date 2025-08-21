import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
	feature?: string;
	message: string;
	currentPlan?: 'basic' | 'pro' | null;
	onClose?: () => void;
	inline?: boolean;
	showFeatureComparison?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
	feature,
	message,
	currentPlan,
	onClose,
	inline = false,
	showFeatureComparison = false,
}) => {
	const navigate = useNavigate();

	const handleUpgrade = () => {
		navigate('/billing');
		if (onClose) onClose();
	};

	const getUpgradeButtonText = () => {
		if (!currentPlan) return 'Choose a Plan';
		if (currentPlan === 'basic') return 'Upgrade to Pro';
		return 'View Plans';
	};

	const getUpgradeButtonColor = () => {
		if (!currentPlan) return 'bg-blue-500 hover:bg-blue-600';
		if (currentPlan === 'basic') return 'bg-purple-500 hover:bg-purple-600';
		return 'bg-gray-500 hover:bg-gray-600';
	};

	const getIcon = () => {
		if (!currentPlan) {
			return (
				<svg className='h-5 w-5 text-blue-400' viewBox='0 0 20 20' fill='currentColor'>
					<path
						fillRule='evenodd'
						d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
						clipRule='evenodd'
					/>
				</svg>
			);
		}
		return (
			<svg className='h-5 w-5 text-yellow-400' viewBox='0 0 20 20' fill='currentColor'>
				<path
					fillRule='evenodd'
					d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
					clipRule='evenodd'
				/>
			</svg>
		);
	};

	const getTitle = () => {
		if (!currentPlan) return 'Subscription Required';
		return 'Plan Limit Reached';
	};

	const getBackgroundColor = () => {
		if (!currentPlan) return 'bg-blue-50 border-blue-200';
		return 'bg-yellow-50 border-yellow-200';
	};

	const getTextColor = () => {
		if (!currentPlan) return 'text-blue-800';
		return 'text-yellow-800';
	};

	const getMessageColor = () => {
		if (!currentPlan) return 'text-blue-700';
		return 'text-yellow-700';
	};

	if (inline) {
		return (
			<div className={`${getBackgroundColor()} border rounded-lg p-4 mb-4`}>
				<div className='flex items-start'>
					<div className='flex-shrink-0'>{getIcon()}</div>
					<div className='ml-3 flex-1'>
						<h3 className={`text-sm font-medium ${getTextColor()}`}>{getTitle()}</h3>
						<p className={`mt-1 text-sm ${getMessageColor()}`}>{message}</p>

						{showFeatureComparison && feature && (
							<div className='mt-3 p-3 bg-white rounded border'>
								<h4 className='text-sm font-medium text-gray-900 mb-2'>
									Feature Comparison
								</h4>
								<div className='grid grid-cols-2 gap-4 text-xs'>
									<div>
										<div className='font-medium text-gray-700'>Basic Plan</div>
										<div className='text-gray-500'>Limited features</div>
									</div>
									<div>
										<div className='font-medium text-purple-700'>Pro Plan</div>
										<div className='text-purple-600'>Unlimited access</div>
									</div>
								</div>
							</div>
						)}

						<div className='mt-4 flex space-x-2'>
							<button
								onClick={handleUpgrade}
								className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-md ${getUpgradeButtonColor()} transition-colors`}
							>
								{getUpgradeButtonText()}
							</button>
							{onClose && (
								<button
									onClick={onClose}
									className='inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
								>
									Dismiss
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl'>
				<div className='flex items-center mb-4'>
					<div className='flex-shrink-0'>{getIcon()}</div>
					<div className='ml-3'>
						<h3 className='text-lg font-medium text-gray-900'>{getTitle()}</h3>
					</div>
				</div>

				<div className='mb-6'>
					<p className='text-gray-600'>{message}</p>
				</div>

				{showFeatureComparison && (
					<div className='mb-6 p-4 bg-gray-50 rounded-lg'>
						<h4 className='text-sm font-medium text-gray-900 mb-3'>
							What you get with Pro:
						</h4>
						<ul className='space-y-2 text-sm text-gray-600'>
							<li className='flex items-center'>
								<svg
									className='h-4 w-4 text-green-500 mr-2'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M5 13l4 4L19 7'
									/>
								</svg>
								Unlimited surveys and questions
							</li>
							<li className='flex items-center'>
								<svg
									className='h-4 w-4 text-green-500 mr-2'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M5 13l4 4L19 7'
									/>
								</svg>
								CSV import and image questions
							</li>
							<li className='flex items-center'>
								<svg
									className='h-4 w-4 text-green-500 mr-2'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M5 13l4 4L19 7'
									/>
								</svg>
								Advanced analytics and PDF export
							</li>
							<li className='flex items-center'>
								<svg
									className='h-4 w-4 text-green-500 mr-2'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M5 13l4 4L19 7'
									/>
								</svg>
								Random question selection
							</li>
						</ul>
					</div>
				)}

				<div className='flex space-x-3'>
					<button
						onClick={handleUpgrade}
						className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${getUpgradeButtonColor()} transition-colors`}
					>
						{getUpgradeButtonText()}
					</button>
					{onClose && (
						<button
							onClick={onClose}
							className='flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors'
						>
							Cancel
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default UpgradePrompt;
