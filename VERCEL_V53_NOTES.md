# Faeyza Store V53

Perbaikan generator foto AI: gunakan batch `n` terlebih dahulu, lalu fallback otomatis ke beberapa request `n=1` secara paralel. Multipart image field mencoba `image[]` lalu `image` untuk kompatibilitas endpoint. Semua hasil yang berhasil dikumpulkan dikembalikan sebagai `images[]` dan dipertahankan oleh Admin saat Save & Publish. Admin cache dibump ke v53.
