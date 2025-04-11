import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build'
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5067', // Adjust this to match your .NET server's port
                changeOrigin: true,
                secure: false, // Accept self-signed certificates if running localhost over HTTPS
            }
        }
    }
});