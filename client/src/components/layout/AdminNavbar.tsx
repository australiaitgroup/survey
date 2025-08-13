import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import {
	UserCircleIcon,
	ArrowRightOnRectangleIcon,
	Bars3Icon,
	XMarkIcon,
	LanguageIcon,
	ChevronDownIcon,
	CreditCardIcon,
	BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const AdminNavbar: React.FC = () => {
	const { logout, profileData, setShowCreateModal } = useAdmin();
	const navigate = useNavigate();
	const { t } = useTranslation('admin');
	const { t: tCommon } = useTranslation();
	const companyName = profileData?.company?.name || 'SigmaQ';
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
	const profileDropdownRef = useRef<HTMLDivElement>(null);

	const handleProfileClick = () => {
		navigate('/admin/profile');
		setProfileDropdownOpen(false);
		setMobileMenuOpen(false);
	};

	const handleLogout = () => {
		logout();
		setMobileMenuOpen(false);
	};

	const handleBillingClick = () => {
		navigate('/admin/profile?tab=billing');
		setProfileDropdownOpen(false);
		setMobileMenuOpen(false);
	};

	const handleCompanyInfoClick = () => {
		navigate('/admin/profile?tab=company');
		setProfileDropdownOpen(false);
		setMobileMenuOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
				setProfileDropdownOpen(false);
			}
		};

		if (profileDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [profileDropdownOpen]);

	return (
		<nav className='bg-white border-b border-gray-200 sticky top-0 z-50'>
			<div className='w-full mx-auto px-4' style={{ maxWidth: '1440px' }}>
				<div className='flex items-center h-16'>
					{/* Logo */}
					<Link to='/admin' className='flex items-center'>
						<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-10' />
					</Link>

					{/* Title & Subtitle next to logo (desktop) */}
					<div className='hidden md:flex flex-col ml-3'>
						<div className='text-sm font-semibold text-gray-900 leading-tight'>
							{t('dashboard.title', {
								companyName,
								defaultValue: `${companyName} Admin Dashboard`,
							})}
						</div>
						<div className='text-xs text-gray-500 leading-tight'>
							{t('dashboard.subtitle', {
								defaultValue: 'Manage your surveys, assessments and view responses',
							})}
						</div>
					</div>

					{/* Spacer */}
					<div className='flex-1' />

					{/* Desktop right controls */}
					<div className='hidden md:flex items-center space-x-1 lg:space-x-4 flex-shrink-0'>
						<LanguageSwitcher />

						<button
							className='btn-primary h-9 px-2 lg:px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0 min-w-0'
							onClick={() => setShowCreateModal(true)}
						>
							+ {t('survey.createSurvey', { defaultValue: 'Create Survey' })}
						</button>

						{/* Profile Dropdown */}
						<div className='relative' ref={profileDropdownRef}>
							<button
								onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
								className='flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-[#FF5A5F] transition-colors duration-200 cursor-pointer'
							>
								<UserCircleIcon className='w-5 h-5' />
								<span className='font-medium'>{tCommon('navigation.profile')}</span>
								<ChevronDownIcon className={`w-4 h-4 transition-transform ${
									profileDropdownOpen ? 'rotate-180' : ''
								}`} />
							</button>
							{profileDropdownOpen && (
								<div className='absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10'>
									<button
										onClick={() => {
											handleProfileClick();
											setProfileDropdownOpen(false);
										}}
										className='flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer'
									>
										<UserCircleIcon className='w-5 h-5' />
										<span className='font-medium'>{tCommon('navigation.profile')}</span>
									</button>
									<button
										onClick={handleCompanyInfoClick}
										className='flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer'
									>
										<BuildingOfficeIcon className='w-5 h-5' />
										<span className='font-medium'>{tCommon('navigation.companyInfo', { defaultValue: 'Company Info' })}</span>
									</button>
									<button
										onClick={handleBillingClick}
										className='flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer'
									>
										<CreditCardIcon className='w-5 h-5' />
										<span className='font-medium'>{tCommon('navigation.billing', { defaultValue: 'Billing' })}</span>
									</button>
									<div className='border-t border-gray-200'></div>
									<button
										onClick={() => {
											handleLogout();
											setProfileDropdownOpen(false);
										}}
										className='flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 cursor-pointer'
									>
										<ArrowRightOnRectangleIcon className='w-5 h-5' />
										<span className='font-medium'>{tCommon('buttons.logout')}</span>
									</button>
								</div>
							)}
						</div>
					</div>

					{/* Mobile menu button */}
					<div className='md:hidden ml-auto'>
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className='p-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 cursor-pointer'
						>
							{mobileMenuOpen ? (
								<XMarkIcon className='h-6 w-6' />
							) : (
								<Bars3Icon className='h-6 w-6' />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Navigation Menu */}
			{mobileMenuOpen && (
				<div className='md:hidden border-t border-gray-200 bg-white'>
					<div className='px-4 py-4 space-y-3'>
						{/* Title & Subtitle for mobile */}
						<div className='pb-3 border-b border-gray-100'>
							<div className='text-base font-semibold text-gray-900'>
								{t('dashboard.title', {
									companyName,
									defaultValue: `${companyName} Admin Dashboard`,
								})}
							</div>
							<div className='text-xs text-gray-500 mt-1'>
								{t('dashboard.subtitle', {
									defaultValue:
										'Manage your surveys, assessments and view responses',
								})}
							</div>
						</div>
						<div className='pb-3 border-b border-gray-100'>
							<LanguageSwitcher />
						</div>

						<button
							onClick={handleProfileClick}
							className='flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer'
						>
							<UserCircleIcon className='w-5 h-5' />
							<span className='font-medium'>{tCommon('navigation.profile')}</span>
						</button>

						<button
							onClick={handleCompanyInfoClick}
							className='flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer'
						>
							<BuildingOfficeIcon className='w-5 h-5' />
							<span className='font-medium'>{tCommon('navigation.companyInfo', { defaultValue: 'Company Info' })}</span>
						</button>

						<button
							onClick={handleBillingClick}
							className='flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer'
						>
							<CreditCardIcon className='w-5 h-5' />
							<span className='font-medium'>{tCommon('navigation.billing', { defaultValue: 'Billing' })}</span>
						</button>

						<div className='border-t border-gray-200 my-2'></div>

						<button
							onClick={handleLogout}
							className='flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200 cursor-pointer'
						>
							<ArrowRightOnRectangleIcon className='w-5 h-5' />
							<span className='font-medium'>{tCommon('buttons.logout')}</span>
						</button>
					</div>
				</div>
			)}
		</nav>
	);
};

export default AdminNavbar;
