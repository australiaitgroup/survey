import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

interface RegisterFormProps {
	onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
	const { registerForm, setRegisterForm, register, loading, error } = useAdmin();

	const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (registerForm.password !== registerForm.confirmPassword) {
			alert('Passwords do not match');
			return;
		}

		if (registerForm.password.length < 8) {
			alert('Password must be at least 8 characters long');
			return;
		}

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
							<input
								id='email'
								name='email'
								type='email'
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your email address'
								value={registerForm.email}
								onChange={handleRegisterChange}
							/>
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
							disabled={loading}
							className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{loading ? 'Creating Account...' : 'Create Account'}
						</button>
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
