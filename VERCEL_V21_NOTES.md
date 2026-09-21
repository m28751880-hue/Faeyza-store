# Faeyza Store V21

V21 menambahkan Content Hub artikel: pencarian/filter artikel, halaman kategori artikel, daftar isi pada artikel, artikel terkait, breadcrumb yang lebih dalam, dan internal linking antar artikel.

## SEO
- Artikel tetap menggunakan Article JSON-LD.
- Breadcrumb tetap tersedia.
- Tidak menambahkan FAQ rich-result schema karena fitur FAQ rich result Google sudah tidak ditampilkan sejak 7 Mei 2026.
- Konten generator diberi konteks bahwa data berasal dari katalog dan bukan pengalaman pengujian langsung.

## Struktur
- `/artikel/` Content Hub
- `/artikel/kategori/{kategori}/` hub per kategori
- `/artikel/{slug}/` artikel
