# Faeyza Store V40 — Automated QA

V40 adds a repeatable QA gate for every build.

## Local QA

```bash
npm run qa
```

The QA script runs validation, admin catalog checks, a fresh static build, SEO audit, JavaScript syntax checks, JSON validation, generated-route/sitemap consistency checks, duplicate HTML id detection, image alt checks, robots/PWA asset checks, a basic public-asset secret scan, and local HTTP smoke tests.

## GitHub Actions

`.github/workflows/qa.yml` runs `npm run qa` on pushes and pull requests using Node 24.

## Deployment

Vercel can continue using `npm run build` as the production build command. QA is intentionally separate so CI can fail on regressions without changing the existing Vercel build contract.
