# Faeyza Store V26

## Analytics traffic + conversion
- Memperluas dashboard V25 dengan ranking halaman berdasarkan raw pageview.
- Menghubungkan klik affiliate ke URL produk/artikel untuk estimasi CTR per halaman.
- Menambahkan visual perbandingan 30 hari pageview vs klik affiliate.
- Tetap menggunakan data agregat Redis; tidak membuat visitor ID atau cookie baru.
- CTR disebut raw pageview CTR, bukan unique visitor CTR.

## Catatan
- Pemetaan CTR halaman berasal dari sumber klik yang sudah ada: `product` untuk produk dan `article:<slug>` untuk artikel.
- Halaman lain yang tidak memiliki sumber klik affiliate akan menunjukkan traffic tanpa conversion click.
- Vercel Cron tetap harian agar kompatibel dengan batas Hobby. Vercel menyatakan Hobby mendukung Cron sekali per hari.
