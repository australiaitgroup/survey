import React, { useState, useEffect } from 'react';

interface StatisticsFilterProps {
	onFilter: (filters: {
		name?: string;
		email?: string;
		fromDate?: string;
		toDate?: string;
		status?: string;
	}) => void;
	loading?: boolean;
}

export const StatisticsFilter: React.FC<StatisticsFilterProps> = ({
	onFilter,
	loading = false,
}) => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [status, setStatus] = useState('');
	const [isExpanded, setIsExpanded] = useState(false);

	useEffect(() => {
		const today = new Date();
		const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
		setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
		setToDate(today.toISOString().split('T')[0]);
	}, []);

	const handleQuery = () => {
		onFilter({
			name: name.trim() || undefined,
			email: email.trim() || undefined,
			fromDate: fromDate || undefined,
			toDate: toDate || undefined,
			status: status || undefined,
		});
	};

	const handleReset = () => {
		setName('');
		setEmail('');
		setStatus('');
		const today = new Date();
		const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
		setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
		setToDate(today.toISOString().split('T')[0]);
		onFilter({
			fromDate: thirtyDaysAgo.toISOString().split('T')[0],
			toDate: today.toISOString().split('T')[0],
		});
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleQuery();
	};

	return (
		<div className='bg-gray-50 rounded-lg p-4 mb-4'>
			<div className='flex justify-between items-center mb-3'>
				<h4 className='font-semibold text-gray-800'>筛选条件</h4>
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className='flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors'
				>
					<span>{isExpanded ? '收起' : '展开'}</span>
					<svg
						className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M19 9l-7 7-7-7'
						/>
					</svg>
				</button>
			</div>

			{isExpanded && (
				<div className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								用户名搜索
							</label>
							<input
								type='text'
								value={name}
								onChange={e => setName(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder='输入用户名进行模糊搜索'
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								邮箱搜索
							</label>
							<input
								type='email'
								value={email}
								onChange={e => setEmail(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder='输入邮箱进行模糊搜索'
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								开始时间
							</label>
							<input
								type='date'
								value={fromDate}
								onChange={e => setFromDate(e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								结束时间
							</label>
							<input
								type='date'
								value={toDate}
								onChange={e => setToDate(e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								答题状态
							</label>
							<select
								value={status}
								onChange={e => setStatus(e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							>
								<option value=''>全部状态</option>
								<option value='completed'>已完成</option>
								<option value='incomplete'>未完成</option>
							</select>
						</div>
					</div>

					<div className='flex gap-3 pt-2'>
						<button
							onClick={handleQuery}
							disabled={loading}
							className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
						>
							{loading ? (
								<div className='flex items-center'>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
									查询中...
								</div>
							) : (
								'查询'
							)}
						</button>
						<button
							onClick={handleReset}
							disabled={loading}
							className='px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors'
						>
							重置
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
