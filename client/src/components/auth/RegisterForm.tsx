import React, { useState, useCallback, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useTranslation } from 'react-i18next';
import api from '../../utils/axiosConfig';
import { AxiosError } from 'axios';

interface RegisterFormProps {
	onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
	const { registerForm, setRegisterForm, register, loading, error } = useAdmin();
	const { i18n } = useTranslation();

	// Verification code related state
	const [verificationCode, setVerificationCode] = useState('');
	const [codeError, setCodeError] = useState('');
	const [codeSent, setCodeSent] = useState(false);
	const [sendingCode, setSendingCode] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [isVerified, setIsVerified] = useState(false);
	const [verifyingCode, setVerifyingCode] = useState(false);
	const [verifyTimeoutId, setVerifyTimeoutId] = useState<number | null>(null);

	const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });

		// If email changes, reset verification status
		if (e.target.name === 'email') {
			setIsVerified(false);
			setCodeSent(false);
			setVerificationCode('');
			setCodeError('');
		}
	};

	// Countdown effect
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (verifyTimeoutId) {
				clearTimeout(verifyTimeoutId);
			}
		};
	}, [verifyTimeoutId]);

	// Send verification code
	const sendVerificationCode = useCallback(async () => {
		if (!registerForm.email || sendingCode || countdown > 0) return;

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(registerForm.email)) {
			setCodeError('Please enter a valid email address');
			return;
		}

		setSendingCode(true);
		setCodeError('');
		setCountdown(60); // Set countdown immediately to disable button

		try {
			const language = i18n.language.startsWith('zh') ? 'zh' : 'en';
			await api.post('/verification/send-code', {
				email: registerForm.email,
				name: registerForm.name,
				language: language,
			});

			setCodeSent(true);
			setCodeError('');
		} catch (err: unknown) {
				const apiError = err as AxiosError<{ error?: string; errorType?: string }>;
			const errorMsg =
				apiError.response?.data?.error || 'Failed to send verification code. Please try again.';
			const errorType = apiError.response?.data?.errorType;
			
			setCodeError(errorMsg);
			
			
			// Reset countdown on error
			setCountdown(0);
		} finally {
			setSendingCode(false);
		}
	}, [registerForm.email, registerForm.name, sendingCode, countdown, i18n.language]);

	// Verify verification code
	const verifyCode = useCallback(async () => {
		if (!verificationCode || !registerForm.email || verifyingCode) return;


		setVerifyingCode(true);
		setCodeError('');

		try {
			await api.post('/verification/verify-code', {
				email: registerForm.email,
				code: verificationCode,
			});

			setIsVerified(true);
			setCodeError('');
		} catch (err: unknown) {
				const apiError = err as AxiosError<{ error?: string }>;
			const errorMsg =
				apiError.response?.data?.error || 'Invalid verification code. Please try again.';
			setCodeError(errorMsg);
		} finally {
			setVerifyingCode(false);
		}
	}, [verificationCode, registerForm.email, verifyingCode]);

	// Helper function to verify with specific code value
	const verifyCodeWithValue = async (codeValue: string) => {
		if (!codeValue || !registerForm.email || verifyingCode) return;

		setVerifyingCode(true);
		setCodeError('');

		try {
			await api.post('/verification/verify-code', {
				email: registerForm.email,
				code: codeValue,
			});

			setIsVerified(true);
			setCodeError('');
			// Update register form with verified code
			setRegisterForm(prev => ({ ...prev, verificationCode: codeValue }));
		} catch (err: unknown) {
				const apiError = err as AxiosError<{ error?: string }>;
			const errorMsg =
				apiError.response?.data?.error || 'Invalid verification code. Please try again.';
			setCodeError(errorMsg);
		} finally {
			setVerifyingCode(false);
		}
	};

	// Verification code input handling
	const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only allow digits, max 6 digits
		setVerificationCode(value);
		setCodeError('');

		// Clear any existing timeout to debounce
		if (verifyTimeoutId) {
			clearTimeout(verifyTimeoutId);
			setVerifyTimeoutId(null);
		}

		// Auto verify when 6 digits are entered
		if (value.length === 6) {
			// Delay a bit to let user see the input completion and debounce
			const timeoutId = window.setTimeout(() => {
				verifyCodeWithValue(value);
				setVerifyTimeoutId(null);
			}, 300);
			setVerifyTimeoutId(timeoutId);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Email verification check
		if (!isVerified) {
			alert('Please verify your email address first');
			return;
		}

		// Validation
		if (registerForm.password !== registerForm.confirmPassword) {
			alert('Passwords do not match');
			return;
		}

		if (registerForm.password.length < 8) {
			alert('Password must be at least 8 characters long');
			return;
		}

		// Call register (verification code already set in registerForm)
		await register(e);
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4'>
			<div className='max-w-md w-full space-y-8'>
				<div>
					<div className='flex justify-center mb-6'>
						<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-12' />
					</div>
					<h2 className='text-center text-3xl font-bold text-gray-900'>
						Register Admin Account
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Create your admin account to access the dashboard
					</p>
				</div>
				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
					<div className='rounded-md space-y-4'>
						<div>
							<label
								htmlFor='name'
								className='block text-sm font-medium text-gray-700'
							>
								Full Name *
							</label>
							<input
								id='name'
								name='name'
								type='text'
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your full name'
								value={registerForm.name}
								onChange={handleRegisterChange}
							/>
						</div>
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-700'
							>
								Email Address *
							</label>
							<div className='mt-1 flex space-x-2'>
								<input
									id='email'
									name='email'
									type='email'
									required
									autoComplete='off'
									className={`flex-1 px-3 py-2 border ${isVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
									placeholder='Enter your email address'
									value={registerForm.email}
									onChange={handleRegisterChange}
									disabled={isVerified}
								/>
								{isVerified && (
									<div className='flex items-center px-2'>
										<svg
											className='w-5 h-5 text-green-500'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M5 13l4 4L19 7'
											/>
										</svg>
									</div>
								)}
							</div>
							{registerForm.email && !isVerified && (
								<div className='mt-3 space-y-3'>
									<div className='flex space-x-2'>
										<input
											type='text'
											placeholder='Enter 6-digit code'
											value={verificationCode}
											onChange={handleCodeChange}
											className='flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
											maxLength={6}
											disabled={verifyingCode}
										/>
										<button
											type='button'
											onClick={sendVerificationCode}
											disabled={
												sendingCode || countdown > 0 || !registerForm.email
											}
											className='px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]'
										>
											{sendingCode
												? 'Sending...'
												: countdown > 0
													? `${countdown}s`
													: codeSent
														? 'Resend'
														: 'Send Code'}
										</button>
									</div>
									{codeSent && !isVerified && (
										<p className='text-sm text-green-600'>
											Verification code sent to your email. Please check your
											inbox.
										</p>
									)}
									{verifyingCode && (
										<p className='text-sm text-blue-600'>Verifying code...</p>
									)}
									{codeError && (
										<p className='text-sm text-red-600'>{codeError}</p>
									)}
								</div>
							)}
						</div>
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'
							>
								Password *
							</label>
							<input
								id='password'
								name='password'
								type='password'
								required
								minLength={8}
								autoComplete='new-password'
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your password (min 8 characters)'
								value={registerForm.password}
								onChange={handleRegisterChange}
							/>
						</div>
						<div>
							<label
								htmlFor='confirmPassword'
								className='block text-sm font-medium text-gray-700'
							>
								Confirm Password *
							</label>
							<input
								id='confirmPassword'
								name='confirmPassword'
								type='password'
								required
								autoComplete='new-password'
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Confirm your password'
								value={registerForm.confirmPassword}
								onChange={handleRegisterChange}
							/>
						</div>
						<div>
							<label
								htmlFor='companyName'
								className='block text-sm font-medium text-gray-700'
							>
								Company Name
							</label>
							<input
								id='companyName'
								name='companyName'
								type='text'
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your company name (optional)'
								value={registerForm.companyName}
								onChange={handleRegisterChange}
							/>
						</div>
					</div>

					{error && (
						<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
							{error}
						</div>
					)}

					<div>
						<button
							type='submit'
							disabled={loading || !isVerified}
							className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{loading ? 'Creating Account...' : 'Create Account'}
						</button>
						{!isVerified && registerForm.email && (
							<p className='mt-2 text-sm text-gray-500 text-center'>
								Please verify your email address to create account
							</p>
						)}
					</div>

					<div className='text-center'>
						<button
							type='button'
							onClick={onSwitchToLogin}
							className='text-blue-600 hover:text-blue-500 text-sm font-medium'
						>
							Already have an account? Sign in
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default RegisterForm;
