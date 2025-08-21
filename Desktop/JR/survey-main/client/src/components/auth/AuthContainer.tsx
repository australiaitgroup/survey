import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthContainer: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [isLoginMode, setIsLoginMode] = useState(true);

	useEffect(() => {
		// Set mode based on current URL
		setIsLoginMode(!location.pathname.includes('/register'));
	}, [location.pathname]);

	const switchToRegister = () => {
		navigate('/admin/register');
	};

	const switchToLogin = () => {
		navigate('/admin/login');
	};

	if (isLoginMode) {
		return <LoginForm onSwitchToRegister={switchToRegister} />;
	}

	return <RegisterForm onSwitchToLogin={switchToLogin} />;
};

export default AuthContainer;
