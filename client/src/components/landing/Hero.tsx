import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	return (
		<section className='relative bg-gradient-to-b from-[#F7F7F7] to-white py-24 lg:py-32 overflow-hidden'>
			{/* Decorative elements */}
			<motion.div
				className='absolute top-20 left-10 w-20 h-20 bg-[#FF5A5F]/10 rounded-full'
				animate={{
					y: [0, -20, 0],
					rotate: [0, 5, 0],
				}}
				transition={{
					duration: 6,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
			></motion.div>
			<motion.div
				className='absolute top-40 right-20 w-16 h-16 bg-[#FC642D]/10 rounded-full'
				animate={{
					y: [0, -15, 0],
					x: [0, 10, 0],
				}}
				transition={{
					duration: 8,
					repeat: Infinity,
					ease: 'easeInOut',
					delay: 2,
				}}
			></motion.div>
			<motion.div
				className='absolute bottom-20 left-1/4 w-12 h-12 bg-[#00A699]/10 rounded-full'
				animate={{
					y: [0, -10, 0],
					scale: [1, 1.1, 1],
				}}
				transition={{
					duration: 5,
					repeat: Infinity,
					ease: 'easeInOut',
					delay: 4,
				}}
			></motion.div>

			<div className='container mx-auto px-6 lg:px-8 relative z-10'>
				<div className='lg:grid lg:grid-cols-12 lg:gap-16 items-center'>
					<motion.div
						className='lg:col-span-6'
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
					>
						<motion.h1
							className='heading-xl mb-6'
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.2 }}
						>
							{t('landing.hero.title')}
						</motion.h1>
						<motion.p
							className='body-xl mb-10 max-w-2xl'
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.4 }}
						>
							{t('landing.hero.subtitle')}
						</motion.p>
						<motion.div
							className='flex flex-col sm:flex-row gap-3'
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.6 }}
						>
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Link
									to='/admin/register'
									className='btn-primary btn-large inline-flex items-center justify-center'
								>
									{t('landing.hero.startFreeTrial')}
								</Link>
							</motion.div>
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Link
									to='/demo'
									className='btn-secondary btn-large inline-flex items-center justify-center'
								>
									{t('landing.hero.seeLiveDemo')}
								</Link>
							</motion.div>
						</motion.div>
					</motion.div>
					<motion.div
						className='mt-16 lg:mt-0 lg:col-span-6'
						initial={{ opacity: 0, x: 100 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 1, delay: 0.3 }}
					>
						<div className='relative'>
							<motion.div
								className='absolute inset-0 bg-gradient-to-r from-[#FF5A5F] to-[#FC642D] rounded-3xl transform rotate-2 opacity-10'
								animate={{ rotate: [2, 4, 2] }}
								transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
							></motion.div>
							<motion.img
								src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&h=600&q=80'
								alt='SigmaQ Dashboard Preview'
								className='relative rounded-3xl shadow-2xl'
								whileHover={{ scale: 1.05, rotate: 1 }}
								transition={{ duration: 0.3 }}
								onError={e => {
									e.currentTarget.src =
										'https://via.placeholder.com/600x400/FF5A5F/ffffff?text=SigmaQ+Dashboard';
								}}
							/>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
