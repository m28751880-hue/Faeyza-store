# Faeyza Store V11.2 — Shopee Screenshot Verification UI

Perubahan V11.1 -> V11.2:
- Menonjolkan input screenshot produk Shopee dalam verification card yang selalu terlihat pada Quick Add.
- Menambahkan instruksi 3 langkah dan keterangan bahwa screenshot diperlukan bila link Shopee tidak terbaca otomatis.
- Menampilkan nama file screenshot dan preview setelah dipilih.
- Menghapus status verifikasi screenshot lama saat pengguna memilih screenshot baru.
- Cache-busting admin app.js dinaikkan dari v61 ke v62 pada admin dan public/admin.
- Menjaga endpoint AI vision dan validasi publish V11.1.

OpenAI image inputs mendukung URL gambar atau Base64 data URL pada API vision.
