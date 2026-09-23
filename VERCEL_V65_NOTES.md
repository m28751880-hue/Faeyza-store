# V65 — Perbaikan Verifikasi Screenshot

- Hasil OCR screenshot sekarang bisa dikoreksi langsung sebelum konfirmasi.
- Nama Produk, brand, kategori, harga, harga lama, rating, ulasan, terjual, dan toko dikunci sebagai fakta setelah pengguna mengonfirmasi.
- Generator AI tidak boleh mengganti fakta yang sudah terverifikasi screenshot.
- Parser OCR lebih tahan terhadap label Variasi/Ukuran dan tidak otomatis menganggap kata warna/model sebagai noise.
- Cache admin dinaikkan ke app.js?v=65.
- admin/ dan public/admin/ disinkronkan.
