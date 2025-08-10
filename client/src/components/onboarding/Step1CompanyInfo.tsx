import React, { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { uploadToCloudinary, getCloudinaryConfig } from '../../utils/cloudinaryUpload';

const Step1CompanyInfo: React.FC = () => {
	const {
		step1Data,
		setStep1Data,
		saveStepData,
		loading,
		error,
		setError,
		uploading,
		setUploading,
		setCurrentStep,
		company,
	} = useOnboarding();

	const [dragOver, setDragOver] = useState(false);

	const industryOptions = [
		'Technology',
		'Healthcare',
		'Finance',
		'Education',
		'Manufacturing',
		'Retail',
		'Real Estate',
		'Consulting',
		'Marketing',
		'Other',
	];

	const sizeOptions = [
		{ value: '1-10', label: '1-10 employees' },
		{ value: '11-50', label: '11-50 employees' },
		{ value: '51-200', label: '51-200 employees' },
		{ value: '201-500', label: '201-500 employees' },
		{ value: '500+', label: '500+ employees' },
	];

	const handleInputChange = (field: keyof typeof step1Data, value: string) => {
		setStep1Data({ [field]: value });
		setError(null);
	};

	const handleFileUpload = async (file: File) => {
		try {
			setUploading(true);
			setError(null);

			const cloudinaryConfig = getCloudinaryConfig();
			const logoUrl = await uploadToCloudinary(file, cloudinaryConfig);

			setStep1Data({ logoUrl });
		} catch (error) {
			console.error('Error uploading logo:', error);
			setError(error instanceof Error ? error.message : 'Failed to upload logo');
		} finally {
			setUploading(false);
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			handleFileUpload(files[0]);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileUpload(files[0]);
		}
	};

	const handleNext = async () => {
		if (!step1Data.companyName.trim()) {
			setError('Company name is required');
			return;
		}

		const success = await saveStepData({
			name: step1Data.companyName,
			logoUrl: step1Data.logoUrl,
			industry: step1Data.industry,
			size: step1Data.size,
		});

		if (success) {
			setCurrentStep(2);
		}
	};

	return (
		<div className='max-w-2xl mx-auto'>
			<div className='text-center mb-8'>
				<h2 className='text-3xl font-bold text-gray-900 mb-2'>
					Welcome! Let's set up your company
				</h2>
				<p className='text-gray-600'>
					Tell us about your company to get started with your survey platform
				</p>
			</div>

			<div className='bg-white rounded-lg shadow-lg p-8'>
				<div className='space-y-6'>
					{/* Slug Preview (read-only) */}
					{company?.slug && (
						<div className='flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg'>
							<div className='text-sm text-gray-600'>Company URL slug</div>
							<div className='text-sm font-mono text-gray-800'>{company.slug}</div>
						</div>
					)}
					{/* Company Name */}
					<div>
						<label
							htmlFor='companyName'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Company Name *
						</label>
						<input
							id='companyName'
							type='text'
							value={step1Data.companyName}
							onChange={e => handleInputChange('companyName', e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							placeholder='Enter your company name'
							required
						/>
					</div>

					{/* Logo Upload */}
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Company Logo
						</label>
						<div
							className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
								dragOver
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-300 hover:border-gray-400'
							}`}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
						>
							{uploading ? (
								<div className='flex items-center justify-center'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
									<span className='ml-2 text-gray-600'>Uploading...</span>
								</div>
							) : step1Data.logoUrl ? (
								<div className='space-y-4'>
									<img
										src={step1Data.logoUrl}
										alt='Company Logo'
										className='mx-auto h-20 w-20 object-contain rounded-lg'
									/>
									<div>
										<p className='text-green-600 font-medium'>
											Logo uploaded successfully!
										</p>
										<button
											type='button'
											onClick={() => setStep1Data({ logoUrl: '' })}
											className='text-sm text-red-600 hover:text-red-800'
										>
											Remove logo
										</button>
									</div>
								</div>
							) : (
								<div className='space-y-4'>
									<div className='mx-auto h-12 w-12 text-gray-400'>
										<svg fill='none' stroke='currentColor' viewBox='0 0 48 48'>
											<path
												d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
												strokeWidth={2}
												strokeLinecap='round'
												strokeLinejoin='round'
											/>
										</svg>
									</div>
									<div>
										<p className='text-gray-600'>
											Drag and drop your logo here, or{' '}
											<label className='text-blue-600 hover:text-blue-800 cursor-pointer font-medium'>
												browse files
												<input
													type='file'
													className='hidden'
													accept='image/*'
													onChange={handleFileSelect}
												/>
											</label>
										</p>
										<p className='text-xs text-gray-500 mt-1'>
											PNG, JPG, GIF up to 10MB
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Industry */}
					<div>
						<label
							htmlFor='industry'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Industry
						</label>
						<select
							id='industry'
							value={step1Data.industry}
							onChange={e => handleInputChange('industry', e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						>
							<option value=''>Select your industry</option>
							{industryOptions.map(industry => (
								<option key={industry} value={industry}>
									{industry}
								</option>
							))}
						</select>
					</div>

					{/* Company Size */}
					<div>
						<label
							htmlFor='size'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Company Size
						</label>
						<select
							id='size'
							value={step1Data.size}
							onChange={e => handleInputChange('size', e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						>
							<option value=''>Select company size</option>
							{sizeOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{/* Error Message */}
					{error && (
						<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
							{error}
						</div>
					)}

					{/* Next Button */}
					<div className='flex justify-end pt-6'>
						<button
							onClick={handleNext}
							disabled={loading || uploading}
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

export default Step1CompanyInfo;
