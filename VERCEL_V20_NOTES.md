# Faeyza Store V20 — Generator Artikel SEO Otomatis

V20 menambahkan generator artikel statis berbasis data katalog.

## Yang baru
- `data/article-topics.json` mengatur template artikel.
- Generator membuat 2 artikel per kategori:
  - Panduan memilih kategori.
  - Checklist sebelum membeli kategori.
- Artikel otomatis menyertakan:
  - title + meta description unik per kategori/topik
  - canonical
  - `Article` JSON-LD
  - breadcrumb
  - ringkasan data produk
  - tabel produk
  - kriteria/spesifikasi yang tersedia
  - internal links ke halaman produk dan perbandingan
  - FAQ
  - disclosure bahwa artikel berasal dari data katalog dan bukan pengalaman penggunaan langsung
- `/artikel/` menjadi indeks semua artikel.
- Sitemap otomatis memasukkan semua artikel.

## Prinsip konten
Generator sengaja tidak membuat klaim pengalaman pribadi, pengujian langsung, atau review pengguna yang tidak ada datanya. Artikel sebaiknya ditinjau dan diperkaya dengan informasi asli sebelum dipublikasikan dalam skala besar.

Google menyarankan konten yang helpful, reliable, people-first dan memiliki nilai asli, bukan sekadar konten massal untuk mesin pencari. Lihat dokumentasi Google Search Central.

## Build
`npm run validate`
`npm run build`
