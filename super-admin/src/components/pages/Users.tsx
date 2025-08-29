import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserDetailView from '../users/UserDetailView';

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
	mustChangePassword?: boolean;
	subscriptionTier?: string;
	subscriptionStatus?: string;
}

const Users: React.FC = () => {
	const { userId } = useParams<{ userId?: string }>();
	const navigate = useNavigate();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [roleFilter, setRoleFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [companyFilter, setCompanyFilter] = useState('');
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		pages: 0,
	});

	useEffect(() => {
		loadUsers();
	}, [pagination.page, searchTerm, roleFilter, statusFilter, companyFilter]);

	useEffect(() => {
		// If URL has userId, load that user
		if (userId && users.length > 0) {
			const user = users.find(u => u._id === userId);
			if (user) {
				setSelectedUser(user);
			} else {
				// If user not found in current list, fetch it specifically
				loadUserById(userId);
			}
		}
	}, [userId, users]);

	const loadUsers = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setLoading(false);
				return;
			}

			const params = new URLSearchParams({
				page: pagination.page.toString(),
				limit: pagination.limit.toString(),
			});

			if (searchTerm) params.append('search', searchTerm);
			if (roleFilter) params.append('role', roleFilter);
			if (statusFilter) params.append('isActive', statusFilter);
			if (companyFilter) params.append('companyId', companyFilter);

			const response = await fetch(`/api/sa/users?${params}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data) {
					setUsers(data.data);
					setPagination(prev => ({
						...prev,
						total: data.pagination?.total || 0,
						pages: data.pagination?.pages || 0,
					}));
				}
			}
		} catch (error) {
			console.log('API not available, showing empty state');
		} finally {
			setLoading(false);
		}
	};

	const loadUserById = async (id: string) => {
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) return;

			const response = await fetch(`/api/sa/users/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data) {
					setSelectedUser(data.data);
				}
			} else {
				navigate('/users');
			}
		} catch (error) {
			console.log('Error loading user, redirecting to list');
			navigate('/users');
		}
	};

	const handleViewUser = (user: User) => {
		navigate(`/users/${user._id}`);
	};

	const handleBackToList = () => {
		setSelectedUser(null);
		navigate('/users');
	};

	const handleUpdateUser = (updatedUser: User) => {
		setUsers(prev =>
			prev.map(user => (user._id === updatedUser._id ? updatedUser : user))
		);
		setSelectedUser(updatedUser);
	};

	const handlePageChange = (newPage: number) => {
		setPagination(prev => ({ ...prev, page: newPage }));
	};

	const filteredUsers = users.filter(user => {
		if (searchTerm) {
			const search = searchTerm.toLowerCase();
			if (!user.name.toLowerCase().includes(search) && 
				!user.email.toLowerCase().includes(search)) {
				return false;
			}
		}
		return true;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2">Loading users...</span>
			</div>
		);
	}

	// Show detail view if URL has userId and user is loaded
	if (userId && selectedUser) {
		return (
			<UserDetailView
				user={selectedUser}
				onBack={handleBackToList}
				onUpdate={handleUpdateUser}
			/>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							User Management
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							Manage all registered users across all companies
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative">
							<input
								type="text"
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								placeholder="Search users..."
								className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
							/>
							<svg
								className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
						</div>

						<button
							onClick={loadUsers}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								></path>
							</svg>
							Refresh
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Role Filter
						</label>
						<select
							value={roleFilter}
							onChange={e => setRoleFilter(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						>
							<option value="">All Roles</option>
							<option value="admin">Admin</option>
							<option value="manager">Manager</option>
							<option value="teacher">Teacher</option>
							<option value="student">Student</option>
							<option value="user">User</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Status Filter
						</label>
						<select
							value={statusFilter}
							onChange={e => setStatusFilter(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						>
							<option value="">All Status</option>
							<option value="true">Active</option>
							<option value="false">Inactive</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Company Filter
						</label>
						<input
							type="text"
							value={companyFilter}
							onChange={e => setCompanyFilter(e.target.value)}
							placeholder="Company ID"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-blue-100 text-blue-600">
							<svg
								className="w-6 h-6"
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
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Total Users</p>
							<p className="text-2xl font-semibold text-gray-900">
								{pagination.total}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-green-100 text-green-600">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Active Users</p>
							<p className="text-2xl font-semibold text-gray-900">
								{users.filter(u => u.isActive).length}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-purple-100 text-purple-600">
							<svg
								className="w-6 h-6"
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
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Admins</p>
							<p className="text-2xl font-semibold text-gray-900">
								{users.filter(u => u.role === 'admin').length}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
							<svg
								className="w-6 h-6"
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
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Recent Logins</p>
							<p className="text-2xl font-semibold text-gray-900">
								{users.filter(u => u.lastLoginAt && 
									new Date(u.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
								).length}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Users Table */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">Users List</h3>
				</div>

				{filteredUsers.length === 0 ? (
					<div className="p-8 text-center">
						<svg
							className="mx-auto h-12 w-12 text-gray-400"
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
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No users found
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							{searchTerm || roleFilter || statusFilter
								? 'No users match your filters.'
								: 'No users have been registered yet.'}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										User
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Company
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Role
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Registration
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Last Login
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredUsers.map(user => (
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
													<button
														onClick={() => handleViewUser(user)}
														className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
													>
														{user.name}
													</button>
													<div className="text-sm text-gray-500">
														{user.email}
													</div>
													{user.studentId && (
														<div className="text-xs text-gray-400">
															ID: {user.studentId}
														</div>
													)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{user.companyId ? (
												<div className="text-sm text-gray-900">
													{user.companyId.name}
												</div>
											) : (
												<span className="text-sm text-gray-400">No company</span>
											)}
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
															: user.role === 'student'
																? '🎓 Student'
																: '👤 User'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex flex-col">
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
														user.isActive
															? 'bg-green-100 text-green-800'
															: 'bg-red-100 text-red-800'
													}`}
												>
													{user.isActive ? '✅ Active' : '❌ Inactive'}
												</span>
												{user.mustChangePassword && (
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
														🔑 Must Change Password
													</span>
												)}
											</div>
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
											{user.lastLoginAt ? (
												<div className="flex flex-col">
													<span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
													<span className="text-xs text-gray-400">
														{new Date(user.lastLoginAt).toLocaleTimeString()}
													</span>
												</div>
											) : (
												<span className="text-gray-400">Never</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<button
												onClick={() => handleViewUser(user)}
												className="text-blue-600 hover:text-blue-900 mr-3"
											>
												View Details
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination */}
				{pagination.pages > 1 && (
					<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
						<div className="flex-1 flex justify-between sm:hidden">
							<button
								onClick={() => handlePageChange(pagination.page - 1)}
								disabled={pagination.page === 1}
								className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
							>
								Previous
							</button>
							<button
								onClick={() => handlePageChange(pagination.page + 1)}
								disabled={pagination.page === pagination.pages}
								className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
							>
								Next
							</button>
						</div>
						<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
							<div>
								<p className="text-sm text-gray-700">
									Showing{' '}
									<span className="font-medium">
										{(pagination.page - 1) * pagination.limit + 1}
									</span>{' '}
									to{' '}
									<span className="font-medium">
										{Math.min(pagination.page * pagination.limit, pagination.total)}
									</span>{' '}
									of{' '}
									<span className="font-medium">{pagination.total}</span> results
								</p>
							</div>
							<div>
								<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
									<button
										onClick={() => handlePageChange(pagination.page - 1)}
										disabled={pagination.page === 1}
										className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
									>
										Previous
									</button>
									{Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
										const page = i + 1;
										return (
											<button
												key={page}
												onClick={() => handlePageChange(page)}
												className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
													page === pagination.page
														? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
														: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
												}`}
											>
												{page}
											</button>
										);
									})}
									<button
										onClick={() => handlePageChange(pagination.page + 1)}
										disabled={pagination.page === pagination.pages}
										className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
									>
										Next
									</button>
								</nav>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Users;