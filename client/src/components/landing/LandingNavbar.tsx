import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '../common/LanguageSwitcher';

const LandingNavbar: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Handle escape key to close mobile menu
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && mobileMenuOpen) {
				setMobileMenuOpen(false);
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [mobileMenuOpen]);

	// Prevent body scroll when menu is open
	useEffect(() => {
		if (mobileMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [mobileMenuOpen]);

	const navLinks = [
		{ key: 'features', href: '/features' },
		{ key: 'pricing', href: '/pricing' },
		{ key: 'caseStudies', href: '/case-studies' },
		{ key: 'about', href: '/about' },
		{ key: 'contact', href: '/contact' },
	];

	return (
		<nav className='bg-white shadow-sm sticky top-0 z-50 border-b border-[#EBEBEB]'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='flex justify-between items-center h-20'>
					<div className='flex items-center'>
						<Link to='/' className='flex items-center'>
							<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-10' />
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div className='hidden md:flex items-center space-x-8'>
						{navLinks.map(link => (
							link.href.startsWith('#') ? (
								<a
									key={link.key}
									href={link.href}
									className='text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out font-medium'
								>
									{t(`landing.footer.${link.key}`)}
								</a>
							) : (
								<Link
									key={link.key}
									to={link.href}
									className='text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out font-medium'
								>
									{t(`landing.footer.${link.key}`)}
								</Link>
							)
						))}
						<LanguageSwitcher />
						<Link
							to='/admin/login'
							className='text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out font-medium'
						>
							Login
						</Link>
						<Link to='/admin/register' className='btn-primary'>
							{t('landing.hero.startFreeTrial')}
						</Link>
					</div>

					{/* Mobile menu button */}
					<div className='md:hidden'>
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className='text-[#484848] hover:text-[#FF5A5F] transition-colors duration-200'
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

			{/* Full-screen Mobile Navigation Overlay */}
			{mobileMenuOpen && (
				<div className='fixed inset-0 z-50 md:hidden'>
					{/* Background overlay */}
					<div
						className='fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300'
						onClick={() => setMobileMenuOpen(false)}
					></div>

					{/* Menu content */}
					<div className='fixed inset-0 bg-white transform transition-all duration-300 ease-in-out animate-in slide-in-from-top-full'>
						{/* Header */}
						<div className='flex items-center justify-between p-6 border-b border-[#EBEBEB]'>
							<Link to='/' className='flex items-center'>
								<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-10' />
							</Link>
							<button
								onClick={() => setMobileMenuOpen(false)}
								className='p-2 text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out'
							>
								<XMarkIcon className='h-8 w-8' />
							</button>
						</div>

						{/* Menu items */}
						<div className='flex flex-col h-full'>
							<div className='flex-1 px-4 py-8 space-y-8'>
								{/* Navigation links */}
								<div className='space-y-6'>
									{navLinks.map(link => (
										link.href.startsWith('#') ? (
											<a
												key={link.key}
												href={link.href}
												className='block text-xl font-medium text-gray-900 hover:text-blue-600 transition duration-150 ease-in-out'
												onClick={() => setMobileMenuOpen(false)}
											>
												{t(`landing.footer.${link.key}`)}
											</a>
										) : (
											<Link
												key={link.key}
												to={link.href}
												className='block text-xl font-medium text-gray-900 hover:text-blue-600 transition duration-150 ease-in-out'
												onClick={() => setMobileMenuOpen(false)}
											>
												{t(`landing.footer.${link.key}`)}
											</Link>
										)
									))}
								</div>

								{/* Language switcher */}
								<div className='pt-6 border-t border-gray-200'>
									<p className='text-sm font-medium text-gray-500 mb-3'>
										Language
									</p>
									<LanguageSwitcher />
								</div>

								{/* Auth links */}
								<div className='space-y-4 pt-6 border-t border-[#EBEBEB]'>
									<Link
										to='/admin/login'
										className='block text-xl font-medium text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out'
										onClick={() => setMobileMenuOpen(false)}
									>
										Login
									</Link>
									<Link
										to='/admin/register'
										className='btn-primary block w-full text-center py-4 text-lg'
										onClick={() => setMobileMenuOpen(false)}
									>
										{t('landing.hero.startFreeTrial')}
									</Link>
								</div>
							</div>

							{/* Footer */}
							<div className='px-4 py-6 border-t border-gray-200'>
								<p className='text-sm text-gray-500 text-center'>
									© 2025 SigmaQ. All rights reserved.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</nav>
	);
};

export default LandingNavbar;
