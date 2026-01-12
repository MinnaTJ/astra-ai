import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/astra-ai/',
    plugins: [react()],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.js$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        },
        target: 'esnext'
      }
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: true
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@constants': path.resolve(__dirname, './src/constants')
      }
    }
  };
});