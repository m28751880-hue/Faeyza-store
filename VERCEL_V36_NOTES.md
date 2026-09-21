# Faeyza Store V36 — PWA & Performance Foundation

V36 adds an installable Progressive Web App foundation without changing the affiliate funnel.

## Added
- Web App Manifest at `/manifest.webmanifest`
- 192px and 512px PNG app icons
- Service worker at `/service-worker.js`
- Custom offline fallback at `/offline.html`
- Deferred service-worker registration after page load
- In-app install prompt using `beforeinstallprompt`
- Install dismissal preference stored locally
- `theme-color` and mobile PWA metadata
- Runtime caching for same-origin static GET requests
- API/admin requests are intentionally excluded from service-worker caching

## Deployment
Serve the site over HTTPS for normal PWA installability. Vercel provides HTTPS automatically on deployed projects.

## Notes
- PWA install availability depends on browser/device criteria.
- Offline mode is intentionally conservative: APIs and admin routes are never cached.
- Product/catalog HTML visited online may be cached for repeat/offline navigation.
