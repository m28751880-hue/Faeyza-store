const crypto = require('node:crypto');
const { jsonBody, adminAuth } = require('../security');

const ALLOWED_HOSTS = [
  /^(.*\.)?shopee\.co\.id$/i, /^(.*\.)?shopee\.com$/i, /^(.*\.)?shope\.ee$/i, /^(.*\.)?s\.shopee\.co\.id$/i, /^(.*\.)?shp\.ee$/i, /^(.*\.)?id\.shp\.ee$/i,
  /^(.*\.)?tiktok\.com$/i, /^(.*\.)?tokopedia\.com$/i,
  /^(.*\.)?lazada\.co\.id$/i, /^(.*\.)?blibli\.com$/i,
  /^(.*\.)?youtube\.com$/i, /^youtu\.be$/i,
  /^(.*\.)?google\.com$/i, /^(.*\.)?google\.co\.id$/i, /^www\.google\.co\.id$/i,
  /^(.*\.)?googleusercontent\.com$/i
];
function auth(req){ return adminAuth(req); }
function allowed(raw){
  try { const u = new URL(raw); return u.protocol === 'https:' && ALLOWED_HOSTS.some(r => r.test(u.hostname)) ? u : null; }
  catch { return null; }
}
function classifyHost(host){
  const h=String(host||'').toLowerCase();
  if(/(^|\.)shopee\.|(^|\.)shp\.ee$/.test(h)) return {source:'Shopee',kind:'marketplace',appCapable:true};
  if(/(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$/.test(h)) return {source:'TikTok Shop/TikTok',kind:'marketplace',appCapable:true};
  if(/(^|\.)tokopedia\.com$|^vt\.tokopedia\.com$/.test(h)) return {source:'Tokopedia',kind:'marketplace',appCapable:true};
  if(/(^|\.)lazada\.co\.id$/.test(h)) return {source:'Lazada',kind:'marketplace',appCapable:true};
  if(/(^|\.)blibli\.com$/.test(h)) return {source:'Blibli',kind:'marketplace',appCapable:true};
  if(/(^|\.)youtube\.com$|^youtu\.be$/.test(h)) return {source:'YouTube',kind:'video',appCapable:true};
  if(/(^|\.)google\.(com|co\.id)$/.test(h)) return {source:'Google',kind:'search',appCapable:false};
  return {source:h||'Tidak diketahui',kind:'web',appCapable:false};
}
function parseGoogleTarget(u){
  const h=u.hostname.toLowerCase();
  if(!/(^|\.)google\.(com|co\.id)$/.test(h)) return '';
  for(const key of ['url','q','target','dest']){
    const v=u.searchParams.get(key); if(!v) continue;
    try { const x=new URL(v,u); if(/^https?:$/.test(x.protocol)) return x.toString(); } catch {}
  }
  return '';
}
function linkSignals(raw,finalUrl,redirects=[]){
  let u; try{u=new URL(raw)}catch{return {source:'Tidak diketahui',kind:'invalid',appCapable:false,initialHost:'',finalHost:'',redirects,tracking:{},appScheme:false};}
  const initial=classifyHost(u.hostname); const f=finalUrl?new URL(finalUrl):u; const final=classifyHost(f.hostname);
  const tracking={}; for(const [k,v] of u.searchParams.entries()) if(/^utm_|^(gclid|fbclid|ttclid|msclkid|ref|affiliate|aff_|sub|subid|clickid|campaign|source)$/i.test(k)) tracking[k]=v;
  const appScheme=/^(intent|market|shopee|snssdk|tiktok|tokopedia):$/i.test(u.protocol);
  const sourceLabel=initial.source!==final.source?`${initial.source} → ${final.source}`:final.source;
  return {source:sourceLabel,kind:final.kind,appCapable:initial.appCapable||final.appCapable,initialHost:u.hostname,finalHost:f.hostname,redirects,tracking,appScheme,initialUrl:u.toString(),finalUrl:f.toString(),note:appScheme?'Link menggunakan skema aplikasi; browser/server tidak dapat memastikan apakah aplikasi akan terbuka.':initial.source==='Google'?'Ini adalah link Google. Jika URL mengandung tujuan marketplace, sistem mencoba mengenali tujuan tersebut.':redirects.length?`Link melewati ${redirects.length} redirect sebelum mencapai tujuan akhir.`:'Tidak ada redirect HTTP yang terdeteksi.'};
}
async function safeFetch(start){
  let u;
  try { u=new URL(start); } catch { throw new Error('URL tidak valid.'); }
  const original=u.toString();
  const googleTarget=parseGoogleTarget(u);
  if(googleTarget){
    const target=allowed(googleTarget); if(target) u=target; else throw new Error('Tujuan dari link Google bukan sumber yang didukung.');
  } else if(!allowed(u.toString())) {
    // Custom app/deep-link: report it without attempting a server fetch.
    if(/^(intent|market|shopee|snssdk|tiktok|tokopedia):$/i.test(u.protocol)) return {r:null,u,original,redirects:[],deepLink:true};
    throw new Error('URL tidak diizinkan.');
  }
  const agents=[
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36',
    'Mozilla/5.0 (compatible; Faeyza StoreBot/5.0)'
  ];
  const redirects=[];
  for(let i=0;i<7;i++){
    let r;
    for(const ua of agents){
      r=await fetch(u, {redirect:'manual', headers:{'user-agent':ua,'accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8','accept-language':'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7','cache-control':'no-cache'}});
      if(![401,403,429,503].includes(r.status)) break;
    }
    if([301,302,303,307,308].includes(r.status)){
      const loc=r.headers.get('location'); if(!loc) throw new Error('Redirect tanpa tujuan.');
      const next=new URL(loc,u);
      if(!/^https:$/.test(next.protocol) || !allowed(next.toString())) throw new Error('Redirect ke host yang tidak diizinkan.');
      redirects.push({from:u.toString(),to:next.toString(),status:r.status});
      u=next; continue;
    }
    return {r,u,original,redirects,deepLink:false};
  }
  throw new Error('Terlalu banyak redirect.');
}
function decode(v){return String(v??'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/gi,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim();}
function attrMeta(html,key){
  const tagRe=/<meta\b[^>]*>/gi; let m;
  while((m=tagRe.exec(html))){
    const tag=m[0];
    const attrs={}; let a;
    const ar=/(\w+)=(["'])([\s\S]*?)\2/g;
    while((a=ar.exec(tag))) attrs[a[1].toLowerCase()]=a[3];
    const name=String(attrs.property||attrs.name||attrs.itemprop||'').toLowerCase();
    if(name===key.toLowerCase() && attrs.content!==undefined) return decode(attrs.content);
  }
  return '';
}
function first(html,patterns){for(const n of patterns){const v=attrMeta(html,n);if(v)return v;}return '';}
function num(v){
  if(v===null||v===undefined||v==='') return '';
  if(typeof v==='number') return Number.isFinite(v)?v:'';
  const raw=String(v).trim().replace(/[^0-9.,-]/g,'');
  if(!raw) return '';
  let s=raw;
  if(raw.includes('.')&&raw.includes(',')) s=raw.lastIndexOf(',')>raw.lastIndexOf('.')?raw.replace(/\./g,'').replace(',','.'):raw.replace(/,/g,'');
  else if(/,\d{1,2}$/.test(raw)) s=raw.replace(',','.');
  else if(/^-?\d{1,3}(?:\.\d{3})+$/.test(raw)) s=raw.replace(/\./g,'');
  else s=raw.replace(/,/g,'');
  const n=Number(s); return Number.isFinite(n)?n:'';
}
function moneyFromText(text){
  const m=String(text||'').match(/(?:Rp\s*|IDR\s*)([0-9][0-9.\,]*)/i); return m?num(m[1]):'';
}
function percentFromText(text){const m=String(text||'').match(/(?:komisi|commission)[^%]{0,60}?([0-9]+(?:[.,][0-9]+)?)\s*%/i);return m?Number(String(m[1]).replace(',','.')):'';}
function compactJsonScripts(html){
  const out=[];
  const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m;
  while((m=re.exec(html))){
    const attrs=m[1]||''; const raw=m[2].trim();
    const interesting=/application\/ld\+json|__NEXT_DATA__|SIGI_STATE|UNIVERSAL_DATA|REHYDRATION|__NUXT__|INITIAL_STATE/i.test(attrs+' '+raw.slice(0,200));
    if(!interesting || raw.length<2 || raw.length>2000000) continue;
    try{out.push(JSON.parse(raw));}catch{}
  }
  return out;
}
function htmlTitle(html){const m=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return m?decode(clean(m[1])):'';}
function marketplaceSignals(html,host){
  const text=clean(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '));
  const prices=[]; const re=/(?:Rp\s*|IDR\s*)([0-9][0-9.,]*)/gi; let m; while((m=re.exec(text))&&prices.length<24){const n=num(m[1]);if(n!==''&&n>0)prices.push(n);}
  let seller='';
  if(/(^|\.)shopee\./i.test(host)||/^s\.shopee\./i.test(host)||/^.*\.shp\.ee$/i.test(host)){
    const sm=text.match(/([A-Za-z0-9À-ÿ&'()._-]{2,50}(?:\s+[A-Za-z0-9À-ÿ&'()._-]{2,40}){0,4})\s+Aktif\s+\d+\s+(?:detik|menit|jam|hari|minggu|bulan|tahun)\s+lalu\s+[^]{0,120}?Kunjungi\s+Toko/i);
    if(sm) seller=clean(sm[1]);
    if(!seller){
      const sm2=text.match(/(?:Toko|Shop)\s*[:\-]\s*([^|]{2,80})/i); if(sm2) seller=clean(sm2[1]);
    }
  } else {
    const sm=(text.match(/(?:dijual oleh|seller|toko|shop)[\s:]+([^|\n]{2,80})/i)||[])[1]||''; seller=clean(sm);
  }
  const title=first(html,['og:title','twitter:title'])||htmlTitle(html);
  const canonical=(html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i)||[])[0]||'';
  const canonicalUrl=canonical?(canonical.match(/href=["']([^"']+)["']/i)||[])[1]||'':'';
  return {text,prices,seller,title:clean(title),canonicalUrl:decode(canonicalUrl)};
}

function flatten(x,out=[]){
  if(x===null||x===undefined) return out;
  if(Array.isArray(x)){for(const v of x)flatten(v,out);return out;}
  if(typeof x==='object'){out.push(x);for(const v of Object.values(x)) if(v&&typeof v==='object') flatten(v,out);}
  return out;
}
function jsonLdObjects(html){return compactJsonScripts(html);}
function productLd(html){
  const nodes=flatten(jsonLdObjects(html));
  return nodes.find(x=>x&&((x['@type']==='Product')||(Array.isArray(x['@type'])&&x['@type'].includes('Product'))))||null;
}
function ldValue(v){if(v&&typeof v==='object')return v.value??v.name??v.url??'';return v;}
function rawStringField(html,keys){
  for(const key of keys){
    const re=new RegExp('(?:[\"\\\']'+key+'[\"\\\']\\s*:\\s*)[\"\\\']([^\"\\\']{2,500})[\"\\\']','i');
    const m=html.match(re); if(m){const v=clean(decode(m[1]).replace(/\\\\([\"\\\\\/bfnrt])/g,'$1')); if(v)return v;}
  }
  return '';
}
function rawNumberField(html,keys){
  for(const key of keys){
    const re=new RegExp('[\"\\\']'+key+'[\"\\\']\\s*:\\s*(?:[\"\\\']([^\"\\\']+)[\"\\\']|(-?\\d+(?:\\.\\d+)?))','i');
    const m=html.match(re); if(m){const n=num(m[1]??m[2]); if(n!=='')return n;}
  }
  return '';
}
function pickObjectValue(nodes,keys){
  const wanted=new Set(keys.map(k=>k.toLowerCase()));
  for(const o of nodes){for(const [k,v] of Object.entries(o||{})){if(wanted.has(k.toLowerCase()) && v!=='' && v!==null && v!==undefined){if(typeof v!=='object')return v; if(v.amount!==undefined)return v.amount; if(v.value!==undefined)return v.value;}}}
  return '';
}
function parseHumanSignals(html){
  const text=clean(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '));
  const commissionRate=percentFromText(text);
  let commissionAmount='';
  const cm=text.match(/(?:komisi|commission)[\s\S]{0,80}?(?:Rp\s*|IDR\s*)([0-9][0-9.\,]*)/i); if(cm) commissionAmount=num(cm[1]);
  let unitsSold='';
  const sm=text.match(/(?:terjual|sold)\s*([0-9][0-9.,]*\s*[kKmMbB]?)/i);
  if(sm){const raw=sm[1].replace(/\s+/g,'').replace(',','.');const n=parseFloat(raw);const mult=/k/i.test(raw)?1000:/m/i.test(raw)?1000000:/b/i.test(raw)?1000000000:1;unitsSold=Number.isFinite(n)?Math.round(n*mult):'';}
  let priceText='';
  const pm=text.match(/(?:harga|price)[^\n]{0,80}?(?:Rp\s*|IDR\s*)([0-9][0-9.\,]*)/i); if(pm) priceText=num(pm[1]);
  return {commissionRate,commissionAmount,unitsSold,priceText};
}
function inferCategory(title){const t=clean(title).toLowerCase();if(/keyboard|keycap|switch/.test(t))return'Keyboard';if(/mouse|tetikus/.test(t))return'Mouse';if(/headset|earphone|earbuds|speaker/.test(t))return'Audio';if(/laptop|stand|desk|mat|monitor|keyboard tray/.test(t))return'Desk Setup';if(/webcam|camera|ring light|mikrofon|microphone/.test(t))return'Creator Gear';if(/kursi|chair|ergonomic/.test(t))return'Furniture';return'Belum ditentukan';}
function inferBrand(title){const t=clean(title);if(!t||/^((IMG|DSC|DCIM|WA)[ _-]?\d{3,}|screenshot|screen shot|photo|foto|image)[ _-]?/i.test(t))return'';return clean(t.split(/\s[-|,:]\s/)[0].split(/\s+/).slice(0,2).join(' '));}
function generated(title,category){const c=category||inferCategory(title);return {summary:`Informasi ${title} untuk membantu membandingkan fitur, spesifikasi, harga, dan kecocokannya untuk penggunaan sehari-hari.`,pros:['Informasi produk dirangkum dari data yang tersedia','Dapat dibandingkan dengan produk sejenis',`Cocok dipertimbangkan untuk ${c.toLowerCase()}`],cons:['Harga dan ketersediaan dapat berubah di toko','Spesifikasi mengikuti informasi yang tersedia pada sumber'],specs:{Kategori:c}};}
function shopeeUrlHints(url){
  const s=String(url||'');
  const m1=s.match(/\/product\/(\d+)\/(\d+)/i);
  const m2=s.match(/-i\.(\d+)\.(\d+)(?:[/?#]|$)/i);
  return {shopId:m1?.[1]||m2?.[1]||'',itemId:m1?.[2]||m2?.[2]||''};
}
async function shopeeFeedLookup({url,title}){
  const feedUrl=String(process.env.SHOPEE_FEED_URL||'').trim();
  if(!feedUrl) return {enabled:false,verified:false,method:'no-feed-configured'};
  let feed;
  try{
    const r=await fetch(feedUrl,{headers:{accept:'application/json,text/csv','user-agent':'FaeyzaStore/1.0'},signal:AbortSignal.timeout(9000)});
    if(!r.ok) throw new Error(`Shopee feed HTTP ${r.status}`);
    const text=await r.text();
    try{const j=JSON.parse(text);feed=Array.isArray(j)?j:(j.products||j.data||j.items||[]);}catch{throw new Error('SHOPEE_FEED_URL harus mengembalikan JSON array atau {products|data|items:[...]}');}
  }catch(e){return {enabled:true,verified:false,method:'official-feed-error',error:e.message};}
  if(!Array.isArray(feed)||!feed.length) return {enabled:true,verified:false,method:'official-feed-empty'};
  const hints=shopeeUrlHints(url);
  const norm=x=>String(x??'').toLowerCase().trim();
  const idMatch=feed.find(p=>{
    const shop=String(p.shopId??p.shop_id??p.shopid??''); const item=String(p.itemId??p.item_id??p.itemid??p.productId??p.product_id??'');
    return hints.itemId && hints.shopId && item===hints.itemId && shop===hints.shopId;
  });
  const targetTitle=norm(title);
  const titleMatch=!idMatch&&targetTitle?feed.map(p=>({p,score:scoreFeedProduct(p,targetTitle)})).sort((a,b)=>b.score-a.score)[0]:null;
  const best=idMatch||(titleMatch&&titleMatch.score>=6?titleMatch.p:null);
  if(!best) return {enabled:true,verified:false,method:'official-feed-no-match',count:feed.length};
  return {enabled:true,verified:true,method:idMatch?'official-feed-id-match':'official-feed-title-match',product:best,count:feed.length};
}
function scoreFeedProduct(p,targetTitle){
  const name=clean(p.name||p.title||p.product_name||p.productName); const a=normTokens(name), b=normTokens(targetTitle); let score=0;
  for(const k of b){if(k.length>2&&a.includes(k))score+=2;}
  return score;
}
function normTokens(v){return clean(v).toLowerCase().split(/[^a-z0-9À-ÿ]+/i).filter(x=>x.length>1);}
function normalizeShopeeFeed(p){
  if(!p)return{};
  const price=num(p.price??p.salePrice??p.sale_price??p.currentPrice??p.current_price);
  const oldPrice=num(p.oldPrice??p.old_price??p.originalPrice??p.original_price??p.listPrice??p.list_price);
  const rate=p.commissionRate??p.commission_rate??p.commission_percent??p.commissionPercentage??'';
  const commissionRate=rate===''?'':(Number(rate)>100?Number(rate)/100:Number(rate));
  return {
    name:clean(p.name||p.title||p.product_name||p.productName),
    shopName:clean(p.shopName||p.shop_name||p.storeName||p.store_name||p.sellerName||p.seller_name),
    image:clean(p.image||p.imageUrl||p.image_url||p.mainImage||p.main_image||p.main_image_url),
    price,oldPrice,priceMin:num(p.priceMin??p.price_min??price),priceMax:num(p.priceMax??p.price_max??price),
    oldPriceMin:num(p.oldPriceMin??p.old_price_min??oldPrice),oldPriceMax:num(p.oldPriceMax??p.old_price_max??oldPrice),
    rating:num(p.rating??p.ratingValue??p.rating_value),reviews:num(p.reviews??p.reviewCount??p.review_count??p.ratingCount??p.rating_count),
    commissionRate,commissionAmount:num(p.commissionAmount??p.commission_amount),unitsSold:num(p.unitsSold??p.units_sold??p.soldCount??p.sold_count),stock:p.stock??p.inStock??p.in_stock??'',
    category:clean(p.category||p.categoryName||p.category_name),brand:clean(p.brand||p.brandName||p.brand_name),productId:String(p.itemId??p.item_id??p.itemid??p.productId??p.product_id??''),detailLink:clean(p.detailLink||p.detail_link||p.url||p.productUrl||p.product_url),
    dataSource:'Shopee official/exported affiliate feed',sourceVerified:true,verificationLevel:'official-feed'
  };
}

function shopeeTextHints(text){
  const cleanText=clean(text);
  const titleLine=(cleanText.match(/(?:^|\s)([A-ZÀ-Ý][^|]{8,160}?)(?:\s+Pre-Order|\s+Terjual\b|\s+Rp\s*[0-9])/i)||[])[1]||'';
  const priceNear=(cleanText.match(/(?:Rp\s*)([0-9][0-9.,]*)\s+(?:Pre-Order|Terjual|Penilaian|Gratis Ongkir)/i)||[])[1]||'';
  return {title:clean(titleLine),price:priceNear?num(priceNear):''};
}
function parseProductPage(html,sourceUrl){
  const ld=productLd(html)||{}; const offer=Array.isArray(ld.offers)?ld.offers[0]:(ld.offers||{}); const agg=ld.aggregateRating||{}; const nodes=flatten(jsonLdObjects(html)); const human=parseHumanSignals(html);
  const rawTitle=rawStringField(html,['item_name','product_name','productName','display_name','product_title']); const title=clean(ld.name)||rawTitle||clean(first(html,['og:title','twitter:title']))||htmlTitle(html)||clean(pickObjectValue(nodes,['title','name','productName']));
  const desc=clean(ld.description)||clean(first(html,['og:description','description','twitter:description']))||clean(pickObjectValue(nodes,['description','shortDescription']));
  const rawImage=rawStringField(html,['image','image_url','main_image_url','mainImageUrl','cover_image']); const image=Array.isArray(ld.image)?ld.image[0]:clean(ld.image)||first(html,['og:image','twitter:image'])||rawImage||clean(pickObjectValue(nodes,['image','mainImage','main_image_url']));
  const ms=marketplaceSignals(html,new URL(sourceUrl).hostname.toLowerCase()); const hints=shopeeTextHints(ms.text); const shopee=/((^|\.)shopee\.|(^|\.)shp\.ee$)/i.test(new URL(sourceUrl).hostname.toLowerCase()); const rawPrice=rawNumberField(html,['price','sale_price','salePrice','current_price','currentPrice','price_min','priceMin']); const price=num(offer.price)||num(first(html,['product:price:amount','og:price:amount','product:price','price']))||rawPrice||num(pickObjectValue(nodes,['salePrice','sale_price','salesPrice','sales_price','minimum_amount']))||human.priceText||(shopee?hints.price:'')||((ms.prices.length===1)?ms.prices[0]:'');
  const low=num(offer.lowPrice),high=num(offer.highPrice);
  const oldPrice=num(offer.highPrice)>price?num(offer.highPrice):num(first(html,['product:price:standard_amount','product:price:original','og:price:original']))||num(pickObjectValue(nodes,['originalPrice','original_price','listPrice','list_price']));
  const brand=clean(ld.brand?.name||ld.brand||first(html,['product:brand','brand']))||rawStringField(html,['brand_name','brandName','brand'])||clean(pickObjectValue(nodes,['brand','brandName','brand_name']));
  const rating=num(agg.ratingValue)||num(first(html,['ratingValue','product:rating:average','rating']))||rawNumberField(html,['rating','ratingValue','rating_value','rating_score','average_rating'])||num(pickObjectValue(nodes,['rating','ratingValue','averageRating']));
  const reviews=num(agg.reviewCount)||num(agg.ratingCount)||num(first(html,['reviewCount','ratingCount','product:rating:count','review_count']))||rawNumberField(html,['review_count','reviewCount','rating_count','ratingCount'])||num(pickObjectValue(nodes,['reviewCount','review_count','ratingCount']));
  const availability=String(offer.availability||pickObjectValue(nodes,['availability','stockStatus'])).toLowerCase();
  const stock=availability?(!/outofstock|soldout|discontinued/.test(availability)):'';
  const seller=clean(offer.seller?.name||ld.seller?.name||first(html,['seller','shop_name','shopName','product:seller']))||rawStringField(html,['shop_name','shopName','store_name','storeName','seller_name','sellerName'])||clean(pickObjectValue(nodes,['seller','sellerName','shopName','shop_name','storeName','store_name']));
  const shopName=seller||clean(ms.seller);
  const hintedTitle=shopee&&hints.title?hints.title:'';
  const commissionRate=human.commissionRate!==''?human.commissionRate:num(first(html,['commission','commission_rate','affiliate:commission']));
  const commissionAmount=human.commissionAmount!==''?human.commissionAmount:num(first(html,['commission_amount','affiliate:commission_amount']));
  const unitsSold=human.unitsSold!==''?human.unitsSold:rawNumberField(html,['units_sold','unitsSold','sold_count','soldCount','product_sold_count','productSoldCount'])||num(pickObjectValue(nodes,['unitsSold','units_sold','soldCount','sold_count','productSoldCount','product_sold_count']));
  return {title:title||hintedTitle,desc,image,price,oldPrice,priceMin:low||price,priceMax:high||price,oldPriceMin:oldPrice||'',oldPriceMax:oldPrice||'',brand,rating,reviews,stock,seller,shopName,commissionRate,commissionAmount,unitsSold,sourceUrl,rawLd:ld};
}
function tiktokSign(path,query,body,secret){const q=Object.entries(query).filter(([k])=>k!=='sign'&&k!=='access_token').sort(([a],[b])=>a.localeCompare(b));const raw=secret+path+q.map(([k,v])=>k+v).join('')+(body||'')+secret;return crypto.createHmac('sha256',secret).update(raw).digest('hex');}
function extractTikTokProductId(url){const s=String(url||'');for(const r of [/\/product\/(\d{8,})/i,/[?&](?:product_id|productId)=(\d{8,})/i,/(?:^|\D)(\d{15,20})(?:\D|$)/]){const m=s.match(r);if(m)return m[1];}return '';}
function keywords(title){return clean(title).split(/[^A-Za-z0-9À-ÿ]+/).filter(x=>x.length>1).slice(0,8);}
function scoreProduct(p,title){const a=clean(p?.title).toLowerCase(),b=clean(title).toLowerCase();let s=0;for(const k of keywords(b)){if(a.includes(k.toLowerCase()))s+=2;}return s;}
async function tiktokLookup({title}){
  const appKey=process.env.TIKTOK_APP_KEY,secret=process.env.TIKTOK_APP_SECRET,token=process.env.TIKTOK_CREATOR_ACCESS_TOKEN;
  if(!appKey||!secret||!token)return {enabled:false};
  const base='https://open-api.tiktokglobalshop.com'; const version=process.env.TIKTOK_PRODUCT_API_VERSION||'202405'; const now=Math.floor(Date.now()/1000);
  async function call(path,body){
    const query={app_key:appKey,timestamp:String(now)}; query.sign=tiktokSign(path,query,body,secret);
    const u=new URL(base+path);Object.entries(query).forEach(([k,v])=>u.searchParams.set(k,v));
    const r=await fetch(u,{method:'POST',headers:{'content-type':'application/json','x-tts-access-token':token},body});
    const d=await r.json().catch(()=>({})); if(!r.ok||d.code!==0)throw new Error(`TikTok API ${r.status}: ${d.message||'request gagal'}`); return d;
  }
  try{
    const body=JSON.stringify({title_keywords:keywords(title),page_size:20,sort_field:'commission_rate',sort_order:'DESC'});
    const d=await call(`/affiliate_creator/${version}/open_collaborations/products/search`,body);
    const products=d.data?.products||[]; const best=products.slice().sort((a,b)=>scoreProduct(b,title)-scoreProduct(a,title))[0];
    if(best&&scoreProduct(best,title)>=4)return {enabled:true,verified:true,method:'official-api-search',product:best};
    return {enabled:true,verified:false,method:'official-api-no-match'};
  }catch(e){return {enabled:true,verified:false,error:e.message};}
}
function normalizeTikTok(p){
  if(!p)return{}; const sales=p.sales_price||p.salesPrice||{}; const orig=p.original_price||p.originalPrice||{}; const comm=p.commission||{}; const cats=p.category_chains||p.categoryChains||[];
  const rate=comm.rate!==undefined?Number(comm.rate):comm.commission_rate!==undefined?Number(comm.commission_rate):'';
  return {name:clean(p.title),shopName:clean(p.shop?.name||p.shop_name||p.seller?.name),image:clean(p.main_image_url||p.mainImageUrl),price:num(sales.minimum_amount??sales.amount??p.sales_price),priceMin:num(sales.minimum_amount),priceMax:num(sales.maximum_amount),oldPrice:num(orig.minimum_amount??p.original_price),oldPriceMin:num(orig.minimum_amount),oldPriceMax:num(orig.maximum_amount),commissionRate:rate!==''?(rate>100?rate/100:rate):'',commissionAmount:num(comm.amount),currency:sales.currency||orig.currency||comm.currency||'',unitsSold:p.units_sold!==undefined?Number(p.units_sold):'',stock:p.has_inventory!==undefined?Boolean(p.has_inventory):'',category:clean(cats[cats.length-1]?.local_name||cats[0]?.local_name),productId:clean(p.id||p.product_id),detailLink:clean(p.detail_link||p.product_link),dataSource:'TikTok Shop Affiliate API',sourceVerified:true,verificationLevel:'official-api'};
}
module.exports=async function(req,res){
  if(!auth(req))return res.status(401).json({ok:false,error:'Unauthorized'});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  let b;try{b=jsonBody(req,65536)}catch(e){return res.status(400).json({ok:false,error:e.message})}
  const rawUrl=String(b.affiliateUrl||'').trim();
  let u=allowed(rawUrl);
  if(!u && /^(intent|market|shopee|snssdk|tiktok|tokopedia):/i.test(rawUrl)) { try { u=new URL(rawUrl); } catch {} }
  if(!u)return res.status(400).json({ok:false,error:'Link harus HTTPS dari sumber yang didukung, atau deep link aplikasi yang valid.'});
  const checkedAt=new Date().toISOString();
  try{
    const fetched=await safeFetch(u.toString());
    const signals=linkSignals(u.toString(),fetched.u.toString(),fetched.redirects||[]);
    if(fetched.deepLink){
      return res.status(200).json({ok:true,source:fetched.u.hostname||signals.source,marketplace:signals.source.toLowerCase().includes('shopee')?'shopee':signals.source.toLowerCase().includes('tiktok')?'tiktok':'other',name:'Produk belum teridentifikasi',slug:'Produk belum teridentifikasi',brand:'',category:'Belum ditentukan',summary:'Link aplikasi terdeteksi. Buka link pada perangkat untuk memastikan tujuan, lalu gunakan URL HTTPS produk jika tersedia.',pros:[],cons:[],specs:{},price:'',oldPrice:'',rating:'',reviews:'',image:'',videoUrl:'',dataSource:'Deep link aplikasi',sourceVerified:false,verificationLevel:'unverified',sourceMethod:'deep-link',checkedAt,sourceSignals:signals,finalUrl:signals.finalUrl,redirectChain:signals.redirects,notice:signals.note});
    }
    const r=fetched.r; if(!r.ok)throw new Error(`Sumber mengembalikan HTTP ${r.status}`); const html=await r.text();
    const page=parseProductPage(html,fetched.u.toString()); const sourceMetaTitle=clean(first(html,['og:title','twitter:title']))||htmlTitle(html); const fileTitle=clean(b.fileName||''); const fallbackTitle=/^(IMG|DSC|DCIM|WA|Screenshot|Screen Shot|Photo|Foto|Image)[ _-]?\d{3,}/i.test(fileTitle)?'Produk belum teridentifikasi':fileTitle.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '); const title=page.title||sourceMetaTitle||fallbackTitle||'Produk belum teridentifikasi'; const category=page.rawLd?.category?.name||page.rawLd?.category||inferCategory(title); const g=generated(title,category);
    let marketplace={enabled:false}; const host=fetched.u.hostname.toLowerCase();
    if(/(^|\.)shopee\.|(^|\.)shp\.ee$/i.test(host)) marketplace=await shopeeFeedLookup({url:fetched.u.toString(),title:page.title||title});
    else if(/(^|\.)tiktok\.com$|^vt\.tokopedia\.com$/i.test(host)) marketplace=await tiktokLookup({title});
    const apiData=marketplace.product?(marketplace.method?.startsWith('official-feed')?normalizeShopeeFeed(marketplace.product):normalizeTikTok(marketplace.product)):{}; const merged={...page,...apiData};
    const hasLiveFacts=[merged.price,merged.commissionRate,merged.rating,merged.reviews,merged.unitsSold].some(v=>v!==''&&v!==null&&v!==undefined);
    const verificationLevel=apiData.verificationLevel||((hasLiveFacts)?'live-page':'unverified');
    const sourceVerified=verificationLevel!=='unverified';
    const dataSource=apiData.dataSource||(hasLiveFacts?'Halaman marketplace langsung':'Halaman marketplace belum menyediakan data produk yang bisa diverifikasi');
    return res.status(200).json({ok:true,source:fetched.u.hostname,marketplace:/shopee\./i.test(fetched.u.hostname)?'shopee':/tiktok\.|tokopedia\./i.test(fetched.u.hostname)?'tiktok':'other',name:merged.name||title,slug:merged.name||title,brand:merged.brand||inferBrand(title),category:merged.category||category,summary:page.desc||g.summary,pros:g.pros,cons:g.cons,specs:{Kategori:merged.category||category,...(page.rawLd?.additionalProperty||[]).reduce((a,x)=>{if(x?.name)a[x.name]=ldValue(x.value);return a},{})},price:merged.price||'',oldPrice:merged.oldPrice||'',priceMin:merged.priceMin||'',priceMax:merged.priceMax||'',oldPriceMin:merged.oldPriceMin||'',oldPriceMax:merged.oldPriceMax||'',rating:merged.rating||'',reviews:merged.reviews||'',shopName:merged.shopName||page.seller||'',commissionRate:merged.commissionRate??'',commissionAmount:merged.commissionAmount||'',unitsSold:merged.unitsSold??'',stock:merged.stock,productId:merged.productId||'',detailLink:merged.detailLink||'',image:merged.image||'',videoUrl:first(html,['og:video','og:video:url','twitter:player'])||'',dataSource,sourceVerified,verificationLevel,sourceMethod:marketplace.method||(/(^|\.)shopee\.|(^|\.)shp\.ee$/i.test(host)?'shopee-live-page':'page-metadata'),checkedAt,finalUrl:fetched.u.toString(),sourceSignals:signals,redirectChain:signals.redirects,notice:marketplace.error?`API marketplace belum tersedia/berhasil: ${marketplace.error}. Sistem tetap memakai data yang benar-benar ditemukan pada halaman.`:verificationLevel==='live-page'?'Data produk ditemukan pada halaman marketplace saat pemeriksaan; harga/komisi dapat berubah dan tetap perlu dicek sebelum publish.':`Halaman ${host} tidak memberikan data produk terstruktur yang cukup untuk memverifikasi harga/komisi. Jangan menganggap field kosong sebagai harga pasti.`});
  }catch(e){
    const fileTitle=clean(b.fileName||''); const generic=/^(IMG|DSC|DCIM|WA|Screenshot|Screen Shot|Photo|Foto|Image)[ _-]?\d{3,}/i.test(fileTitle); const title=generic?'Produk belum teridentifikasi':fileTitle.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ')||'Produk belum teridentifikasi'; const category='Belum ditentukan'; const g=generated(title,category); const sourceSignals=linkSignals(u.toString(),u.toString(),[]);
    return res.status(200).json({ok:true,source:u.hostname,fallback:true,name:title,slug:title,brand:'',category,summary:g.summary,pros:g.pros,cons:g.cons,specs:g.specs,price:'',oldPrice:'',rating:'',reviews:'',image:'',videoUrl:'',dataSource:'Tidak terverifikasi',sourceVerified:false,verificationLevel:'unverified',checkedAt,finalUrl:u.toString(),sourceSignals,redirectChain:[],notice:`Halaman marketplace tidak bisa dibaca otomatis: ${e.message}. Jangan anggap harga kosong sebagai harga pasti; periksa halaman toko.`});
  }
};
module.exports.config={maxDuration:40};
module.exports._test = { parseProductPage, marketplaceSignals, attrMeta, rawStringField, rawNumberField, shopeeTextHints, shopeeUrlHints, inferCategory, inferBrand, classifyHost, linkSignals, parseGoogleTarget, scoreFeedProduct, normalizeShopeeFeed };
