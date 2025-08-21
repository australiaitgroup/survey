import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
		<motion.nav
			className='bg-white shadow-sm sticky top-0 z-50 border-b border-[#EBEBEB]'
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
		>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='flex justify-between items-center h-20'>
					<div className='flex items-center'>
						<motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
							<Link to='/' className='flex items-center'>
								<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-10' />
							</Link>
						</motion.div>
					</div>

					{/* Desktop Navigation */}
					<div className='hidden md:flex items-center space-x-8'>
						{navLinks.map((link, index) => (
							<motion.div
								key={link.key}
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2, delay: 0.05 * index }}
								whileHover={{ scale: 1.05 }}
							>
								{link.href.startsWith('#') ? (
									<a
										href={link.href}
										className='text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out font-medium'
									>
										{t(`landing.footer.${link.key}`)}
									</a>
								) : (
									<Link
										to={link.href}
										className='text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out font-medium'
									>
										{t(`landing.footer.${link.key}`)}
									</Link>
								)}
							</motion.div>
						))}
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2, delay: 0.3 }}
						>
							<LanguageSwitcher />
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2, delay: 0.35 }}
							whileHover={{ scale: 1.05 }}
						>
							<Link
								to='/admin/login'
								className='text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out font-medium'
							>
								Login
							</Link>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2, delay: 0.4 }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<Link to='/admin/register' className='btn-primary whitespace-nowrap'>
								{t('landing.hero.startFreeTrial')}
							</Link>
						</motion.div>
					</div>

					{/* Mobile menu button */}
					<div className='md:hidden'>
						<motion.button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className='text-[#484848] hover:text-[#FF5A5F] transition-colors duration-200'
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
						>
							<AnimatePresence mode='wait'>
								{mobileMenuOpen ? (
									<motion.div
										key='close'
										initial={{ rotate: -90, opacity: 0 }}
										animate={{ rotate: 0, opacity: 1 }}
										exit={{ rotate: 90, opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										<XMarkIcon className='h-6 w-6' />
									</motion.div>
								) : (
									<motion.div
										key='open'
										initial={{ rotate: 90, opacity: 0 }}
										animate={{ rotate: 0, opacity: 1 }}
										exit={{ rotate: -90, opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										<Bars3Icon className='h-6 w-6' />
									</motion.div>
								)}
							</AnimatePresence>
						</motion.button>
					</div>
				</div>
			</div>

			{/* Full-screen Mobile Navigation Overlay */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						className='fixed inset-0 z-50 md:hidden'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{/* Background overlay */}
						<motion.div
							className='fixed inset-0 bg-black bg-opacity-50'
							onClick={() => setMobileMenuOpen(false)}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						></motion.div>

						{/* Menu content */}
						<motion.div
							className='fixed inset-0 bg-white'
							initial={{ y: '-100%' }}
							animate={{ y: 0 }}
							exit={{ y: '-100%' }}
							transition={{ duration: 0.25, ease: 'easeInOut' }}
						>
							{/* Header */}
							<div className='flex items-center justify-between p-6 border-b border-[#EBEBEB]'>
								<Link to='/' className='flex items-center'>
									<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-10' />
								</Link>
								<motion.button
									onClick={() => setMobileMenuOpen(false)}
									className='p-2 text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out'
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.9 }}
								>
									<XMarkIcon className='h-8 w-8' />
								</motion.button>
							</div>

							{/* Menu items */}
							<motion.div
								className='flex flex-col h-full'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.1, duration: 0.2 }}
							>
								<div className='flex-1 px-4 py-8 space-y-8'>
									{/* Navigation links */}
									<div className='space-y-6'>
										{navLinks.map((link, index) => (
											<motion.div
												key={link.key}
												initial={{ x: -50, opacity: 0 }}
												animate={{ x: 0, opacity: 1 }}
												transition={{
													delay: 0.15 + index * 0.05,
													duration: 0.2,
												}}
											>
												{link.href.startsWith('#') ? (
													<a
														href={link.href}
														className='block text-xl font-medium text-gray-900 hover:text-blue-600 transition duration-150 ease-in-out'
														onClick={() => setMobileMenuOpen(false)}
													>
														{t(`landing.footer.${link.key}`)}
													</a>
												) : (
													<Link
														to={link.href}
														className='block text-xl font-medium text-gray-900 hover:text-blue-600 transition duration-150 ease-in-out'
														onClick={() => setMobileMenuOpen(false)}
													>
														{t(`landing.footer.${link.key}`)}
													</Link>
												)}
											</motion.div>
										))}
									</div>

									{/* Language switcher */}
									<motion.div
										className='pt-6 border-t border-gray-200'
										initial={{ y: 20, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.4, duration: 0.2 }}
									>
										<p className='text-sm font-medium text-gray-500 mb-3'>
											Language
										</p>
										<LanguageSwitcher />
									</motion.div>

									{/* Auth links */}
									<motion.div
										className='space-y-4 pt-6 border-t border-[#EBEBEB]'
										initial={{ y: 20, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.5, duration: 0.2 }}
									>
										<Link
											to='/admin/login'
											className='block text-xl font-medium text-[#484848] hover:text-[#FF5A5F] transition duration-200 ease-in-out'
											onClick={() => setMobileMenuOpen(false)}
										>
											Login
										</Link>
										<motion.div
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
										>
											<Link
												to='/admin/register'
												className='btn-primary block w-full text-center py-4 text-lg'
												onClick={() => setMobileMenuOpen(false)}
											>
												{t('landing.hero.startFreeTrial')}
											</Link>
										</motion.div>
									</motion.div>
								</div>

								{/* Footer */}
								<motion.div
									className='px-4 py-6 border-t border-gray-200'
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.6, duration: 0.2 }}
								>
									<p className='text-sm text-gray-500 text-center'>
										© 2025 SigmaQ. All rights reserved.
									</p>
								</motion.div>
							</motion.div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.nav>
	);
};

export default LandingNavbar;
