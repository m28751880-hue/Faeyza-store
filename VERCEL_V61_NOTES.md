# V11 / V61 — Shopee Product Verification

- Added screenshot-based product verification flow in admin.
- Added `Verifikasi dari Screenshot` button and screenshot upload.
- AI vision extracts only facts visibly present in the screenshot; missing facts remain blank.
- Screenshot verification does not scrape or bypass Shopee anti-bot controls.
- Verified screenshot data can feed the existing content generator.
- Removed dependency on filename-based product identity for this flow.
- Cache-busted admin app to v60.
- Official Shopee Open API remains optional; it requires AppId/Secret when available.
