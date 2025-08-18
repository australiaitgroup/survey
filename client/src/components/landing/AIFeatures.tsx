import React from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const AIFeatures: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const features = [
		{ key: 'aiSurvey', icon: SparklesIcon },
		{ key: 'aiCandidateAnalysis', icon: ChatBubbleLeftRightIcon },
		{ key: 'aiAutomation', icon: Cog6ToothIcon },
	];

	return (
		<section id='ai' className='py-24 bg-white'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='text-center mb-12'>
					<h2 className='heading-lg mb-4'>{t('landing.ai.title')}</h2>
					<p className='body-lg text-[#767676] max-w-3xl mx-auto'>
						{t('landing.ai.subtitle')}
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{features.map(item => {
						const Icon = item.icon;
						return (
							<div key={item.key} className='card-hover bg-white p-8'>
								<div className='mb-4 inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#6D28D9] to-[#9333EA] text-white shadow-lg'>
									<Icon className='h-7 w-7' />
								</div>
								<h3 className='heading-sm mb-2'>
									{t(`landing.ai.${item.key}.title`)}
								</h3>
								<p className='text-[#767676]'>
									{t(`landing.ai.${item.key}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default AIFeatures;
