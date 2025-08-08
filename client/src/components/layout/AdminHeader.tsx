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
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>
						{t('dashboard.title', {
							companyName,
							defaultValue: `${companyName} Admin Dashboard`,
						})}
					</h1>
					<p className='text-gray-600 mt-1'>
						{t('dashboard.subtitle', {
							defaultValue: 'Manage your surveys, assessments and view responses',
						})}
					</p>
				</div>
				<div className='flex items-center gap-3'>
					<button className='btn-primary' onClick={() => setShowCreateModal(true)}>
						+ {t('survey.createSurvey', { defaultValue: 'Create Survey' })}
					</button>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className='md:hidden'>
				<div className='mb-4'>
					<div className='flex justify-between items-start mb-2'>
						<div className='flex-1'>
							<h1 className='text-2xl font-bold text-gray-900'>
								{t('dashboard.title', {
									companyName,
									defaultValue: `${companyName} Admin Dashboard`,
								})}
							</h1>
							<p className='text-gray-600 text-sm mt-1'>
								{t('dashboard.subtitle', {
									defaultValue:
										'Manage your surveys, assessments and view responses',
								})}
							</p>
						</div>
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

				<div className='mb-4'>
					<button className='w-full btn-primary' onClick={() => setShowCreateModal(true)}>
						+ {t('survey.createSurvey', { defaultValue: 'Create Survey' })}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminHeader;
