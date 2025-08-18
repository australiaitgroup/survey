import React, { useState, useEffect } from 'react';

interface Transaction {
	_id: string;
	type: string;
	amount: number;
	companyId: string;
	companyName: string;
	status: string;
	createdAt: string;
	description?: string;
}

const Transactions: React.FC = () => {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('');

	useEffect(() => {
		loadTransactions();
	}, []);

	const loadTransactions = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setLoading(false);
				return;
			}

			const response = await fetch('/api/sa/transactions', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data) {
					setTransactions(data.data);
				}
			}
		} catch (error) {
			console.log('API not available, showing empty state');
		} finally {
			setLoading(false);
		}
	};

	const filteredTransactions = transactions.filter(transaction => {
		let matches = true;

		if (searchTerm) {
			matches =
				transaction.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
		}

		if (filterStatus && transaction.status !== filterStatus) {
			matches = false;
		}

		return matches;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
					<p className="text-gray-600">Loading transactions...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							Transaction Management
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							Monitor all financial transactions across the platform
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative">
							<input
								type="text"
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								placeholder="Search transactions..."
								className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
							/>
							<svg
								className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
						</div>

						<select
							value={filterStatus}
							onChange={e => setFilterStatus(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						>
							<option value="">All Status</option>
							<option value="completed">Completed</option>
							<option value="pending">Pending</option>
							<option value="failed">Failed</option>
						</select>

						<button
							onClick={loadTransactions}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								></path>
							</svg>
							Refresh
						</button>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-green-100 text-green-600">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
								></path>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Total Revenue</p>
							<p className="text-2xl font-semibold text-gray-900">
								$
								{transactions
									.filter(t => t.status === 'completed')
									.reduce((sum, t) => sum + t.amount, 0)
									.toFixed(2)}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-blue-100 text-blue-600">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								></path>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Total Transactions</p>
							<p className="text-2xl font-semibold text-gray-900">
								{transactions.length}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Pending</p>
							<p className="text-2xl font-semibold text-gray-900">
								{transactions.filter(t => t.status === 'pending').length}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="p-3 rounded-full bg-red-100 text-red-600">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								></path>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Failed</p>
							<p className="text-2xl font-semibold text-gray-900">
								{transactions.filter(t => t.status === 'failed').length}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Transactions Table */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
				</div>

				{filteredTransactions.length === 0 ? (
					<div className="p-8 text-center">
						<svg
							className="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No transactions found
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							{searchTerm
								? 'No transactions match your search.'
								: 'No transactions have been processed yet.'}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Transaction
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Company
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Amount
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredTransactions.map(transaction => (
									<tr key={transaction._id}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{transaction.type}
												</div>
												{transaction.description && (
													<div className="text-sm text-gray-500">
														{transaction.description}
													</div>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{transaction.companyName}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												${transaction.amount.toFixed(2)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													transaction.status === 'completed'
														? 'bg-green-100 text-green-800'
														: transaction.status === 'pending'
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-red-100 text-red-800'
												}`}
											>
												{transaction.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(transaction.createdAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<button className="text-blue-600 hover:text-blue-900">
												View Details
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default Transactions;
