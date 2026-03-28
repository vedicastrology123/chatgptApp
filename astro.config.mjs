// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

export default defineConfig({
  devToolbar: {
    enabled: false, // This turns off the little "Astro" icon at the bottom and kills the 404
  },
  output: 'server', 
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: netlify()
});