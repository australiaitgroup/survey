import React from 'react';
import { useTranslation } from 'react-i18next';
import {
	UserGroupIcon,
	AcademicCapIcon,
	BuildingOfficeIcon,
	BookOpenIcon,
	GlobeAsiaAustraliaIcon,
} from '@heroicons/react/24/outline';

const UseCases: React.FC = () => {
    const { t, i18n } = useTranslation('translation');
    React.useEffect(() => {
        i18n.loadNamespaces(['translation']).catch(() => {});
    }, [i18n]);

	const useCases = [
		{
			key: 'hrTeams',
			icon: UserGroupIcon,
			color: 'bg-blue-50 text-blue-600 border-blue-200',
		},
		{
			key: 'training',
			icon: AcademicCapIcon,
			color: 'bg-green-50 text-green-600 border-green-200',
		},
		{
			key: 'startups',
			icon: BuildingOfficeIcon,
			color: 'bg-purple-50 text-purple-600 border-purple-200',
		},
		{
			key: 'universities',
			icon: BookOpenIcon,
			color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
		},
		{
			key: 'international',
			icon: GlobeAsiaAustraliaIcon,
			color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
		},
	];

	return (
		<section className='py-24 bg-[#F7F7F7]'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='text-center mb-20'>
					<h2 className='heading-lg mb-4'>{t('landing.useCases.title')}</h2>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
					{useCases.map(useCase => {
						const Icon = useCase.icon;
						return (
							<div key={useCase.key} className='card-hover bg-white p-8'>
								<div className='flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5A5F] to-[#FC642D] text-white mb-6 shadow-lg'>
									<Icon className='h-8 w-8' />
								</div>
								<h3 className='heading-sm mb-4 text-[#484848]'>
									{t(`landing.useCases.${useCase.key}.title`)}
								</h3>
								<p className='body-md'>
									{t(`landing.useCases.${useCase.key}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default UseCases;
