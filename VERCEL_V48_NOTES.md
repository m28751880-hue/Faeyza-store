# V48 — AI Product Autofill + Multi-Pose Product Photos

V48 extends the existing admin quick-add flow without adding a new serverless function (Hobby remains compatible).

## What changed
- Product content generation now sends the product link, source metadata, and the uploaded reference photo to OpenAI Responses API.
- OpenAI web search is enabled for the content step so the model can try to resolve the exact product page from the affiliate URL before drafting fields.
- Added AI photo generation from one uploaded reference photo.
- Default: 3 additional photos; admin can choose 3, 4, or 5.
- Prompts explicitly request preservation of the same face, hair, clothing, colors, accessories, body proportions visible in the reference, and product details while changing only pose/camera/composition.
- Generated images use OpenAI GPT Image 2.5 Sunburst, low quality, portrait 1024x1536, WebP output with compression to keep catalog size manageable.
- Generated image data is stored with the product and materialized into static `/assets/generated/` files during the build, so product HTML does not embed the AI gallery images as base64.
- Product pages already support `images[]` galleries, so the new AI photos automatically appear in the existing gallery/lightbox.
- Admin shows thumbnails of generated AI photos before publish.
- Admin product save body limit increased from 1 MiB to 4 MiB to accommodate compacted image data.
- No new API function was added; `api/ai-product-content.js` was extended, keeping the release at 11 serverless functions.

## Environment variables
- `OPENAI_API_KEY` — existing OpenAI secret.
- `OPENAI_MODEL=gpt-5.6-luna` — text/content model.
- `OPENAI_IMAGE_MODEL=gpt-image-2.5-sunburst` — image edit/generation model.
- `OPENAI_IMAGE_QUALITY=low` — quick/low-cost default; can be changed later.

## Important limitation
The image model is instructed to preserve identity and clothing, but generative image editing cannot guarantee pixel-identical face/clothing in every output. Review the generated images before publishing.

## Security
- API key remains server-side only.
- Admin authentication remains unchanged.
- Generated photos are only produced through the authenticated admin endpoint.
