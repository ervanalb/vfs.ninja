import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        pool: 'pool/index.html',
        about: 'about/index.html',
      },
    },
  },
})
