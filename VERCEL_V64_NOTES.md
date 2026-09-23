# V64 — Screenshot Verification State & OCR Fix

- Screenshot verification state is persisted for the current browser session so a reload does not silently fall back to the unreadable Shopee page.
- Confirmed screenshot data remains the primary source when Shopee server/page inspection returns no structured data.
- OCR no longer treats repeated identical prices as an old price.
- OCR title selection ignores common Shopee variation/option lines and scores more likely product-title lines.
- Restored screenshot data is shown again after a page reload.
- Admin cache-bust updated to `app.js?v=64`.
- `admin/` and `public/admin/` assets are kept synchronized.
