import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Site estático. Só as páginas marcadas com `export const prerender = false`
// (ferramentas profissionais e webhook) rodam no servidor.
export default defineConfig({
  site: 'https://lipedema360.com.br',
  trailingSlash: 'never',
  build: { format: 'file' },
  adapter: vercel(),
});
