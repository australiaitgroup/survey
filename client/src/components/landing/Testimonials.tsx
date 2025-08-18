import React from 'react';
import { useTranslation } from 'react-i18next';

const Testimonials: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const testimonials = [
		{
			key: 'testimonial1',
			avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
		},
		{
			key: 'testimonial2',
			avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
		},
	];

	return (
		<section className='py-24 bg-[#F7F7F7]'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='text-center mb-20'>
					<h2 className='heading-lg mb-4'>{t('landing.testimonials.title')}</h2>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto'>
					{testimonials.map(testimonial => (
						<div key={testimonial.key} className='card-hover'>
							<div className='flex items-center mb-6'>
								<span className='text-4xl text-[#FF5A5F] font-serif'>"</span>
							</div>
							<blockquote className='body-lg mb-6'>
								"{t(`landing.testimonials.${testimonial.key}.quote`)}"
							</blockquote>
							<div className='flex items-center'>
								<img
									src={testimonial.avatar}
									alt='Customer'
									className='w-12 h-12 rounded-full mr-4'
								/>
								<div>
									<cite className='text-sm font-medium text-gray-900 not-italic'>
										{t(`landing.testimonials.${testimonial.key}.author`)}
									</cite>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Testimonials;
