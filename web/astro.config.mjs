import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

/**
 * Astro configuration for the culinary blog.
 *
 * Key decisions:
 * - `output: "hybrid"` — static pages by default (SSG) with opt-in SSR
 *   for dynamic routes. Best for a blog: fast static pages + flexibility.
 * - React integration for interactive Islands (filters, search, checkboxes).
 * - Cloudflare Pages adapter for deployment.
 * - SCSS via Vite's built-in support (no extra plugin needed).
 */
export default defineConfig({
  site: "https://gdywbrzuchuburczy.pl",

  output: "static",

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "pl",
        locales: {
          pl: "pl-PL",
          en: "en-US",
        },
      },
    }),
  ],

  adapter: cloudflare(),

  vite: {
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "/src/styles/_variables.scss" as *;\n`,
        },
      },
    },
  },
});
