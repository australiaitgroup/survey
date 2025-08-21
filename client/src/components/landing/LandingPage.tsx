import React from 'react';
import Hero from './Hero';
import Features from './Features';
import HowItWorks from './HowItWorks';
import UseCases from './UseCases';
import ProductSuite from './ProductSuite';
import QuestionBanksHighlight from './QuestionBanksHighlight';
import AIFeatures from './AIFeatures';
import Pricing from './Pricing';
import Testimonials from './Testimonials';
import FinalCTA from './FinalCTA';
import Footer from './Footer';
import LandingNavbar from './LandingNavbar';
import SEO from '../common/SEO';

const LandingPage: React.FC = () => {
	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'SigmaQ — Create Smarter Surveys & Assessments'}
				description={
					'Build modern surveys and assessments with analytics, collaboration, and custom branding.'
				}
				openGraph={{ url: 'https://sigmaq.example.com/', image: '/favicon-512x512.png' }}
			/>
			<LandingNavbar />
			<main>
				<Hero />
				<HowItWorks />
				<ProductSuite />
				<section id='features'>
					<Features />
				</section>
				<QuestionBanksHighlight />
				<UseCases />
				<AIFeatures />
				<section id='pricing'>
					<Pricing />
				</section>
				<Testimonials />
				<FinalCTA />
			</main>
			<Footer />
		</div>
	);
};

export default LandingPage;
