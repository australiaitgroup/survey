import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinLive: React.FC = () => {
	const navigate = useNavigate();
	const [pin, setPin] = useState('');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [submitting, setSubmitting] = useState(false);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		const sessionId = pin || 'mock-session';
		// Pass name/email via state; provider will connect in session route
		navigate(`/live/session/${encodeURIComponent(sessionId)}`, { state: { name, email } });
	}

	return (
		<div className='min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50'>
			<div className='w-full max-w-md bg-white rounded-xl shadow p-6'>
				<h1 className='text-xl font-bold text-center mb-1'>Join Live Quiz</h1>
				<p className='text-sm text-gray-500 text-center mb-6'>Enter the game PIN and your name</p>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Game PIN</label>
						<input
							type='text'
							inputMode='numeric'
							pattern='[0-9]*'
							placeholder='123456'
							value={pin}
							onChange={(e) => setPin(e.target.value)}
							className='w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500'
							required
						/>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
						<input
							type='text'
							placeholder='Your name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							className='w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500'
							required
						/>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Email (optional)</label>
						<input
							type='email'
							placeholder='you@example.com'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className='w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500'
						/>
					</div>
					<button
						type='submit'
						disabled={!pin || !name || submitting}
						className='w-full rounded-lg bg-emerald-600 text-white py-2.5 text-base font-semibold hover:bg-emerald-700 disabled:opacity-50'
					>
						Join
					</button>
				</form>
				<p className='text-xs text-gray-400 text-center mt-4'>Powered by SigmaQ Live</p>
			</div>
		</div>
	);
};

export default JoinLive;

