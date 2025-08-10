import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';

const AdminHeader: React.FC = () => {
	const { setShowCreateModal, profileData } = useAdmin();
	const { t, i18n } = useTranslation('admin');

	// Get company name from profile data, fallback to "SigmaQ" if not available
	const companyName = profileData?.company?.name || 'SigmaQ';

	// Update document title when company name changes
	useEffect(() => {
		document.title = `${companyName} - Admin Dashboard`;
	}, [companyName]);

	return (
		<div className='mb-6'>
			{/* Desktop Layout */}
			<div className='hidden md:flex justify-between items-center'>
				<div />
                <div className='flex items-center gap-3' />
			</div>

			{/* Mobile Layout */}
			<div className='md:hidden'>
				<div className='mb-4'>
					<div className='flex justify-between items-start mb-2'>
						<div className='flex-1' />
						{/* Mobile Language Switcher */}
						<div className='flex bg-gray-100 rounded-md p-1 ml-3'>
							<button
								onClick={() => i18n.changeLanguage('en')}
								className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
									i18n.language === 'en'
										? 'bg-white text-gray-900 shadow-sm'
										: 'text-gray-600'
								}`}
							>
								EN
							</button>
							<button
								onClick={() => i18n.changeLanguage('zh')}
								className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
									i18n.language === 'zh'
										? 'bg-white text-gray-900 shadow-sm'
										: 'text-gray-600'
								}`}
							>
								中文
							</button>
						</div>
					</div>
				</div>

                <div className='mb-4' />
			</div>
		</div>
	);
};

export default AdminHeader;
