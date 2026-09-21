# Faeyza Store V25

## Pageview + CTR
- Menambahkan tracker pageview agregat pada halaman publik.
- Tracker memakai `navigator.sendBeacon` bila tersedia dan fallback `fetch(..., keepalive)`.
- Halaman `/admin/` dan `/api/` tidak dihitung.
- Redis menyimpan total, harian, dan route pageview tanpa IP/email/account ID.
- Dashboard `/admin/tracking/` menghitung CTR mentah = total klik affiliate / total pageview.
- Label eksplisit: raw pageview CTR, bukan unique visitor CTR.

## Environment
Variabel V23/V24 tetap dipakai: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `STATS_TOKEN`.
Setelah mengubah Environment Variables di Vercel, lakukan redeploy agar nilai baru digunakan.
