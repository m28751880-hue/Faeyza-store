const assert = require('node:assert/strict');
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'qa-test-password';
const reader = require('../api/admin-product-inspect');
const { parseProductPage, attrMeta, rawStringField, rawNumberField, shopeeUrlHints } = reader._test;

const html = `<!doctype html><html><head>
<meta content="Sepatu Sneakers Wanita Casual Premium" property="og:title">
<meta property="og:image" content="https://down-id.img.susercontent.com/file/test-image">
<meta name="description" content="Sepatu sneakers wanita casual">
<link rel="canonical" href="https://shopee.co.id/Sepatu-Sneakers-Wanita-Casual-Premium-i.123456.987654321">
<script type="application/ld+json">${JSON.stringify({
  '@context':'https://schema.org', '@type':'Product', name:'Sepatu Sneakers Wanita Casual Premium',
  image:['https://down-id.img.susercontent.com/file/test-image'], brand:{'@type':'Brand',name:'Fayella'},
  aggregateRating:{'@type':'AggregateRating',ratingValue:'4.8',reviewCount:'123'},
  offers:{'@type':'Offer',price:'160000',priceCurrency:'IDR',availability:'https://schema.org/InStock',seller:{'@type':'Organization',name:'RA STORE'}}
})}</script>
<script>window.__STATE__={"productName":"Sepatu Sneakers Wanita Casual Premium","price":"160000","shop_name":"RA STORE"};</script>
</head><body>
Rp 160.000
Sepatu Sneakers Wanita Casual Premium
RA STORE Aktif 5 bulan lalu KAB. BANDUNG Kunjungi Toko 20 Produk
</body></html>`;

assert.equal(attrMeta(html,'og:title'),'Sepatu Sneakers Wanita Casual Premium');
assert.equal(rawStringField(html,['productName']),'Sepatu Sneakers Wanita Casual Premium');
assert.equal(rawNumberField(html,['price']),160000);
assert.deepEqual(shopeeUrlHints('https://shopee.co.id/foo-i.123456.987654321'),{shopId:'123456',itemId:'987654321'});

const p = parseProductPage(html,'https://s.shopee.co.id/example');
assert.equal(p.title,'Sepatu Sneakers Wanita Casual Premium');
assert.equal(p.price,160000);
assert.equal(p.image,'https://down-id.img.susercontent.com/file/test-image');
assert.equal(p.shopName,'RA STORE');
assert.equal(p.rating,4.8);
assert.equal(p.reviews,123);

console.log('Marketplace reader fixture: PASS');
console.log(JSON.stringify({name:p.title,price:p.price,shopName:p.shopName,image:p.image,rating:p.rating,reviews:p.reviews},null,2));
