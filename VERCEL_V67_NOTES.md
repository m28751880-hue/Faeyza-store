# V67 — Perbaikan Status Verifikasi & Alur Publish ke Beranda

- Memperbaiki badge status setelah screenshot dikonfirmasi pengguna. Status `screenshot-ocr-verified` sebelumnya salah tampil sebagai `⚠ Data belum terverifikasi` karena UI hanya mengenali `screenshot-verified`.
- Status sekarang membaca `sourceVerified` dan level `screenshot-ocr-verified` secara konsisten.
- Jika screenshot sudah dikonfirmasi pengguna, UI menampilkan `✓ Data screenshot dikonfirmasi pengguna`.
- Alur `Simpan & Publish` tetap menyimpan katalog ke `products.json` melalui GitHub.
- Karena halaman beranda dibuat dari `products.json` saat `npm run build`, produk yang disimpan dan `active=true` otomatis masuk ke beranda pada deployment Vercel berikutnya.
- Produk nonaktif (`active=false`) tetap tidak ditampilkan di beranda.
- Cache admin dinaikkan ke `app.js?v=67`.
