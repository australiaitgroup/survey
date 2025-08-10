import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import ImageUpload from '../common/ImageUpload';
import BillingView from '../billing/BillingView';

const ProfileView: React.FC = () => {
	const { t } = useTranslation();
	const {
		profileData,
		profileForm,
		setProfileForm,
		passwordForm,
		setPasswordForm,
		companyForm,
		setCompanyForm,
		loadProfile,
		updateProfile,
		updatePassword,
		updateCompany,
		loading,
		error,
		setError,
	} = useAdmin();

	const [activeTab, setActiveTab] = useState<'personal' | 'company' | 'billing'>('personal');

	useEffect(() => {
		loadProfile();
	}, []);

	const handleProfileSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateProfile();
	};

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updatePassword();
	};

	const handleCompanySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateCompany();
	};

	const handleAvatarUpload = (imageUrl: string) => {
		setProfileForm({
			...profileForm,
			avatarUrl: imageUrl,
		});
	};

	const handleAvatarRemove = () => {
		setProfileForm({
			...profileForm,
			avatarUrl: '',
		});
	};

	const handleLogoUpload = (imageUrl: string) => {
		setCompanyForm({
			...companyForm,
			logoUrl: imageUrl,
		});
	};

	const handleLogoRemove = () => {
		setCompanyForm({
			...companyForm,
			logoUrl: '',
		});
	};

	if (loading && !profileData) {
		return (
			<div className='flex justify-center items-center py-12'>
				<div className='text-lg text-gray-600'>Loading profile...</div>
			</div>
		);
	}

	return (
		<div className='max-w-4xl mx-auto'>
			<div className='bg-white rounded-lg shadow-sm border border-gray-200'>
				{/* Header */}
				<div className='px-6 py-4 border-b border-gray-200'>
					<h2 className='text-2xl font-bold text-gray-900'>{t('profile.settings')}</h2>
					<p className='text-gray-600 mt-1'>{t('profile.manageInfo')}</p>
				</div>

				{/* Error Message */}
				{error && (
					<div className='mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md'>
						<div className='text-red-700'>{error}</div>
						<button
							onClick={() => setError('')}
							className='mt-2 text-red-600 hover:text-red-800 text-sm underline'
						>
							{t('profile.dismiss')}
						</button>
					</div>
				)}

				{/* Tab Navigation */}
				<div className='px-6 py-4 border-b border-gray-200'>
					<div className='flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto'>
						<button
							onClick={() => setActiveTab('personal')}
							className={`flex-1 min-w-[80px] rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
								activeTab === 'personal'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							{t('profile.personalInfo')}
						</button>
						<button
							onClick={() => setActiveTab('company')}
							className={`flex-1 min-w-[80px] rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
								activeTab === 'company'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							{t('profile.companyInfo')}
						</button>
						<button
							onClick={() => setActiveTab('billing')}
							className={`flex-1 min-w-[80px] rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
								activeTab === 'billing'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							{t('navigation.billing')}
						</button>
					</div>
				</div>

				{/* Personal Information Tab */}
				{activeTab === 'personal' && (
					<div className='p-6'>
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
							{/* Profile Form */}
							<div>
								<h3 className='text-lg font-semibold text-gray-900 mb-4'>
									Profile Details
								</h3>
								<form onSubmit={handleProfileSubmit} className='space-y-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Name
										</label>
										<input
											type='text'
											value={profileForm.name}
											onChange={e =>
												setProfileForm({
													...profileForm,
													name: e.target.value,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											required
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											{t('common.email')}
										</label>
										<input
											type='email'
											value={profileForm.email}
											onChange={e =>
												setProfileForm({
													...profileForm,
													email: e.target.value,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											required
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Avatar
										</label>
										<ImageUpload
											imageUrl={profileForm.avatarUrl}
											onImageUpload={handleAvatarUpload}
											onImageRemove={handleAvatarRemove}
											placeholder='Upload your profile avatar'
											uploadMethod='cloudinary'
											className='max-w-sm'
										/>
										<p className='text-xs text-gray-500 mt-1'>
											Upload an avatar image. Supported formats: JPG, PNG,
											GIF, WebP
										</p>
									</div>

									<button
										type='submit'
										disabled={loading}
										className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
									>
										{loading
											? t('profile.updating')
											: t('profile.updatePersonalInfo')}
									</button>
								</form>
							</div>

							{/* Password Form */}
							<div>
								<h3 className='text-lg font-semibold text-gray-900 mb-4'>
									Change Password
								</h3>
								<form onSubmit={handlePasswordSubmit} className='space-y-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Current Password
										</label>
										<input
											type='password'
											value={passwordForm.currentPassword}
											onChange={e =>
												setPasswordForm({
													...passwordForm,
													currentPassword: e.target.value,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											required
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											New Password
										</label>
										<input
											type='password'
											value={passwordForm.newPassword}
											onChange={e =>
												setPasswordForm({
													...passwordForm,
													newPassword: e.target.value,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											minLength={6}
											required
										/>
										<p className='text-xs text-gray-500 mt-1'>
											Password must be at least 6 characters long
										</p>
									</div>

									<button
										type='submit'
										disabled={loading}
										className='w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
									>
										{loading
											? t('profile.updating')
											: t('profile.updatePassword')}
									</button>
								</form>
							</div>
						</div>
					</div>
				)}

				{/* Billing Tab */}
				{activeTab === 'billing' && (
					<div className='p-6'>
						<BillingView />
					</div>
				)}

				{/* Company Information Tab */}
				{activeTab === 'company' && (
					<div className='p-6'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>
							Company Details
						</h3>
						<form onSubmit={handleCompanySubmit} className='space-y-4 max-w-2xl'>
							{(profileData?.company as any)?.slug && (
								<div className='flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg'>
									<div className='text-sm text-gray-600'>Company URL slug</div>
									<div className='text-sm font-mono text-gray-800'>
										{(profileData!.company as any).slug}
									</div>
								</div>
							)}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										{t('profile.companyName')} *
									</label>
									<input
										type='text'
										value={companyForm.name}
										onChange={e =>
											setCompanyForm({ ...companyForm, name: e.target.value })
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										required
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										{t('profile.industry')}
									</label>
									<input
										type='text'
										value={companyForm.industry || ''}
										onChange={e =>
											setCompanyForm({
												...companyForm,
												industry: e.target.value,
											})
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='e.g., Technology, Education, Healthcare'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Company Size
									</label>
									<select
										value={companyForm.size || ''}
										onChange={e =>
											setCompanyForm({ ...companyForm, size: e.target.value })
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
									>
										<option value=''>Select company size</option>
										<option value='1-10'>1-10 employees</option>
										<option value='11-50'>11-50 employees</option>
										<option value='51-200'>51-200 employees</option>
										<option value='201-500'>201-500 employees</option>
										<option value='500+'>500+ employees</option>
									</select>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Founded Year
									</label>
									<input
										type='number'
										value={companyForm.foundedYear || ''}
										onChange={e =>
											setCompanyForm({
												...companyForm,
												foundedYear: e.target.value
													? parseInt(e.target.value)
													: undefined,
											})
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										min='1800'
										max={new Date().getFullYear()}
										placeholder='e.g., 2020'
									/>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Company Logo
								</label>
								<ImageUpload
									imageUrl={companyForm.logoUrl}
									onImageUpload={handleLogoUpload}
									onImageRemove={handleLogoRemove}
									placeholder='Upload your company logo'
									uploadMethod='cloudinary'
									className='max-w-sm'
								/>
								<p className='text-xs text-gray-500 mt-1'>
									Upload a company logo. Supported formats: JPG, PNG, GIF, WebP
								</p>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('profile.website')}
								</label>
								<input
									type='url'
									value={companyForm.website || ''}
									onChange={e =>
										setCompanyForm({ ...companyForm, website: e.target.value })
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
									placeholder='https://www.example.com'
								/>
							</div>

							{/* Contact Information Section */}
							<div className='border-t border-gray-200 pt-4 mt-6'>
								<h4 className='text-md font-semibold text-gray-900 mb-4'>
									Contact Information
								</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Contact Email
										</label>
										<input
											type='email'
											value={companyForm.contactEmail || ''}
											onChange={e =>
												setCompanyForm({
													...companyForm,
													contactEmail: e.target.value,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											placeholder='contact@company.com'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Contact Phone
										</label>
										<input
											type='tel'
											value={companyForm.contactPhone || ''}
											onChange={e =>
												setCompanyForm({
													...companyForm,
													contactPhone: e.target.value,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											placeholder='+61 451010217'
										/>
									</div>
								</div>
							</div>

							{/* Address Section */}
							<div className='border-t border-gray-200 pt-4 mt-6'>
								<h4 className='text-md font-semibold text-gray-900 mb-4'>
									Address
								</h4>
								<div className='space-y-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Street Address
										</label>
										<input
											type='text'
											value={companyForm.address?.street || ''}
											onChange={e =>
												setCompanyForm({
													...companyForm,
													address: {
														...companyForm.address,
														street: e.target.value,
													},
												})
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											placeholder='123 Main Street'
										/>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												City
											</label>
											<input
												type='text'
												value={companyForm.address?.city || ''}
												onChange={e =>
													setCompanyForm({
														...companyForm,
														address: {
															...companyForm.address,
															city: e.target.value,
														},
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='New York'
											/>
										</div>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												State/Province
											</label>
											<input
												type='text'
												value={companyForm.address?.state || ''}
												onChange={e =>
													setCompanyForm({
														...companyForm,
														address: {
															...companyForm.address,
															state: e.target.value,
														},
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='NY'
											/>
										</div>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Country
											</label>
											<input
												type='text'
												value={companyForm.address?.country || ''}
												onChange={e =>
													setCompanyForm({
														...companyForm,
														address: {
															...companyForm.address,
															country: e.target.value,
														},
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='United States'
											/>
										</div>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Postal Code
											</label>
											<input
												type='text'
												value={companyForm.address?.postalCode || ''}
												onChange={e =>
													setCompanyForm({
														...companyForm,
														address: {
															...companyForm.address,
															postalCode: e.target.value,
														},
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												placeholder='10001'
											/>
										</div>
									</div>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Description
								</label>
								<textarea
									value={companyForm.description || ''}
									onChange={e =>
										setCompanyForm({
											...companyForm,
											description: e.target.value,
										})
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none'
									placeholder='Brief description of your company...'
								/>
							</div>

							{/* Preferences Section */}
							<div className='border-t border-gray-200 pt-4 mt-6'>
								<h4 className='text-md font-semibold text-gray-900 mb-4'>
									Survey Preferences
								</h4>
								<div className='space-y-4'>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Theme Color
											</label>
											<div className='flex items-center space-x-2'>
												<input
													type='color'
													value={companyForm.themeColor || '#3B82F6'}
													onChange={e =>
														setCompanyForm({
															...companyForm,
															themeColor: e.target.value,
														})
													}
													className='w-12 h-10 border border-gray-300 rounded-md'
												/>
												<input
													type='text'
													value={companyForm.themeColor || '#3B82F6'}
													onChange={e =>
														setCompanyForm({
															...companyForm,
															themeColor: e.target.value,
														})
													}
													className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
													placeholder='#3B82F6'
												/>
											</div>
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-1'>
												Default Language
											</label>
											<select
												value={companyForm.defaultLanguage || 'en'}
												onChange={e =>
													setCompanyForm({
														...companyForm,
														defaultLanguage: e.target.value,
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											>
												<option value='en'>English</option>
												<option value='zh'>中文</option>
												<option value='es'>Español</option>
												<option value='fr'>Français</option>
												<option value='de'>Deutsch</option>
											</select>
										</div>
									</div>

									<div className='space-y-3'>
										<div className='flex items-center'>
											<input
												type='checkbox'
												id='customLogoEnabled'
												checked={companyForm.customLogoEnabled || false}
												onChange={e =>
													setCompanyForm({
														...companyForm,
														customLogoEnabled: e.target.checked,
													})
												}
												className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
											/>
											<label
												htmlFor='customLogoEnabled'
												className='ml-2 block text-sm text-gray-700'
											>
												Enable custom logo in surveys
											</label>
										</div>

										<div className='flex items-center'>
											<input
												type='checkbox'
												id='autoNotifyCandidate'
												checked={companyForm.autoNotifyCandidate !== false}
												onChange={e =>
													setCompanyForm({
														...companyForm,
														autoNotifyCandidate: e.target.checked,
													})
												}
												className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
											/>
											<label
												htmlFor='autoNotifyCandidate'
												className='ml-2 block text-sm text-gray-700'
											>
												Automatically notify survey participants
											</label>
										</div>
									</div>
								</div>
							</div>

							<button
								type='submit'
								disabled={loading}
								className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
							>
								{loading ? t('profile.updating') : t('profile.updateCompanyInfo')}
							</button>
						</form>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProfileView;
