// API Configuration
export const API_CONFIG = {
	// Base URL for API requests
	BASE_URL:
		import.meta.env.MODE === 'development'
			? '/api' // Vite proxy will handle this in development
			: import.meta.env.VITE_API_BASE_URL || '/api',

	// App URL for constructing full URLs (e.g., for sharing)
	APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,

	// API timeout in milliseconds
	TIMEOUT: 30000,

	// Retry configuration
	RETRY_ATTEMPTS: 3,
	RETRY_DELAY: 1000,
};

// Helper function to construct full API URLs
export const getApiUrl = (path: string): string => {
	const baseUrl = API_CONFIG.BASE_URL;
	const cleanPath = path.startsWith('/') ? path : `/${path}`;
	return `${baseUrl}${cleanPath}`;
};

// Helper function to construct full app URLs
export const getAppUrl = (path: string): string => {
	const appUrl = API_CONFIG.APP_URL;
	const cleanPath = path.startsWith('/') ? path : `/${path}`;
	return `${appUrl}${cleanPath}`;
};

// Environment checks
export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';
