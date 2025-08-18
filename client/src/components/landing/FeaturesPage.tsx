import React from 'react';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import SEO from '../common/SEO';
import Features from './Features';
import ProductSuite from './ProductSuite';
import QuestionBanksHighlight from './QuestionBanksHighlight';
import AIFeatures from './AIFeatures';

const FeaturesPage: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'Features — SigmaQ Survey Platform'}
				description={t('landing.featuresPage.intro')}
				openGraph={{ url: 'https://sigmaq.example.com/features', image: '/favicon-512x512.png' }}
			/>
			<LandingNavbar />
			<main>
				<section className='py-16 border-b border-[#EBEBEB]'>
					<div className='container mx-auto px-6 lg:px-8'>
						<h1 className='heading-lg mb-3'>{t('landing.featuresPage.title')}</h1>
						<p className='body-lg text-[#767676] max-w-3xl'>
							{t('landing.featuresPage.intro')}
						</p>
					</div>
				</section>

				{/* Core features section */}
				<section>
					<Features />
				</section>

				{/* Product suite */}
				<ProductSuite />

				{/* Question Banks */}
				<QuestionBanksHighlight />

				{/* AI */}
				<AIFeatures />


			</main>
			<Footer />
		</div>
	);
};

export default FeaturesPage;
