import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
    const { t, i18n } = useTranslation('translation');
    React.useEffect(() => {
        i18n.loadNamespaces(['translation']).catch(() => {});
    }, [i18n]);

	const plans = [
		{
			key: 'free',
			featured: false,
			features: [
				t('landing.pricing.free.features.0'),
				t('landing.pricing.free.features.1'),
				t('landing.pricing.free.features.2'),
				t('landing.pricing.free.features.3'),
				t('landing.pricing.free.features.4'),
				t('landing.pricing.free.features.5'),
			],
		},
		{
			key: 'professional',
			featured: true,
			features: [
				t('landing.pricing.professional.features.0'),
				t('landing.pricing.professional.features.1'),
				t('landing.pricing.professional.features.2'),
				t('landing.pricing.professional.features.3'),
				t('landing.pricing.professional.features.4'),
				t('landing.pricing.professional.features.5'),
				t('landing.pricing.professional.features.6'),
				t('landing.pricing.professional.features.7'),
			],
		},
		{
			key: 'business',
			featured: false,
			features: [
				t('landing.pricing.business.features.0'),
				t('landing.pricing.business.features.1'),
				t('landing.pricing.business.features.2'),
				t('landing.pricing.business.features.3'),
				t('landing.pricing.business.features.4'),
				t('landing.pricing.business.features.5'),
				t('landing.pricing.business.features.6'),
				t('landing.pricing.business.features.7'),
				t('landing.pricing.business.features.8'),
				t('landing.pricing.business.features.9'),
			],
		},
	];

	return (
		<section className='py-24 bg-white'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='text-center mb-20'>
					<h2 className='heading-lg mb-4'>{t('landing.pricing.title')}</h2>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
					{plans.map(plan => (
						<div
							key={plan.key}
							className={`relative card-hover ${
								plan.featured
									? 'border-2 border-[#FF5A5F] ring-2 ring-[#FF5A5F]/20 mt-4'
									: 'mt-8'
							}`}
						>
							{plan.featured && (
								<div className='absolute -top-4 left-1/2 transform -translate-x-1/2 z-10'>
									<span className='bg-gradient-to-r from-[#FF5A5F] to-[#FC642D] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg'>
										MOST POPULAR
									</span>
								</div>
							)}
							<div className={`p-6 ${plan.featured ? 'pt-8' : 'pt-6'}`}>
								<h3 className='text-xl font-bold mb-2 text-[#484848]'>
									{t(`landing.pricing.${plan.key}.title`)}
								</h3>
								<p className='text-sm text-[#767676] mb-4'>
									{t(`landing.pricing.${plan.key}.subtitle`)}
								</p>
								<div className='mb-6'>
									<span className='text-3xl font-bold text-[#484848]'>
										{t(`landing.pricing.${plan.key}.price`)}
									</span>
								</div>
								<ul className='space-y-2 mb-6 min-h-[200px]'>
									{plan.features.map((feature, index) => (
										<li key={index} className='flex items-start'>
											<CheckIcon className='h-4 w-4 text-[#00A699] mr-2 mt-0.5 flex-shrink-0' />
											<span className='text-sm text-[#484848] leading-relaxed'>
												{feature}
											</span>
										</li>
									))}
								</ul>
								<Link
									to={
										plan.key === 'free'
											? '/admin/register'
											: plan.key === 'business'
												? '/contact-sales'
												: '/admin/register'
									}
									className={`block w-full text-center py-2.5 px-5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
										plan.featured
											? 'bg-[#FF5A5F] text-white hover:bg-[#E00007]'
											: plan.key === 'free'
												? 'bg-[#00A699] text-white hover:bg-[#008A80]'
												: 'bg-[#484848] text-white hover:bg-[#2C2C2C]'
									}`}
								>
									{t(`landing.pricing.${plan.key}.button`)}
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Pricing;
