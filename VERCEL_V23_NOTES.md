# V23 — Persistent Affiliate Analytics

V23 upgrades V22 runtime-log tracking to optional persistent aggregate analytics using Upstash Redis REST.

## Environment variables
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `STATS_TOKEN` — a separate random token used to protect the stats endpoint

If Redis variables are absent, affiliate clicks still redirect and remain available in Vercel Runtime Logs, preserving V22 behavior.

## Storage model
- `kj:clicks:total`
- `kj:clicks:daily` hash
- `kj:clicks:products` hash
- `kj:clicks:sources` hash

No IP, email, or account ID is stored in Redis.

## Dashboard
`/admin/tracking/` accepts the admin token in-browser and calls `/api/affiliate-stats` with an Authorization header.

## Vercel setup
Vercel Marketplace currently offers Upstash as a serverless database/storage integration. Connect it to the project and provide the REST URL/token variables required by this adapter. Keep `STATS_TOKEN` as a separate secret.
