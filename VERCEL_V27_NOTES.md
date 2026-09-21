# Faeyza Store V27

V27 adds click → conversion → commission attribution.

## Flow
1. `/api/affiliate-click` creates a click ID and stores it in Redis for 30 days.
2. If `AFFILIATE_CLICK_PARAM` is configured, that click ID is appended to the affiliate destination URL. The affiliate network must return the same ID in its conversion report/webhook for automatic attribution.
3. `/api/affiliate-conversion` accepts finalized conversion events with `event_id`, optional `click_id`, product, commission, and currency. Duplicate event IDs are ignored.
4. Dashboard `/admin/tracking/` reports conversions, commission, conversion rate, commission per click, and product-level conversion/commission.

## Environment variables
- `CONVERSION_SECRET` — secret for the conversion webhook.
- `AFFILIATE_CLICK_PARAM` — network-specific sub-ID parameter, only if supported by the affiliate program.
- Existing Upstash and `STATS_TOKEN` variables remain required for persistence/dashboard.

Do not invent a network parameter. Configure the exact sub-ID/click-ID field documented by the affiliate provider. Vercel environment variables are configured in Project Settings and require redeploy after changes.
