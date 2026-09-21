# Faeyza Store V7 — Bulk Affiliate SEO Site

V7 memperkuat pipeline V6 untuk katalog besar: spreadsheet → JSON → validasi → static pages → SEO audit.

## Quick start

```bash
npm run import -- data/products.csv
SITE_URL=https://domainkamu.com npm run build
```

Upload isi `public/` ke hosting static seperti shared hosting, Cloudflare Pages, Netlify, Vercel, atau GitHub Pages.

## Data produk

Kolom CSV/XLSX utama: `name, slug, category, brand, price, oldPrice, rating, reviews, icon, image, tag, summary, pros, cons, specs, affiliateUrl`.

- `pros` dan `cons`: pisahkan dengan `|`.
- `specs`: format `Kunci=Nilai|Kunci=Nilai`.
- `image`: URL gambar produk opsional.
- Rating/review hanya masukkan bila sumbernya nyata dan dapat diverifikasi.
- Jangan memasukkan testimonial atau klaim performa yang tidak memiliki dasar.

## Output V7

- halaman produk SEO + Product/Offer schema
- halaman kategori + ItemList schema
- panduan kategori + Article schema
- perbandingan produk + Article schema
- breadcrumb schema
- halaman disclosure afiliasi
- 404 page
- sitemap.xml
- robots.txt
- RSS feed
- SEO audit otomatis
- pencarian client-side
- internal linking produk terkait

## Catatan SEO

Generator tidak mengklaim bahwa suatu produk adalah "terbaik" berdasarkan algoritma internal. Halaman perbandingan menampilkan data yang tersedia sehingga pembaca dapat menilai sendiri.

Jangan membuat ribuan halaman hanya dengan mengganti nama produk. Pastikan setiap produk memiliki data yang cukup, ringkasan yang berguna, dan spesifikasi yang benar.

## V8 Admin

Buka `admin/index.html` setelah file situs berada di hosting/local server. Admin ini adalah editor client-side: memuat `products.json`, permite menambah/mengubah data dasar, lalu mengekspor JSON/CSV. Ia tidak mengirim data ke server atau menyimpan kredensial affiliate. Setelah export, jalankan `npm run validate` lalu `npm run build`. Untuk workflow produksi multi-user, gunakan CMS/database dengan autentikasi.

## V12 — Vercel deployment
See `README_VERCEL.md` for Vercel Functions, Cron, environment variables, GitHub catalog persistence, and affiliate feed configuration.

## V20 — Generator Artikel SEO Otomatis

V20 membuat artikel statis otomatis dari kategori dan data produk melalui `data/article-topics.json`. Setiap kategori menghasilkan artikel panduan dan checklist, lengkap dengan internal linking, tabel produk, FAQ, canonical, dan `Article` JSON-LD. Konten generator tidak mengklaim pengalaman penggunaan langsung.
