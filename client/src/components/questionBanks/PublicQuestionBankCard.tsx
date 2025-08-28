import React, { useState } from 'react';
import { PublicQuestionBank } from '../../hooks/usePublicQuestionBanks';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import PublicBankPreviewModal from './PublicBankPreviewModal';
import CopyQuestionsModal from './CopyQuestionsModal';
import api from '../../utils/axiosConfig';

interface PublicQuestionBankCardProps {
	bank: PublicQuestionBank;
	onEntitlementChange?: () => void;
}

const PublicQuestionBankCard: React.FC<PublicQuestionBankCardProps> = ({
	bank,
	onEntitlementChange,
}) => {
	const { t } = useTranslation('admin');
	const { navigate } = useAdmin();
	const [loading, setLoading] = useState(false);
	const [localEntitlement, setLocalEntitlement] = useState(bank.entitlement);
	const [showPreviewModal, setShowPreviewModal] = useState(false);
	const [showCopyModal, setShowCopyModal] = useState(false);
	const [copyData, setCopyData] = useState<{
		sourceBankId: string;
		sourceBankTitle: string;
		questionIds: string[];
	} | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Format price display
	const formatPrice = (price?: number) => {
		if (!price) return '$0';
		return `$${price.toFixed(2)}`;
	};

	// Format date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	// Get entitlement badge style
	const getEntitlementStyle = (entitlement: string) => {
		switch (entitlement) {
			case 'Owned':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'Included':
				return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'Locked':
				return 'bg-gray-100 text-gray-600 border-gray-200';
			default:
				return 'bg-gray-100 text-gray-600 border-gray-200';
		}
	};

	// Get type badge style
	const getTypeBadgeStyle = (type: string) => {
		return type === 'FREE' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
	};

	// Handle free bank purchase (go through checkout)
	const handleFreePurchase = async () => {
		setLoading(true);
		try {
			const response = await api.post(`/public-banks/${bank._id}/purchase`);

			if (response.data.success) {
				if (response.data.checkoutUrl) {
					// Redirect to checkout page
					window.location.href = response.data.checkoutUrl;
				} else {
					// Direct success for free items
					setLocalEntitlement('Owned');
					onEntitlementChange?.();
					console.log('Free question bank purchased successfully');
				}
			}
		} catch (error: any) {
			console.error('Error purchasing question bank:', error);
			alert(error.response?.data?.error || 'Failed to purchase question bank');
		} finally {
			setLoading(false);
		}
	};

	// Handle one-time purchase
	const handleBuyOnce = async () => {
		setLoading(true);
		try {
			const response = await api.post(`/public-banks/${bank._id}/buy-once`);

			if (response.data.success) {
				if (response.data.checkoutUrl) {
					// Redirect to Stripe Checkout
					window.location.href = response.data.checkoutUrl;
				} else {
					// Simulated purchase (Stripe not configured)
					setLocalEntitlement('Owned');
					onEntitlementChange?.();
					alert(response.data.message || 'Purchase completed successfully');
				}
			}
		} catch (error: any) {
			console.error('Error purchasing question bank:', error);
			alert(error.response?.data?.error || 'Failed to purchase question bank');
		} finally {
			setLoading(false);
		}
	};

	// Handle subscription
	const handleSubscribe = async () => {
		setLoading(true);
		try {
			const response = await api.post(`/public-banks/${bank._id}/subscribe`);

			if (response.data.success) {
				if (response.data.checkoutUrl) {
					// Redirect to Stripe Checkout
					window.location.href = response.data.checkoutUrl;
				} else {
					// Simulated subscription (Stripe not configured)
					setLocalEntitlement('Owned');
					onEntitlementChange?.();
					alert(response.data.message || 'Subscription started successfully');
				}
			}
		} catch (error: any) {
			console.error('Error subscribing to question bank:', error);
			alert(error.response?.data?.error || 'Failed to start subscription');
		} finally {
			setLoading(false);
		}
	};

	// Handle "Use now" - navigate to survey creation with pre-selected bank
	const handleUseNow = () => {
		// Navigate to survey creation with this bank pre-selected
		// Add timestamp to force navigation even if already on admin page
		navigate(`/admin?preselectedBank=${bank._id}&t=${Date.now()}`);
	};

	// Handle preview button click
	const handlePreview = () => {
		setShowPreviewModal(true);
	};

	// Handle copy questions from preview modal
	const handleCopyQuestions = (sourceBankId: string, questionIds: string[]) => {
		setCopyData({
			sourceBankId,
			sourceBankTitle: bank.title,
			questionIds,
		});
		setShowCopyModal(true);
	};

	// Handle successful copy
	const handleCopySuccess = (targetBankName: string, copiedCount: number) => {
		setSuccessMessage(
			`Successfully copied ${copiedCount} question${copiedCount !== 1 ? 's' : ''} to "${targetBankName}"`
		);

		// Clear success message after 5 seconds
		setTimeout(() => setSuccessMessage(null), 5000);

		// Close modals
		setShowCopyModal(false);
		setCopyData(null);
	};

	// Render appropriate CTAs based on bank type and entitlement
	const renderCTAs = () => {
		const buttons = [];

		// Always add Preview button
		buttons.push(
			<button
				key='preview'
				onClick={handlePreview}
				className='flex-1 sm:flex-none px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors min-w-0'
			>
				{t('questionBanks.marketplace.preview', 'Preview')}
			</button>
		);

		if (bank.type === 'FREE') {
			if (localEntitlement === 'Included' || localEntitlement === 'Owned') {
				buttons.push(
					<button
						key='use'
						onClick={handleUseNow}
						className='flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors min-w-0'
					>
						{t('questionBanks.marketplace.useNow', 'Use now')}
					</button>
				);
			} else {
				buttons.push(
					<button
						key='purchase'
						onClick={handleFreePurchase}
						disabled={loading}
						className='flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-0'
					>
						{loading
							? t('questionBanks.marketplace.processing', 'Processing...')
							: t('questionBanks.marketplace.purchase', 'Purchase')}
					</button>
				);
			}
		} else {
			// PAID bank
			if (localEntitlement === 'Owned' || localEntitlement === 'Included') {
				buttons.push(
					<button
						key='use'
						onClick={handleUseNow}
						className='flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors min-w-0'
					>
						{t('questionBanks.marketplace.useNow', 'Use now')}
					</button>
				);
			} else {
				buttons.push(
					<button
						key='buy'
						onClick={handleBuyOnce}
						disabled={loading}
						className='flex-1 sm:flex-none px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-0'
					>
						{loading
							? t('questionBanks.marketplace.processing', 'Processing...')
							: t('questionBanks.marketplace.buyOnce', 'Buy once')}
					</button>
				);
				buttons.push(
					<button
						key='subscribe'
						onClick={handleSubscribe}
						disabled={loading}
						className='flex-1 sm:flex-none px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-0'
					>
						{loading
							? t('questionBanks.marketplace.processing', 'Processing...')
							: t('questionBanks.marketplace.subscribe', 'Subscribe')}
					</button>
				);
			}
		}

		return (
			<div className='w-full'>
				<div className='flex flex-wrap gap-2 sm:flex-nowrap'>{buttons}</div>
			</div>
		);
	};

	return (
		<>
			<div className='card hover:shadow-lg transition-shadow relative flex flex-col h-full'>
				{/* Card Content - Flex Grow */}
				<div className='flex-1 flex flex-col'>
					{/* Success Message */}
					{successMessage && (
						<div className='mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm'>
							{successMessage}
						</div>
					)}

					{/* Content Area - Flex Grow */}
					<div className='flex-1 flex flex-col'>
						{/* Title */}
						<h3 className='text-lg font-bold text-gray-800 mb-2'>{bank.title}</h3>

						{/* Status Badges - Below Title */}
						<div className='flex flex-wrap gap-2 mb-3'>
							{/* Type Badge */}
							<span
								className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeStyle(bank.type)}`}
							>
								{bank.type === 'FREE' ? '[Free]' : `${formatPrice(bank.price)}`}
							</span>
							{/* Entitlement Status Badge */}
							<span
								className={`px-2 py-1 text-xs font-medium rounded-full border ${getEntitlementStyle(localEntitlement)}`}
							>
								{localEntitlement === 'Owned' && '✓ '}
								{localEntitlement === 'Included' && '◉ '}
								{localEntitlement === 'Locked' && '🔒 '}
								{localEntitlement}
							</span>
						</div>

						{/* Description - truncated to 2 lines */}
						<p
							className='text-gray-600 text-sm mb-3 line-clamp-2'
							style={{
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{bank.description}
						</p>

						{/* Tags */}
						<div className='flex flex-wrap gap-1 mb-3'>
							{bank.tags.slice(0, 3).map((tag, index) => (
								<span
									key={index}
									className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md'
								>
									{tag}
								</span>
							))}
							{bank.tags.length > 3 && (
								<span className='px-2 py-1 text-xs text-gray-500'>
									+{bank.tags.length - 3} more
								</span>
							)}
						</div>

						{/* Meta Information */}
						<div className='flex items-center text-xs text-gray-500 mb-4'>
							<span>{bank.questionCount} questions</span>
							<span className='mx-2'>•</span>
							<span>Updated {formatDate(bank.lastUpdated)}</span>
						</div>

						{/* Spacer to push buttons to bottom */}
						<div className='flex-1'></div>
					</div>

					{/* Action Buttons - Always at Bottom */}
					<div className='border-t border-gray-100 pt-3 mt-auto'>{renderCTAs()}</div>
				</div>
			</div>

			{/* Modals */}
			<PublicBankPreviewModal
				isOpen={showPreviewModal}
				onClose={() => setShowPreviewModal(false)}
				bankId={bank._id}
				bankTitle={bank.title}
				onCopyQuestions={handleCopyQuestions}
			/>

			{copyData && (
				<CopyQuestionsModal
					isOpen={showCopyModal}
					onClose={() => setShowCopyModal(false)}
					sourceBankId={copyData.sourceBankId}
					sourceBankTitle={copyData.sourceBankTitle}
					questionIds={copyData.questionIds}
					onSuccess={handleCopySuccess}
				/>
			)}
		</>
	);
};

export default PublicQuestionBankCard;
