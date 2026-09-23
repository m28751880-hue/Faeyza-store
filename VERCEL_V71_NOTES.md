# V71 — Final Production Release

- Finalized admin-to-publish validation: factual/source/media/content/SEO fields cannot remain blank.
- Missing non-verifiable facts are normalized to “Tidak tercantum pada sumber yang diverifikasi.” rather than invented.
- Screenshot verification session key bumped to V71 and verified-source labels recognize screenshot-verified and screenshot-ocr-verified states.
- Publish API now validates complete catalog records before committing products.json to GitHub.
- Existing premium UI, OCR, affiliate, PWA, SEO, and static generation retained.
- This release is ready for the user’s Vercel/GitHub deployment; actual external deployment still depends on the project’s configured credentials/repository.
