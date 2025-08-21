import React, { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const Step3BrandSettings: React.FC = () => {
	const { step3Data, setStep3Data, saveStepData, loading, error, setError, setCurrentStep } =
		useOnboarding();

	const [showColorPicker, setShowColorPicker] = useState(false);

	const predefinedColors = [
		'#3B82F6', // Blue
		'#10B981', // Green
		'#8B5CF6', // Purple
		'#F59E0B', // Yellow
		'#EF4444', // Red
		'#06B6D4', // Cyan
		'#84CC16', // Lime
		'#F97316', // Orange
		'#EC4899', // Pink
		'#6B7280', // Gray
	];

	const handleInputChange = (field: keyof typeof step3Data, value: string | boolean) => {
		setStep3Data({ [field]: value });
		setError(null);
	};

	const handleColorSelect = (color: string) => {
		setStep3Data({ themeColor: color });
		setShowColorPicker(false);
		setError(null);
	};

	const isValidHexColor = (color: string): boolean => {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
	};

	const handleNext = async () => {
		// Validation
		if (!isValidHexColor(step3Data.themeColor)) {
			setError('Please enter a valid hex color code (e.g., #3B82F6)');
			return;
		}

		const success = await saveStepData({
			themeColor: step3Data.themeColor,
			customLogoEnabled: step3Data.customLogoEnabled,
		});

		if (success) {
			setCurrentStep(4);
		}
	};

	const handleBack = () => {
		setCurrentStep(2);
	};

	const handleSkip = async () => {
		// Save current data even when skipping
		await saveStepData({
			themeColor: step3Data.themeColor,
			customLogoEnabled: step3Data.customLogoEnabled,
		});
		setCurrentStep(4);
	};

	return (
		<div className='max-w-2xl mx-auto'>
			<div className='text-center mb-8'>
				<h2 className='text-3xl font-bold text-gray-900 mb-2'>Brand Settings</h2>
				<p className='text-gray-600'>
					Customize the look and feel of your surveys to match your brand
				</p>
				<p className='text-sm text-gray-500 mt-1'>
					This step is optional - you can always change these settings later
				</p>
			</div>

			<div className='bg-white rounded-lg shadow-lg p-8'>
				<div className='space-y-8'>
					{/* Theme Color */}
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-4'>
							Primary Theme Color
						</label>

						{/* Color Preview */}
						<div className='flex items-center space-x-4 mb-4'>
							<div
								className='w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm'
								style={{ backgroundColor: step3Data.themeColor }}
							></div>
							<div>
								<p className='text-sm font-medium text-gray-900'>
									Current Color: {step3Data.themeColor}
								</p>
								<p className='text-xs text-gray-500'>
									This color will be used for buttons, links, and accents
								</p>
							</div>
						</div>

						{/* Predefined Colors */}
						<div className='mb-4'>
							<p className='text-sm text-gray-700 mb-2'>
								Choose from popular colors:
							</p>
							<div className='grid grid-cols-5 gap-2'>
								{predefinedColors.map(color => (
									<button
										key={color}
										onClick={() => handleColorSelect(color)}
										className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
											step3Data.themeColor === color
												? 'border-gray-800 ring-2 ring-gray-300'
												: 'border-gray-300 hover:border-gray-400'
										}`}
										style={{ backgroundColor: color }}
										title={color}
									/>
								))}
							</div>
						</div>

						{/* Custom Color Input */}
						<div className='relative'>
							<label
								htmlFor='themeColor'
								className='block text-sm text-gray-700 mb-2'
							>
								Or enter a custom hex color:
							</label>
							<div className='flex items-center space-x-2'>
								<input
									id='themeColor'
									type='text'
									value={step3Data.themeColor}
									onChange={e => handleInputChange('themeColor', e.target.value)}
									className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='#3B82F6'
								/>
								<input
									type='color'
									value={step3Data.themeColor}
									onChange={e => handleInputChange('themeColor', e.target.value)}
									className='w-12 h-10 border border-gray-300 rounded-lg cursor-pointer'
								/>
							</div>
						</div>
					</div>

					{/* Custom Logo Settings */}
					<div className='border-t pt-8'>
						<div className='flex items-start space-x-3'>
							<div className='flex-shrink-0'>
								<input
									id='customLogoEnabled'
									type='checkbox'
									checked={step3Data.customLogoEnabled}
									onChange={e =>
										handleInputChange('customLogoEnabled', e.target.checked)
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
							</div>
							<div className='flex-1'>
								<label
									htmlFor='customLogoEnabled'
									className='text-sm font-medium text-gray-900'
								>
									Enable custom logo in surveys
								</label>
								<p className='text-sm text-gray-500 mt-1'>
									When enabled, your company logo will appear on all survey pages.
									Make sure you've uploaded a logo in the first step.
								</p>
							</div>
						</div>
					</div>

					{/* Preview Section */}
					<div className='border-t pt-8'>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>Preview</h3>
						<div className='border border-gray-200 rounded-lg p-6 bg-gray-50'>
							<div className='text-center'>
								<h4 className='text-xl font-semibold text-gray-900 mb-4'>
									Sample Survey Title
								</h4>
								<button
									className='px-6 py-2 text-white font-medium rounded-lg transition-colors'
									style={{ backgroundColor: step3Data.themeColor }}
								>
									Start Survey
								</button>
								<p className='text-sm text-gray-600 mt-4'>
									This is how your survey buttons will look with the selected
									theme color
								</p>
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
						<div className='flex space-x-3'>
							<button
								onClick={handleSkip}
								className='px-6 py-3 text-gray-600 font-medium rounded-lg hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
							>
								Skip for now
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
		</div>
	);
};

export default Step3BrandSettings;
