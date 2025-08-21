import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import useSubscription from '../hooks/useSubscription';

// Initialize Stripe
const getStripeKey = () => {
	const keyName = 'VITE_' + 'STRIPE_' + 'PUBLISHABLE_' + 'KEY';
	return import.meta.env[keyName];
};
const stripePromise = loadStripe(getStripeKey());

interface PlanFeatures {
	maxSurveys: number;
	maxQuestionsPerSurvey: number;
	maxInvitees: number;
	csvImport: boolean;
	imageQuestions: boolean;
	advancedAnalytics: boolean;
	randomQuestions: boolean;
	fullQuestionBank: boolean;
	templates: number;
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
	basic: {
		maxSurveys: 3,
		maxQuestionsPerSurvey: 20,
		maxInvitees: 30,
		csvImport: false,
		imageQuestions: false,
		advancedAnalytics: false,
		randomQuestions: false,
		fullQuestionBank: false,
		templates: 3,
	},
	pro: {
		maxSurveys: -1,
		maxQuestionsPerSurvey: -1,
		maxInvitees: -1,
		csvImport: true,
		imageQuestions: true,
		advancedAnalytics: true,
		randomQuestions: true,
		fullQuestionBank: true,
		templates: -1,
	},
};

const BillingPage: React.FC = () => {
	const { subscriptionInfo, loading, hasActiveSubscription, getFormattedEndDate, refetch } =
		useSubscription();

	const [processingCheckout, setProcessingCheckout] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [showCancelMessage, setShowCancelMessage] = useState(false);

	useEffect(() => {
		// Check for success/cancel messages from URL params
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('success') === 'true') {
			setShowSuccessMessage(true);
			refetch(); // Refresh subscription info
		}
		if (urlParams.get('canceled') === 'true') {
			setShowCancelMessage(true);
		}
	}, [refetch]);

	const handleSubscribe = async (planType: 'basic' | 'pro') => {
		setProcessingCheckout(true);

		try {
			const token = localStorage.getItem('token');
			const response = await axios.post(
				'/api/stripe/create-checkout-session',
				{ planType },
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				}
			);

			const stripe = await stripePromise;
			if (stripe) {
				const { error } = await stripe.redirectToCheckout({
					sessionId: response.data.sessionId,
				});

				if (error) {
					console.error('Stripe checkout error:', error);
				}
			}
		} catch (error) {
			console.error('Error creating checkout session:', error);
		} finally {
			setProcessingCheckout(false);
		}
	};

	const handleManageBilling = async () => {
		try {
			const token = localStorage.getItem('token');
			const response = await axios.post(
				'/api/stripe/create-portal-session',
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			window.location.href = response.data.url;
		} catch (error) {
			console.error('Error creating portal session:', error);
		}
	};

	const renderFeatureList = (features: PlanFeatures) => (
		<ul className='space-y-3 text-sm'>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>📊</span>
				<span>
					{features.maxSurveys === -1
						? 'Unlimited surveys'
						: `Up to ${features.maxSurveys} surveys`}
				</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>❓</span>
				<span>
					{features.maxQuestionsPerSurvey === -1
						? 'Unlimited questions per survey'
						: `Up to ${features.maxQuestionsPerSurvey} questions per survey`}
				</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>👥</span>
				<span>
					{features.maxInvitees === -1
						? 'Unlimited invitees'
						: `Up to ${features.maxInvitees} invitees`}
				</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>{features.csvImport ? '✅' : '❌'}</span>
				<span className={features.csvImport ? '' : 'text-gray-500'}>CSV bulk import</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>{features.imageQuestions ? '✅' : '❌'}</span>
				<span className={features.imageQuestions ? '' : 'text-gray-500'}>
					Image questions (Cloudinary)
				</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>{features.advancedAnalytics ? '📈' : '📊'}</span>
				<span>
					{features.advancedAnalytics
						? 'Advanced analytics & PDF export'
						: 'Basic analytics'}
				</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>{features.randomQuestions ? '✅' : '❌'}</span>
				<span className={features.randomQuestions ? '' : 'text-gray-500'}>
					Random question selection
				</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>🏦</span>
				<span>
					{features.fullQuestionBank ? 'Full question bank' : 'Limited question bank'}
				</span>
			</li>
			<li className='flex items-center'>
				<span className='mr-3 text-lg'>📝</span>
				<span>
					{features.templates === -1
						? 'All survey templates'
						: `${features.templates} survey templates`}
				</span>
			</li>
		</ul>
	);

	if (loading) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
			</div>
		);
	}

	return (
		<div className='max-w-7xl mx-auto p-6'>
			<div className='text-center mb-8'>
				<h1 className='text-4xl font-bold text-gray-900 mb-4'>Choose Your Plan</h1>
				<p className='text-xl text-gray-600'>
					Select the perfect plan for your survey needs
				</p>
			</div>

			{/* Success/Cancel Messages */}
			{showSuccessMessage && (
				<div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-8'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-green-400'
								viewBox='0 0 20 20'
								fill='currentColor'
							>
								<path
									fillRule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3'>
							<h3 className='text-sm font-medium text-green-800'>
								Subscription activated successfully!
							</h3>
							<div className='mt-2 text-sm text-green-700'>
								<p>
									Welcome to your new plan. You can now access all the features
									included in your subscription.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{showCancelMessage && (
				<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-yellow-400'
								viewBox='0 0 20 20'
								fill='currentColor'
							>
								<path
									fillRule='evenodd'
									d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3'>
							<h3 className='text-sm font-medium text-yellow-800'>
								Subscription setup was canceled
							</h3>
							<div className='mt-2 text-sm text-yellow-700'>
								<p>
									No worries! You can try again anytime. Choose a plan below to
									get started.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Current Subscription Status */}
			{hasActiveSubscription && (
				<div className='bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-8'>
					<div className='flex items-center justify-between'>
						<div>
							<h2 className='text-2xl font-semibold text-green-800 mb-2'>
								Active Subscription
							</h2>
							<div className='space-y-1'>
								<p className='text-green-700'>
									<span className='font-medium'>Plan:</span>{' '}
									{subscriptionInfo?.subscriptionTier?.toUpperCase()} Plan
								</p>
								<p className='text-green-700'>
									<span className='font-medium'>Status:</span>{' '}
									{subscriptionInfo?.subscriptionStatus}
								</p>
								{getFormattedEndDate() && (
									<p className='text-green-700'>
										<span className='font-medium'>Next billing:</span>{' '}
										{getFormattedEndDate()}
									</p>
								)}
								{subscriptionInfo?.subscriptionCancelAtPeriodEnd && (
									<p className='text-orange-600 font-medium'>
										⚠️ Subscription will cancel at the end of the current period
									</p>
								)}
							</div>
						</div>
						<div className='flex space-x-3'>
							<button
								onClick={handleManageBilling}
								className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors'
							>
								Manage Billing
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Pricing Plans */}
			<div className='grid lg:grid-cols-2 gap-8 mb-8'>
				{/* Basic Plan */}
				<div
					className={`relative border-2 rounded-xl p-8 ${
						subscriptionInfo?.subscriptionTier === 'basic'
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:border-blue-300 transition-colors'
					}`}
				>
					{subscriptionInfo?.subscriptionTier === 'basic' && (
						<div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
							<span className='bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium'>
								Current Plan
							</span>
						</div>
					)}

					<div className='text-center mb-8'>
						<h3 className='text-3xl font-bold text-gray-900'>Basic Plan</h3>
						<div className='mt-4'>
							<span className='text-5xl font-bold text-gray-900'>$19</span>
							<span className='text-xl text-gray-600'>/month</span>
						</div>
						<p className='text-gray-600 mt-2'>
							Perfect for small teams and individuals
						</p>
					</div>

					<div className='mb-8'>{renderFeatureList(PLAN_FEATURES.basic)}</div>

					<div className='mt-auto'>
						{subscriptionInfo?.subscriptionTier === 'basic' ? (
							<button
								disabled
								className='w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg cursor-not-allowed font-medium'
							>
								Current Plan
							</button>
						) : subscriptionInfo?.subscriptionTier === 'pro' ? (
							<button
								onClick={handleManageBilling}
								className='w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg transition-colors font-medium'
							>
								Downgrade to Basic
							</button>
						) : (
							<button
								onClick={() => handleSubscribe('basic')}
								disabled={processingCheckout}
								className='w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50 font-medium'
							>
								{processingCheckout ? 'Processing...' : 'Start with Basic'}
							</button>
						)}
					</div>
				</div>

				{/* Pro Plan */}
				<div
					className={`relative border-2 rounded-xl p-8 ${
						subscriptionInfo?.subscriptionTier === 'pro'
							? 'border-purple-500 bg-purple-50'
							: 'border-purple-200 hover:border-purple-300 transition-colors'
					}`}
				>
					<div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
						<span className='bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium'>
							{subscriptionInfo?.subscriptionTier === 'pro'
								? 'Current Plan'
								: 'Most Popular'}
						</span>
					</div>

					<div className='text-center mb-8'>
						<h3 className='text-3xl font-bold text-gray-900'>Pro Plan</h3>
						<div className='mt-4'>
							<span className='text-5xl font-bold text-gray-900'>$49</span>
							<span className='text-xl text-gray-600'>/month</span>
						</div>
						<p className='text-gray-600 mt-2'>For growing businesses and teams</p>
					</div>

					<div className='mb-8'>{renderFeatureList(PLAN_FEATURES.pro)}</div>

					<div className='mt-auto'>
						{subscriptionInfo?.subscriptionTier === 'pro' ? (
							<button
								disabled
								className='w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg cursor-not-allowed font-medium'
							>
								Current Plan
							</button>
						) : (
							<button
								onClick={() => handleSubscribe('pro')}
								disabled={processingCheckout}
								className='w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50 font-medium'
							>
								{processingCheckout
									? 'Processing...'
									: subscriptionInfo?.subscriptionTier === 'basic'
										? 'Upgrade to Pro'
										: 'Start with Pro'}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* No Subscription Message */}
			{!hasActiveSubscription && (
				<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center'>
					<div className='flex justify-center mb-4'>
						<svg
							className='h-12 w-12 text-yellow-500'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
							/>
						</svg>
					</div>
					<h3 className='text-lg font-semibold text-yellow-800 mb-2'>
						No Active Subscription
					</h3>
					<p className='text-yellow-700'>
						You need an active subscription to use the survey platform. Please choose a
						plan above to get started.
					</p>
				</div>
			)}

			{/* FAQ Section */}
			<div className='mt-16'>
				<h2 className='text-2xl font-bold text-center text-gray-900 mb-8'>
					Frequently Asked Questions
				</h2>
				<div className='grid md:grid-cols-2 gap-6'>
					<div className='bg-white p-6 rounded-lg border'>
						<h3 className='font-semibold text-gray-900 mb-2'>
							Can I change my plan anytime?
						</h3>
						<p className='text-gray-600'>
							Yes, you can upgrade or downgrade your plan at any time. Changes will be
							prorated and reflected in your next billing cycle.
						</p>
					</div>
					<div className='bg-white p-6 rounded-lg border'>
						<h3 className='font-semibold text-gray-900 mb-2'>
							What happens if I cancel?
						</h3>
						<p className='text-gray-600'>
							You can cancel anytime and will retain access to your plan features
							until the end of your current billing period.
						</p>
					</div>
					<div className='bg-white p-6 rounded-lg border'>
						<h3 className='font-semibold text-gray-900 mb-2'>Is my data secure?</h3>
						<p className='text-gray-600'>
							Yes, we use industry-standard encryption and security measures to
							protect your data and survey responses.
						</p>
					</div>
					<div className='bg-white p-6 rounded-lg border'>
						<h3 className='font-semibold text-gray-900 mb-2'>Do you offer refunds?</h3>
						<p className='text-gray-600'>
							We offer a 30-day money-back guarantee for new subscriptions. Contact
							support for assistance.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BillingPage;
