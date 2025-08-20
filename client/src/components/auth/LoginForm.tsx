import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

interface LoginFormProps {
	onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
	const { loginForm, setLoginForm, login, loading, error } = useAdmin();

	const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4'>
			<div className='max-w-md w-full space-y-8'>
				<div>
					<div className='flex justify-center mb-6'>
						<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-12' />
					</div>
					<h2 className='text-center text-3xl font-bold text-gray-900'>Admin Login</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Sign in to access the admin dashboard
					</p>
				</div>
				<form className='mt-8 space-y-6' onSubmit={login}>
					<div className='rounded-md space-y-4'>
						<div>
							<label
								htmlFor='username'
								className='block text-sm font-medium text-gray-700'
							>
								Email Address
							</label>
							<input
								id='username'
								name='username'
								type='text'
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your email address'
								value={loginForm.username}
								onChange={handleLoginChange}
							/>
						</div>
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'
							>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your password'
								value={loginForm.password}
								onChange={handleLoginChange}
							/>
						</div>
					</div>

					{error && (
						<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
							<div className='flex items-start'>
								<div className='flex-shrink-0'>
									<svg
										className='h-5 w-5 text-red-400'
										viewBox='0 0 20 20'
										fill='currentColor'
									>
										<path
											fillRule='evenodd'
											d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
											clipRule='evenodd'
										/>
									</svg>
								</div>
								<div className='ml-3 flex-1'>
									<p className='text-sm font-medium'>{error}</p>
									{error.includes('No account found') && (
										<p className='mt-2 text-sm text-red-600'>
											💡 <strong>Tip:</strong> Make sure you&apos;re using
											your email address, not a username.
										</p>
									)}
									{error.includes('Incorrect password') && (
										<p className='mt-2 text-sm text-red-600'>
											💡 <strong>Tip:</strong> Passwords are case-sensitive.
											Check your Caps Lock key.
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					<div>
						<button
							type='submit'
							disabled={loading}
							className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>

					{onSwitchToRegister && (
						<div className='text-center'>
							<button
								type='button'
								onClick={onSwitchToRegister}
								className='text-blue-600 hover:text-blue-500 text-sm font-medium'
							>
								Don&apos;t have an account? Register here
							</button>
						</div>
					)}
				</form>
			</div>
		</div>
	);
};

export default LoginForm;
