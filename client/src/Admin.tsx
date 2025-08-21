import React from 'react';
import { AdminProvider } from './contexts/AdminContext';
import AuthWrapper from './components/auth/AuthWrapper';
import AdminDashboard from './components/AdminDashboard';

const Admin: React.FC = () => {
	return (
		<AdminProvider>
			<AuthWrapper>
				<AdminDashboard />
			</AuthWrapper>
		</AdminProvider>
	);
};

export default Admin;
