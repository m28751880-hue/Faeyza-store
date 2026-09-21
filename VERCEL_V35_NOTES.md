# Faeyza Store V35 — Affiliate Analytics 2.0

V35 memperluas analytics dari dashboard klik/konversi menjadi funnel dan performa rentang waktu.

## Dashboard
- Funnel Pageview → Affiliate Click → Conversion → Commission.
- Rentang 7 / 30 / 90 hari.
- CTR = raw affiliate click ÷ raw pageview.
- CVR = conversion ÷ affiliate click.
- EPC = commission ÷ affiliate click.
- Komisi per konversi.
- Trend harian untuk klik, pageview, konversi, atau komisi.
- Performa produk: pageview, klik, CTR, konversi, CVR, komisi, EPC.
- Performa artikel dan sumber tombol.
- Traffic per halaman.
- Export CSV performa produk.

## Data harian baru
Tracker menambah agregasi harian untuk produk, sumber, route pageview, conversion produk, dan commission produk. Data ini memungkinkan analisis rentang 7/30/90 hari tanpa menyimpan PII.

## Backward compatibility
Agregat V28/V30 tetap dibaca. Data historis sebelum agregasi V35 tersedia hanya pada level total/all-time yang sudah ada; performa produk per rentang tidak dapat direkonstruksi untuk periode sebelum V35.

## Security
STATS_TOKEN tetap wajib untuk `/api/affiliate-stats`. Redis credentials tetap server-side. Tidak ada IP, email, atau account ID yang disimpan oleh tracker.

## Deployment
Setelah deploy, pastikan environment variables Upstash dan STATS_TOKEN tersedia di Vercel lalu redeploy.
