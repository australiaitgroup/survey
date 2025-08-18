import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
	ClipboardDocumentListIcon,
	AdjustmentsHorizontalIcon,
	ChartBarIcon,
	ShareIcon,
} from '@heroicons/react/24/outline';

const HowItWorks: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const steps = [
		{ key: 'step1', icon: ClipboardDocumentListIcon },
		{ key: 'step2', icon: AdjustmentsHorizontalIcon },
		{ key: 'step3', icon: ChartBarIcon },
		{ key: 'step4', icon: ShareIcon },
	];

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				delayChildren: 0.3
			}
		}
	};

	const cardVariants = {
		hidden: { opacity: 0, y: 60, scale: 0.8 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				duration: 0.6,
				ease: "easeOut"
			}
		}
	};

	return (
		<section id='how-it-works' className='py-24 bg-[#F7F7F7]'>
			<div className='container mx-auto px-6 lg:px-8'>
				<motion.div 
					className='text-center mb-16'
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
				>
					<motion.h2 
						className='heading-lg mb-4'
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						{t('landing.howItWorks.title')}
					</motion.h2>
					<motion.p 
						className='body-lg text-[#767676] max-w-3xl mx-auto'
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						{t('landing.howItWorks.subtitle')}
					</motion.p>
				</motion.div>

				<motion.div 
					className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-50px" }}
				>
					{steps.map((step, index) => {
						const Icon = step.icon;
						return (
							<motion.div 
								key={step.key} 
								className='card-hover bg-white p-8 text-center'
								variants={cardVariants}
								whileHover={{ 
									y: -10, 
									scale: 1.05,
									transition: { duration: 0.3 }
								}}
								whileTap={{ scale: 0.95 }}
							>
								<motion.div 
									className='mx-auto mb-4 inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#FF5A5F] to-[#FC642D] text-white shadow-lg'
									whileHover={{ 
										rotate: 360,
										scale: 1.1 
									}}
									transition={{ duration: 0.5 }}
								>
									<Icon className='h-8 w-8' />
								</motion.div>
								<motion.h3 
									className='heading-sm mb-2'
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
								>
									{t(`landing.howItWorks.${step.key}.title`)}
								</motion.h3>
								<motion.p 
									className='text-[#767676]'
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
								>
									{t(`landing.howItWorks.${step.key}.description`)}
								</motion.p>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
};

export default HowItWorks;
