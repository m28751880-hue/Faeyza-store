# Faeyza Store V28

V28 menambahkan jembatan provider conversion.

## TikTok Shop
- Menggunakan endpoint resmi TikTok Shop Affiliate Creator Trace Orders versi 202505.
- Mengambil order affiliate berdasarkan rentang waktu.
- Membaca status order, product ID, actual commission, dan currency.
- Menyimpan conversion dengan event ID `tiktok:<order_id>` sehingga aman dari duplikasi.
- Cron harian `/api/tiktok-affiliate-sync` pada 02:30.
- Secret provider dan kredensial hanya di Environment Variables.

## Shopee
V28 tidak mengarang endpoint conversion Shopee. Gunakan `/api/affiliate-conversion` sebagai bridge untuk laporan/webhook/ekspor resmi Shopee setelah format dan field tracking akun tersedia.

## Environment
- PROVIDER_SYNC_SECRET
- TIKTOK_APP_KEY
- TIKTOK_APP_SECRET
- TIKTOK_CREATOR_ACCESS_TOKEN
- TIKTOK_TRACE_API_VERSION=202505
- TIKTOK_TRACE_TIME_TYPE=PAY_TIME
- TIKTOK_TRACE_TIME_GE / TIKTOK_TRACE_TIME_LT (opsional)

Jangan memasukkan secret/API token ke chat atau source code.
