import React, { useState, useEffect } from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation,
} from 'react-router-dom';
import PublicBanks from './components/pages/PublicBanks';
import PublicBankDetailPage from './components/pages/PublicBankDetailPage';
import Overview from './components/pages/Overview';
import Companies from './components/pages/Companies';
import Users from './components/pages/Users';
import Transactions from './components/pages/Transactions';
import Audit from './components/pages/Audit';
import ProtectedRoute from './components/ProtectedRoute';

// Simple Login Component
function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const response = await fetch('/api/admin/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username: email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Login failed');
			}

			// Check if user has superAdmin role
			if (data.user?.role !== 'superAdmin') {
				throw new Error('Super Admin access required');
			}

			// Store token and user data
			localStorage.setItem('sa_token', data.token);
			localStorage.setItem('sa_user', JSON.stringify(data.user));

			// Redirect to dashboard
			navigate('/overview');
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
					<p className="text-gray-600 mt-2">System Management Portal</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label htmlFor="email" className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					{error && <div className="text-red-600 text-sm">{error}</div>}

					<button
						type="submit"
						disabled={loading}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
					>
						{loading ? 'Signing In...' : 'Sign In'}
					</button>
				</form>
			</div>
		</div>
	);
}

// Layout Component with Navigation
function Layout({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<any>(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		// Get user data (authentication is already checked by ProtectedRoute)
		const userData = localStorage.getItem('sa_user');
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser(parsedUser);
			} catch (e) {
				console.error('Failed to parse user data');
			}
		}
	}, []);

	const handleLogout = () => {
		localStorage.removeItem('sa_token');
		localStorage.removeItem('sa_user');
		navigate('/login');
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	const handleNavigation = (path: string) => {
		navigate(path);
		closeMobileMenu();
	};

	const navigation = [
		{ name: 'Overview', path: '/overview' },
		{ name: 'Companies', path: '/companies' },
		{ name: 'Users', path: '/users' },
		{ name: 'Public Banks', path: '/public-banks' },
		{ name: 'Transactions', path: '/transactions' },
		{ name: 'Audit', path: '/audit' },
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Fixed Header */}
			<header className="fixed top-0 left-0 right-0 bg-white shadow z-50">
				<div className="px-4 sm:px-6 py-4 flex justify-between items-center">
					<div className="flex items-center">
						{/* Mobile menu button */}
						<button
							onClick={toggleMobileMenu}
							className="lg:hidden mr-3 p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
							aria-label="Toggle menu"
						>
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								{isMobileMenuOpen ? (
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								) : (
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								)}
							</svg>
						</button>
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
					</div>
					<div className="flex items-center space-x-2 sm:space-x-4">
						<span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
							Welcome, {user?.name || 'Admin'}
						</span>
						<button
							onClick={handleLogout}
							className="bg-red-600 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm rounded hover:bg-red-700"
						>
							Logout
						</button>
					</div>
				</div>
			</header>

			{/* Mobile menu overlay */}
			{isMobileMenuOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={closeMobileMenu}
				/>
			)}

			{/* Content with top padding to account for fixed header */}
			<div className="pt-16">
				{/* Desktop Sidebar */}
				<nav className="hidden lg:fixed lg:left-0 lg:top-16 lg:w-64 lg:bg-white lg:shadow-sm lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:z-40 lg:flex lg:flex-col">
					<div className="p-4 flex-1">
						<ul className="space-y-2">
							{navigation.map(item => {
								const isActive = location.pathname === item.path;
								return (
									<li key={item.name}>
										<button
											onClick={() => handleNavigation(item.path)}
											className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
												isActive
													? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
													: 'text-gray-700 hover:bg-gray-100'
											}`}
										>
											{item.name}
										</button>
									</li>
								);
							})}
						</ul>
					</div>
					{/* Desktop Sidebar Footer */}
					<div className="p-4 border-t border-gray-200 bg-gray-50">
						<div className="text-center">
							<img src="/SigmaQ-logo.svg" alt="SigmaQ" className="h-6 mx-auto mb-2" />
							<p className="text-xs text-gray-500 mb-1">Powered by</p>
							<a 
								href="https://jracademy.ai" 
								target="_blank" 
								rel="noopener noreferrer"
								className="text-xs text-blue-600 hover:text-blue-700 font-medium"
							>
								JR Academy
							</a>
						</div>
					</div>
				</nav>

				{/* Mobile Sidebar */}
				<nav className={`fixed left-0 top-16 w-64 bg-white shadow-sm h-[calc(100vh-4rem)] overflow-y-auto z-50 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
					isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
				}`}>
					<div className="p-4 flex-1">
						<ul className="space-y-2">
							{navigation.map(item => {
								const isActive = location.pathname === item.path;
								return (
									<li key={item.name}>
										<button
											onClick={() => handleNavigation(item.path)}
											className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
												isActive
													? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
													: 'text-gray-700 hover:bg-gray-100'
											}`}
										>
											{item.name}
										</button>
									</li>
								);
							})}
						</ul>
					</div>
					{/* Mobile Sidebar Footer */}
					<div className="p-4 border-t border-gray-200 bg-gray-50">
						<div className="text-center">
							<img src="/SigmaQ-logo.svg" alt="SigmaQ" className="h-6 mx-auto mb-2" />
							<p className="text-xs text-gray-500 mb-1">Powered by</p>
							<a 
								href="https://jracademy.ai" 
								target="_blank" 
								rel="noopener noreferrer"
								className="text-xs text-blue-600 hover:text-blue-700 font-medium"
							>
								JR Academy
							</a>
						</div>
					</div>
				</nav>

				{/* Main Content with responsive margin */}
				<main className="lg:ml-64 p-4 sm:p-6">{children}</main>
			</div>
		</div>
	);
}

// Root component that handles authentication-based routing
function AuthenticatedRoot() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		const checkAuth = () => {
			const token = localStorage.getItem('sa_token');
			const userData = localStorage.getItem('sa_user');

			if (token && userData) {
				try {
					const parsedUser = JSON.parse(userData);
					if (parsedUser.role === 'superAdmin') {
						setIsAuthenticated(true);
						return;
					}
				} catch (e) {
					// Invalid user data
				}
			}

			setIsAuthenticated(false);
		};

		checkAuth();
	}, []);

	if (isAuthenticated === null) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return isAuthenticated ? <Navigate to="/overview" replace /> : <Navigate to="/login" replace />;
}

// Main App Component
function App() {
	return (
		<Router>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route
					path="/overview"
					element={
						<ProtectedRoute>
							<Layout>
								<Overview />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/companies"
					element={
						<ProtectedRoute>
							<Layout>
								<Companies />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/companies/:companyId"
					element={
						<ProtectedRoute>
							<Layout>
								<Companies />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/users"
					element={
						<ProtectedRoute>
							<Layout>
								<Users />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/users/:userId"
					element={
						<ProtectedRoute>
							<Layout>
								<Users />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/public-banks"
					element={
						<ProtectedRoute>
							<Layout>
								<PublicBanks />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/public-banks/:id"
					element={
						<ProtectedRoute>
							<Layout>
								<PublicBankDetailPage />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/transactions"
					element={
						<ProtectedRoute>
							<Layout>
								<Transactions />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/audit"
					element={
						<ProtectedRoute>
							<Layout>
								<Audit />
							</Layout>
						</ProtectedRoute>
					}
				/>
				<Route path="/" element={<AuthenticatedRoot />} />
			</Routes>
		</Router>
	);
}

export default App;
