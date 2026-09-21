# Faeyza Store V50 — Marketplace-Verified Product Autofill

V50 upgrades the Admin Quick Add flow so marketplace facts are sourced from the product URL before AI content generation.

## Flow
1. Admin enters TikTok Shop or Shopee product/affiliate link and one photo.
2. `/api/admin-product-inspect` resolves allowed redirects and reads marketplace page metadata/JSON-LD.
3. For TikTok Shop, when `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET`, and `TIKTOK_CREATOR_ACCESS_TOKEN` are configured, the endpoint also calls the official TikTok Shop Affiliate Creator API to verify the product and retrieve current affiliate product data such as sales price, original price, shop, commission, units sold, inventory and category when available.
4. AI generates editorial fields, but V50 re-applies marketplace fields after AI so the model cannot overwrite the source price/commission/shop facts.
5. Admin shows source verification status and last checked time before publish.

## Environment
- `TIKTOK_APP_KEY`
- `TIKTOK_APP_SECRET`
- `TIKTOK_CREATOR_ACCESS_TOKEN`
- `TIKTOK_PRODUCT_API_VERSION=202509`
- `OPENAI_MODEL=gpt-5.6-luna`
- `OPENAI_IMAGE_MODEL=gpt-image-2`

Shopee page metadata/JSON-LD is used when the page exposes it. V50 does not invent a Shopee API endpoint; an official/exported feed can be connected separately if available.

## Important
- Empty/unverified price is not treated as a verified price.
- Marketplace price and stock can change after publication; the product page still tells visitors to check the current store page.
- No new serverless function was added, so V50 keeps the existing function-count budget.
