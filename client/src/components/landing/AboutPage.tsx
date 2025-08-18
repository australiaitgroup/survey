import React from 'react';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import SEO from '../common/SEO';

const AboutPage: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'About — SigmaQ Survey Platform'}
				description={t('landing.about.intro')}
				openGraph={{
					url: 'https://sigmaq.example.com/about',
					image: '/favicon-512x512.png',
				}}
			/>
			<LandingNavbar />
			<main>
				{/* Hero */}
				<section className='relative overflow-hidden bg-gradient-to-b from-[#F7F7F7] to-white'>
					<div className='absolute inset-0 pointer-events-none' aria-hidden>
						<div className='absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#FF5A5F]/10'></div>
						<div className='absolute top-24 -right-10 w-40 h-40 rounded-full bg-[#00A699]/10'></div>
					</div>
					<div className='container mx-auto px-6 lg:px-8 py-20 lg:py-28 relative'>
						<h1 className='heading-lg mb-4'>{t('landing.about.title')}</h1>
						<p className='body-lg text-[#767676] max-w-3xl'>
							{t('landing.about.intro')}
						</p>
					</div>
				</section>

				{/* Story + Image */}
				<section className='container mx-auto px-6 lg:px-8 py-12 lg:py-16'>
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'>
						<div className='order-2 lg:order-1'>
							<h2 className='heading-md mb-3'>{t('landing.about.storyTitle')}</h2>
							<p className='body-md text-[#484848]'>{t('landing.about.story')}</p>
							<h3 className='heading-sm mt-8 mb-3'>
								{t('landing.about.missionTitle')}
							</h3>
							<p className='text-[#484848]'>{t('landing.about.mission')}</p>
							<h3 className='heading-sm mt-8 mb-3'>
								{t('landing.about.valuesTitle')}
							</h3>
							<ul className='list-disc pl-6 space-y-2 text-[#484848]'>
								<li>{t('landing.about.values.0')}</li>
								<li>{t('landing.about.values.1')}</li>
								<li>{t('landing.about.values.2')}</li>
							</ul>
						</div>
						<div className='order-1 lg:order-2'>
							<div className='relative'>
								<div className='absolute inset-0 bg-gradient-to-r from-[#FF5A5F] to-[#FC642D] rounded-3xl transform rotate-2 opacity-10'></div>
								<img
									src='https://images.unsplash.com/photo-1529336953121-a0ce66f9a8e0?q=80&w=1600&auto=format&fit=crop'
									alt='About SigmaQ'
									className='relative rounded-3xl shadow-2xl'
								/>
							</div>
						</div>
					</div>
				</section>

				{/* Stats */}
				<section className='py-12 bg-[#F7F7F7]'>
					<div className='container mx-auto px-6 lg:px-8'>
						<div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
							<div className='text-center p-6 bg-white rounded-2xl shadow-sm'>
								<p className='text-3xl font-bold text-[#484848]'>500+</p>
								<p className='text-[#767676]'>
									{t('landing.about.stats.companies')}
								</p>
							</div>
							<div className='text-center p-6 bg-white rounded-2xl shadow-sm'>
								<p className='text-3xl font-bold text-[#484848]'>30+</p>
								<p className='text-[#767676]'>
									{t('landing.about.stats.countries')}
								</p>
							</div>
							<div className='text-center p-6 bg-white rounded-2xl shadow-sm'>
								<p className='text-3xl font-bold text-[#484848]'>1M+</p>
								<p className='text-[#767676]'>
									{t('landing.about.stats.responses')}
								</p>
							</div>
							<div className='text-center p-6 bg-white rounded-2xl shadow-sm'>
								<p className='text-3xl font-bold text-[#484848]'>99.9%</p>
								<p className='text-[#767676]'>{t('landing.about.stats.uptime')}</p>
							</div>
						</div>
					</div>
				</section>

				{/* Timeline */}
				<section className='container mx-auto px-6 lg:px-8 py-16'>
					<h2 className='heading-md mb-8'>{t('landing.about.timelineTitle')}</h2>
					<div className='relative border-l-2 border-[#EBEBEB] pl-6 space-y-8'>
						<div>
							<p className='text-sm text-[#767676]'>
								{t('landing.about.timeline.0.year')}
							</p>
							<p className='text-[#484848]'>{t('landing.about.timeline.0.text')}</p>
						</div>
						<div>
							<p className='text-sm text-[#767676]'>
								{t('landing.about.timeline.1.year')}
							</p>
							<p className='text-[#484848]'>{t('landing.about.timeline.1.text')}</p>
						</div>
						<div>
							<p className='text-sm text-[#767676]'>
								{t('landing.about.timeline.2.year')}
							</p>
							<p className='text-[#484848]'>{t('landing.about.timeline.2.text')}</p>
						</div>
						<div>
							<p className='text-sm text-[#767676]'>
								{t('landing.about.timeline.3.year')}
							</p>
							<p className='text-[#484848]'>{t('landing.about.timeline.3.text')}</p>
						</div>
					</div>
				</section>

				{/* Team */}
				<section className='py-16 bg-[#F7F7F7]'>
					<div className='container mx-auto px-6 lg:px-8'>
						<h2 className='heading-md mb-8'>{t('landing.about.teamTitle')}</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
							<div className='card-hover p-6 text-center'>
								<img
									className='w-20 h-20 rounded-full mx-auto mb-3 object-cover'
									src='https://randomuser.me/api/portraits/men/10.jpg'
									alt='Team'
								/>
								<p className='font-semibold text-[#484848]'>Alex Chen</p>
								<p className='text-sm text-[#767676]'>
									{t('landing.about.roles.ceo')}
								</p>
							</div>
							<div className='card-hover p-6 text-center'>
								<img
									className='w-20 h-20 rounded-full mx-auto mb-3 object-cover'
									src='https://randomuser.me/api/portraits/women/12.jpg'
									alt='Team'
								/>
								<p className='font-semibold text-[#484848]'>Mina Li</p>
								<p className='text-sm text-[#767676]'>
									{t('landing.about.roles.cto')}
								</p>
							</div>
							<div className='card-hover p-6 text-center'>
								<img
									className='w-20 h-20 rounded-full mx-auto mb-3 object-cover'
									src='https://randomuser.me/api/portraits/women/22.jpg'
									alt='Team'
								/>
								<p className='font-semibold text-[#484848]'>Sara Kim</p>
								<p className='text-sm text-[#767676]'>
									{t('landing.about.roles.headOfAI')}
								</p>
							</div>
							<div className='card-hover p-6 text-center'>
								<img
									className='w-20 h-20 rounded-full mx-auto mb-3 object-cover'
									src='https://randomuser.me/api/portraits/men/32.jpg'
									alt='Team'
								/>
								<p className='font-semibold text-[#484848]'>Daniel Wong</p>
								<p className='text-sm text-[#767676]'>
									{t('landing.about.roles.headOfDesign')}
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Customers */}
				<section className='container mx-auto px-6 lg:px-8 py-16'>
					<h2 className='heading-md mb-8'>{t('landing.about.customersTitle')}</h2>
					<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center'>
						<img
							className='h-10 opacity-80'
							src='https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg'
							alt='Slack'
						/>
						<img
							className='h-10 opacity-80'
							src='https://cdn.worldvectorlogo.com/logos/notion-logo-1.svg'
							alt='Notion'
						/>
						<img
							className='h-10 opacity-80'
							src='https://cdn.worldvectorlogo.com/logos/airtable-1.svg'
							alt='Airtable'
						/>
						<img
							className='h-10 opacity-80'
							src='https://cdn.worldvectorlogo.com/logos/zapier-1.svg'
							alt='Zapier'
						/>
						<img
							className='h-10 opacity-80'
							src='https://cdn.worldvectorlogo.com/logos/google-sheets-4.svg'
							alt='Google Sheets'
						/>
						<img
							className='h-10 opacity-80'
							src='https://cdn.worldvectorlogo.com/logos/intercom-1.svg'
							alt='Intercom'
						/>
					</div>
				</section>

				{/* CTA */}
				<section className='py-16 bg-gradient-to-r from-[#FF5A5F] to-[#FC642D]'>
					<div className='container mx-auto px-6 lg:px-8 text-center text-white'>
						<h2 className='text-3xl font-bold mb-3'>{t('landing.about.ctaTitle')}</h2>
						<p className='opacity-90 mb-6'>{t('landing.about.ctaSubtitle')}</p>
						<a
							href='/contact'
							className='inline-block bg-white text-[#FF5A5F] px-6 py-3 rounded-xl font-medium shadow'
						>
							{t('landing.about.ctaButton')}
						</a>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default AboutPage;
