import React from 'react';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import SEO from '../common/SEO';

const PrivacyPage: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'Privacy Policy — SigmaQ'}
				description={t('landing.privacy.intro')}
				openGraph={{ url: 'https://sigmaq.example.com/privacy', image: '/favicon-512x512.png' }}
			/>
			<LandingNavbar />
			<main className='py-16'>
				<section className='container mx-auto px-6 lg:px-8 prose max-w-none'>
					<h1>{t('landing.privacy.title')}</h1>
					<p>{t('landing.privacy.intro')}</p>
					<h2>{t('landing.privacy.dataTitle')}</h2>
					<p>{t('landing.privacy.data')}</p>
					<h2>{t('landing.privacy.securityTitle')}</h2>
					<p>{t('landing.privacy.security')}</p>
					<h2>{t('landing.privacy.contactTitle')}</h2>
					<p>{t('landing.privacy.contact')}</p>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default PrivacyPage;
