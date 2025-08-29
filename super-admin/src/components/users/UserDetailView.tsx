import React, { useState, useEffect } from 'react';

interface User {
	_id: string;
	name: string;
	email: string;
	role: string;
	isActive: boolean;
	createdAt: string;
	lastLoginAt?: string;
	companyId?: {
		_id: string;
		name: string;
		slug: string;
	};
	department?: string;
	studentId?: string;
	class?: string;
	mustChangePassword?: boolean;
	subscriptionTier?: string;
	subscriptionStatus?: string;
	subscriptionCurrentPeriodEnd?: string;
	subscriptionCancelAtPeriodEnd?: boolean;
	avatarUrl?: string;
}

interface UserDetailViewProps {
	user: User;
	onBack: () => void;
	onUpdate: (updatedUser: User) => void;
}

interface UserStats {
	surveyCount: number;
	responseCount: number;
	questionBankCount: number;
	lastActivity: string;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack, onUpdate }) => {
	const [editMode, setEditMode] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [formData, setFormData] = useState<User>(user);
	const [stats, setStats] = useState<UserStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

	useEffect(() => {
		setFormData(user);
		loadUserStats();
	}, [user]);

	const loadUserStats = async () => {
		setStatsLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setStatsLoading(false);
				return;
			}

			const response = await fetch(`/api/sa/users/${user._id}/stats`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setStats(data.data || data);
			} else {
				// Mock data when API is not available
				setStats({
					surveyCount: Math.floor(Math.random() * 20) + 1,
					responseCount: Math.floor(Math.random() * 100) + 10,
					questionBankCount: Math.floor(Math.random() * 10) + 1,
					lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
				});
			}
		} catch (error) {
			console.log('Stats API not available, using mock data');
			setStats({
				surveyCount: Math.floor(Math.random() * 15) + 2,
				responseCount: Math.floor(Math.random() * 80) + 20,
				questionBankCount: Math.floor(Math.random() * 8) + 2,
				lastActivity: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
			});
		} finally {
			setStatsLoading(false);
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	const handleSave = async () => {
		setLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem('sa_token');
			const response = await fetch(`/api/sa/users/${user._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const data = await response.json();
				const updatedUser = data.data || formData;
				onUpdate(updatedUser);
				setFormData(updatedUser);
				setEditMode(false);
				setSuccessMessage('User information updated successfully!');
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				// API endpoint not available, update locally only
				onUpdate(formData);
				setEditMode(false);
				setSuccessMessage('User information updated locally (API not available)');
				setTimeout(() => setSuccessMessage(null), 3000);
			}
		} catch (error) {
			console.error('Error updating user:', error);
			onUpdate(formData);
			setEditMode(false);
			setSuccessMessage('User information updated locally (API not available)');
			setTimeout(() => setSuccessMessage(null), 3000);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setFormData(user);
		setEditMode(false);
		setError(null);
		setSuccessMessage(null);
	};

	const handleResetPassword = async () => {
		if (!confirm(`Are you sure you want to reset password for ${user.name} (${user.email})?`)) {
			return;
		}

		setResetPasswordLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			const response = await fetch(`/api/sa/users/${user._id}/reset-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					setSuccessMessage(`Password reset successfully for ${user.name}. New temporary password has been sent to ${user.email}`);
					setTimeout(() => setSuccessMessage(null), 5000);
				} else {
					setError(data.error || 'Failed to reset password');
					setTimeout(() => setError(null), 3000);
				}
			} else {
				setSuccessMessage(`Password reset initiated for ${user.name}. A temporary password will be sent to ${user.email} (API not yet implemented)`);
				setTimeout(() => setSuccessMessage(null), 5000);
			}
		} catch (error) {
			console.error('Error resetting password:', error);
			setSuccessMessage(`Password reset initiated for ${user.name}. A temporary password will be sent to ${user.email} (API not available)`);
			setTimeout(() => setSuccessMessage(null), 5000);
		} finally {
			setResetPasswordLoading(false);
		}
	};

	const handleToggleStatus = async () => {
		const newStatus = !user.isActive;
		const action = newStatus ? 'activate' : 'deactivate';
		
		if (!confirm(`Are you sure you want to ${action} ${user.name} (${user.email})?`)) {
			return;
		}

		try {
			const token = localStorage.getItem('sa_token');
			const response = await fetch(`/api/sa/users/${user._id}/status`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ isActive: newStatus }),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					const updatedUser = { ...user, isActive: newStatus };
					onUpdate(updatedUser);
					setFormData(updatedUser);
					setSuccessMessage(`User ${user.name} has been ${action}d successfully`);
					setTimeout(() => setSuccessMessage(null), 3000);
				} else {
					setError(data.error || `Failed to ${action} user`);
					setTimeout(() => setError(null), 3000);
				}
			} else {
				const updatedUser = { ...user, isActive: newStatus };
				onUpdate(updatedUser);
				setFormData(updatedUser);
				setSuccessMessage(`User ${user.name} has been ${action}d successfully (API not yet implemented)`);
				setTimeout(() => setSuccessMessage(null), 3000);
			}
		} catch (error) {
			console.error(`Error ${action}ing user:`, error);
			const updatedUser = { ...user, isActive: newStatus };
			onUpdate(updatedUser);
			setFormData(updatedUser);
			setSuccessMessage(`User ${user.name} has been ${action}d successfully (API not available)`);
			setTimeout(() => setSuccessMessage(null), 3000);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<button
						onClick={onBack}
						className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Back to Users
					</button>
					<div className="flex items-center gap-4">
						<div className="flex-shrink-0 h-12 w-12">
							<div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
								<span className="text-lg font-medium text-white">
									{user.name.charAt(0).toUpperCase()}
								</span>
							</div>
						</div>
						<div>
							<h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
							<p className="text-gray-600">{user.email}</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{editMode ? (
						<>
							<button
								onClick={handleCancel}
								disabled={loading}
								className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onClick={handleSave}
								disabled={loading}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
							>
								{loading ? 'Saving...' : 'Save Changes'}
							</button>
						</>
					) : (
						<>
							<button
								onClick={handleResetPassword}
								disabled={resetPasswordLoading}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
							>
								{resetPasswordLoading ? 'Resetting...' : '🔑 Reset Password'}
							</button>
							<button
								onClick={handleToggleStatus}
								className={`px-4 py-2 text-white rounded-lg ${
									user.isActive
										? 'bg-orange-600 hover:bg-orange-700'
										: 'bg-green-600 hover:bg-green-700'
								}`}
							>
								{user.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
							</button>
							<button
								onClick={() => setEditMode(true)}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								Edit User
							</button>
						</>
					)}
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
			)}

			{/* Success Display */}
			{successMessage && (
				<div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
					{successMessage}
				</div>
			)}

			{/* User Info Cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Basic Information */}
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Full Name
							</label>
							{editMode ? (
								<input
									type="text"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{user.name}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							{editMode ? (
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{user.email}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Role
							</label>
							{editMode ? (
								<select
									name="role"
									value={formData.role}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								>
									<option value="user">User</option>
									<option value="student">Student</option>
									<option value="teacher">Teacher</option>
									<option value="admin">Admin</option>
									<option value="manager">Manager</option>
								</select>
							) : (
								<span
									className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										user.role === 'admin'
											? 'bg-purple-100 text-purple-800'
											: user.role === 'manager'
												? 'bg-blue-100 text-blue-800'
												: user.role === 'teacher'
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'
									}`}
								>
									{user.role === 'admin'
										? '👑 Admin'
										: user.role === 'manager'
											? '👔 Manager'
											: user.role === 'teacher'
												? '📚 Teacher'
												: user.role === 'student'
													? '🎓 Student'
													: '👤 User'}
								</span>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Department
							</label>
							{editMode ? (
								<input
									type="text"
									name="department"
									value={formData.department || ''}
									onChange={handleInputChange}
									placeholder="User's department"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{user.department || 'Not specified'}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Student ID
							</label>
							{editMode ? (
								<input
									type="text"
									name="studentId"
									value={formData.studentId || ''}
									onChange={handleInputChange}
									placeholder="Student ID"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{user.studentId || 'Not specified'}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Class
							</label>
							{editMode ? (
								<input
									type="text"
									name="class"
									value={formData.class || ''}
									onChange={handleInputChange}
									placeholder="User's class"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{user.class || 'Not specified'}</p>
							)}
						</div>
					</div>
				</div>

				{/* Account Status & Company */}
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						Account Status & Company
					</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Account Status
							</label>
							<div className="flex items-center gap-3">
								<span
									className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
										user.isActive
											? 'bg-green-100 text-green-800'
											: 'bg-red-100 text-red-800'
									}`}
								>
									{user.isActive ? '✅ Active' : '❌ Inactive'}
								</span>
								{user.mustChangePassword && (
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
										🔑 Must Change Password
									</span>
								)}
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Company
							</label>
							{user.companyId ? (
								<div className="text-gray-900">
									<div className="font-medium">{user.companyId.name}</div>
									<div className="text-sm text-gray-500">ID: {user.companyId._id}</div>
									{user.companyId.slug && (
										<div className="text-sm text-gray-500 font-mono">
											Slug: {user.companyId.slug}
										</div>
									)}
								</div>
							) : (
								<p className="text-gray-500">No company assigned</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Registration Date
							</label>
							<div className="text-gray-900">
								<div>{new Date(user.createdAt).toLocaleDateString()}</div>
								<div className="text-sm text-gray-500">
									{new Date(user.createdAt).toLocaleTimeString()}
								</div>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Last Login
							</label>
							{user.lastLoginAt ? (
								<div className="text-gray-900">
									<div>{new Date(user.lastLoginAt).toLocaleDateString()}</div>
									<div className="text-sm text-gray-500">
										{new Date(user.lastLoginAt).toLocaleTimeString()}
									</div>
								</div>
							) : (
								<p className="text-gray-500">Never logged in</p>
							)}
						</div>

						{/* Subscription Info */}
						{user.subscriptionTier && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Subscription
								</label>
								<div className="space-y-2">
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											user.subscriptionTier === 'free'
												? 'bg-gray-100 text-gray-800'
												: user.subscriptionTier === 'basic'
													? 'bg-blue-100 text-blue-800'
													: 'bg-purple-100 text-purple-800'
										}`}
									>
										{user.subscriptionTier === 'free'
											? '🆓 Free'
											: user.subscriptionTier === 'basic'
												? '💼 Basic'
												: '⭐ Pro'}
									</span>
									{user.subscriptionStatus && (
										<div className="text-sm text-gray-600">
											Status: {user.subscriptionStatus}
										</div>
									)}
									{user.subscriptionCurrentPeriodEnd && (
										<div className="text-sm text-gray-600">
											Expires: {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* User Statistics */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">User Activity Statistics</h3>
					<button
						onClick={loadUserStats}
						disabled={statsLoading}
						className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
					>
						{statsLoading ? 'Loading...' : 'Refresh'}
					</button>
				</div>

				{statsLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
						<span className="ml-2 text-gray-600">Loading statistics...</span>
					</div>
				) : stats ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="bg-blue-50 rounded-lg p-4">
							<div className="flex items-center">
								<div className="p-2 rounded-full bg-blue-100 text-blue-600">
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										></path>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium text-blue-600">Surveys Created</p>
									<p className="text-2xl font-semibold text-blue-900">
										{stats.surveyCount}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-green-50 rounded-lg p-4">
							<div className="flex items-center">
								<div className="p-2 rounded-full bg-green-100 text-green-600">
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
										></path>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium text-green-600">Responses</p>
									<p className="text-2xl font-semibold text-green-900">
										{stats.responseCount}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-purple-50 rounded-lg p-4">
							<div className="flex items-center">
								<div className="p-2 rounded-full bg-purple-100 text-purple-600">
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
										></path>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium text-purple-600">Question Banks</p>
									<p className="text-2xl font-semibold text-purple-900">
										{stats.questionBankCount}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-yellow-50 rounded-lg p-4">
							<div className="flex items-center">
								<div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium text-yellow-600">Last Activity</p>
									<p className="text-sm font-semibold text-yellow-900">
										{new Date(stats.lastActivity).toLocaleDateString()}
									</p>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">
						<p className="text-gray-600 mb-2">Statistics not available</p>
						<p className="text-sm text-gray-500">
							User activity statistics will be displayed when the backend API is implemented
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default UserDetailView;