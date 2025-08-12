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
		</div>
	);
};

export default AdminHeader;
