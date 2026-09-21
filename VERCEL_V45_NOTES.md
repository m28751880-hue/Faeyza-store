# Faeyza Store V45 — Admin Password Login

- Added a real admin login screen at `/admin/`.
- Admin uses `ADMIN_PASSWORD` configured in Vercel Environment Variables.
- Successful login creates a 12-hour HttpOnly/Secure/SameSite=Strict signed session cookie.
- Logout clears the session.
- Admin product, product-inspect, and AI content APIs accept the signed admin session.
- Legacy `ADMIN_TOKEN` bearer auth remains as a compatibility fallback.
- No additional Serverless Function was added; Vercel Hobby function count remains 11.
- Password is never stored in the browser/localStorage and is not included in page source.
