import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
	ChartBarIcon,
	DocumentChartBarIcon,
	SparklesIcon,
	FolderIcon,
	GlobeAltIcon,
	SwatchIcon,
} from '@heroicons/react/24/outline';

const Features: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const getFeatureImage = (index: number) => {
		const images = [
			// Feature 1: Create professional assessments easily
			'https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 2: Visual analytics & reporting
			'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 3: AI-powered insights
			'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 4: Question bank manager
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 5: Multilingual assessments
			'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 6: Branding & company customization
			'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
		];
		return images[index] || images[0];
	};

	const features = [
		{
			key: 'feature1',
			icon: ChartBarIcon,
			color: 'bg-blue-100 text-blue-600',
		},
		{
			key: 'feature2',
			icon: DocumentChartBarIcon,
			color: 'bg-green-100 text-green-600',
		},
		{
			key: 'feature3',
			icon: SparklesIcon,
			color: 'bg-purple-100 text-purple-600',
		},
		{
			key: 'feature4',
			icon: FolderIcon,
			color: 'bg-yellow-100 text-yellow-600',
		},
		{
			key: 'feature5',
			icon: GlobeAltIcon,
			color: 'bg-indigo-100 text-indigo-600',
		},
		{
			key: 'feature6',
			icon: SwatchIcon,
			color: 'bg-pink-100 text-pink-600',
		},
	];

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.3,
				delayChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 50 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.8,
				ease: 'easeOut',
			},
		},
	};

	return (
		<section className='py-24 bg-white'>
			<div className='container mx-auto px-6 lg:px-8'>
				<motion.div
					className='text-center mb-20'
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
				>
					<h2 className='heading-lg mb-4'>{t('landing.features.title')}</h2>
				</motion.div>

				<motion.div
					className='space-y-32'
					variants={containerVariants}
					initial='hidden'
					whileInView='visible'
					viewport={{ once: true, margin: '-100px' }}
				>
					{features.map((feature, index) => {
						const Icon = feature.icon;
						const isEven = index % 2 === 0;

						return (
							<motion.div
								key={feature.key}
								variants={itemVariants}
								className={`flex flex-col lg:flex-row items-center gap-16 ${
									!isEven ? 'lg:flex-row-reverse' : ''
								}`}
							>
								<motion.div
									className='flex-1'
									initial={{ opacity: 0, x: isEven ? -50 : 50 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.8, delay: 0.2 }}
								>
									<motion.div
										className={
											'inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#FF5A5F] to-[#FC642D] text-white mb-6 shadow-lg'
										}
										whileHover={{ scale: 1.1, rotate: 5 }}
										transition={{ duration: 0.3 }}
									>
										<Icon className='h-8 w-8' />
									</motion.div>
									<motion.h3
										className='heading-md mb-6'
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										transition={{ duration: 0.6, delay: 0.4 }}
									>
										{t(`landing.features.${feature.key}.title`)}
									</motion.h3>
									<motion.p
										className='body-lg'
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										transition={{ duration: 0.6, delay: 0.6 }}
									>
										{t(`landing.features.${feature.key}.description`)}
									</motion.p>
								</motion.div>
								<motion.div
									className='flex-1'
									initial={{ opacity: 0, x: isEven ? 50 : -50 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.8, delay: 0.4 }}
								>
									<div className='relative group'>
										<motion.div
											className='absolute inset-0 bg-gradient-to-br from-[#FF5A5F]/20 to-[#FC642D]/20 rounded-3xl transform rotate-2'
											whileHover={{ rotate: 4, scale: 1.02 }}
											transition={{ duration: 0.3 }}
										></motion.div>
										<motion.img
											src={getFeatureImage(index)}
											alt={t(`landing.features.${feature.key}.title`)}
											className='relative rounded-3xl shadow-xl'
											whileHover={{ scale: 1.05, rotate: 1 }}
											transition={{ duration: 0.3 }}
											onError={e => {
												e.currentTarget.src = `https://via.placeholder.com/500x300/FF5A5F/ffffff?text=Feature+${
													index + 1
												}`;
											}}
										/>
									</div>
								</motion.div>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
};

export default Features;
