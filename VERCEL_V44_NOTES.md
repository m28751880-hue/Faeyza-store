# Faeyza Store V44 — Final Hobby Deploy Compatibility

V44 is the corrected production package after Vercel reported the Hobby Serverless Function limit.

Changes:
- Removed the unused `api/tiktok-oauth/callback.js` function that remained in V43.
- API function count is now 11, matching the Hobby deployment guard.
- Kept TikTok conversion-sync (`api/tiktok-affiliate-sync.js`); the removed callback was not referenced by the current site/admin UI.
- No product, SEO, analytics, admin catalog, AI content, PWA, or scheduled-sync features are intentionally removed.
- `npm run release` and ZIP integrity must pass before release.

Affiliate activation still requires replacing demo affiliate URLs and configuring the required Vercel environment variables/secrets.
