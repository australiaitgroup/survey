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
