import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';

interface SubscriptionPlan {
	id: string;
	name: string;
	price: number;
	period: 'month' | 'year';
	features: string[];
	isPopular?: boolean;
	current?: boolean;
}

interface BillingInfo {
	currentPlan: SubscriptionPlan;
	nextBillingDate: string;
	paymentMethod: {
		type: 'card' | 'paypal';
		last4?: string;
		brand?: string;
		email?: string;
	} | null;
	billingHistory: {
		id: string;
		date: string;
		amount: number;
		status: 'paid' | 'pending' | 'failed';
		description: string;
	}[];
}

const BillingView: React.FC = () => {
	const { t } = useTranslation();
	const { loading, setLoading, error, setError } = useAdmin();
	const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

	// Mock data for now - replace with actual API calls
	const availablePlans: SubscriptionPlan[] = [
		{
			id: 'free',
			name: 'Free',
			price: 0,
			period: 'month',
			features: [
				'Up to 3 surveys',
				'Up to 10 questions per survey',
				'Up to 10 invitees per survey',
				'Basic survey templates',
				'Email support',
				'Basic analytics',
			],
			current: true,
		},
		{
			id: 'pro',
			name: 'Professional',
			price: 29,
			period: 'month',
			features: [
				'Up to 10 surveys',
				'Up to 20 questions per survey',
				'Up to 30 invitees per survey',
				'Advanced survey templates',
				'Custom branding',
				'Advanced analytics',
				'Priority support',
				'Export to CSV/PDF',
			],
			isPopular: true,
		},
		{
			id: 'business',
			name: 'Business',
			price: 99,
			period: 'month',
			features: [
				'Unlimited surveys',
				'Unlimited questions per survey',
				'Unlimited invitees',
				'All survey templates',
				'Full custom branding',
				'Advanced analytics & reporting',
				'24/7 premium support',
				'API access',
				'Team collaboration',
				'White-label options',
			],
		},
	];

	useEffect(() => {
		loadBillingInfo();
	}, []);

	const loadBillingInfo = async () => {
		setLoading(true);
		try {
			// Mock API call - replace with actual endpoint
			// const response = await api.get('/admin/billing');
			// setBillingInfo(response.data);

			// Mock data for demonstration
			setBillingInfo({
				currentPlan: availablePlans[0],
				nextBillingDate: '2024-12-01',
				paymentMethod: null,
				billingHistory: [
					{
						id: '1',
						date: '2024-11-01',
						amount: 0,
						status: 'paid',
						description: 'Free Plan - Monthly',
					},
				],
			});
		} catch (err) {
			console.error('Load billing info error:', err);
			setError('Failed to load billing information');
		} finally {
			setLoading(false);
		}
	};

	const handleUpgrade = (plan: SubscriptionPlan) => {
		setSelectedPlan(plan);
		setShowUpgradeModal(true);
	};

	const handleCancelSubscription = async () => {
		if (
			!confirm(
				'Are you sure you want to cancel your subscription? You will lose access to premium features.'
			)
		) {
			return;
		}

		setLoading(true);
		try {
			// Mock API call - replace with actual endpoint
			// await api.post('/admin/billing/cancel');
			alert(
				'Subscription cancelled successfully. You will retain access until the end of your billing period.'
			);
			loadBillingInfo();
		} catch (err) {
			console.error('Cancel subscription error:', err);
			setError('Failed to cancel subscription');
		} finally {
			setLoading(false);
		}
	};

	const processUpgrade = async () => {
		if (!selectedPlan) return;

		setLoading(true);
		try {
			// Mock API call - replace with actual payment processing
			// const response = await api.post('/admin/billing/upgrade', {
			//   planId: selectedPlan.id
			// });

			alert(`Successfully upgraded to ${selectedPlan.name} plan!`);
			setShowUpgradeModal(false);
			setSelectedPlan(null);
			loadBillingInfo();
		} catch (err) {
			console.error('Upgrade error:', err);
			setError('Failed to process upgrade');
		} finally {
			setLoading(false);
		}
	};

	if (loading && !billingInfo) {
		return (
			<div className='flex justify-center items-center py-12'>
				<div className='text-lg text-gray-600'>Loading billing information...</div>
			</div>
		);
	}

	return (
		<div className='max-w-6xl mx-auto'>
			<div className='bg-white rounded-lg shadow-sm border border-gray-200'>
				{/* Header */}
				<div className='px-6 py-4 border-b border-gray-200'>
					<h2 className='text-2xl font-bold text-gray-900'>Billing & Subscriptions</h2>
					<p className='text-gray-600 mt-1'>
						Manage your subscription plan and billing information
					</p>
				</div>

				{/* Error Message */}
				{error && (
					<div className='mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md'>
						<div className='text-red-700'>{error}</div>
						<button
							onClick={() => setError('')}
							className='mt-2 text-red-600 hover:text-red-800 text-sm underline'
						>
							Dismiss
						</button>
					</div>
				)}

				<div className='p-6'>
					{/* Current Plan Section */}
					{billingInfo && (
						<div className='mb-8'>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								Current Plan
							</h3>
							<div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
								<div className='flex justify-between items-start'>
									<div>
										<h4 className='text-xl font-bold text-blue-900'>
											{billingInfo.currentPlan.name}
										</h4>
										<p className='text-blue-700 text-lg font-semibold'>
											${billingInfo.currentPlan.price}/
											{billingInfo.currentPlan.period}
										</p>
										{billingInfo.nextBillingDate && (
											<p className='text-blue-600 text-sm mt-2'>
												Next billing date:{' '}
												{new Date(
													billingInfo.nextBillingDate
												).toLocaleDateString()}
											</p>
										)}
									</div>
									{billingInfo.currentPlan.id !== 'free' && (
										<button
											onClick={handleCancelSubscription}
											className='px-4 py-2 text-red-600 hover:text-red-800 text-sm font-medium'
										>
											Cancel Subscription
										</button>
									)}
								</div>
								<div className='mt-4'>
									<h5 className='font-medium text-blue-900 mb-2'>
										Plan Features:
									</h5>
									<ul className='text-blue-700 text-sm space-y-1'>
										{billingInfo.currentPlan.features.map((feature, index) => (
											<li key={index} className='flex items-center'>
												<span className='mr-2'>✓</span>
												{feature}
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					)}

					{/* Available Plans Section */}
					<div className='mb-8'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>
							Available Plans
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							{availablePlans.map(plan => (
								<div
									key={plan.id}
									className={`border rounded-lg p-6 relative ${
										plan.isPopular
											? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
											: 'border-gray-200'
									} ${
										plan.current ? 'bg-green-50 border-green-300' : 'bg-white'
									}`}
								>
									{plan.isPopular && (
										<div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
											<span className='bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full'>
												POPULAR
											</span>
										</div>
									)}
									{plan.current && (
										<div className='absolute -top-3 right-4'>
											<span className='bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full'>
												CURRENT
											</span>
										</div>
									)}

									<div className='text-center mb-4'>
										<h4 className='text-xl font-bold text-gray-900'>
											{plan.name}
										</h4>
										<div className='mt-2'>
											<span className='text-3xl font-bold text-gray-900'>
												${plan.price}
											</span>
											<span className='text-gray-600'>/{plan.period}</span>
										</div>
									</div>

									<ul className='space-y-2 mb-6'>
										{plan.features.map((feature, index) => (
											<li
												key={index}
												className='flex items-start text-sm text-gray-600'
											>
												<span className='text-green-500 mr-2 mt-0.5'>
													✓
												</span>
												{feature}
											</li>
										))}
									</ul>

									<button
										onClick={() => (plan.current ? null : handleUpgrade(plan))}
										disabled={plan.current || loading}
										className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
											plan.current
												? 'bg-green-100 text-green-800 cursor-not-allowed'
												: plan.isPopular
													? 'bg-blue-600 text-white hover:bg-blue-700'
													: 'bg-gray-600 text-white hover:bg-gray-700'
										} disabled:opacity-50 disabled:cursor-not-allowed`}
									>
										{plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Payment Method Section */}
					{billingInfo && (
						<div className='mb-8'>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								Payment Method
							</h3>
							<div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
								{billingInfo.paymentMethod ? (
									<div className='flex justify-between items-center'>
										<div>
											{billingInfo.paymentMethod.type === 'card' ? (
												<div>
													<p className='font-medium'>
														{billingInfo.paymentMethod.brand} ••••{' '}
														{billingInfo.paymentMethod.last4}
													</p>
												</div>
											) : (
												<div>
													<p className='font-medium'>PayPal</p>
													<p className='text-gray-600 text-sm'>
														{billingInfo.paymentMethod.email}
													</p>
												</div>
											)}
										</div>
										<button className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
											Update Payment Method
										</button>
									</div>
								) : (
									<div className='text-center py-4'>
										<p className='text-gray-600 mb-4'>
											No payment method on file
										</p>
										<button className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'>
											Add Payment Method
										</button>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Billing History Section */}
					{billingInfo && billingInfo.billingHistory.length > 0 && (
						<div>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								Billing History
							</h3>
							<div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
								<table className='min-w-full divide-y divide-gray-200'>
									<thead className='bg-gray-50'>
										<tr>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Date
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Description
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Amount
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Status
											</th>
										</tr>
									</thead>
									<tbody className='bg-white divide-y divide-gray-200'>
										{billingInfo.billingHistory.map(invoice => (
											<tr key={invoice.id}>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
													{new Date(invoice.date).toLocaleDateString()}
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
													{invoice.description}
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
													${invoice.amount.toFixed(2)}
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<span
														className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
															invoice.status === 'paid'
																? 'bg-green-100 text-green-800'
																: invoice.status === 'pending'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-red-100 text-red-800'
														}`}
													>
														{invoice.status.charAt(0).toUpperCase() +
															invoice.status.slice(1)}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Upgrade Modal */}
			{showUpgradeModal && selectedPlan && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='bg-white rounded-lg max-w-md w-full p-6'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>
							Upgrade to {selectedPlan.name}
						</h3>
						<p className='text-gray-600 mb-4'>
							You're about to upgrade to the {selectedPlan.name} plan for $
							{selectedPlan.price}/{selectedPlan.period}.
						</p>
						<div className='mb-6'>
							<h4 className='font-medium text-gray-900 mb-2'>
								You'll get access to:
							</h4>
							<ul className='text-sm text-gray-600 space-y-1'>
								{selectedPlan.features.map((feature, index) => (
									<li key={index} className='flex items-center'>
										<span className='text-green-500 mr-2'>✓</span>
										{feature}
									</li>
								))}
							</ul>
						</div>
						<div className='flex space-x-4'>
							<button
								onClick={() => setShowUpgradeModal(false)}
								className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
							>
								Cancel
							</button>
							<button
								onClick={processUpgrade}
								disabled={loading}
								className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
							>
								{loading ? 'Processing...' : 'Upgrade Now'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default BillingView;
