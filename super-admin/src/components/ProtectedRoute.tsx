import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
	children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const navigate = useNavigate();

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

			// Not authenticated, redirect to login
			setIsAuthenticated(false);
			navigate('/login');
		};

		checkAuth();
	}, [navigate]);

	// Show loading while checking authentication
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

	// If authenticated, render children
	if (isAuthenticated) {
		return <>{children}</>;
	}

	// Not authenticated, return null (navigation to login is handled in useEffect)
	return null;
};

export default ProtectedRoute;
