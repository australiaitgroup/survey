import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n.use(HttpBackend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: 'en',
		lng: 'en', // Force default language
		debug: true, // Enable debug to see what's happening

		// Force reload translations
		load: 'languageOnly',
		preload: ['en', 'zh'],

		interpolation: {
			escapeValue: false, // React already does escaping
		},

		backend: {
			loadPath: '/locales/{{lng}}/{{ns}}.json',
			// Add cache busting and error handling
			addPath: '/locales/add/{{lng}}/{{ns}}',
			allowMultiLoading: false,
			parse: (data: string) => JSON.parse(data),
			crossDomain: false,
		},

		detection: {
			order: ['localStorage', 'navigator', 'htmlTag'],
			caches: ['localStorage'],
		},

		// Default namespace
		defaultNS: 'translation',

		// List of namespaces
		ns: ['translation', 'admin', 'survey'],
	});

export default i18n;
