import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const ProfileView: React.FC = () => {
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

	const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal');

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

	const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// For demo purposes, we'll use a data URL
			// In a real application, you'd upload to a file service
			const reader = new FileReader();
			reader.onload = (event) => {
				if (event.target?.result) {
					setProfileForm({
						...profileForm,
						avatarUrl: event.target.result as string,
					});
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// For demo purposes, we'll use a data URL
			// In a real application, you'd upload to a file service
			const reader = new FileReader();
			reader.onload = (event) => {
				if (event.target?.result) {
					setCompanyForm({
						...companyForm,
						logoUrl: event.target.result as string,
					});
				}
			};
			reader.readAsDataURL(file);
		}
	};

	if (loading && !profileData) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="text-lg text-gray-600">Loading profile...</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
					<p className="text-gray-600 mt-1">Manage your personal information and company details</p>
				</div>

				{/* Error Message */}
				{error && (
					<div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
						<div className="text-red-700">{error}</div>
						<button
							onClick={() => setError('')}
							className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Tab Navigation */}
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
						<button
							onClick={() => setActiveTab('personal')}
							className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
								activeTab === 'personal'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Personal Information
						</button>
						<button
							onClick={() => setActiveTab('company')}
							className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
								activeTab === 'company'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Company Information
						</button>
					</div>
				</div>

				{/* Personal Information Tab */}
				{activeTab === 'personal' && (
					<div className="p-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							{/* Profile Form */}
							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Details</h3>
								<form onSubmit={handleProfileSubmit} className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Name
										</label>
										<input
											type="text"
											value={profileForm.name}
											onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Email
										</label>
										<input
											type="email"
											value={profileForm.email}
											onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Avatar
										</label>
										<div className="flex items-center space-x-4">
											{profileForm.avatarUrl && (
												<img
													src={profileForm.avatarUrl}
													alt="Avatar preview"
													className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
												/>
											)}
											<input
												type="file"
												accept="image/*"
												onChange={handleAvatarUpload}
												className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
											/>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											Upload an image (max 2MB). Supported formats: JPG, PNG, GIF
										</p>
									</div>

									<button
										type="submit"
										disabled={loading}
										className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{loading ? 'Updating...' : 'Update Profile'}
									</button>
								</form>
							</div>

							{/* Password Form */}
							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
								<form onSubmit={handlePasswordSubmit} className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Current Password
										</label>
										<input
											type="password"
											value={passwordForm.currentPassword}
											onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											New Password
										</label>
										<input
											type="password"
											value={passwordForm.newPassword}
											onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											minLength={6}
											required
										/>
										<p className="text-xs text-gray-500 mt-1">
											Password must be at least 6 characters long
										</p>
									</div>

									<button
										type="submit"
										disabled={loading}
										className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{loading ? 'Updating...' : 'Change Password'}
									</button>
								</form>
							</div>
						</div>
					</div>
				)}

				{/* Company Information Tab */}
				{activeTab === 'company' && (
					<div className="p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
						<form onSubmit={handleCompanySubmit} className="space-y-4 max-w-2xl">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Company Name *
									</label>
									<input
										type="text"
										value={companyForm.name}
										onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Industry
									</label>
									<input
										type="text"
										value={companyForm.industry}
										onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="e.g., Technology, Education, Healthcare"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Company Logo
								</label>
								<div className="flex items-center space-x-4">
									{companyForm.logoUrl && (
										<img
											src={companyForm.logoUrl}
											alt="Company logo preview"
											className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
										/>
									)}
									<input
										type="file"
										accept="image/*"
										onChange={handleLogoUpload}
										className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
									/>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									Upload a company logo (max 2MB). Supported formats: JPG, PNG, GIF
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Website
								</label>
								<input
									type="url"
									value={companyForm.website}
									onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="https://www.example.com"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Description
								</label>
								<textarea
									value={companyForm.description}
									onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
									placeholder="Brief description of your company..."
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{loading ? 'Updating...' : 'Update Company Information'}
							</button>
						</form>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProfileView;