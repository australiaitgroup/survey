import React from 'react';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import SEO from '../common/SEO';
import Pricing from './Pricing';
import QuestionBanksHighlight from './QuestionBanksHighlight';

const PricingPage: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'Pricing — SigmaQ Survey Platform'}
				description={t('landing.pricingPage.intro')}
				openGraph={{
					url: 'https://sigmaq.example.com/pricing',
					image: '/favicon-512x512.png',
				}}
			/>
			<LandingNavbar />
			<main>
				{/* Hero */}
				<section className='py-16 border-b border-[#EBEBEB]'>
					<div className='container mx-auto px-6 lg:px-8'>
						<h1 className='heading-lg mb-3'>{t('landing.pricingPage.title')}</h1>
						<p className='body-lg text-[#767676] max-w-3xl'>
							{t('landing.pricingPage.intro')}
						</p>
					</div>
				</section>

				{/* Plans */}
				<Pricing />

				{/* Question Banks */}
				<section className='py-16 bg-[#F7F7F7]'>
					<div className='container mx-auto px-6 lg:px-8'>
						<h2 className='heading-md mb-3'>{t('landing.pricingPage.banks.title')}</h2>
						<p className='text-[#767676] max-w-3xl mb-8'>
							{t('landing.pricingPage.banks.subtitle')}
						</p>
						<QuestionBanksHighlight />
					</div>
				</section>

				{/* Resale / Monetization */}
				<section className='py-16'>
					<div className='container mx-auto px-6 lg:px-8'>
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
							<div>
								<h2 className='heading-md mb-3'>
									{t('landing.pricingPage.resale.title')}
								</h2>
								<p className='text-[#767676] mb-4'>
									{t('landing.pricingPage.resale.subtitle')}
								</p>
								<ul className='list-disc pl-6 text-[#484848] space-y-2'>
									<li>{t('landing.pricingPage.resale.points.0')}</li>
									<li>{t('landing.pricingPage.resale.points.1')}</li>
									<li>{t('landing.pricingPage.resale.points.2')}</li>
								</ul>
							</div>
							<div>
								<img
									src='https://images.unsplash.com/photo-1556761175-129418cb2dfe?q=80&w=1600&auto=format&fit=crop'
									alt='Monetize assessments'
									className='rounded-2xl shadow'
								/>
							</div>
						</div>
						<div className='mt-8'>
							<a href='/contact' className='btn-primary'>
								{t('landing.pricingPage.resale.cta')}
							</a>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default PricingPage;
