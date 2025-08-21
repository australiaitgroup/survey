import React from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const Step2ContactInfo: React.FC = () => {
	const { step2Data, setStep2Data, saveStepData, loading, error, setError, setCurrentStep } =
		useOnboarding();

	const roleOptions = [
		'CEO/Founder',
		'CTO',
		'HR Manager',
		'Operations Manager',
		'Project Manager',
		'Team Lead',
		'Developer',
		'Designer',
		'Marketing Manager',
		'Sales Manager',
		'Other',
	];

	const handleInputChange = (field: keyof typeof step2Data, value: string) => {
		setStep2Data({ [field]: value });
		setError(null);
	};

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleNext = async () => {
		// Validation
		if (!step2Data.contactName.trim()) {
			setError('Contact name is required');
			return;
		}

		if (!step2Data.contactEmail.trim()) {
			setError('Contact email is required');
			return;
		}

		if (!validateEmail(step2Data.contactEmail)) {
			setError('Please enter a valid email address');
			return;
		}

		const success = await saveStepData({
			contactName: step2Data.contactName,
			contactEmail: step2Data.contactEmail,
			role: step2Data.role,
		});

		if (success) {
			setCurrentStep(3);
		}
	};

	const handleBack = () => {
		setCurrentStep(1);
	};

	return (
		<div className='max-w-2xl mx-auto'>
			<div className='text-center mb-8'>
				<h2 className='text-3xl font-bold text-gray-900 mb-2'>Contact Information</h2>
				<p className='text-gray-600'>
					Let us know who the main contact person is for your account
				</p>
			</div>

			<div className='bg-white rounded-lg shadow-lg p-8'>
				<div className='space-y-6'>
					{/* Contact Name */}
					<div>
						<label
							htmlFor='contactName'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Contact Name *
						</label>
						<input
							id='contactName'
							type='text'
							value={step2Data.contactName}
							onChange={e => handleInputChange('contactName', e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							placeholder="Enter the main contact person's name"
							required
						/>
					</div>

					{/* Contact Email */}
					<div>
						<label
							htmlFor='contactEmail'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Contact Email *
						</label>
						<input
							id='contactEmail'
							type='email'
							value={step2Data.contactEmail}
							onChange={e => handleInputChange('contactEmail', e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							placeholder='Enter the contact email address'
							required
						/>
						<p className='text-xs text-gray-500 mt-1'>
							This email will be used for important account notifications
						</p>
					</div>

					{/* Role */}
					<div>
						<label
							htmlFor='role'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Role/Position
						</label>
						<select
							id='role'
							value={step2Data.role}
							onChange={e => handleInputChange('role', e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						>
							<option value=''>Select role/position</option>
							{roleOptions.map(role => (
								<option key={role} value={role}>
									{role}
								</option>
							))}
						</select>
					</div>

					{/* Additional Info */}
					<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
						<div className='flex'>
							<div className='flex-shrink-0'>
								<svg
									className='h-5 w-5 text-blue-400'
									fill='currentColor'
									viewBox='0 0 20 20'
								>
									<path
										fillRule='evenodd'
										d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
										clipRule='evenodd'
									/>
								</svg>
							</div>
							<div className='ml-3'>
								<h3 className='text-sm font-medium text-blue-800'>
									Why do we need this information?
								</h3>
								<div className='mt-2 text-sm text-blue-700'>
									<p>
										This contact information helps us provide better support and
										send important updates about your account. We'll never share
										your information with third parties.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
							{error}
						</div>
					)}

					{/* Navigation Buttons */}
					<div className='flex justify-between pt-6'>
						<button
							onClick={handleBack}
							className='px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
						>
							Back
						</button>
						<button
							onClick={handleNext}
							disabled={loading}
							className='px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{loading ? 'Saving...' : 'Next Step'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Step2ContactInfo;
