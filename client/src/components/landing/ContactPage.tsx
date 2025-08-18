import React from 'react';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import SEO from '../common/SEO';
import axios from 'axios';

const ContactPage: React.FC = () => {
	const { t, i18n } = useTranslation('translation');
	React.useEffect(() => {
		i18n.loadNamespaces(['translation']).catch(() => {});
	}, [i18n]);

	const [submitting, setSubmitting] = React.useState(false);
	const [submitted, setSubmitted] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const name = String(formData.get('name') || '');
		const email = String(formData.get('email') || '');
		const message = String(formData.get('message') || '');
		try {
			await axios.post('/api/contact', { name, email, message });
			setSubmitted(true);
			form.reset();
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Failed to send');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className='min-h-screen bg-white'>
			<SEO
				title={'Contact — SigmaQ Survey Platform'}
				description={t('landing.contact.subtitle')}
				openGraph={{ url: 'https://sigmaq.example.com/contact', image: '/favicon-512x512.png' }}
			/>
			<LandingNavbar />
			<main className='py-16'>
				{/* Hero */}
				<section className='container mx-auto px-6 lg:px-8 mb-10'>
					<div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF5A5F]/10 to-[#FC642D]/10 p-8 lg:p-12'>
						<h1 className='heading-lg mb-3'>{t('landing.contact.title')}</h1>
						<p className='body-lg text-[#767676] max-w-3xl'>
							{t('landing.contact.subtitle')}
						</p>
					</div>
				</section>

				{/* Channels */}
				<section className='container mx-auto px-6 lg:px-8 mb-12'>
					<h2 className='heading-md mb-6'>{t('landing.contact.channelsTitle')}</h2>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div className='card-hover p-6'>
							<p className='text-sm text-[#767676] mb-1'>{t('landing.contact.channels.sales')}</p>
							<a href='mailto:sales@sigmaq.io' className='text-[#484848] font-medium'>sales@sigmaq.io</a>
						</div>
						<div className='card-hover p-6'>
							<p className='text-sm text-[#767676] mb-1'>{t('landing.contact.channels.support')}</p>
							<a href='mailto:support@sigmaq.io' className='text-[#484848] font-medium'>support@sigmaq.io</a>
						</div>
						<div className='card-hover p-6'>
							<p className='text-sm text-[#767676] mb-1'>{t('landing.contact.channels.phone')}</p>
							<a href='tel:+61451010217' className='text-[#484848] font-medium'>+61 451010217</a>
							<p className='text-xs text-[#767676] mt-1'>{t('landing.contact.channels.hours')}</p>
						</div>
					</div>
				</section>

				{/* Form */}
				<section className='container mx-auto px-6 lg:px-8'>
					<form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-4xl'>
						<div className='md:col-span-1'>
							<label className='block text-sm font-medium mb-1 text-[#484848]'>
								{t('landing.contact.name')}
							</label>
							<input name='name' required className='w-full border border-[#EBEBEB] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]' />
						</div>
						<div className='md:col-span-1'>
							<label className='block text-sm font-medium mb-1 text-[#484848]'>
								{t('landing.contact.email')}
							</label>
							<input name='email' type='email' required className='w-full border border-[#EBEBEB] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]' />
						</div>
						<div className='md:col-span-2'>
							<label className='block text-sm font-medium mb-1 text-[#484848]'>
								{t('landing.contact.message')}
							</label>
							<textarea name='message' required rows={5} className='w-full border border-[#EBEBEB] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]'></textarea>
						</div>
						<div className='md:col-span-2'>
							<button type='submit' disabled={submitting} className='btn-primary'>
								{submitting ? 'Sending...' : t('landing.contact.send')}
							</button>
							{submitted && (
								<span className='ml-3 text-[#00A699]'>Sent</span>
							)}
							{error && (
								<span className='ml-3 text-red-600'>{error}</span>
							)}
						</div>
					</form>
				</section>

				{/* Offices */}
				<section className='container mx-auto px-6 lg:px-8 py-16'>
					<h2 className='heading-md mb-6'>{t('landing.contact.officesTitle')}</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='card-hover p-6'>
							<p className='text-sm text-[#767676] mb-1'>{t('landing.contact.offices.hq.title')}</p>
							<p className='text-[#484848]'>{t('landing.contact.offices.hq.address')}</p>
						</div>
						<div className='card-hover p-6'>
							<p className='text-sm text-[#767676] mb-1'>{t('landing.contact.offices.apac.title')}</p>
							<p className='text-[#484848]'>{t('landing.contact.offices.apac.address')}</p>
						</div>
					</div>
				</section>

				{/* FAQ (short) */}
				<section className='container mx-auto px-6 lg:px-8 pb-16'>
					<h2 className='heading-md mb-4'>{t('landing.contact.faqTitle')}</h2>
					<ul className='list-disc pl-6 text-[#484848] space-y-2 max-w-3xl'>
						<li>{t('landing.contact.faq.0')}</li>
						<li>{t('landing.contact.faq.1')}</li>
						<li>{t('landing.contact.faq.2')}</li>
					</ul>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default ContactPage;
