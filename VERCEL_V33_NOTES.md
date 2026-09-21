# Faeyza Store V33 — Wishlist / Saved Products

V33 builds on V32 and adds a guest wishlist stored locally in the browser.

## Features
- ♡ Simpan Produk on product cards
- ♡ Simpan Produk on product detail pages
- `/favorit/` Saved Products page
- Saved count state support
- Remove saved items without login
- Uses `localStorage` only; no account/IP/email data is sent to the server
- Keeps V32 gallery, video, recently viewed, search/filter, affiliate tracking, conversion tracking, analytics, admin, and SEO features
- Saved product records retain slug/name/image/category/price/rating for local rendering

## Testing
- `npm run validate`
- `npm run admin`
- `npm run build`
- HTTP smoke tests for `/`, `/produk/`, `/favorit/`, product detail, `/admin/`, `/artikel/`
- ZIP integrity check
