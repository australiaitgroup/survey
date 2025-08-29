import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Overview from './pages/Overview';
import Companies from './pages/Companies';
import Users from './pages/Users';
import PublicBanks from './pages/PublicBanks';
import Transactions from './pages/Transactions';
import Audit from './pages/Audit';

const Dashboard: React.FC = () => {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// Mock user data - replace with real auth
	const user = {
		name: 'Super Admin',
		email: 'superadmin@system.com',
	};

	const navigation = [
		{
			id: 'overview',
			name: 'Overview',
			path: '/overview',
			icon: (
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					></path>
				</svg>
			),
		},
		{
			id: 'companies',
			name: 'Companies',
			path: '/companies',
			icon: (
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					></path>
				</svg>
			),
		},
		{
			id: 'users',
			name: 'Users',
			path: '/users',
			icon: (
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z"
					></path>
				</svg>
			),
		},
		{
			id: 'public-banks',
			name: 'Public Banks',
			path: '/public-banks',
			icon: (
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
					></path>
				</svg>
			),
		},
		{
			id: 'transactions',
			name: 'Transactions',
			path: '/transactions',
			icon: (
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
					></path>
				</svg>
			),
		},
		{
			id: 'audit',
			name: 'Audit Logs',
			path: '/audit',
			icon: (
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					></path>
				</svg>
			),
		},
	];

	const getCurrentTabName = () => {
		const pathname = location.pathname;
		
		// Handle routes with parameters
		if (pathname.startsWith('/companies')) {
			return 'Companies';
		}
		if (pathname.startsWith('/users')) {
			return 'Users';
		}
		if (pathname.startsWith('/public-banks')) {
			return 'Public Banks';
		}
		if (pathname.startsWith('/transactions')) {
			return 'Transactions';
		}
		if (pathname.startsWith('/audit')) {
			return 'Audit Logs';
		}
		if (pathname.startsWith('/overview')) {
			return 'Overview';
		}
		
		// Fallback to exact match
		const currentNav = navigation.find(nav => nav.path === pathname);
		return currentNav ? currentNav.name : 'Dashboard';
	};

	const handleNavigate = (path: string) => {
		navigate(path);
		// Close sidebar on mobile
		if (window.innerWidth < 1024) {
			setSidebarOpen(false);
		}
	};

	const handleLogout = () => {
		// Clear auth data
		localStorage.removeItem('sa_token');
		localStorage.removeItem('sa_user');
		// Redirect to login
		window.location.href = '/super-admin/login';
	};

	return (
		<div className="min-h-screen flex">
			<Sidebar
				navigation={navigation}
				currentPath={location.pathname}
				user={user}
				sidebarOpen={sidebarOpen}
				onNavigate={handleNavigate}
				onLogout={handleLogout}
				onToggle={() => setSidebarOpen(!sidebarOpen)}
			/>

			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header
					currentTabName={getCurrentTabName()}
					loading={loading}
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					onRefresh={() => setLoading(true)}
				/>

				<main className="flex-1 overflow-y-auto p-6">
					<Routes>
						<Route path="/overview" element={<Overview />} />
						<Route path="/companies" element={<Companies />} />
						<Route path="/companies/:companyId" element={<Companies />} />
						<Route path="/users" element={<Users />} />
						<Route path="/users/:userId" element={<Users />} />
						<Route path="/public-banks" element={<PublicBanks />} />
						<Route path="/transactions" element={<Transactions />} />
						<Route path="/audit" element={<Audit />} />
					</Routes>
				</main>
			</div>

			{/* Loading overlay */}
			{loading && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 flex items-center space-x-3">
						<div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
						<span className="text-gray-700">Loading...</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default Dashboard;
