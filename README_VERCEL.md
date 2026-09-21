# Faeyza Store V12 — Vercel Deployment

V12 is prepared for Vercel: static SEO pages are generated at build time, while Vercel Functions handle health checks, scheduled catalog sync, and integration entry points.

## Architecture

`Affiliate feed/API -> /api/sync -> GitHub products.json -> Vercel build -> public SEO pages`

The sync function does **not** invent Shopee/TikTok endpoints. It consumes an official JSON feed/API endpoint configured in environment variables. GitHub is used as the persistent catalog because Vercel Functions are stateless.

Vercel Cron invokes `/api/sync` every 6 hours. Protect the route with `CRON_SECRET` and configure the same secret in Vercel Environment Variables.

## Required Vercel variables

Set Production variables in **Vercel Project → Settings → Environment Variables**:

- `CRON_SECRET`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH=main`
- `GITHUB_PRODUCTS_PATH=products.json`
- `SHOPEE_FEED_URL` (only if you have an official feed/API endpoint)
- `TIKTOK_FEED_URL` (only if you have an official feed/API endpoint)
- `SITE_URL`

TikTok OAuth settings can additionally use `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, and `TIKTOK_REDIRECT_URI`.

## Deploy

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables above.
4. Deploy.
5. Test `/api/health`.
6. After configuring an official affiliate feed, the Vercel Cron job will sync every 6 hours.

Do not put API secrets in `products.json`, `admin/`, browser JavaScript, or public files.


## V13 production hardening
- Cron-compatible `GET /api/sync` (POST remains supported for manual calls).
- `GET /api/sync?dryRun=1` validates feeds without committing to GitHub.
- `GET /api/sync-status` reports whether required integrations are configured (never exposes secrets).
- Sync commits the catalog to GitHub; if the repository is connected to Vercel, the commit can trigger a new deployment.
- Keep `CRON_SECRET`, `GITHUB_TOKEN`, and provider credentials in Vercel Environment Variables only.


## V44 Hobby deploy note
V44 keeps the deployed API surface at 11 Serverless Function files to stay below the Hobby deployment function-count rejection encountered during deployment. The unused `/api/tiktok-oauth` endpoint was removed; the site and admin UI do not call it.
