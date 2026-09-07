# Abdelkarim Douadjia

Personal portfolio at https://abdelkarim.me.

The current website source is in `site/`. It includes the home page, project
archive, project details, ASCII background, and scroll and image interactions.
The earlier React source remains at the repository root for reference.

## Local preview

```sh
cd site
npm ci
npm start
```

## Build and publish

```sh
cd site
npm run build
```

The build writes `site/dist/`, including the browser modules required by Three.js,
GSAP, and Lenis. A push to `main` that changes `site/` runs the GitHub Pages
workflow. The custom domain is `abdelkarim.me` with HTTPS enforced.

For browser verification, run `npm run verify:release` while a local server is
running. Set `SITE_URL` to test another server or the deployed site. Screenshots
are written to `site/verification/release/`.
