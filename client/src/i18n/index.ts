import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n.use(HttpBackend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: 'en',
		// Respect previously chosen language via detector; don't force 'en'
		supportedLngs: ['en', 'zh'],
		debug: false, // Disable debug logs in production

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

		react: {
			useSuspense: false,
			bindI18n: 'languageChanged loaded',
			bindI18nStore: 'added removed',
		},

		// Default namespace
		defaultNS: 'translation',
		fallbackNS: 'translation',

		// Do not override nsSeparator; keep default ':' so dotted keys remain object paths

		// List of namespaces used in the app
		ns: ['translation', 'admin', 'survey', 'question'],
	});

// Ensure <html lang> reflects the active language on startup and changes
if (typeof document !== 'undefined') {
	const setHtmlLang = (lng: string) => {
		document.documentElement.setAttribute('lang', lng);
	};
	// Set once after initialization
	setHtmlLang(i18n.language || 'en');
	// Update on runtime language changes
	i18n.on('languageChanged', lng => {
		setHtmlLang(lng);
		// Ensure all namespaces reload after language change
		void i18n.reloadResources();
	});
}

export default i18n;
