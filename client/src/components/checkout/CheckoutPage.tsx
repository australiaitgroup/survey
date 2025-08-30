import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import api from '../../utils/axiosConfig';

interface QuestionBank {
	_id: string;
	title: string;
	description: string;
	type: 'FREE' | 'PAID';
	price?: number;
	questionCount: number;
	tags: string[];
}

const CheckoutPage: React.FC = () => {
	const { t } = useTranslation('admin');
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const bankId = searchParams.get('bank');

	const [bank, setBank] = useState<QuestionBank | null>(null);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!bankId) {
			setError('Invalid bank ID');
			setLoading(false);
			return;
		}

		fetchBankDetails();
	}, [bankId]);

	const fetchBankDetails = async () => {
		try {
			const response = await api.get(`/public-banks/${bankId}`);
			setBank(response.data);
		} catch (error: any) {
			console.error('Error fetching bank details:', error);
			setError('Failed to load question bank details');
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmPurchase = async () => {
		if (!bank) return;

		setProcessing(true);
		try {
			if (bank.type === 'FREE' || bank.price === 0) {
				// Handle free purchase
				const response = await api.post(`/public-banks/${bank._id}/purchase-free`);

				if (response.data.success) {
					// Redirect to confirmation page
					navigate(`/admin/checkout/confirmation?bank=${bank._id}&type=free`);
				}
			} else {
				// Handle paid purchase - redirect to Stripe
				const response = await api.post(`/public-banks/${bank._id}/buy-once`);

				if (response.data.checkoutUrl) {
					window.location.href = response.data.checkoutUrl;
				} else {
					// Simulated purchase
					navigate(`/admin/checkout/confirmation?bank=${bank._id}&type=paid`);
				}
			}
		} catch (error: any) {
			console.error('Error processing purchase:', error);
			setError(error.response?.data?.error || 'Failed to process purchase');
		} finally {
			setProcessing(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-2 text-gray-600">Loading checkout...</p>
				</div>
			</div>
		);
	}

	if (error || !bank) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
					<div className="text-center">
						<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
						<p className="text-gray-600 mb-4">{error}</p>
						<button
							onClick={() => navigate('/admin/question-banks?tab=marketplace')}
							className="btn-primary"
						>
							Back to Marketplace
						</button>
					</div>
				</div>
			</div>
		);
	}

	const isFreePurchase = bank.type === 'FREE' || bank.price === 0;

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-2xl mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
					<p className="text-gray-600 mt-2">Review your purchase details</p>
				</div>

				{/* Checkout Card */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					{/* Bank Details */}
					<div className="p-6 border-b border-gray-200">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h2 className="text-xl font-semibold text-gray-900 mb-2">{bank.title}</h2>
								<p className="text-gray-600 mb-4">{bank.description}</p>

								{/* Tags */}
								<div className="flex flex-wrap gap-2 mb-4">
									{bank.tags.slice(0, 3).map((tag, index) => (
										<span
											key={index}
											className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
										>
											{tag}
										</span>
									))}
									{bank.tags.length > 3 && (
										<span className="px-2 py-1 text-xs text-gray-500">
											+{bank.tags.length - 3} more
										</span>
									)}
								</div>

								{/* Question Count */}
								<div className="text-sm text-gray-500">
									{bank.questionCount} questions included
								</div>
							</div>

							{/* Price */}
							<div className="text-right ml-6">
								<div className="text-2xl font-bold text-gray-900">
									{isFreePurchase ? '$0' : `$${bank.price?.toFixed(2)}`}
								</div>
								<div className="text-sm text-gray-500">
									{isFreePurchase ? 'Free' : 'One-time purchase'}
								</div>
							</div>
						</div>
					</div>

					{/* Payment Section */}
					<div className="p-6">
						{isFreePurchase ? (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
								<div className="flex items-center">
									<div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
										<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</div>
									<div>
										<h3 className="text-sm font-medium text-green-800">No Payment Required</h3>
										<p className="text-sm text-green-700 mt-1">
											This question bank is free. Click confirm to add it to your library.
										</p>
									</div>
								</div>
							</div>
						) : (
							<div className="mb-6">
								<h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
								<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<span className="text-gray-700">Total Amount</span>
										<span className="text-xl font-semibold text-gray-900">
											${bank.price?.toFixed(2)}
										</span>
									</div>
								</div>
								<p className="text-sm text-gray-500 mt-2">
									You will be redirected to Stripe to complete your payment securely.
								</p>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={() => navigate('/admin/question-banks?tab=marketplace')}
								className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
								disabled={processing}
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmPurchase}
								disabled={processing}
								className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
							>
								{processing ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Processing...
									</>
								) : (
									isFreePurchase ? 'Confirm Purchase' : 'Continue to Payment'
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Security Notice */}
				<div className="text-center mt-6">
					<div className="flex items-center justify-center text-sm text-gray-500">
						<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						Secure checkout powered by Stripe
					</div>
				</div>
			</div>
		</div>
	);
};

export default CheckoutPage;
