import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';

const NavigationTabs: React.FC = () => {
	const { tab, setTab, navigate } = useAdmin();
	const { t: tCommon, i18n } = useTranslation();

	useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	useEffect(() => {
		const lng = (i18n.language || 'en').split('-')[0];
		// Debug: verify translation bundle and key resolution
		// eslint-disable-next-line no-console
	}, [i18n.language, i18n]);

	const handleTabClick = (newTab: 'list' | 'collections' | 'question-banks' | 'profile') => {
		setTab(newTab);
		if (newTab === 'list') {
			navigate('/admin');
		} else if (newTab === 'collections') {
			navigate('/admin/collections');
		} else if (newTab === 'question-banks') {
			navigate('/admin/question-banks');
		} else if (newTab === 'profile') {
			navigate('/admin/profile');
		}
	};

	// Don't show tabs when viewing survey or question bank details
	if (tab === 'detail') {
		return null;
	}

	return (
		<div className='flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6 overflow-x-auto'>
			<button
				onClick={() => handleTabClick('list')}
				className={`flex-1 min-w-[80px] rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
					tab === 'list'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}`}
			>
				{tCommon('navigation.surveys', 'Surveys')}
			</button>
			<button
				onClick={() => handleTabClick('collections')}
				className={`flex-1 min-w-[80px] rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
					tab === 'collections'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}`}
			>
				{tCommon('navigation.collections', 'Collections')}
			</button>
			<button
				onClick={() => handleTabClick('question-banks')}
				className={`flex-1 min-w-[80px] rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
					tab === 'question-banks'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}`}
			>
				{tCommon('navigation.questionBanks', 'Question Banks')}
			</button>
			<button
				onClick={() => handleTabClick('profile')}
				className={`flex-1 min-w-[80px] rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
					tab === 'profile'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}`}
			>
				{tCommon('navigation.profile', 'Profile')}
			</button>
		</div>
	);
};

export default NavigationTabs;
