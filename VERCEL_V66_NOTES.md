# V66 — Lengkap Semua Kolom Tanpa Mengarang Data

Perbaikan utama dari V65:

- Editor admin sekarang menampilkan seluruh field data marketplace yang tersedia: nama, slug, kategori, brand, harga, harga lama, rating, ulasan, terjual, toko, stok, komisi, rentang harga, marketplace, product ID, detail link, URL affiliate, foto, video, sumber, metode, waktu pemeriksaan, dan fakta sumber.
- Field konten lengkap: ringkasan, SEO title, meta description, spesifikasi JSON, kelebihan, pertimbangan, FAQ, dan caption.
- Generator AI wajib mengisi semua field konten. Jika fakta memang tidak terlihat/terverifikasi, sistem menulis `Tidak tercantum pada sumber yang diverifikasi.` daripada mengarang.
- Data yang sudah dikonfirmasi dari screenshot dikunci. AI tidak boleh mengganti nama, brand, kategori, harga, harga lama, rating, ulasan, terjual, toko, stok, atau spesifikasi sumber.
- Input AI sekarang menerima seluruh fakta marketplace, bukan hanya nama/kategori/harga.
- Fallback tanpa OPENAI_API_KEY juga menghasilkan paket konten lengkap yang aman dan berbasis fakta sumber.
- FAQ otomatis dilengkapi sampai 4 item dengan jawaban berbasis sumber.
- Publish diblokir jika konten utama belum lengkap atau produk belum terverifikasi.
- OCR review sekarang juga menyediakan Stok dan Spesifikasi yang terlihat untuk dikoreksi sebelum konfirmasi.
- `admin/` dan `public/admin/` disinkronkan.
- Cache admin dinaikkan ke `app.js?v=66`.
