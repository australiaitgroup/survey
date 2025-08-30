import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

interface RecommendedBank {
	_id: string;
	title: string;
	description: string;
	type: 'FREE' | 'PAID';
	price?: number;
	questionCount: number;
	tags: string[];
	entitlement: string;
}

const OrderConfirmationPage: React.FC = () => {
	const { t } = useTranslation('admin');
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const bankId = searchParams.get('bank');
	const purchaseType = searchParams.get('type');

	const [bank, setBank] = useState<QuestionBank | null>(null);
	const [recommendedBanks, setRecommendedBanks] = useState<RecommendedBank[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!bankId) {
			setError('Invalid order details');
			setLoading(false);
			return;
		}

		fetchOrderDetails();
		fetchRecommendations();
	}, [bankId]);

	const fetchOrderDetails = async () => {
		try {
			const response = await api.get(`/public-banks/${bankId}`);
			setBank(response.data);
		} catch (error: any) {
			console.error('Error fetching bank details:', error);
			setError('Failed to load order details');
		}
	};

	const fetchRecommendations = async () => {
		try {
			// Fetch recommended banks based on similar tags
			const response = await api.get(`/public-banks?pageSize=3&type=all`);
			const filtered = response.data.banks
				.filter((b: RecommendedBank) => b._id !== bankId)
				.slice(0, 3);
			setRecommendedBanks(filtered);
		} catch (error: any) {
			console.error('Error fetching recommendations:', error);
			// Don't show error for recommendations, just continue without them
		} finally {
			setLoading(false);
		}
	};

	const formatPrice = (price?: number) => {
		if (!price) return '$0';
		return `$${price.toFixed(2)}`;
	};

	const handlePurchaseRecommended = async (recommendedBank: RecommendedBank) => {
		if (recommendedBank.type === 'FREE' || recommendedBank.price === 0) {
			navigate(`/admin/checkout?bank=${recommendedBank._id}`);
		} else {
			navigate(`/admin/checkout?bank=${recommendedBank._id}`);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-2 text-gray-600">Loading confirmation...</p>
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

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-3xl mx-auto px-4">
				{/* Success Header */}
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Successful!</h1>
					<p className="text-lg text-gray-600">
						✅ You've successfully added <strong>{bank.title}</strong> to your library.
					</p>
				</div>

				{/* Order Details */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h3 className="text-lg font-medium text-gray-900 mb-2">{bank.title}</h3>
								<p className="text-gray-600 mb-3">{bank.description}</p>

								{/* Tags */}
								<div className="flex flex-wrap gap-2 mb-3">
									{bank.tags.slice(0, 5).map((tag, index) => (
										<span
											key={index}
											className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
										>
											{tag}
										</span>
									))}
								</div>

								<div className="text-sm text-gray-500">
									{bank.questionCount} questions • {bank.type === 'FREE' ? 'Free' : 'Paid'} question bank
								</div>
							</div>

							<div className="text-right ml-6">
								<div className="text-2xl font-bold text-gray-900">
									{formatPrice(bank.price)}
								</div>
								<div className="text-sm text-gray-500">
									{purchaseType === 'free' ? 'Free' : 'One-time purchase'}
								</div>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="p-6">
						<div className="flex gap-3">
							<button
								onClick={() => navigate('/admin/question-banks')}
								className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
							>
								Go to My Question Banks
							</button>
							<button
								onClick={() => navigate(`/admin?preselectedBank=${bank._id}&t=${Date.now()}`)}
								className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
							>
								Use Now
							</button>
						</div>
					</div>
				</div>

				{/* Recommended Banks */}
				{recommendedBanks.length > 0 && (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200">
						<div className="p-6 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900 mb-2">You might also like</h2>
							<p className="text-gray-600">
								Expand your question library with these popular question banks
							</p>
						</div>

						<div className="p-6">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{recommendedBanks.map((recommendedBank) => (
									<div key={recommendedBank._id} className="border border-gray-200 rounded-lg p-4">
										<div className="mb-3">
											<h4 className="font-medium text-gray-900 mb-1">{recommendedBank.title}</h4>
											<p className="text-sm text-gray-600 line-clamp-2">{recommendedBank.description}</p>
										</div>

										{/* Tags */}
										<div className="flex flex-wrap gap-1 mb-3">
											{recommendedBank.tags.slice(0, 2).map((tag, index) => (
												<span
													key={index}
													className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
												>
													{tag}
												</span>
											))}
										</div>

										{/* Price and Action */}
										<div className="flex items-center justify-between">
											<div className="text-sm">
												<span className="font-medium text-gray-900">
													{formatPrice(recommendedBank.price)}
												</span>
												<span className="text-gray-500 ml-1">
													• {recommendedBank.questionCount} questions
												</span>
											</div>

											{recommendedBank.entitlement === 'Locked' ? (
												<button
													onClick={() => handlePurchaseRecommended(recommendedBank)}
													className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
												>
													{recommendedBank.type === 'FREE' ? 'Get' : 'Buy'}
												</button>
											) : (
												<span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded">
													Owned
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Upsell Text */}
						<div className="px-6 pb-6">
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<div className="flex items-start">
									<div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
										<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
										</svg>
									</div>
									<div>
										<h4 className="text-sm font-medium text-blue-800 mb-1">
											Build a comprehensive question library
										</h4>
										<p className="text-sm text-blue-700">
											Having multiple question banks allows you to create more diverse and comprehensive assessments for different roles and skill levels.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Back to Marketplace */}
				<div className="text-center mt-8">
					<button
						onClick={() => navigate('/admin/question-banks?tab=marketplace')}
						className="text-blue-600 hover:text-blue-800 font-medium"
					>
						← Back to Marketplace
					</button>
				</div>
			</div>
		</div>
	);
};

export default OrderConfirmationPage;
