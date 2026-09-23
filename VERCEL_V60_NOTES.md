# V60 — Shopee short-link safety fallback

- Keeps official Shopee Affiliate API support when credentials are available.
- Does not bypass CAPTCHA/anti-bot protections.
- When a Shopee short-link is blocked server-side (401/403/429/503), Admin opens the link and asks the operator to paste the final HTTPS product URL.
- Filename-like values such as IMG/DSC/WA/Screenshot are never used as verified product identity.
- Unknown category remains `Belum ditentukan`; `Workspace` is not used as a fallback.
- Publishing remains blocked for unverified/unknown product identity.
