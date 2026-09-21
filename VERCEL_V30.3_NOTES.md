# Faeyza Store V30.3 — Share Produk

## Fitur baru
- Tombol **📤 Bagikan Produk** di setiap item Admin Catalog Manager.
- URL produk dibuat otomatis berdasarkan domain yang sedang dibuka, sehingga aman dipakai di Vercel maupun domain sendiri.
- Caption otomatis dari nama, ringkasan, harga, kategori, URL, dan hashtag.
- **Salin Link** untuk TikTok/Instagram/kanal yang menerima paste link.
- **📱 Bagikan** memakai Web Share API jika didukung perangkat/browser; fallback menyalin caption.
- **WhatsApp** membuka share dengan caption + URL melalui format resmi click-to-chat WhatsApp.
- **Facebook** membuka dialog share URL.
- **QR Code** dibuat di browser dari URL produk dan dapat disimpan sebagai PNG.
- Tidak menambahkan tracking pribadi atau nomor telepon.

## Cara pakai
1. Buka `/admin/`.
2. Masukkan ADMIN_TOKEN dan muat katalog / buat produk.
3. Pada produk yang ingin dipromosikan, tekan **📤 Bagikan Produk**.
4. Pilih Salin Link, WhatsApp, Facebook, Bagikan, atau QR Code.
5. Untuk TikTok/Instagram, gunakan **Salin Caption** lalu tempel ke postingan dan arahkan audiens ke link produk.

## Catatan
- QR generator memakai library browser dari jsDelivr. Jika koneksi diblokir, tombol QR akan meminta halaman dibuka ulang saat koneksi tersedia.
- Tombol Bagikan memakai fitur share perangkat; aplikasi yang muncul bergantung pada Android/browser yang digunakan.
- Link Facebook menggunakan share dialog berbasis URL.
- Caption adalah template otomatis, bukan klaim pengalaman penggunaan langsung. Tetap periksa sebelum dipublikasikan.
