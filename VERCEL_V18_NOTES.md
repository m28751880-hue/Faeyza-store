# Faeyza Store V18

V18 focuses on improving product detail pages for an affiliate-review workflow.

## Changes
- richer product hero and purchase CTA
- quick product facts
- explicit pros and considerations
- specifications table
- "Cocok untuk" section generated from category
- pre-purchase checklist
- related products
- mobile sticky affiliate CTA when a real affiliate URL exists
- clearer disclosure that marketplace/catalog ratings are catalog information
- Product JSON-LD keeps Offer data but does not emit AggregateRating for marketplace ratings that are not owned by Faeyza Store

## SEO note
Google's Product structured-data documentation says product pages can use Product/Offer markup, while Review/AggregateRating data must represent review/rating information that is available on the marked-up page. V18 therefore avoids presenting third-party marketplace ratings as Faeyza Store reviews.

## Affiliate note
Demo products still use placeholder affiliate URLs until real Shopee/TikTok affiliate URLs are supplied.
