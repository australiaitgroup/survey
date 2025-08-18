import React, { useState, useEffect } from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from 'recharts';

const Overview: React.FC = () => {
	const [stats, setStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadStats();
	}, []);

	const loadStats = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				setLoading(false);
				return;
			}

			const response = await fetch('/api/sa/stats', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setStats(data.data || data);
			} else {
				console.error('Failed to fetch stats:', response.status);
			}
		} catch (error) {
			console.error('Error loading stats:', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
					<p className="text-gray-600">Loading statistics...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
				<button
					onClick={loadStats}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					Refresh
				</button>
			</div>

			{stats ? (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										></path>
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										Total Companies
									</p>
									<p className="text-2xl font-semibold text-gray-900">
										{stats.overview?.totalCompanies || 0}
									</p>
									<p className="text-xs text-gray-500">
										{stats.overview?.activeCompanies || 0} active
									</p>
								</div>
							</div>
						</div>

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
											d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z"
										></path>
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										Active Users
									</p>
									<p className="text-2xl font-semibold text-gray-900">
										{stats.overview?.activeUsers || 0}
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
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										></path>
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										Total Surveys
									</p>
									<p className="text-2xl font-semibold text-gray-900">
										{stats.overview?.totalSurveys || 0}
									</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-3 rounded-full bg-purple-100 text-purple-600">
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
											d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
										></path>
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										Total Responses
									</p>
									<p className="text-2xl font-semibold text-gray-900">
										{stats.overview?.totalResponses || 0}
									</p>
								</div>
							</div>
						</div>
					</div>
					{/* Recent growth (last N days) */}
					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Last {stats.daily?.range?.days || 7} days growth
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="p-4 rounded border">
								<div className="text-sm text-gray-600">New Companies</div>
								<div className="text-2xl font-semibold">
									{stats.overview?.growth7d?.companies || 0}
								</div>
							</div>
							<div className="p-4 rounded border">
								<div className="text-sm text-gray-600">New Surveys</div>
								<div className="text-2xl font-semibold">
									{stats.overview?.growth7d?.surveys || 0}
								</div>
							</div>
							<div className="p-4 rounded border">
								<div className="text-sm text-gray-600">New Responses</div>
								<div className="text-2xl font-semibold">
									{stats.overview?.growth7d?.responses || 0}
								</div>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Daily Growth Trends
							</h3>
							<div className="h-72">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart
										data={(stats.daily?.companies || []).map(
											(d: any, i: number) => {
												const surveys =
													stats.daily?.surveys?.[i]?.count || 0;
												const responses =
													stats.daily?.responses?.[i]?.count || 0;
												return {
													date: d.date,
													companies: d.count,
													surveys,
													responses,
												};
											}
										)}
										margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" tick={{ fontSize: 12 }} />
										<YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="companies"
											stroke="#3b82f6"
											strokeWidth={2}
											dot={false}
											name="Companies"
										/>
										<Line
											type="monotone"
											dataKey="surveys"
											stroke="#22c55e"
											strokeWidth={2}
											dot={false}
											name="Surveys"
										/>
										<Line
											type="monotone"
											dataKey="responses"
											stroke="#a855f7"
											strokeWidth={2}
											dot={false}
											name="Responses"
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								System Health
							</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Database Status</span>
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
										Healthy
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">API Response Time</span>
									<span className="text-sm text-gray-900">&lt; 200ms</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Active Sessions</span>
									<span className="text-sm text-gray-900">
										{stats.activeSessions || stats.sessions?.active || 0}
									</span>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Recent Activity
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div>
									<div className="font-medium mb-2">Companies</div>
									<ul className="space-y-1 text-sm text-gray-700">
										{(stats.recent?.companies || []).map(
											(c: any, i: number) => (
												<li key={i}>
													{c.name}{' '}
													<span className="text-gray-400">
														(
														{new Date(c.createdAt).toLocaleDateString()}
														)
													</span>
												</li>
											)
										)}
									</ul>
								</div>
								<div>
									<div className="font-medium mb-2">Surveys</div>
									<ul className="space-y-1 text-sm text-gray-700">
										{(stats.recent?.surveys || []).map((s: any, i: number) => (
											<li key={i}>
												{s.title || s._id}{' '}
												<span className="text-gray-400">
													({new Date(s.createdAt).toLocaleDateString()})
												</span>
											</li>
										))}
									</ul>
								</div>
								<div>
									<div className="font-medium mb-2">Responses</div>
									<ul className="space-y-1 text-sm text-gray-700">
										{(stats.recent?.responses || []).map(
											(r: any, i: number) => (
												<li key={i}>
													Response {r._id}{' '}
													<span className="text-gray-400">
														(
														{new Date(r.createdAt).toLocaleDateString()}
														)
													</span>
												</li>
											)
										)}
									</ul>
								</div>
							</div>
						</div>
					</div>
				</>
			) : (
				<div className="text-center py-8 text-gray-500">No data available</div>
			)}
		</div>
	);
};

export default Overview;
