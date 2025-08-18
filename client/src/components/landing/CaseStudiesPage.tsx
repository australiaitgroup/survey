import React from 'react';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import SEO from '../common/SEO';

const cases = [
	{
		company: 'TechCorp',
		metric: '+40% response rate',
		cover: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1600&auto=format&fit=crop',
	},
	{
		company: 'InnovateLab',
		metric: '3x faster reporting',
		cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop',
	},
];

const CaseStudiesPage: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'Case Studies — SigmaQ'}
				description={t('landing.caseStudies.subtitle')}
				openGraph={{
					url: 'https://sigmaq.example.com/case-studies',
					image: '/favicon-512x512.png',
				}}
			/>
			<LandingNavbar />
			<main className='py-16'>
				<section className='container mx-auto px-6 lg:px-8'>
					<h1 className='heading-lg mb-4'>{t('landing.caseStudies.title')}</h1>
					<p className='body-lg text-[#767676] max-w-3xl'>
						{t('landing.caseStudies.subtitle')}
					</p>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-10'>
						{cases.map(item => (
							<article key={item.company} className='card-hover overflow-hidden'>
								<img
									src={item.cover}
									alt={item.company}
									className='w-full h-56 object-cover'
								/>
								<div className='p-6'>
									<h3 className='heading-sm mb-1'>{item.company}</h3>
									<p className='text-sm text-[#767676]'>{item.metric}</p>
								</div>
							</article>
						))}
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default CaseStudiesPage;
