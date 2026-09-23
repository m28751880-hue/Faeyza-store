# Faeyza Store V11.3 — Screenshot OCR Fallback

- Screenshot verification now tries existing OpenAI vision first.
- If OpenAI API is unavailable, out of credits, or returns an error, browser-side Tesseract OCR is used as a fallback.
- OCR results are explicitly marked as pending confirmation and require the admin to click “Konfirmasi Data OCR” before content generation.
- No price, rating, shop, commission, or specs are invented when text is not detected.
- Tesseract.js is loaded from jsDelivr in the admin page.
- Cache version: v63.
