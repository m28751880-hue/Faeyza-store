# Faeyza Store V30.4

## Mobile marketplace-style UI

V30.4 mempertahankan fitur V30.3 dan mengubah tampilan layar kecil (<=800px) menjadi mobile-first dengan pola marketplace:

- header sticky dengan search bar mobile
- kategori cepat horizontal
- banner rekomendasi
- grid produk 2 kolom
- kartu produk dengan foto, tag, rating, harga, dan CTA Cek Harga
- section video referensi
- bottom navigation: Beranda, Produk, Panduan, Bandingkan, Admin
- kategori tile dan section heading yang ringkas
- product detail lebih rapat di mobile dengan CTA yang mudah dijangkau
- desktop tetap menggunakan layout desktop yang ada

## Catatan

Desain mengambil pola navigasi dan product discovery yang umum pada mobile ecommerce, bukan menyalin tampilan marketplace tertentu.

Semua fitur V30.3 tetap dipertahankan: Admin Quick Add, auto metadata, videoUrl, Share Produk, caption otomatis, WhatsApp/Facebook share, QR Code, tracking affiliate, conversion/commission analytics, dan halaman SEO.

## Test

- `npm run validate` -> OK: 5 products
- `npm run admin` -> 5 products, 0 invalid/duplicate
- `npm run build` -> 5 product pages, 4 category pages, 8 article pages, 26 sitemap URLs
- SEO audit -> OK: 5 products
- Existing warnings: 3 demo products still use placeholder affiliate URLs
