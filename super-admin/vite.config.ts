import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	base: '/super-admin/',
	server: {
		port: 3000,
		fs: {
			// 允许从 monorepo 上层导入共享组件
			allow: ['..'],
		},
		proxy: {
			// Proxy API requests to the main server
			'/api': {
				target: 'http://localhost:5050',
				changeOrigin: true,
				secure: false,
			},
		},
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js'],
	},
	build: {
		outDir: 'dist',
		sourcemap: true,
		rollupOptions: {
			input: {
				main: './index.html',
			},
		},
	},
});
