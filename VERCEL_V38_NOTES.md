# V38 — Performance + PWA Optimization

- Lazy/decode async catalog and gallery images; first product gallery image gets fetchpriority=high.
- Service worker uses network-first for HTML/navigation and stale-while-revalidate style caching for static assets.
- Old service-worker caches are cleaned during activation.
- Long cards/article sections use content-visibility to reduce initial paint work.
- Vercel sends long-lived immutable cache headers for fingerprintable/static assets and a shorter cache for the manifest.
- API/Admin routes remain outside the service-worker cache.

Review generated pages after deployment with Lighthouse/PageSpeed and replace data-URI images with CDN/object storage when catalog volume grows.
