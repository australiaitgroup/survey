import React from 'react';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useAdmin } from '../../contexts/AdminContext';
import QuestionBankCard from './QuestionBankCard';
import PublicQuestionBankCard from './PublicQuestionBankCard';
import { usePublicBanksForSurvey } from '../../hooks/usePublicBanksForSurvey';
import { usePublicBankRecommendations } from '../../hooks/usePublicBankRecommendations';
import { useTranslation } from 'react-i18next';

const QuestionBankListView: React.FC = () => {
	const { questionBanks } = useQuestionBanks();
	const { setShowQuestionBankModal, navigate } = useAdmin();
	const { authorized, locked } = usePublicBanksForSurvey();
	const { recommendations: randomRecommendations, refresh: refreshRecommendations } = usePublicBankRecommendations(4); // Get 4 random recommendations
	const { t, i18n } = useTranslation('admin');

	React.useEffect(() => {
		i18n.loadNamespaces(['admin']).catch(() => {});
	}, [i18n]);

	// All question banks are now local only (not mixed with purchased ones)
	const localBanks = questionBanks;

	// Convert PublicBankForSurvey to PublicQuestionBank format for compatibility
	const convertToPublicQuestionBank = (bank: any) => ({
		_id: bank._id,
		title: bank.title,
		description: bank.description,
		tags: bank.tags || [],
		questionCount: bank.questionCount,
		lastUpdated: bank.lastUpdated,
		type: bank.type,
		price: bank.price,
		entitlement: bank.accessType || 'Locked',
	});

	// Get purchased banks (owned/subscription only)
	const purchasedBanks = authorized
		.filter((b: any) => b.accessType === 'Owned' || b.accessType === 'Subscription')
		.map(convertToPublicQuestionBank);

	// Use random recommendations instead of just locked banks
	const recommendedBanks = randomRecommendations;

	const handleGoToMarketplace = () => {
		navigate('/admin/question-banks?tab=marketplace');
	};

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h2 className='text-xl font-semibold text-gray-800'>
					{t('questionBanks.title', 'My Question Banks')}
				</h2>
				<div className='flex gap-2'>
					<button className='btn-primary' onClick={() => setShowQuestionBankModal(true)}>
						+ {t('questionBanks.createButton', 'Create Question Bank')}
					</button>
				</div>
			</div>

			{localBanks.length === 0 && purchasedBanks.length === 0 ? (
				<div className='space-y-6'>
					{/* Empty State with Create Guidance */}
					<div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
						<div className='max-w-md mx-auto'>
							<div className='mb-4'>
								<svg
									className='mx-auto h-12 w-12 text-gray-400'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
									/>
								</svg>
							</div>
							<h3 className='text-lg font-medium text-gray-900 mb-2'>
								{t('questionBanks.empty.title', 'No question banks yet')}
							</h3>
							<p className='text-gray-500 mb-6'>
								{t(
									'questionBanks.empty.description',
									'Create your first question bank to organize your questions and build surveys.'
								)}
							</p>
							<div className='space-y-3'>
								<button
									className='btn-primary w-full'
									onClick={() => setShowQuestionBankModal(true)}
								>
									+ Create Your First Question Bank
								</button>
								<button
									className='btn-secondary w-full'
									onClick={handleGoToMarketplace}
								>
									Browse Public Question Banks
								</button>
							</div>
						</div>
					</div>

					{/* Recommended Public Banks Section */}
					<div className='space-y-4'>
						<div className='flex justify-between items-center'>
							<div className='flex items-center gap-3'>
								<h3 className='text-lg font-medium text-gray-800'>
									推荐题库
								</h3>
								<button
									onClick={refreshRecommendations}
									className='p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors'
									title='刷新推荐'
								>
									<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
									</svg>
								</button>
							</div>
							<button
								className='text-blue-600 hover:text-blue-800 text-sm font-medium'
								onClick={handleGoToMarketplace}
							>
								浏览更多 →
							</button>
						</div>
						{recommendedBanks.length > 0 ? (
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch'>
								{recommendedBanks.map(bank => (
									<PublicQuestionBankCard key={bank._id} bank={bank} />
								))}
							</div>
						) : (
							<div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
								<div className='w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center'>
									<svg className='w-6 h-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
									</svg>
								</div>
								<p className='text-gray-600 mb-3'>暂无推荐题库</p>
								<button
									onClick={handleGoToMarketplace}
									className='text-blue-600 hover:text-blue-800 font-medium'
								>
									去市场看看 →
								</button>
							</div>
						)}
					</div>
				</div>
			) : (
				<div className='space-y-8'>
					{/* My Created Banks Section */}
					{localBanks.length > 0 && (
						<div className='space-y-4'>
							<h3 className='text-lg font-medium text-gray-800'>我创建的题库</h3>
							<div className='grid gap-4'>
								{localBanks.map(bank => (
									<QuestionBankCard key={bank._id} bank={bank} />
								))}
							</div>
						</div>
					)}

					{/* Purchased Banks Section */}
					{purchasedBanks.length > 0 && (
						<div className='space-y-4'>
							<div className='flex justify-between items-center'>
								<h3 className='text-lg font-medium text-gray-800'>
									已购买的题库
									<span className='ml-2 text-sm text-gray-500'>
										({purchasedBanks.length})
									</span>
								</h3>
								<button
									className='text-blue-600 hover:text-blue-800 text-sm font-medium'
									onClick={handleGoToMarketplace}
								>
									浏览更多 →
								</button>
							</div>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
								{purchasedBanks.map(bank => (
									<PublicQuestionBankCard key={bank._id} bank={bank} />
								))}
							</div>
						</div>
					)}

					{/* Recommended Public Banks Section */}
					<div className='space-y-4 border-t pt-6'>
						<div className='flex justify-between items-center'>
							<div className='flex items-center gap-3'>
								<h3 className='text-lg font-medium text-gray-800'>推荐题库</h3>
								<button
									onClick={refreshRecommendations}
									className='p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors'
									title='刷新推荐'
								>
									<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
									</svg>
								</button>
							</div>
							<button
								className='text-blue-600 hover:text-blue-800 text-sm font-medium'
								onClick={handleGoToMarketplace}
							>
								浏览市场 →
							</button>
						</div>
						{recommendedBanks.length > 0 ? (
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch'>
								{recommendedBanks.map(bank => (
									<PublicQuestionBankCard key={bank._id} bank={bank} />
								))}
							</div>
						) : (
							<div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
								<div className='w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center'>
									<svg className='w-6 h-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
									</svg>
								</div>
								<p className='text-gray-600 mb-3'>暂无推荐题库</p>
								<button
									onClick={handleGoToMarketplace}
									className='text-blue-600 hover:text-blue-800 font-medium'
								>
									去市场看看 →
								</button>
							</div>
						)}
					</div>

					{/* Show create prompt if no local banks */}
					{localBanks.length === 0 && (
						<div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
							<p className='text-gray-600 mb-4'>您还没有创建任何题库</p>
							<button
								className='btn-primary'
								onClick={() => setShowQuestionBankModal(true)}
							>
								+ 创建第一个题库
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default QuestionBankListView;
