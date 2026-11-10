# Hombre Tribute

Astro mirror of the [Hombre Tribute](https://www.hombre-tribute.com) Webflow site (1967 Paul Newman western fan tribute).

This is a **mirror-first** migration: published Webflow HTML, CSS, JS, and media are copied into this repo so the site looks and behaves the same. Cleaning it into idiomatic Astro components is a later pass.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Project notes

- Bound Webflow site ID lives in [`webflow.json`](webflow.json) (`63af52b71504f950bae436f8`).
- Page markup: [`src/mirror/body.html`](src/mirror/body.html) rendered by [`src/pages/index.astro`](src/pages/index.astro).
- Local assets: `public/assets`, `public/css`, `public/js`, `public/audio`.
- Custom interactions (Lenis / Howler / GSAP) come from the previous overlay scripts, now at `public/js/custom-script.js` and `public/css/custom-style.css`.
- Adobe Typekit remains remote (`eii3mun`).
- To refresh the mirror from the live Webflow publish: `node scripts/mirror-webflow.mjs` (then re-copy `.tmp/body.html` into `src/mirror/body.html` if needed).
