import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  preprocess: vitePreprocess(),
  onwarn: (warning, handler) => {
    if (warning.code === 'a11y_label_has_associated_control') return;
    handler(warning);
  },
}
