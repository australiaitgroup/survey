import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false, // No sourcemap needed in production
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
				},
			},
		},
	},
	server: {
		host: '0.0.0.0',
		port: 5051, // Frontend port
		proxy: {
			// Proxy API requests to backend in development
			'/api': {
				target: 'http://localhost:5050', // Backend running on port 5050
				changeOrigin: true,
				secure: false,
			},
			// Support multi-tenant API routes like /:companySlug/api/* during local dev
			'^/[^/]+/api': {
				target: 'http://localhost:5050',
				changeOrigin: true,
				secure: false,
				rewrite: (path: string) => path.replace(/^\/[^/]+\/api/, '/api'),
			},
		},
		allowedHosts: ['localhost', '127.0.0.1', 'survey.jiangren.com.au', '*.jiangren.com.au'],
	},
});
