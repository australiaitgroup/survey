import 'react-i18next';

declare module 'react-i18next' {
	interface CustomTypeOptions {
		defaultNS: 'translation';
		resources: {
			translation: typeof import('../../public/locales/en/translation.json');
			admin: typeof import('../../public/locales/en/admin.json');
			survey: typeof import('../../public/locales/en/survey.json');
			question: typeof import('../../public/locales/en/question.json');
		};
	}
}
