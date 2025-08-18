import React from 'react';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import SEO from '../common/SEO';

const TermsPage: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'Terms of Service — SigmaQ'}
				description={t('landing.terms.intro')}
				openGraph={{ url: 'https://sigmaq.example.com/terms', image: '/favicon-512x512.png' }}
			/>
			<LandingNavbar />
			<main className='py-16'>
				<section className='container mx-auto px-6 lg:px-8 prose max-w-none'>
					<h1>{t('landing.terms.title')}</h1>
					<p>{t('landing.terms.intro')}</p>
					<h2>{t('landing.terms.useTitle')}</h2>
					<p>{t('landing.terms.use')}</p>
					<h2>{t('landing.terms.liabilityTitle')}</h2>
					<p>{t('landing.terms.liability')}</p>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default TermsPage;
