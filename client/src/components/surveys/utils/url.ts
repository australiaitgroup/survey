export const getSurveyUrl = (slug: string, companySlug?: string) => {
	const basePath = companySlug ? `/${companySlug}` : '';
	return `${window.location.origin}${basePath}/survey/${slug}`;
};

export const getAssessmentUrl = (slug: string, companySlug?: string) => {
	const basePath = companySlug ? `/${companySlug}` : '';
	return `${window.location.origin}${basePath}/assessment/${slug}`;
};

export const getOnboardingUrl = (slug: string, companySlug?: string) => {
	const basePath = companySlug ? `/${companySlug}` : '';
	return `${window.location.origin}${basePath}/onboarding/${slug}`;
};
