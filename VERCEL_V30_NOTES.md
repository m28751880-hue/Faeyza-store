# Faeyza Store V30

V30 menambahkan Admin Catalog Manager server-side.

## Fitur
- Muat katalog melalui `/api/admin-products`.
- Edit nama, slug, kategori, brand, harga, rating, review, gambar, affiliate URL, ringkasan.
- Aktif/nonaktif produk.
- Import JSON, CSV, dan XLSX melalui admin browser (XLSX parser dimuat dari SheetJS CDN).
- Preview/filter katalog.
- Simpan & Publish: server memvalidasi lalu commit `products.json` ke GitHub.
- Jika repository terhubung ke Vercel, push/commit dapat memicu deployment baru.

## Environment Variables
`ADMIN_TOKEN` diperlukan untuk GET/POST `/api/admin-products`.
`GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_PRODUCTS_PATH` dipakai untuk persistence.

Simpan token/secret di Vercel Environment Variables, bukan di source code. Setelah mengubah Environment Variables, redeploy agar deployment baru mengambil nilainya.
