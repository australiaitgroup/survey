import React from 'react';
import { useTranslation } from 'react-i18next';
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

	return (
		<section id='products' className='py-24 bg-white'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='text-center mb-12'>
					<h2 className='heading-lg mb-4'>{t('landing.productSuite.title')}</h2>
					<p className='body-lg text-[#767676] max-w-3xl mx-auto'>
						{t('landing.productSuite.subtitle')}
					</p>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
					{products.map(product => {
						const Icon = product.icon;
						return (
							<div key={product.key} className='card-hover bg-white p-8 text-left'>
								<div className='mb-4 inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#FF5A5F] to-[#FC642D] text-white shadow-lg'>
									<Icon className='h-7 w-7' />
								</div>
								<h3 className='heading-sm mb-2'>{t(`landing.productSuite.${product.key}.title`)}</h3>
								<p className='text-[#767676]'>{t(`landing.productSuite.${product.key}.description`)}</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default ProductSuite;
