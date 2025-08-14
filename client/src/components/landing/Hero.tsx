import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
    const { t, i18n } = useTranslation('translation');
    React.useEffect(() => {
        i18n.loadNamespaces(['translation']).catch(() => {});
    }, [i18n]);

	return (
		<section className='relative bg-gradient-to-b from-[#F7F7F7] to-white py-24 lg:py-32 overflow-hidden'>
			{/* Decorative elements */}
			<div className='absolute top-20 left-10 w-20 h-20 bg-[#FF5A5F]/10 rounded-full animate-float'></div>
			<div
				className='absolute top-40 right-20 w-16 h-16 bg-[#FC642D]/10 rounded-full animate-float'
				style={{ animationDelay: '2s' }}
			></div>
			<div
				className='absolute bottom-20 left-1/4 w-12 h-12 bg-[#00A699]/10 rounded-full animate-float'
				style={{ animationDelay: '4s' }}
			></div>

			<div className='container mx-auto px-6 lg:px-8 relative z-10'>
				<div className='lg:grid lg:grid-cols-12 lg:gap-16 items-center'>
					<div className='lg:col-span-6'>
						<h1 className='heading-xl mb-6'>{t('landing.hero.title')}</h1>
						<p className='body-xl mb-10 max-w-2xl'>{t('landing.hero.subtitle')}</p>
						<div className='flex flex-col sm:flex-row gap-3'>
							<Link
								to='/admin/register'
								className='btn-primary btn-large inline-flex items-center justify-center'
							>
								{t('landing.hero.startFreeTrial')}
							</Link>
							<Link
								to='/demo'
								className='btn-secondary btn-large inline-flex items-center justify-center'
							>
								{t('landing.hero.seeLiveDemo')}
							</Link>
						</div>
					</div>
					<div className='mt-16 lg:mt-0 lg:col-span-6'>
						<div className='relative'>
							<div className='absolute inset-0 bg-gradient-to-r from-[#FF5A5F] to-[#FC642D] rounded-3xl transform rotate-2 opacity-10'></div>
							<img
								src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&h=600&q=80'
								alt='SigmaQ Dashboard Preview'
								className='relative rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500'
								onError={e => {
									e.currentTarget.src =
										'https://via.placeholder.com/600x400/FF5A5F/ffffff?text=SigmaQ+Dashboard';
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
