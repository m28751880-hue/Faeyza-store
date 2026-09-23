# V9 / V59 notes

- Added official Shopee Affiliate Open API lookup using SHOPPE_APP_ID/SHOPEE_APP_SECRET.
- Product offer lookup supports shopId + itemId when a canonical Shopee URL is available and keyword matching as a fallback.
- Fixed commissionRate normalization (Shopee values such as 0.25 become 25%).
- Added explicit legacy-photo-name sanitizer in Admin so IMG/WA/DSC names cannot remain paired with Workspace as a guessed category.
- Added Buka & Verifikasi button for the source link.
- Updated admin cache-busting to v59.
