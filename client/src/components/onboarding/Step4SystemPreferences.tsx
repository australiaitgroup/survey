import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';

const Step4SystemPreferences: React.FC = () => {
	const navigate = useNavigate();
	const {
		step4Data,
		setStep4Data,
		saveStepData,
		completeOnboarding,
		loading,
		error,
		setError,
		setCurrentStep,
	} = useOnboarding();

	const languageOptions = [
		{ value: 'en', label: 'English', flag: '🇺🇸' },
		{ value: 'zh', label: '中文', flag: '🇨🇳' },
		{ value: 'es', label: 'Español', flag: '🇪🇸' },
		{ value: 'fr', label: 'Français', flag: '🇫🇷' },
		{ value: 'de', label: 'Deutsch', flag: '🇩🇪' },
		{ value: 'ja', label: '日本語', flag: '🇯🇵' },
	];

	const handleInputChange = (field: keyof typeof step4Data, value: string | boolean) => {
		setStep4Data({ [field]: value });
		setError(null);
	};

	const handleComplete = async () => {
		// Save current step data first
		const saveSuccess = await saveStepData({
			defaultLanguage: step4Data.defaultLanguage,
			autoNotifyCandidate: step4Data.autoNotifyCandidate,
		});

		if (!saveSuccess) {
			return;
		}

		// Complete onboarding
		const completeSuccess = await completeOnboarding();

		if (completeSuccess) {
			// Redirect to admin dashboard
			navigate('/admin/surveys');
		}
	};

	const handleBack = () => {
		setCurrentStep(3);
	};

	return (
		<div className='max-w-2xl mx-auto'>
			<div className='text-center mb-8'>
				<h2 className='text-3xl font-bold text-gray-900 mb-2'>System Preferences</h2>
				<p className='text-gray-600'>Configure default settings for your survey platform</p>
				<p className='text-sm text-gray-500 mt-1'>
					You can change these settings anytime in your account preferences
				</p>
			</div>

			<div className='bg-white rounded-lg shadow-lg p-8'>
				<div className='space-y-8'>
					{/* Default Language */}
					<div>
						<label
							htmlFor='defaultLanguage'
							className='block text-sm font-medium text-gray-700 mb-4'
						>
							Default Language
						</label>
						<div className='grid grid-cols-2 gap-3'>
							{languageOptions.map(language => (
								<button
									key={language.value}
									onClick={() =>
										handleInputChange('defaultLanguage', language.value)
									}
									className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${
										step4Data.defaultLanguage === language.value
											? 'border-blue-500 bg-blue-50 text-blue-700'
											: 'border-gray-300 hover:border-gray-400 text-gray-700'
									}`}
								>
									<span className='text-xl'>{language.flag}</span>
									<span className='font-medium'>{language.label}</span>
									{step4Data.defaultLanguage === language.value && (
										<svg
											className='w-5 h-5 text-blue-600 ml-auto'
											fill='currentColor'
											viewBox='0 0 20 20'
										>
											<path
												fillRule='evenodd'
												d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
												clipRule='evenodd'
											/>
										</svg>
									)}
								</button>
							))}
						</div>
						<p className='text-sm text-gray-500 mt-2'>
							This will be the default language for new surveys and system
							notifications
						</p>
					</div>

					{/* Auto Notify Candidates */}
					<div className='border-t pt-8'>
						<div className='flex items-start space-x-3'>
							<div className='flex-shrink-0 mt-1'>
								<input
									id='autoNotifyCandidate'
									type='checkbox'
									checked={step4Data.autoNotifyCandidate}
									onChange={e =>
										handleInputChange('autoNotifyCandidate', e.target.checked)
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
							</div>
							<div className='flex-1'>
								<label
									htmlFor='autoNotifyCandidate'
									className='text-sm font-medium text-gray-900'
								>
									Automatically notify candidates
								</label>
								<p className='text-sm text-gray-500 mt-1'>
									When enabled, candidates will automatically receive email
									notifications when:
								</p>
								<ul className='text-sm text-gray-500 mt-2 ml-4 list-disc space-y-1'>
									<li>They are invited to take a survey</li>
									<li>Survey reminders are sent</li>
									<li>Survey results are available (if configured)</li>
								</ul>
							</div>
						</div>
					</div>

					{/* Recommendations */}
					<div className='border-t pt-8'>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>
							Recommended Next Steps
						</h3>
						<div className='space-y-3'>
							<div className='flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg'>
								<div className='flex-shrink-0'>
									<svg
										className='h-5 w-5 text-green-400'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
											clipRule='evenodd'
										/>
									</svg>
								</div>
								<div>
									<h4 className='text-sm font-medium text-green-800'>
										Create your first survey
									</h4>
									<p className='text-sm text-green-700 mt-1'>
										Start by creating a survey to test your setup and get
										familiar with the platform
									</p>
								</div>
							</div>

							<div className='flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
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
								<div>
									<h4 className='text-sm font-medium text-blue-800'>
										Explore question banks
									</h4>
									<p className='text-sm text-blue-700 mt-1'>
										Browse our pre-built question templates to speed up survey
										creation
									</p>
								</div>
							</div>

							<div className='flex items-start space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg'>
								<div className='flex-shrink-0'>
									<svg
										className='h-5 w-5 text-purple-400'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
											clipRule='evenodd'
										/>
									</svg>
								</div>
								<div>
									<h4 className='text-sm font-medium text-purple-800'>
										Customize your profile
									</h4>
									<p className='text-sm text-purple-700 mt-1'>
										Update your account settings and notification preferences
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
							onClick={handleComplete}
							disabled={loading}
							className='px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
						>
							{loading ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
									<span>Completing...</span>
								</>
							) : (
								<>
									<span>Complete Setup</span>
									<svg
										className='w-5 h-5'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M5 13l4 4L19 7'
										/>
									</svg>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Step4SystemPreferences;
