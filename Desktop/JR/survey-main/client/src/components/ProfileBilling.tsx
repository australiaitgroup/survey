import React, { useState } from 'react';
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

const PLAN_DETAILS = {
	free: {
		name: 'Free Plan',
		price: 0,
		description: '适合个人试用的基础版本',
		features: {
			maxSurveys: 3,
			maxQuestionsPerSurvey: 10,
			maxInvitees: 10,
			csvImport: false,
			imageQuestions: false,
			advancedAnalytics: false,
			randomQuestions: false,
			fullQuestionBank: false,
			templates: 1,
		},
		highlights: [
			'创建最多3个调查问卷',
			'每个问卷最多10道题目',
			'邀请最多10位用户参与',
			'基础数据分析功能',
			'1套问卷模板',
			'基础题库管理功能',
		],
	},
	basic: {
		name: 'Basic Plan',
		price: 19,
		description: '适合个人用户和小团队的进阶功能',
		features: {
			maxSurveys: 10,
			maxQuestionsPerSurvey: 20,
			maxInvitees: 30,
			csvImport: false,
			imageQuestions: false,
			advancedAnalytics: false,
			randomQuestions: false,
			fullQuestionBank: false,
			templates: 3,
		},
		highlights: [
			'创建最多10个调查问卷',
			'每个问卷最多20道题目',
			'邀请最多30位用户参与',
			'基础数据分析功能',
			'3套问卷模板',
			'有限题库管理功能',
		],
	},
	pro: {
		name: 'Pro Plan',
		price: 49,
		description: '为成长型企业和团队提供的全功能解决方案',
		features: {
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
		highlights: [
			'无限制创建调查问卷',
			'每个问卷无限制题目数量',
			'无限制邀请用户参与',
			'支持CSV批量导入题库',
			'支持图片题目（图文题）',
			'高级数据分析和PDF导出',
			'支持随机抽题功能',
			'完整题库管理功能',
			'所有问卷模板',
		],
	},
};

const ProfileBilling: React.FC = () => {
	const {
		subscriptionInfo,
		loading,
		hasActiveSubscription,
		getFormattedEndDate,
		canUpgrade,
		canDowngrade,
		refetch,
	} = useSubscription();

	const [processingAction, setProcessingAction] = useState<string | null>(null);
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);

	const handleSubscribe = async (planType: 'basic' | 'pro') => {
		setProcessingAction(`subscribe-${planType}`);

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
			setProcessingAction(null);
		}
	};

	const handleManageBilling = async () => {
		setProcessingAction('manage');

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
		} finally {
			setProcessingAction(null);
		}
	};

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			active: { color: 'bg-green-100 text-green-800', text: '活跃' },
			trialing: { color: 'bg-blue-100 text-blue-800', text: '试用中' },
			past_due: { color: 'bg-yellow-100 text-yellow-800', text: '逾期' },
			canceled: { color: 'bg-red-100 text-red-800', text: '已取消' },
			incomplete: { color: 'bg-gray-100 text-gray-800', text: '未完成' },
		};

		const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.incomplete;

		return (
			<span
				className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
			>
				{config.text}
			</span>
		);
	};

	const renderFeatureList = (features: string[]) => (
		<ul className='space-y-2'>
			{features.map((feature, index) => (
				<li key={index} className='flex items-start'>
					<svg
						className='flex-shrink-0 h-5 w-5 text-green-500 mt-0.5'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M5 13l4 4L19 7'
						/>
					</svg>
					<span className='ml-2 text-sm text-gray-700'>{feature}</span>
				</li>
			))}
		</ul>
	);

	if (loading) {
		return (
			<div className='flex justify-center items-center py-12'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Current Subscription Status */}
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-medium text-gray-900'>当前套餐</h3>
					{subscriptionInfo?.subscriptionStatus ? (
						getStatusBadge(subscriptionInfo.subscriptionStatus)
					) : (
						<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
							免费用户
						</span>
					)}
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<div>
						<dl className='space-y-3'>
							<div>
								<dt className='text-sm font-medium text-gray-500'>套餐类型</dt>
								<dd className='text-lg font-semibold text-gray-900 capitalize'>
									{subscriptionInfo?.subscriptionTier || 'free'} Plan
								</dd>
							</div>
							<div>
								<dt className='text-sm font-medium text-gray-500'>月费</dt>
								<dd className='text-lg font-semibold text-gray-900'>
									{subscriptionInfo?.subscriptionTier === 'basic'
										? '$19'
										: subscriptionInfo?.subscriptionTier === 'pro'
											? '$49'
											: '免费'}
									/月
								</dd>
							</div>
							{getFormattedEndDate() && (
								<div>
									<dt className='text-sm font-medium text-gray-500'>
										下次计费日期
									</dt>
									<dd className='text-sm text-gray-900'>
										{getFormattedEndDate()}
									</dd>
								</div>
							)}
							{subscriptionInfo?.subscriptionCancelAtPeriodEnd && (
								<div>
									<dt className='text-sm font-medium text-gray-500'>取消状态</dt>
									<dd className='text-sm text-orange-600 font-medium'>
										订阅将在当前计费周期结束时取消
									</dd>
								</div>
							)}
						</dl>
					</div>

					<div className='flex flex-col space-y-3'>
						{hasActiveSubscription && subscriptionInfo?.subscriptionTier !== 'free' && (
							<button
								onClick={handleManageBilling}
								disabled={processingAction === 'manage'}
								className='w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50'
							>
								{processingAction === 'manage' ? '处理中...' : '管理订阅'}
							</button>
						)}

						{canUpgrade() && (
							<button
								onClick={() => handleSubscribe('pro')}
								disabled={processingAction === 'subscribe-pro'}
								className='w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50'
							>
								{processingAction === 'subscribe-pro' ? '处理中...' : '升级到Pro'}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Plan Comparison */}
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<h3 className='text-lg font-medium text-gray-900 mb-6'>订阅套餐对比</h3>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Free Plan */}
					<div
						className={`border-2 rounded-lg p-6 ${
							(subscriptionInfo?.subscriptionTier || 'free') === 'free'
								? 'border-gray-500 bg-gray-50'
								: 'border-gray-200'
						}`}
					>
						{(subscriptionInfo?.subscriptionTier || 'free') === 'free' && (
							<div className='mb-4'>
								<span className='bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
									当前套餐
								</span>
							</div>
						)}

						<div className='mb-4'>
							<h4 className='text-xl font-bold text-gray-900'>
								{PLAN_DETAILS.free.name}
							</h4>
							<div className='mt-2'>
								<span className='text-3xl font-bold text-gray-900'>免费</span>
							</div>
							<p className='text-sm text-gray-600 mt-2'>
								{PLAN_DETAILS.free.description}
							</p>
						</div>

						<div className='mb-6'>
							{renderFeatureList(PLAN_DETAILS.free.highlights)}
						</div>

						{(subscriptionInfo?.subscriptionTier || 'free') !== 'free' && (
							<button
								disabled
								className='w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed'
							>
								当前套餐
							</button>
						)}
					</div>

					{/* Basic Plan */}
					<div
						className={`border-2 rounded-lg p-6 ${
							subscriptionInfo?.subscriptionTier === 'basic'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200'
						}`}
					>
						{subscriptionInfo?.subscriptionTier === 'basic' && (
							<div className='mb-4'>
								<span className='bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
									当前套餐
								</span>
							</div>
						)}

						<div className='mb-4'>
							<h4 className='text-xl font-bold text-gray-900'>
								{PLAN_DETAILS.basic.name}
							</h4>
							<div className='mt-2'>
								<span className='text-3xl font-bold text-gray-900'>
									${PLAN_DETAILS.basic.price}
								</span>
								<span className='text-gray-600'>/月</span>
							</div>
							<p className='text-sm text-gray-600 mt-2'>
								{PLAN_DETAILS.basic.description}
							</p>
						</div>

						<div className='mb-6'>
							{renderFeatureList(PLAN_DETAILS.basic.highlights)}
						</div>

						{subscriptionInfo?.subscriptionTier !== 'basic' && (
							<button
								onClick={() => handleSubscribe('basic')}
								disabled={!!processingAction}
								className='w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50'
							>
								{processingAction === 'subscribe-basic'
									? '处理中...'
									: subscriptionInfo?.subscriptionTier === 'pro'
										? '降级到Basic'
										: '升级到Basic'}
							</button>
						)}
					</div>

					{/* Pro Plan */}
					<div
						className={`border-2 rounded-lg p-6 relative ${
							subscriptionInfo?.subscriptionTier === 'pro'
								? 'border-purple-500 bg-purple-50'
								: 'border-purple-200'
						}`}
					>
						<div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
							<span className='bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
								{subscriptionInfo?.subscriptionTier === 'pro' ? '当前套餐' : '推荐'}
							</span>
						</div>

						<div className='mb-4'>
							<h4 className='text-xl font-bold text-gray-900'>
								{PLAN_DETAILS.pro.name}
							</h4>
							<div className='mt-2'>
								<span className='text-3xl font-bold text-gray-900'>
									${PLAN_DETAILS.pro.price}
								</span>
								<span className='text-gray-600'>/月</span>
							</div>
							<p className='text-sm text-gray-600 mt-2'>
								{PLAN_DETAILS.pro.description}
							</p>
						</div>

						<div className='mb-6'>{renderFeatureList(PLAN_DETAILS.pro.highlights)}</div>

						{subscriptionInfo?.subscriptionTier !== 'pro' && (
							<button
								onClick={() => handleSubscribe('pro')}
								disabled={!!processingAction}
								className='w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50'
							>
								{processingAction === 'subscribe-pro' ? '处理中...' : '升级到Pro'}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Free Plan Info */}
			{(subscriptionInfo?.subscriptionTier || 'free') === 'free' && (
				<div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-blue-400'
								viewBox='0 0 20 20'
								fill='currentColor'
							>
								<path
									fillRule='evenodd'
									d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3'>
							<h3 className='text-sm font-medium text-blue-800'>免费套餐用户</h3>
							<div className='mt-2 text-sm text-blue-700'>
								<p>
									您正在使用免费套餐，可以创建最多3个调查问卷。升级到付费套餐可以解锁更多功能和更高的使用限制。
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Billing History & FAQ */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* FAQ */}
				<div className='bg-white rounded-lg border border-gray-200 p-6'>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>常见问题</h3>
					<div className='space-y-4'>
						<div>
							<h4 className='text-sm font-medium text-gray-900 mb-1'>
								可以随时更改套餐吗？
							</h4>
							<p className='text-sm text-gray-600'>
								是的，您可以随时升级或降级套餐。更改将按比例计费，并在下个计费周期生效。
							</p>
						</div>
						<div>
							<h4 className='text-sm font-medium text-gray-900 mb-1'>
								取消订阅后会怎样？
							</h4>
							<p className='text-sm text-gray-600'>
								您可以随时取消订阅，在当前计费周期结束前仍可使用所有功能。
							</p>
						</div>
						<div>
							<h4 className='text-sm font-medium text-gray-900 mb-1'>
								数据安全如何保障？
							</h4>
							<p className='text-sm text-gray-600'>
								我们使用行业标准的加密和安全措施来保护您的数据和调查回复。
							</p>
						</div>
						<div>
							<h4 className='text-sm font-medium text-gray-900 mb-1'>
								是否提供退款？
							</h4>
							<p className='text-sm text-gray-600'>
								新订阅用户享有30天退款保证。如需帮助，请联系客服。
							</p>
						</div>
					</div>
				</div>

				{/* Support */}
				<div className='bg-white rounded-lg border border-gray-200 p-6'>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>需要帮助？</h3>
					<div className='space-y-4'>
						<div className='flex items-start'>
							<div className='flex-shrink-0'>
								<svg
									className='h-5 w-5 text-blue-500 mt-0.5'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
									/>
								</svg>
							</div>
							<div className='ml-3'>
								<h4 className='text-sm font-medium text-gray-900'>在线客服</h4>
								<p className='text-sm text-gray-600'>
									工作日 9:00-18:00 为您提供实时帮助
								</p>
							</div>
						</div>

						<div className='flex items-start'>
							<div className='flex-shrink-0'>
								<svg
									className='h-5 w-5 text-blue-500 mt-0.5'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
									/>
								</svg>
							</div>
							<div className='ml-3'>
								<h4 className='text-sm font-medium text-gray-900'>邮件支持</h4>
								<p className='text-sm text-gray-600'>support@surveyapp.com</p>
							</div>
						</div>

						<div className='flex items-start'>
							<div className='flex-shrink-0'>
								<svg
									className='h-5 w-5 text-blue-500 mt-0.5'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253'
									/>
								</svg>
							</div>
							<div className='ml-3'>
								<h4 className='text-sm font-medium text-gray-900'>帮助文档</h4>
								<p className='text-sm text-gray-600'>查看详细的使用指南和教程</p>
							</div>
						</div>
					</div>

					<div className='mt-6'>
						<button className='w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors'>
							联系客服
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfileBilling;
