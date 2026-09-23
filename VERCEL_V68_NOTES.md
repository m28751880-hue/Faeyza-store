# V68 — Screenshot Verification Fix

- Fixed a session-restore bug where previously confirmed but incomplete OCR data was restored and displayed as if it were complete.
- Screenshot verification now uses a new session key (`faeyza:screenshot-verification:v68`).
- If restored confirmed data is missing key visible facts such as price or shop, it is marked for re-check instead of being trusted as complete.
- Local screenshot OCR now performs multiple passes with an upscaled/high-contrast image variant.
- Shop detection accepts marketplace patterns such as toko/shop/seller and common shop-name signals, while rejecting meaningless short OCR fragments such as `in`.
- Root `admin/` and mirrored `public/admin/` assets are synchronized.
- Admin cache version updated to `app.js?v=68`.
- Build, validation, admin checks, QA, and JavaScript syntax checks pass.
