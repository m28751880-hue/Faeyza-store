# Faeyza Store V48 — Final Production Release

V48 is the production-ready release package. It freezes the existing affiliate-review feature set and adds a deterministic release gate.

## Release gate

Run:

```bash
npm run release
```

This runs catalog validation, admin validation, a clean production build, automated QA, and the final production artifact check.

## Deployment checklist

1. Upload the V48 source to the repository used by Vercel.
2. Set production environment variables in Vercel; never commit secrets.
3. Redeploy after environment changes.
4. Confirm the production domain and `SITE_URL` match.
5. Run the release gate locally/CI before publishing.
6. Open the home page, product catalog, one product page, articles, favorites, compare, and admin routes.
7. Confirm affiliate URLs are real before launch. Demo placeholders are intentionally reported as warnings in catalog validation.

## Server-side environment variables

Use the values required by the enabled integrations. Common production secrets in this project include:

- `ADMIN_TOKEN`
- `STATS_TOKEN`
- `CRON_SECRET`
- `CONVERSION_SECRET`
- `OPENAI_API_KEY` (only if AI content generation is enabled)
- integration credentials required by the official Shopee/TikTok adapters

Never place these values in client-side JavaScript, `products.json`, or the ZIP.

## Affiliate launch check

The demo catalog contains placeholder affiliate URLs for some products. Replace them with real affiliate URLs before sending production traffic. The site remains functional, but those placeholders should not be treated as live monetization links.

## Scope

No automatic production deployment is performed by this release. V48 is a tested, production-ready package; deployment remains an explicit operator action.
