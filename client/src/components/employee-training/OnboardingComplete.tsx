import React from 'react';
import { OnboardingTemplate } from './OnboardingContext';

interface OnboardingCompleteProps {
	template: OnboardingTemplate;
	onRestart: () => void;
}

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({ template, onRestart }) => {
	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-4xl mx-auto px-4 py-16'>
				<div className='text-center'>
					{/* Success Icon */}
					<div className='mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8'>
						<svg
							className='w-12 h-12 text-green-600'
							fill='currentColor'
							viewBox='0 0 20 20'
						>
							<path
								fillRule='evenodd'
								d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
								clipRule='evenodd'
							/>
						</svg>
					</div>

					{/* Congratulations Message */}
					<h1 className='text-4xl font-bold text-gray-900 mb-4'>🎉 Congratulations!</h1>
					<p className='text-xl text-gray-600 mb-8'>
						You have successfully completed the "{template.title}" training!
					</p>

					{/* Training Summary */}
					<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8'>
						<h2 className='text-2xl font-semibold text-gray-900 mb-6'>
							Training Summary
						</h2>

						<div className='grid md:grid-cols-2 gap-6'>
							{/* Basic Info */}
							<div className='space-y-4'>
								<div>
									<h3 className='text-lg font-medium text-gray-900 mb-2'>
										Training Details
									</h3>
									<div className='space-y-2 text-sm text-gray-600'>
										<div>
											<strong>Title:</strong> {template.title}
										</div>
										{template.description && (
											<div>
												<strong>Description:</strong> {template.description}
											</div>
										)}
										<div>
											<strong>Total Sections:</strong>{' '}
											{template.onboardingSettings.sections.length}
										</div>
										<div>
											<strong>Total Questions:</strong>{' '}
											{template.questions.length}
										</div>
									</div>
								</div>

								{/* Learning Path */}
								<div>
									<h3 className='text-lg font-medium text-gray-900 mb-2'>
										Learning Path
									</h3>
									<div className='space-y-2 text-sm text-gray-600'>
										<div>
											<strong>Type:</strong>{' '}
											{template.onboardingSettings.learningPath.type}
										</div>
										<div>
											<strong>Allow Skipping:</strong>{' '}
											{template.onboardingSettings.learningPath.allowSkipping
												? 'Yes'
												: 'No'}
										</div>
										<div>
											<strong>Require Completion:</strong>{' '}
											{template.onboardingSettings.learningPath
												.requireCompletion
												? 'Yes'
												: 'No'}
										</div>
									</div>
								</div>
							</div>

							{/* Compliance & Sections */}
							<div className='space-y-4'>
								{/* Compliance */}
								<div>
									<h3 className='text-lg font-medium text-gray-900 mb-2'>
										Compliance Requirements
									</h3>
									<div className='space-y-2 text-sm text-gray-600'>
										<div>
											<strong>Required:</strong>{' '}
											{template.onboardingSettings.compliance.required
												? 'Yes'
												: 'No'}
										</div>
										<div>
											<strong>Minimum Score:</strong>{' '}
											{template.onboardingSettings.compliance.minimumScore}%
										</div>
										<div>
											<strong>Certificate Required:</strong>{' '}
											{template.onboardingSettings.compliance
												.certificateRequired
												? 'Yes'
												: 'No'}
										</div>
									</div>
								</div>

								{/* Sections */}
								<div>
									<h3 className='text-lg font-medium text-gray-900 mb-2'>
										Training Sections
									</h3>
									<div className='space-y-2'>
										{template.onboardingSettings.sections.map(
											(section, index) => (
												<div
													key={section.id}
													className='flex items-center space-x-2'
												>
													<div className='w-6 h-6 bg-green-100 rounded-full flex items-center justify-center'>
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
													</div>
													<span className='text-sm text-gray-700'>
														{section.title}
													</span>
												</div>
											)
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Instructions */}
					{template.instructions && (
						<div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
							<h3 className='text-lg font-medium text-blue-800 mb-3'>
								📋 Training Instructions
							</h3>
							<p className='text-blue-700'>{template.instructions}</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<button
							onClick={onRestart}
							className='px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200'
						>
							🔄 Restart Training
						</button>

						<button
							onClick={() => window.close()}
							className='px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200'
						>
							🚪 Close Training
						</button>
					</div>

					{/* Footer */}
					<div className='mt-12 text-center text-sm text-gray-500'>
						<p>Training completed successfully. Your progress has been saved.</p>
						<p className='mt-1'>
							If you have any questions, please contact your training administrator.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default OnboardingComplete;
