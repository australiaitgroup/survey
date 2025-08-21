import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QuestionBankListView from './QuestionBankListView';
import MarketplaceView from './MarketplaceView';

type TabType = 'my-banks' | 'marketplace';

const QuestionBanksTabbedView: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { t, i18n } = useTranslation('admin');
	const [activeTab, setActiveTab] = useState<TabType>('my-banks');

	useEffect(() => {
		i18n.loadNamespaces(['admin']).catch(() => {});
	}, [i18n]);

	// Read tab from URL query parameters
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const tabParam = params.get('tab');

		if (tabParam === 'marketplace') {
			setActiveTab('marketplace');
		} else {
			setActiveTab('my-banks');
		}
	}, [location.search]);

	// Update URL when tab changes
	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		const params = new URLSearchParams(location.search);
		params.set('tab', tab);
		navigate(`${location.pathname}?${params.toString()}`, { replace: true });
	};

	return (
		<div className='space-y-4'>
			{/* Segmented Tabs */}
			<div className='flex space-x-1 rounded-lg bg-gray-100 p-1 max-w-sm'>
				<button
					onClick={() => handleTabChange('my-banks')}
					className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
						activeTab === 'my-banks'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'
					}`}
				>
					{t('questionBanks.tabs.myBanks', 'My Banks')}
				</button>
				<button
					onClick={() => handleTabChange('marketplace')}
					className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
						activeTab === 'marketplace'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'
					}`}
				>
					{t('questionBanks.tabs.marketplace', 'Marketplace')}
				</button>
			</div>

			{/* Tab Content */}
			{activeTab === 'my-banks' ? <QuestionBankListView /> : <MarketplaceView />}
		</div>
	);
};

export default QuestionBanksTabbedView;
