let isInitialized = false;
const DEFAULT_GA_MEASUREMENT_ID = 'G-YFHEBSNVSC';

function getMeasurementId(): string | undefined {
	const envId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
	if (envId) return envId;
	const mode = import.meta.env.MODE;
	if (mode === 'production') return DEFAULT_GA_MEASUREMENT_ID;
	return undefined;
}

function loadScript(src: string): Promise<void> {
	return new Promise(resolve => {
		const existing = document.querySelector(`script[src="${src}"]`);
		if (existing) {
			resolve();
			return;
		}
		const s = document.createElement('script');
		s.async = true;
		s.src = src;
		s.onload = () => resolve();
		document.head.appendChild(s);
	});
}

export async function initAnalytics(): Promise<void> {
	const measurementId = getMeasurementId();
	if (!measurementId || isInitialized) return;

	// Setup dataLayer and gtag function
	(window as any).dataLayer = (window as any).dataLayer || [];
	function gtag(...args: any[]) {
		(window as any).dataLayer.push(arguments);
	}
	(window as any).gtag = gtag;
	gtag('js', new Date());

	await loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
	gtag('config', measurementId, { anonymize_ip: true });
	isInitialized = true;
}

export function trackPageView(path: string): void {
	const measurementId = getMeasurementId();
	if (!measurementId || !(window as any).gtag) return;
	(window as any).gtag('config', measurementId, {
		page_path: path,
	});
}
