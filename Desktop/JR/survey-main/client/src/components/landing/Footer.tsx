import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Footer: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const links = [
		{ key: 'features', to: '/features' },
		{ key: 'pricing', to: '/pricing' },
		{ key: 'caseStudies', to: '/case-studies' },
		{ key: 'about', to: '/about' },
		{ key: 'contact', to: '/contact' },
		{ key: 'helpCenter', to: '/help' },
		{ key: 'privacy', to: '/privacy' },
		{ key: 'terms', to: '/terms' },
	];

	return (
		<footer className='bg-white border-t border-[#EBEBEB] py-16'>
			<div className='container mx-auto px-6 lg:px-8'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12'>
					<div className='lg:col-span-2'>
						<img src='/SigmaQ-logo.svg' alt='SigmaQ' className='h-12 mb-6' />
						<p className='text-[#767676] mb-8 max-w-md text-lg leading-relaxed'>
							{t('appName')} - Smarter assessments for smarter teams.
						</p>
						<div className='mb-4'>
							<LanguageSwitcher />
						</div>
					</div>

					<div>
						<h4 className='text-lg font-semibold mb-6 text-[#484848]'>Quick Links</h4>
						<ul className='space-y-3'>
							{links.map(link => (
								<li key={link.key}>
									{link.to.startsWith('#') ? (
										<a
											href={link.to}
											className='text-[#767676] hover:text-[#FF5A5F] transition duration-200 ease-in-out'
										>
											{t(`landing.footer.${link.key}`)}
										</a>
									) : (
										<Link
											to={link.to}
											className='text-[#767676] hover:text-[#FF5A5F] transition duration-200 ease-in-out'
										>
											{t(`landing.footer.${link.key}`)}
										</Link>
									)}
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className='text-lg font-semibold mb-6 text-[#484848]'>Get in Touch</h4>
						<ul className='space-y-3 text-[#767676]'>
							<li className='hover:text-[#FF5A5F] transition duration-200'>
								<a href='mailto:hello@jiangren.com.au'>hello@jiangren.com.au</a>
							</li>
							<li className='hover:text-[#FF5A5F] transition duration-200'>
								<a href='tel:+61451010217'>+61 451010217</a>
							</li>
						</ul>
					</div>
				</div>

				<div className='border-t border-[#EBEBEB] pt-8 mt-12'>
					<div className='flex flex-col md:flex-row justify-between items-center'>
						<p className='text-[#767676] body-sm'>{t('landing.footer.copyright')}</p>
						<div className='flex space-x-6 mt-4 md:mt-0'>
							<a
								href='#'
								className='text-[#767676] hover:text-[#FF5A5F] transition duration-200'
							>
								<span className='sr-only'>Twitter</span>
								<svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
									<path d='M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84' />
								</svg>
							</a>
							<a
								href='#'
								className='text-[#767676] hover:text-[#FF5A5F] transition duration-200'
							>
								<span className='sr-only'>LinkedIn</span>
								<svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fillRule='evenodd'
										d='M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z'
										clipRule='evenodd'
									/>
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
