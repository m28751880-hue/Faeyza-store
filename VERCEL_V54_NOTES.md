# Faeyza Store V54

## Manual product gallery
- Quick Add now accepts up to 5 manual product photos.
- First selected photo becomes the main image; remaining photos are stored in `images[]` as the product gallery.
- AI image generation is disabled in the Quick Add flow, so no OpenAI image-generation credits are consumed.
- OpenAI, when configured, is used only for text content generation.
- Photos are resized/compressed client-side before being stored.
- Admin cache bumped to v54.
