import React from 'react';
import { useTranslation } from 'react-i18next';
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

	return (
		<section id='how-it-works' className='py-24 bg-[#F7F7F7]'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='text-center mb-16'>
					<h2 className='heading-lg mb-4'>{t('landing.howItWorks.title')}</h2>
					<p className='body-lg text-[#767676] max-w-3xl mx-auto'>
						{t('landing.howItWorks.subtitle')}
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{steps.map(step => {
						const Icon = step.icon;
						return (
							<div key={step.key} className='card-hover bg-white p-8 text-center'>
								<div className='mx-auto mb-4 inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#FF5A5F] to-[#FC642D] text-white shadow-lg'>
									<Icon className='h-8 w-8' />
								</div>
								<h3 className='heading-sm mb-2'>{t(`landing.howItWorks.${step.key}.title`)}</h3>
								<p className='text-[#767676]'>
									{t(`landing.howItWorks.${step.key}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default HowItWorks;
