# Faeyza Store V56

## Shopee Affiliate Reader 3.0
- Supports Shopee affiliate short-link hosts including `shope.ee`, `s.shopee.co.id`, `shp.ee`, and `id.shp.ee` in addition to Shopee product pages.
- Follows allowed HTTPS redirects to the final Shopee product page.
- Improves `<meta>` parsing even when `content` appears before `property`/`name`.
- Extracts product name, price, product image, seller/store, rating, review count, sold count, and structured offer data from JSON-LD, embedded marketplace state, metadata, and rendered page text when available.
- Shopee seller extraction recognizes the visible `Aktif ... lalu ... Kunjungi Toko` pattern and avoids using a generic `Shopee` platform name as the store.
- Marketplace facts remain source facts; missing values stay blank rather than being invented by AI.
- Manual product photos remain supported and remain the primary catalog images in the current V54/V55 workflow.

## Verification
- Added `scripts/test-marketplace-reader.js` fixture test.
- Node syntax checks, catalog validation, build, SEO, QA, production-check, and ZIP integrity are required before release.
