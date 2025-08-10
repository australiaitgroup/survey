import axios from 'axios';

// Get API base URL from environment variable
// In development with Vite proxy, we use relative URL '/api'
// In production, this should be set to your actual API endpoint
const baseURL =
	import.meta.env.MODE === 'development'
		? '/api' // Vite proxy will handle this in development
		: import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance with base configuration
const api = axios.create({
	baseURL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add JWT token
api.interceptors.request.use(
	config => {
		const token = localStorage.getItem('adminToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
    // Suppress writes in preview mode (but NEVER suppress admin writes)
    const isWrite = ['post', 'put', 'patch', 'delete'].includes(
        (config.method || '').toLowerCase()
    );
    const urlPath = config.url || '';
    const isAdminEndpoint = urlPath.startsWith('/admin/');
    if ((window as any).__PREVIEW__ === true && isWrite && !isAdminEndpoint) {
        console.debug('Preview mode: write suppressed for non-admin endpoint', urlPath);
        // Cancel by throwing a special axios cancel which will be handled below
        return Promise.reject({ __previewSuppressed: true });
    }
		return config;
	},
	error => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
	response => {
		return response;
	},
	error => {
		// Swallow suppressed preview writes as successful no-ops
		if (error && error.__previewSuppressed) {
			return Promise.resolve({ data: { success: true, preview: true } } as any);
		}
		if (error.response?.status === 401) {
			// Only redirect on token expiration for authenticated endpoints
			// Skip redirect for login/register endpoints
			const requestUrl = error.config?.url || '';
			const isAuthEndpoint =
				requestUrl.includes('/login') || requestUrl.includes('/register');

			if (!isAuthEndpoint) {
				// Token expired or invalid for authenticated endpoint, remove it and redirect to login
				localStorage.removeItem('adminToken');
				window.location.href = '/admin';
			}
		}
		return Promise.reject(error);
	}
);

export default api;
