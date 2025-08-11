import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'~frontend': path.resolve(__dirname, './frontend'),
			'~server': path.resolve(__dirname, './server')
		}
	},

	root: './frontend',
	server: {
		port: 8607
	},
	build: {
		outDir: '../build/frontend',
		emptyOutDir: true
	}
});
