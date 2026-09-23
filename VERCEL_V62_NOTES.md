# V62 / V11.1 — Shopee Screenshot Verification Hardening

- Screenshot verification now requires a product name plus at least one corroborating visible fact (price, shop, rating, reviews, sold, product URL, or specs).
- Screenshot payload is compressed before verification and rejected client-side if still too large.
- Generate Content requires `sourceVerified === true`.
- Save & Publish is blocked in both frontend and `/api/admin-products` unless `sourceVerified === true`.
- Server rejects `Workspace`, `Produk belum teridentifikasi`, and filename-like fallback names on publish.
- Cache-busted admin app to `v=61`.
- OpenAI Vision continues to use the configured `OPENAI_MODEL`; current OpenAI model docs list GPT-5.6 Luna as a vision-capable model.
