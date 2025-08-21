import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import AuthContainer from './AuthContainer';

interface AuthWrapperProps {
	children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
	const { loggedIn } = useAdmin();

	if (!loggedIn) {
		return <AuthContainer />;
	}

	return <>{children}</>;
};

export default AuthWrapper;
