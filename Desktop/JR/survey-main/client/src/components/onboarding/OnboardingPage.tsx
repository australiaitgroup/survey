import React from 'react';
import { OnboardingProvider, useOnboarding } from '../../contexts/OnboardingContext';
import Step1CompanyInfo from './Step1CompanyInfo';
import Step2ContactInfo from './Step2ContactInfo';
import Step3BrandSettings from './Step3BrandSettings';
import Step4SystemPreferences from './Step4SystemPreferences';

const StepIndicator: React.FC = () => {
	const { currentStep } = useOnboarding();

	const steps = [
		{ number: 1, title: 'Company Info', description: 'Basic company details' },
		{ number: 2, title: 'Contact Info', description: 'Primary contact person' },
		{ number: 3, title: 'Brand Settings', description: 'Colors and logo' },
		{ number: 4, title: 'Preferences', description: 'System settings' },
	];

	return (
		<div className='mb-8'>
			<nav aria-label='Progress'>
				<ol className='flex items-center justify-center space-x-8'>
					{steps.map((step, stepIdx) => (
						<li key={step.number} className='flex items-center'>
							{stepIdx !== 0 && (
								<div
									className={`hidden sm:block absolute top-4 -ml-px mt-0.5 h-0.5 w-16 ${
										currentStep > step.number - 1
											? 'bg-blue-600'
											: 'bg-gray-300'
									}`}
									style={{ left: 'calc(-2rem - 1px)' }}
								/>
							)}
							<div className='relative flex items-center justify-center'>
								<div
									className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
										currentStep > step.number
											? 'border-blue-600 bg-blue-600 text-white'
											: currentStep === step.number
												? 'border-blue-600 bg-white text-blue-600'
												: 'border-gray-300 bg-white text-gray-500'
									}`}
								>
									{currentStep > step.number ? (
										<svg
											className='h-5 w-5'
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
										step.number
									)}
								</div>
								<div className='ml-4 min-w-0 text-left'>
									<div
										className={`text-sm font-medium ${
											currentStep >= step.number
												? 'text-blue-600'
												: 'text-gray-500'
										}`}
									>
										{step.title}
									</div>
									<div className='text-xs text-gray-500'>{step.description}</div>
								</div>
							</div>
						</li>
					))}
				</ol>
			</nav>
		</div>
	);
};

const OnboardingContent: React.FC = () => {
	const { currentStep } = useOnboarding();

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return <Step1CompanyInfo />;
			case 2:
				return <Step2ContactInfo />;
			case 3:
				return <Step3BrandSettings />;
			case 4:
				return <Step4SystemPreferences />;
			default:
				return <Step1CompanyInfo />;
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='text-center mb-12'>
					<div className='flex items-center justify-center mb-6'>
						<div className='flex items-center space-x-3'>
							<div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
								<svg
									className='w-6 h-6 text-white'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
									/>
								</svg>
							</div>
							<h1 className='text-2xl font-bold text-gray-900'>Survey SaaS</h1>
						</div>
					</div>
					<StepIndicator />
				</div>

				{/* Step Content */}
				<div className='max-w-4xl mx-auto'>{renderCurrentStep()}</div>

				{/* Footer */}
				<div className='text-center mt-12 text-sm text-gray-500'>
					<p>Need help? Contact our support team at support@surveyapp.com</p>
				</div>
			</div>
		</div>
	);
};

const OnboardingPage: React.FC = () => {
	return (
		<OnboardingProvider>
			<OnboardingContent />
		</OnboardingProvider>
	);
};

export default OnboardingPage;
