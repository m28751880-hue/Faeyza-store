# V72 — Perbaikan tombol Simpan & Publish

- Tombol **Simpan & Publish** sekarang memberi feedback langsung: validasi, proses menyimpan, berhasil, atau error server.
- Tombol dikunci sementara saat request berlangsung agar tidak terjadi klik ganda.
- Request publish memakai `credentials: same-origin` agar sesi admin tetap terkirim.
- Status publish otomatis dibawa ke area status supaya hasil klik terlihat di layar mobile maupun desktop.
- Produk baru dari alur otomatis kini menyimpan `productId` dan `detailLink` dari hasil pemeriksaan sumber bila tersedia.
- Validasi frontend tidak lagi memblokir hanya karena `productId`/`detailLink` kosong; server mengisi fakta tekstual yang memang tidak tercantum dengan `Tidak tercantum pada sumber yang diverifikasi.`
- Cache JS admin dibump ke `app.js?v=72` agar browser tidak memakai JavaScript V71 lama.
