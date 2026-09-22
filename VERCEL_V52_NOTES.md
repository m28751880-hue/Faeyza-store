# Faeyza Store V52

## Fix Foto AI 3–5
- Mengubah generasi foto referensi dari beberapa request paralel menjadi satu request `images/edits` dengan parameter `n`.
- Semua hasil `b64_json` dari respons GPT Image disimpan ke `product.images`.
- Admin menampilkan jumlah foto AI dan gallery seluruh hasil.
- Admin JS diberi cache version `?v=52`.
- Target 3–5 foto tetap dibatasi di server.
- Foto AI tetap perlu diperiksa sebelum publish.
