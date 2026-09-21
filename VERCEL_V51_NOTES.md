# Faeyza Store V51 — Marketplace Reader 2.0

V51 improves the Quick Add marketplace reader without requiring TikTok Partner Center access.

## What changed
- Follows up to 7 HTTPS redirects while keeping every redirect host on the marketplace allowlist.
- More robust `<meta>` parsing regardless of attribute order.
- Reads Product JSON-LD and common embedded Next.js product data.
- Extracts price, original price, shop/seller, rating, reviews, stock, sold count and commission when the live marketplace page exposes them.
- Recognizes TikTok Shop short links on `vt.tokopedia.com` as a TikTok Shop source for optional API lookup.
- Removes the unsupported TikTok product-by-ID call from V50 and uses the documented Affiliate Creator open-collaboration search endpoint when TikTok credentials/scopes are available.
- Distinguishes three evidence levels in Admin:
  - `official-api`: data returned by TikTok's official Affiliate Creator API.
  - `live-page`: data read from the current marketplace page.
  - `unverified`: no reliable marketplace fact was obtained.
- AI content generation cannot overwrite marketplace price, shop, commission, stock, rating, or other marketplace facts collected by the reader.
- Empty facts stay empty; the system does not invent prices or commissions.
- Admin script cache-busted to V51 and service-worker cache bumped to V51.

## TikTok API limitation
TikTok's official Affiliate Creator APIs require an app, enabled API access, creator scopes, and creator authorization. If those credentials are not available, V51 still uses the live product/affiliate page when the page exposes usable data. This is intentionally labeled `live-page`, not `official-api`.

## Environment
- `TIKTOK_APP_KEY`
- `TIKTOK_APP_SECRET`
- `TIKTOK_CREATOR_ACCESS_TOKEN`
- `TIKTOK_PRODUCT_API_VERSION=202405`
- `OPENAI_MODEL=gpt-5.6-luna`
- `OPENAI_IMAGE_MODEL=gpt-image-2`

## Important
Marketplace data can change after publication. The admin UI shows the check timestamp and the product page continues to direct visitors to the current marketplace listing.
