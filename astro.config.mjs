// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  build: {
    format: 'directory'
  },
  trailingSlash: 'never',
  site: 'https://timbaya.com',
  vite: {
    ssr: {
      noExternal: ['@astrojs/*']
    }
  }
});