import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon, BoltIcon, AcademicCapIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const ProductSuite: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const products = [
		{ key: 'surveys', icon: ClipboardDocumentListIcon },
		{ key: 'assessments', icon: AcademicCapIcon },
		{ key: 'liveQuiz', icon: BoltIcon },
		{ key: 'onboarding', icon: UserPlusIcon },
	];

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.15,
				delayChildren: 0.2
			}
		}
	};

	const cardVariants = {
		hidden: { opacity: 0, x: -60, rotateY: -15 },
		visible: {
			opacity: 1,
			x: 0,
			rotateY: 0,
			transition: {
				duration: 0.8,
				ease: "easeOut"
			}
		}
	};

	return (
		<section id='products' className='py-24 bg-white'>
			<div className='container mx-auto px-6 lg:px-8'>
				<motion.div 
					className='text-center mb-12'
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
				>
					<motion.h2 
						className='heading-lg mb-4'
						initial={{ opacity: 0, scale: 0.8 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						{t('landing.productSuite.title')}
					</motion.h2>
					<motion.p 
						className='body-lg text-[#767676] max-w-3xl mx-auto'
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						{t('landing.productSuite.subtitle')}
					</motion.p>
				</motion.div>

				<motion.div 
					className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-100px" }}
				>
					{products.map((product, index) => {
						const Icon = product.icon;
						return (
							<motion.div 
								key={product.key} 
								className='card-hover bg-white p-8 text-left'
								variants={cardVariants}
								whileHover={{ 
									y: -15,
									scale: 1.03,
									rotateY: 5,
									transition: { duration: 0.3 }
								}}
								whileTap={{ scale: 0.97 }}
							>
								<motion.div 
									className='mb-4 inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#FF5A5F] to-[#FC642D] text-white shadow-lg'
									whileHover={{ 
										scale: 1.15,
										rotate: [0, -10, 10, 0],
										transition: { duration: 0.5 }
									}}
								>
									<Icon className='h-7 w-7' />
								</motion.div>
								<motion.h3 
									className='heading-sm mb-2'
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
								>
									{t(`landing.productSuite.${product.key}.title`)}
								</motion.h3>
								<motion.p 
									className='text-[#767676]'
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
								>
									{t(`landing.productSuite.${product.key}.description`)}
								</motion.p>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
};

export default ProductSuite;
