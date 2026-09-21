# Faeyza Store V42 — Final Production

V42 freezes the existing affiliate-review feature set and adds a deterministic production release gate.

- `npm run release` runs validation, admin checks, production build, automated QA, and final artifact checks.
- QA HTTP smoke tests run in-process on an ephemeral local port.
- Release checks reject committed secret-like files while allowing `.env.example` as a template.
- Example URLs are checked only when a real `SITE_URL` is configured; the repository default remains `https://example.com` until deployment configuration is supplied.
- No automatic production deployment is performed.
