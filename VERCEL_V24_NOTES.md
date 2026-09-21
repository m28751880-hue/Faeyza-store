# Faeyza Store V24

V24 menambahkan analytics klik affiliate yang lebih berguna dari V23.

## Perubahan
- Dashboard `/admin/tracking/` dengan metrik total, 7 hari, 30 hari, hari terakhir.
- Grafik klik harian 7/30 hari.
- Ranking produk paling banyak diklik.
- Ranking artikel yang menghasilkan klik.
- Sumber tombol tetap tersedia.
- CTA `Cek Harga` ditambahkan ke tabel produk pada artikel dan memakai source `article:<article-slug>`.
- API `/api/affiliate-stats` mengembalikan `articleClicks` dari source agregat Redis.
- Tidak menyimpan IP/email/ID akun.
- CTR belum dihitung karena V24 belum mengumpulkan pageview/impression teragregasi.

## Environment
Tetap gunakan:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `STATS_TOKEN`

Setelah mengubah Environment Variables di Vercel, redeploy agar perubahan tersedia di runtime.
