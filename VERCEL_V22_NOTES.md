# V22 — Affiliate Click Tracking

- Added `/api/affiliate-click` redirect endpoint.
- Affiliate buttons now log structured `affiliate_click` events before redirecting.
- No IP, email, or account ID is added by the application event.
- Added `/admin/tracking/` guide for interpreting Vercel Runtime Logs.
- `products.json` is bundled into the tracking function.
- No database or third-party analytics credential is required.
- Vercel Logs remain the source of truth for production click events.
