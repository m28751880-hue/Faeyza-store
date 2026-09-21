# Faeyza Store V31 — Search & Discovery

V31 meningkatkan pencarian katalog tanpa mengubah konsep mobile marketplace V30.4.

## Fitur
- Halaman katalog `/produk/` dengan pencarian berbasis URL `?q=`.
- Global search desktop + mobile dengan autocomplete produk.
- Submit search via Enter/tombol pencarian.
- Autocomplete menampilkan produk, kategori, dan harga yang tersedia.
- Filter kategori, rating minimum, batas harga.
- Sorting: paling relevan, harga rendah/tinggi, rating, nama A–Z.
- Applied-filter chips dan tombol Reset.
- Empty state ketika tidak ada hasil.
- Search mencakup nama, kategori, brand, tag, ringkasan, serta nama/nilai spesifikasi.
- `products-search.json` sebagai indeks pencarian ringan.
- Link navigasi Produk sekarang menuju katalog `/produk/`.
- Desktop tetap dipertahankan; mobile search dibuat marketplace-style.

## QA
- `npm run validate` → OK
- `npm run admin` → 5 produk, 0 invalid/duplicate
- `npm run build` → 5 produk, 4 kategori, 8 artikel, 27 sitemap URLs
- SEO audit → OK
- Affiliate placeholder warnings tetap ada pada data demo dan bukan error build.
