# Faeyza Store V55

## Marketplace Reader 2.0
- Preserves the existing GitHub persistence flow from V54.
- Improves Indonesian Rupiah parsing, including values such as Rp 160.000.
- Reads HTML `<title>` plus more embedded JSON state used by modern marketplace pages.
- Uses multiple browser-like request headers when a marketplace rejects one user-agent.
- Expands product-field extraction for sold count and embedded product price data.
- Does not treat a generic marketplace/site name as the seller.
- Does not mark a marketplace as verified merely because the page returned a platform name; verification now requires actual product facts such as price, rating, review count, sold count, or commission.
- Keeps official TikTok Affiliate API support when the required approved creator credentials are available. TikTok Affiliate APIs require the relevant creator scope/access; the reader never invents missing price or commission.
- Admin JS cache bumped to v55.

## Safety
- No marketplace data is invented. Empty price/commission remains empty and explicitly unverified.
- GitHub token handling is unchanged.
