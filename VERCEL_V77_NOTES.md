# V77 — Remove Product Image Overlay Completely

- Removed all pseudo-element/decorative layers from `.visual`.
- Any unexpected child overlay inside `.visual` is hidden; only product image, save button, and badge remain.
- Product image uses plain transparent background, contain, centered, no blend mode, no filter, no transform.
- CSS cache bumped to v77.
- Generator keeps the card visual structure limited to image + save button + badge.
