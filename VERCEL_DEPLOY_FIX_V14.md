# Faeyza Store V14 — Vercel deployment fix

V14 keeps the static-site + Vercel Functions architecture, but makes the deployment contract explicit:

- Node.js `24.x` is pinned in `package.json`.
- Vercel uses `npm run build` explicitly.
- `public/` is explicitly configured as the output directory.
- `products.json` is explicitly included in the `/api/sync` function bundle.
- The obsolete `vercel-build` script is removed so the build is not selected twice by configuration/script detection.
- `/api/health` reports V14.
- `/api/sync` remains compatible with both GET (Cron) and POST (manual) requests.

Do not put Shopee/TikTok/GitHub secrets into the repository. Configure them in Vercel Environment Variables.
