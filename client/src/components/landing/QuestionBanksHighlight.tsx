import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderIcon, ClipboardDocumentCheckIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const QuestionBanksHighlight: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const points = [
		{ key: 'readyMade', icon: FolderIcon },
		{ key: 'quality', icon: ClipboardDocumentCheckIcon },
		{ key: 'fasterHiring', icon: ArrowTrendingUpIcon },
	];

	return (
		<section id='question-banks' className='py-24 bg-[#F7F7F7]'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='text-center mb-12'>
					<h2 className='heading-lg mb-4'>{t('landing.questionBanks.title')}</h2>
					<p className='body-lg text-[#767676] max-w-3xl mx-auto'>
						{t('landing.questionBanks.subtitle')}
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{points.map(item => {
						const Icon = item.icon;
						return (
							<div key={item.key} className='card-hover bg-white p-8'>
								<div className='mb-4 inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#00A699] to-[#00A699]/80 text-white shadow-lg'>
									<Icon className='h-7 w-7' />
								</div>
								<h3 className='heading-sm mb-2'>{t(`landing.questionBanks.${item.key}.title`)}</h3>
								<p className='text-[#767676]'>{t(`landing.questionBanks.${item.key}.description`)}</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default QuestionBanksHighlight;
