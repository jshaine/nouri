# Deploying Nouri

Nouri is a static site: `npm run build` writes everything to `dist/`, and any
static host can serve it. There is no server, database or API key to set up.

Two things every host needs:

- **HTTPS.** Service workers (offline use, installing to the home screen) only
  run on HTTPS or `localhost`. All the hosts below give you HTTPS for free.
- **A fallback to `index.html`.** Screens such as `/history` are routes in the
  app, not files. The host must answer unknown paths with `index.html` so a
  reload or a shared link works. The files for this are already in the repo.

Before deploying, run the full check:

```bash
npm run ci
```

## Netlify

1. Create a site from the repository.
2. Build command: `npm run build`. Publish directory: `dist`.

`public/_redirects` is copied into `dist/` and sends every path to
`index.html`.

## Vercel

1. Import the repository. Vercel detects Vite.
2. Keep the defaults (build `npm run build`, output `dist`).

`vercel.json` rewrites paths without a file extension to `index.html`, so real
files such as `foods.json` are still served as themselves.

## GitHub Pages

A project site lives under a subpath (`https://<user>.github.io/nouri/`), so
build with that base path:

```bash
BASE_PATH=/nouri/ npm run build
```

`BASE_PATH` sets the asset URLs, the router's base, the manifest's `start_url`
and `scope`, and the service worker's navigation fallback. Keep the leading and
trailing slashes. Then publish `dist/` (for example with the
`actions/upload-pages-artifact` and `actions/deploy-pages` actions).

GitHub Pages has no rewrites. Once the service worker is installed it answers
every route offline, but the very first visit to a deep link such as
`/nouri/history` returns GitHub's 404 page. Links from the home page are fine.
Copy `dist/index.html` to `dist/404.html` after the build if you want deep
links to work on a first visit too.

## Food data and FNRI

`public/foods.json` (USDA FoodData Central, public domain) is committed and
always deployed.

`public/foods-fnri.json` (Philippine Food Composition Tables) is gitignored,
because the data is copyrighted. A host that builds from the repository will
not have it, and the app works without it: search simply has no FNRI foods,
and Settings credits only USDA. Only deploy it if you have FNRI's permission,
by building locally with the file present and uploading that `dist/`.

## After an update

Visitors keep the version they have until they accept the new one: the app
shows "A new version of Nouri is ready" and updates when they tap Reload
(or they can tap Later). Nothing about
their data changes, because it lives in IndexedDB on their device.
