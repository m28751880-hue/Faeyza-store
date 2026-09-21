# Faeyza Store V43 — Hobby Deploy Compatibility

V43 addresses the Vercel Hobby deployment error that reported a Serverless Function limit during output deployment.

Changes:
- Removed the unused `/api/tiktok-oauth.js` endpoint. The live site/admin does not call this endpoint.
- API function count is now 11 instead of 12.
- Added a production-check guard so future builds fail early if more than 11 API function files are present.
- No product, SEO, analytics, admin catalog, TikTok conversion-sync, or scheduled-sync functionality is changed.
- TikTok OAuth environment example is retained as documentation only; OAuth is not part of the current site UI.

Deployment note: V43 is intended to avoid the Hobby function-count rejection shown in the Vercel deployment details.
