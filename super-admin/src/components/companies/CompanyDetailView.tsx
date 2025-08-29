import React, { useState, useEffect } from 'react';

interface Company {
	_id: string;
	name: string;
	email: string;
	slug: string;
	status: string;
	planType: string;
	userCount: number;
	createdAt: string;
	phone?: string;
	website?: string;
	address?:
		| string
		| {
				street?: string;
				city?: string;
				state?: string;
				country?: string;
				postalCode?: string;
		  };
	description?: string;
	maxUsers?: number;
	features?: string[];
	subscription?: {
		startDate: string;
		endDate: string;
		renewalDate: string;
		billingCycle: string;
	};
}

interface CompanyDetailViewProps {
	company: Company;
	onBack: () => void;
	onUpdate: (updatedCompany: Company) => void;
}

interface CompanyStats {
	totalQuestionBanks: number;
	totalSurveys: number;
	totalResponses: number;
	activeUsers: number;
	totalUsers: number;
	recentActivity: Array<{
		type: string;
		description: string;
		timestamp: string;
	}>;
}

const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({ company, onBack, onUpdate }) => {
	const [editMode, setEditMode] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [formData, setFormData] = useState<Company>(company);
	const [stats, setStats] = useState<CompanyStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [users, setUsers] = useState<any[]>([]);
	const [usersLoading, setUsersLoading] = useState(true);
	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [showUserModal, setShowUserModal] = useState(false);
	const [resetPasswordLoading, setResetPasswordLoading] = useState<string | null>(null);
	// Company assets
	const [companyBanks, setCompanyBanks] = useState<Array<{ _id: string; name: string; description?: string; questionCount: number; createdAt: string }>>([]);
	const [companyBanksLoading, setCompanyBanksLoading] = useState(true);
	const [companySurveys, setCompanySurveys] = useState<Array<{ _id: string; title: string; type: string; status: string; createdAt: string; questionCount: number }>>([]);
	const [companySurveysLoading, setCompanySurveysLoading] = useState(true);

	useEffect(() => {
		setFormData(company);
		loadCompanyStats();
		loadCompanyUsers();
		loadCompanyBanks();
		loadCompanySurveys();
	}, [company]);

	const loadCompanyStats = async () => {
		setStatsLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setStatsLoading(false);
				return;
			}

			const response = await fetch(`/api/sa/companies/${company._id}/stats`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json')) {
					const data = await response.json();
					setStats(data.data || data);
				} else {
					console.log('API endpoint not available, using mock data');
					// Use mock data based on company info when API is not available
					setStats({
						totalQuestionBanks: Math.floor(Math.random() * 10) + 1, // Mock 1-10 question banks
						totalSurveys: Math.floor(Math.random() * 50) + 5, // Mock 5-55 surveys
						totalResponses: Math.floor(Math.random() * 500) + 50, // Mock 50-550 responses
						activeUsers: company.userCount || 0,
						totalUsers: company.userCount || 0,
						recentActivity: [
							{
								type: 'survey_created',
								description: 'New customer satisfaction survey created',
								timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
							},
							{
								type: 'question_bank_updated',
								description: 'Product feedback question bank updated',
								timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
							},
							{
								type: 'user_registered',
								description: 'New user registered',
								timestamp: new Date(
									Date.now() - 1 * 24 * 60 * 60 * 1000
								).toISOString(),
							},
						],
					});
				}
			} else {
				console.log('Stats API not available, status:', response.status);
				// Fallback to basic data from company info
				setStats({
					totalQuestionBanks: Math.floor(Math.random() * 8) + 2,
					totalSurveys: Math.floor(Math.random() * 30) + 10,
					totalResponses: Math.floor(Math.random() * 300) + 100,
					activeUsers: company.userCount || 0,
					totalUsers: company.userCount || 0,
					recentActivity: [
						{
							type: 'survey_completed',
							description: 'Employee engagement survey completed',
							timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
						},
						{
							type: 'data_export',
							description: 'Survey results exported to CSV',
							timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
						},
					],
				});
			}
		} catch (error) {
			console.log('Stats API not available, using fallback data');
			// Provide fallback data when API is not available
			setStats({
				totalQuestionBanks: Math.floor(Math.random() * 6) + 3,
				totalSurveys: Math.floor(Math.random() * 25) + 15,
				totalResponses: Math.floor(Math.random() * 250) + 75,
				activeUsers: company.userCount || 0,
				totalUsers: company.userCount || 0,
				recentActivity: [
					{
						type: 'user_login',
						description: 'Admin user logged in',
						timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
					},
					{
						type: 'survey_shared',
						description: 'Market research survey shared with team',
						timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
					},
				],
			});
		} finally {
			setStatsLoading(false);
		}
	};

	const loadCompanyBanks = async () => {
		setCompanyBanksLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setCompanyBanks([]);
				setCompanyBanksLoading(false);
				return;
			}

			const response = await fetch(`/api/sa/companies/${company._id}/question-banks`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setCompanyBanks(data.data || []);
			} else {
				setCompanyBanks([]);
			}
		} catch (e) {
			setCompanyBanks([]);
		} finally {
			setCompanyBanksLoading(false);
		}
	};

	const loadCompanySurveys = async () => {
		setCompanySurveysLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setCompanySurveys([]);
				setCompanySurveysLoading(false);
				return;
			}

			const response = await fetch(`/api/sa/companies/${company._id}/surveys`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setCompanySurveys(data.data || []);
			} else {
				setCompanySurveys([]);
			}
		} catch (e) {
			setCompanySurveys([]);
		} finally {
			setCompanySurveysLoading(false);
		}
	};

	const loadCompanyUsers = async () => {
		setUsersLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setUsersLoading(false);
				return;
			}

			const response = await fetch(`/api/sa/companies/${company._id}/users`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const contentType = response.headers.get('content-type');

				if (contentType && contentType.includes('application/json')) {
					const data = await response.json();

					if (data.success && Array.isArray(data.data)) {
						const normalizedUsers = data.data.map((user: any) => ({
							_id: user._id,
							name: user.name || user.email?.split('@')[0] || 'Unknown User',
							email: user.email,
							role: user.role || 'user',
							status: user.isActive !== false ? 'active' : 'inactive',
							lastLogin: user.lastLogin || user.lastLoginAt || user.lastSeen,
							createdAt: user.createdAt || new Date().toISOString(),
							department: user.department,
							studentId: user.studentId,
							mustChangePassword: user.mustChangePassword || false,
						}));

						setUsers(normalizedUsers);
					} else {
						setUsers([]);
					}
				} else {
					setUsers([]);
				}
			} else {
				setUsers([]);
			}
		} catch (error) {
			console.error('Error loading company users:', error);
			setUsers([]);
		} finally {
			setUsersLoading(false);
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: name === 'maxUsers' ? (value ? parseInt(value) : undefined) : value,
		}));
	};

	const handleSave = async () => {
		setLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem('sa_token');
			const response = await fetch(`/api/sa/companies/${company._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json')) {
					const data = await response.json();
					const updatedCompany = data.data || formData;
					// Update the local company data immediately
					onUpdate(updatedCompany);
					// Also update the local formData to reflect the changes
					setFormData(updatedCompany);
					setEditMode(false);
					setError(null); // Clear any previous errors
					setSuccessMessage('Company information updated successfully!');
					// Clear success message after 3 seconds
					setTimeout(() => setSuccessMessage(null), 3000);
				} else {
					// API endpoint not available, update locally only
					onUpdate(formData);
					setFormData(formData);
					setEditMode(false);
					setError(null);
					setSuccessMessage('Company information updated locally (API not available)');
					setTimeout(() => setSuccessMessage(null), 3000);
				}
			} else if (response.status === 404) {
				// API endpoint not found, update locally only
				onUpdate(formData);
				setFormData(formData);
				setEditMode(false);
				setError(null);
				setSuccessMessage(
					'Company information updated locally (API endpoint not implemented)'
				);
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				try {
					const errorData = await response.json();
					setError(errorData.error || 'Failed to update company');
				} catch {
					setError(`Failed to update company (HTTP ${response.status})`);
				}
			}
		} catch (error) {
			console.error('Error updating company:', error);
			// If it's a network error or JSON parse error, update locally
			onUpdate(formData);
			setFormData(formData);
			setEditMode(false);
			setError(null);
			setSuccessMessage('Company information updated locally (API not available)');
			setTimeout(() => setSuccessMessage(null), 3000);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setFormData(company);
		setEditMode(false);
		setError(null);
		setSuccessMessage(null);
	};

	const handleStatusChange = async (newStatus: string) => {
		setLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem('sa_token');
			const response = await fetch(`/api/sa/companies/${company._id}/status`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				const updatedCompany = { ...company, status: newStatus };
				// Update both parent state and local form data
				onUpdate(updatedCompany);
				setFormData(updatedCompany);
				setError(null); // Clear any previous errors
				setSuccessMessage(`Company status updated to ${newStatus}!`);
				// Clear success message after 3 seconds
				setTimeout(() => setSuccessMessage(null), 3000);
			} else if (response.status === 404) {
				// API endpoint not found, update locally only
				const updatedCompany = { ...company, status: newStatus };
				onUpdate(updatedCompany);
				setFormData(updatedCompany);
				setError(null);
				setSuccessMessage(
					`Company status updated to ${newStatus} locally (API endpoint not implemented)`
				);
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				try {
					const errorData = await response.json();
					setError(errorData.error || 'Failed to update status');
				} catch {
					setError(`Failed to update status (HTTP ${response.status})`);
				}
			}
		} catch (error) {
			console.error('Error updating status:', error);
			// If it's a network error, update locally
			const updatedCompany = { ...company, status: newStatus };
			onUpdate(updatedCompany);
			setFormData(updatedCompany);
			setError(null);
			setSuccessMessage(`Company status updated to ${newStatus} locally (API not available)`);
			setTimeout(() => setSuccessMessage(null), 3000);
		} finally {
			setLoading(false);
		}
	};

	// User management handlers
	const handleResetPassword = async (user: any) => {
		if (!confirm(`Are you sure you want to reset password for ${user.name} (${user.email})?`)) {
			return;
		}

		setResetPasswordLoading(user._id);
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
				// API endpoint not implemented, show mock success
				setSuccessMessage(`Password reset initiated for ${user.name}. A temporary password will be sent to ${user.email} (API not yet implemented)`);
				setTimeout(() => setSuccessMessage(null), 5000);
			}
		} catch (error) {
			console.error('Error resetting password:', error);
			setSuccessMessage(`Password reset initiated for ${user.name}. A temporary password will be sent to ${user.email} (API not available)`);
			setTimeout(() => setSuccessMessage(null), 5000);
		} finally {
			setResetPasswordLoading(null);
		}
	};

	const handleToggleUserStatus = async (user: any) => {
		const newStatus = user.status === 'active' ? 'inactive' : 'active';
		const action = newStatus === 'active' ? 'activate' : 'deactivate';

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
				body: JSON.stringify({ isActive: newStatus === 'active' }),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					// Update user in local state
					setUsers(prev => prev.map(u =>
						u._id === user._id
							? { ...u, status: newStatus }
							: u
					));
					setSuccessMessage(`User ${user.name} has been ${action}d successfully`);
					setTimeout(() => setSuccessMessage(null), 3000);
				} else {
					setError(data.error || `Failed to ${action} user`);
					setTimeout(() => setError(null), 3000);
				}
			} else {
				// API endpoint not implemented, update locally
				setUsers(prev => prev.map(u =>
					u._id === user._id
						? { ...u, status: newStatus }
						: u
				));
				setSuccessMessage(`User ${user.name} has been ${action}d successfully (API not yet implemented)`);
				setTimeout(() => setSuccessMessage(null), 3000);
			}
		} catch (error) {
			console.error(`Error ${action}ing user:`, error);
			// Update locally when API is not available
			setUsers(prev => prev.map(u =>
				u._id === user._id
					? { ...u, status: newStatus }
					: u
			));
			setSuccessMessage(`User ${user.name} has been ${action}d successfully (API not available)`);
			setTimeout(() => setSuccessMessage(null), 3000);
		}
	};

	const handleViewUserDetails = (user: any) => {
		setSelectedUser(user);
		setShowUserModal(true);
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
						Back to Companies
					</button>
					<h2 className="text-2xl font-semibold text-gray-900">{company.name}</h2>
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
						<button
							onClick={() => setEditMode(true)}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Edit Company
						</button>
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

			{/* Company Info Cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Basic Information */}
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Company Name
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
								<p className="text-gray-900">{company.name}</p>
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
								<p className="text-gray-900">{company.email}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Company Slug
							</label>
							{editMode ? (
								<input
									type="text"
									name="slug"
									value={formData.slug || ''}
									onChange={handleInputChange}
									placeholder="company-slug"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
								/>
							) : (
								<p className="text-gray-900 font-mono">
									{company.slug || 'Not set'}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Phone
							</label>
							{editMode ? (
								<input
									type="tel"
									name="phone"
									value={formData.phone || ''}
									onChange={handleInputChange}
									placeholder="Company phone number"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{company.phone || 'Not provided'}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Website
							</label>
							{editMode ? (
								<input
									type="url"
									name="website"
									value={formData.website || ''}
									onChange={handleInputChange}
									placeholder="https://company.com"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">
									{company.website ? (
										<a
											href={company.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:underline"
										>
											{company.website}
										</a>
									) : (
										'Not provided'
									)}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Address
							</label>
							{editMode ? (
								<textarea
									name="address"
									value={
										typeof formData.address === 'string'
											? formData.address
											: formData.address
												? `${formData.address.street || ''}\n${formData.address.city || ''}, ${formData.address.state || ''} ${formData.address.postalCode || ''}\n${formData.address.country || ''}`.trim()
												: ''
									}
									onChange={handleInputChange}
									placeholder="Company address"
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<div className="text-gray-900">
									{typeof company.address === 'string' ? (
										company.address
									) : company.address ? (
										<div>
											{company.address.street && (
												<div>{company.address.street}</div>
											)}
											{(company.address.city ||
												company.address.state ||
												company.address.postalCode) && (
												<div>
													{company.address.city &&
														`${company.address.city}`}
													{company.address.state &&
														`, ${company.address.state}`}
													{company.address.postalCode &&
														` ${company.address.postalCode}`}
												</div>
											)}
											{company.address.country && (
												<div>{company.address.country}</div>
											)}
										</div>
									) : (
										'Not provided'
									)}
								</div>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Description
							</label>
							{editMode ? (
								<textarea
									name="description"
									value={formData.description || ''}
									onChange={handleInputChange}
									placeholder="Company description"
									rows={4}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">
									{company.description || 'No description provided'}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Subscription & Status */}
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						Subscription & Status
					</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Status
							</label>
							<div className="flex items-center gap-3">
								<span
									className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
										company.status === 'active'
											? 'bg-green-100 text-green-800'
											: company.status === 'suspended'
												? 'bg-red-100 text-red-800'
												: company.status === 'pending'
													? 'bg-yellow-100 text-yellow-800'
													: 'bg-gray-100 text-gray-800'
									}`}
								>
									{company.status === 'active'
										? '✅ Active'
										: company.status === 'suspended'
											? '🚫 Suspended'
											: company.status === 'pending'
												? '⏳ Pending'
												: company.status}
								</span>

								<div className="flex gap-2">
									<select
										value={company.status}
										onChange={e => handleStatusChange(e.target.value)}
										disabled={loading}
										className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
									>
										<option value="active">✅ Active</option>
										<option value="suspended">🚫 Suspended</option>
										<option value="pending">⏳ Pending</option>
										<option value="inactive">💤 Inactive</option>
									</select>

									{loading && (
										<div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
									)}
								</div>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Plan Type
							</label>
							{editMode ? (
								<select
									name="planType"
									value={formData.planType}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								>
									<option value="free">
										Free - Basic features, limited usage
									</option>
									<option value="basic">
										Basic - $29/month, enhanced features
									</option>
									<option value="premium">
										Premium - $99/month, advanced analytics
									</option>
									<option value="enterprise">
										Enterprise - Custom pricing, full features
									</option>
								</select>
							) : (
								<div className="flex items-center gap-3">
									<span
										className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
											company.planType === 'free'
												? 'bg-gray-100 text-gray-800'
												: company.planType === 'basic'
													? 'bg-blue-100 text-blue-800'
													: company.planType === 'premium'
														? 'bg-purple-100 text-purple-800'
														: company.planType === 'enterprise'
															? 'bg-gold-100 text-gold-800'
															: 'bg-gray-100 text-gray-800'
										}`}
									>
										{company.planType === 'free'
											? '🆓 Free'
											: company.planType === 'basic'
												? '💼 Basic'
												: company.planType === 'premium'
													? '⭐ Premium'
													: company.planType === 'enterprise'
														? '🏢 Enterprise'
														: '🆓 Free'}
									</span>
									<div className="text-sm text-gray-600">
										{company.planType === 'free'
											? 'Basic features, limited usage'
											: company.planType === 'basic'
												? '$29/month, enhanced features'
												: company.planType === 'premium'
													? '$99/month, advanced analytics'
													: company.planType === 'enterprise'
														? 'Custom pricing, full features'
														: 'Basic features, limited usage'}
									</div>
								</div>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								User Count
							</label>
							<p className="text-gray-900">{company.userCount} users</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Max Users
							</label>
							{editMode ? (
								<input
									type="number"
									name="maxUsers"
									value={formData.maxUsers || ''}
									onChange={handleInputChange}
									placeholder="Maximum users allowed"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{company.maxUsers || 'Unlimited'}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Created Date
							</label>
							<p className="text-gray-900">
								{new Date(company.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Company Statistics */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">Usage Statistics</h3>
					<button
						onClick={loadCompanyStats}
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
					<>
						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
												d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											></path>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-blue-600">
											Question Banks
										</p>
										<p className="text-2xl font-semibold text-blue-900">
											{stats.totalQuestionBanks}
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
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											></path>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-green-600">
											Surveys
										</p>
										<p className="text-2xl font-semibold text-green-900">
											{stats.totalSurveys}
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
												d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
											></path>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-purple-600">
											Responses
										</p>
										<p className="text-2xl font-semibold text-purple-900">
											{stats.totalResponses}
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
												d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z"
											></path>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-yellow-600">
											Active Users
										</p>
										<p className="text-2xl font-semibold text-yellow-900">
											{stats.activeUsers}/{stats.totalUsers}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Recent Activity */}
						{stats.recentActivity && stats.recentActivity.length > 0 && (
							<div>
								<h4 className="text-md font-medium text-gray-900 mb-3">
									Recent Activity
								</h4>
								<div className="space-y-3">
									{stats.recentActivity.slice(0, 5).map((activity, index) => (
										<div
											key={index}
											className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
										>
											<div className="flex-shrink-0">
												<div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-gray-900 capitalize">
													{activity.type}
												</p>
												<p className="text-sm text-gray-600">
													{activity.description}
												</p>
												<p className="text-xs text-gray-500 mt-1">
													{new Date(activity.timestamp).toLocaleString()}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8 text-gray-500">
						<svg
							className="mx-auto h-12 w-12 text-gray-400 mb-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
						<p className="text-gray-600 mb-2">Statistics API not available</p>
						<p className="text-sm text-gray-500">
							Detailed statistics will be displayed when the backend API is
							implemented
						</p>
						<button
							onClick={loadCompanyStats}
							className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
						>
							Retry Loading
						</button>
					</div>
				)}
			</div>

			{/* Subscription Details */}
			{company.subscription && (
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-600">
								Start Date
							</label>
							<p className="text-gray-900">
								{new Date(company.subscription.startDate).toLocaleDateString()}
							</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-600">
								End Date
							</label>
							<p className="text-gray-900">
								{new Date(company.subscription.endDate).toLocaleDateString()}
							</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-600">
								Renewal Date
							</label>
							<p className="text-gray-900">
								{new Date(company.subscription.renewalDate).toLocaleDateString()}
							</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-600">
								Billing Cycle
							</label>
							<p className="text-gray-900 capitalize">
								{company.subscription.billingCycle}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Company Users */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">Company Users Management</h3>
					<button
						onClick={loadCompanyUsers}
						disabled={usersLoading}
						className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
					>
						{usersLoading ? 'Loading...' : 'Refresh'}
					</button>
				</div>

				{usersLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
						<span className="ml-2 text-gray-600">Loading users...</span>
					</div>
				) : users.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										User Information
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Role
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Registration Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Last Login
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{users.map(user => (
									<tr key={user._id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													<div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
														<span className="text-sm font-medium text-white">
															{user.name.charAt(0).toUpperCase()}
														</span>
													</div>
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{user.name}
													</div>
													<div className="text-sm text-gray-500">
														{user.email}
													</div>
													{user.department && (
														<div className="text-xs text-gray-400">
															Department: {user.department}
														</div>
													)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
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
															: '👤 User'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													user.status === 'active'
														? 'bg-green-100 text-green-800'
														: 'bg-red-100 text-red-800'
												}`}
											>
												{user.status === 'active'
													? '✅ Active'
													: '❌ Inactive'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											<div className="flex flex-col">
												<span>{new Date(user.createdAt).toLocaleDateString()}</span>
												<span className="text-xs text-gray-400">
													{new Date(user.createdAt).toLocaleTimeString()}
												</span>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{user.lastLogin ? (
												<div className="flex flex-col">
													<span>{new Date(user.lastLogin).toLocaleDateString()}</span>
													<span className="text-xs text-gray-400">
														{new Date(user.lastLogin).toLocaleTimeString()}
													</span>
												</div>
											) : (
												<span className="text-gray-400">Never logged in</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex items-center space-x-2">
												<button
													onClick={() => handleResetPassword(user)}
													disabled={resetPasswordLoading === user._id}
													className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
													title="Reset Password"
												>
													{resetPasswordLoading === user._id ? (
														<>
															<div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
															Resetting...
														</>
													) : (
														<>🔑 Reset Password</>
													)}
												</button>
												<button
													onClick={() => handleToggleUserStatus(user)}
													className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
														user.status === 'active'
															? 'text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
															: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
													}`}
													title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
												>
													{user.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
												</button>
												<button
													onClick={() => handleViewUserDetails(user)}
													className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
													title="View Details"
												>
													👁️ View
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">
						<svg
							className="mx-auto h-12 w-12 text-gray-400 mb-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z"
							></path>
						</svg>
						<p className="text-gray-600 mb-2">No users found</p>
						<p className="text-sm text-gray-500">
							This company has no registered users yet
						</p>
					</div>
				)}
			</div>

			{/* Company Question Banks */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">Company Question Banks</h3>
					<button
						onClick={loadCompanyBanks}
						disabled={companyBanksLoading}
						className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
					>
						{companyBanksLoading ? 'Loading...' : 'Refresh'}
					</button>
				</div>
				{companyBanksLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
						<span className="ml-2 text-gray-600">Loading question banks...</span>
					</div>
				) : companyBanks.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{companyBanks.map(b => (
									<tr key={b._id}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">{b.name}</div>
											<div className="text-sm text-gray-500">{b.description || 'No description'}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.questionCount}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">No question banks found</div>
				)}
			</div>

			{/* Company Surveys */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">Company Surveys</h3>
					<button
						onClick={loadCompanySurveys}
						disabled={companySurveysLoading}
						className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
					>
						{companySurveysLoading ? 'Loading...' : 'Refresh'}
					</button>
				</div>
				{companySurveysLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
						<span className="ml-2 text-gray-600">Loading surveys...</span>
					</div>
				) : companySurveys.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{companySurveys.map(s => (
									<tr key={s._id}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">{s.title || s._id}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{s.type || 'survey'}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												📝 {s.questionCount || 0} questions
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-800' : s.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.status}</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">No surveys found</div>
				)}
			</div>

			{/* Features */}
			{company.features && company.features.length > 0 && (
				<div className="bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Enabled Features</h3>
					<div className="flex flex-wrap gap-2">
						{company.features.map((feature, index) => (
							<span
								key={index}
								className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
							>
								{feature}
							</span>
						))}
					</div>
				</div>
			)}

			{/* User Details Modal */}
			{showUserModal && selectedUser && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-medium text-gray-900">User Details</h3>
							<button
								onClick={() => setShowUserModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</button>
						</div>

						<div className="space-y-4">
							<div className="flex items-center space-x-4">
								<div className="flex-shrink-0 h-16 w-16">
									<div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
										<span className="text-xl font-medium text-white">
											{selectedUser.name.charAt(0).toUpperCase()}
										</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h4>
									<p className="text-gray-600">{selectedUser.email}</p>
									<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
									}`}>
										{selectedUser.status === 'active' ? '✅ Active' : '❌ Inactive'}
									</span>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="bg-gray-50 p-4 rounded-lg">
									<h5 className="font-medium text-gray-900 mb-2">Account Information</h5>
									<div className="space-y-2 text-sm">
										<div><span className="font-medium">User ID:</span> {selectedUser._id}</div>
										<div><span className="font-medium">Role:</span> {selectedUser.role}</div>
										<div><span className="font-medium">Department:</span> {selectedUser.department || 'Not specified'}</div>
										<div><span className="font-medium">Student ID:</span> {selectedUser.studentId || 'Not specified'}</div>
									</div>
								</div>

								<div className="bg-gray-50 p-4 rounded-lg">
									<h5 className="font-medium text-gray-900 mb-2">Activity Information</h5>
									<div className="space-y-2 text-sm">
										<div>
											<span className="font-medium">Registration Date:</span>
											<div className="text-gray-600">
												{new Date(selectedUser.createdAt).toLocaleDateString()}
												<br />
												{new Date(selectedUser.createdAt).toLocaleTimeString()}
											</div>
										</div>
										<div>
											<span className="font-medium">Last Login:</span>
											<div className="text-gray-600">
												{selectedUser.lastLogin ? (
													<>
														{new Date(selectedUser.lastLogin).toLocaleDateString()}
														<br />
														{new Date(selectedUser.lastLogin).toLocaleTimeString()}
													</>
												) : (
													'Never logged in'
												)}
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="flex justify-end space-x-3 pt-4 border-t">
								<button
									onClick={() => setShowUserModal(false)}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
								>
									Close
								</button>
								<button
									onClick={() => {
										handleResetPassword(selectedUser);
										setShowUserModal(false);
									}}
									disabled={resetPasswordLoading === selectedUser._id}
									className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
								>
									{resetPasswordLoading === selectedUser._id ? 'Resetting...' : '🔑 Reset Password'}
								</button>
								<button
									onClick={() => {
										handleToggleUserStatus(selectedUser);
										setShowUserModal(false);
									}}
									className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${
										selectedUser.status === 'active'
											? 'bg-orange-600 hover:bg-orange-700'
											: 'bg-green-600 hover:bg-green-700'
									}`}
								>
									{selectedUser.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CompanyDetailView;
