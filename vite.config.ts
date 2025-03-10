import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      watchFilePaths: [
        path.resolve(__dirname, 'src/popup.tsx'),
        path.resolve(__dirname, 'src/components'),
      ],
      disableAutoLaunch: true,
      manifest: () => {
        // Generate your manifest
        const packageJson = readJsonFile('package.json');
        return {
          ...readJsonFile('manifest.json'),
          name: packageJson.name,
          version: packageJson.version,
        };
      },
    }),
  ],
  build: {
    sourcemap: 'inline',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
