const crypto = require('node:crypto');
const { jsonBody, adminAuth } = require('../security');

const ALLOWED_HOSTS = [
  /^(.*\.)?shopee\.co\.id$/i, /^(.*\.)?shopee\.com$/i,
  /^(.*\.)?tiktok\.com$/i, /^(.*\.)?tokopedia\.com$/i,
  /^(.*\.)?lazada\.co\.id$/i, /^(.*\.)?blibli\.com$/i,
  /^(.*\.)?youtube\.com$/i, /^youtu\.be$/i
];
function auth(req){ return adminAuth(req); }
function allowed(raw){
  try { const u = new URL(raw); return u.protocol === 'https:' && ALLOWED_HOSTS.some(r => r.test(u.hostname)) ? u : null; }
  catch { return null; }
}
async function safeFetch(start){
  let u = allowed(start); if(!u) throw new Error('URL tidak diizinkan.');
  for(let i=0;i<7;i++){
    const r = await fetch(u, {redirect:'manual', headers:{'user-agent':'Mozilla/5.0 (compatible; Faeyza StoreBot/3.0)','accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'}});
    if([301,302,303,307,308].includes(r.status)){
      const loc = r.headers.get('location'); if(!loc) throw new Error('Redirect tanpa tujuan.');
      const next = new URL(loc,u);
      if(next.protocol!=='https:' || !ALLOWED_HOSTS.some(x=>x.test(next.hostname))) throw new Error('Redirect ke host yang tidak diizinkan.');
      u=next; continue;
    }
    return {r,u};
  }
  throw new Error('Terlalu banyak redirect.');
}
function decode(v){return String(v??'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/gi,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim();}
function attrMeta(html,key){
  const k=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const tagRe=/<meta\b[^>]*>/gi; let m;
  while((m=tagRe.exec(html))){
    const tag=m[0];
    const a=tag.match(/(?:property|name)=["']([^"']+)["']/i);
    const b=tag.match(/content=["']([^"']*)["']/i);
    if(a&&b&&a[1].toLowerCase()===key.toLowerCase()) return decode(b[1]);
  }
  return '';
}
function first(html,patterns){for(const n of patterns){const v=attrMeta(html,n);if(v)return v;}return '';}
function num(v){
  if(v===null||v===undefined||v==='') return '';
  const raw=String(v).replace(/[^0-9.,-]/g,'');
  if(!raw) return '';
  let s=raw;
  if(raw.includes('.')&&raw.includes(',')) s=raw.lastIndexOf(',')>raw.lastIndexOf('.')?raw.replace(/\./g,'').replace(',','.'):raw.replace(/,/g,'');
  else if(/,\d{1,2}$/.test(raw)) s=raw.replace(',','.');
  else s=raw.replace(/,/g,'');
  const n=Number(s); return Number.isFinite(n)?n:'';
}
function moneyFromText(text){
  const m=String(text||'').match(/(?:Rp\s*|IDR\s*)([0-9][0-9.\,]*)/i); return m?num(m[1]):'';
}
function percentFromText(text){const m=String(text||'').match(/(?:komisi|commission)[^%]{0,60}?([0-9]+(?:[.,][0-9]+)?)\s*%/i);return m?Number(String(m[1]).replace(',','.')):'';}
function compactJsonScripts(html){
  const out=[]; const re=/<script\b[^>]*(?:type=["']application\/ld\+json["']|id=["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while((m=re.exec(html))){const raw=m[1].trim();try{out.push(JSON.parse(raw));}catch{}}
  return out;
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
function inferCategory(title){const t=title.toLowerCase();if(/keyboard|keycap|switch/.test(t))return'Keyboard';if(/mouse|tetikus/.test(t))return'Mouse';if(/headset|earphone|earbuds|speaker/.test(t))return'Audio';if(/laptop|stand|desk|mat|monitor|keyboard tray/.test(t))return'Desk Setup';return'Workspace';}
function inferBrand(title){return clean(title.split(/\s[-|,:]\s/)[0].split(/\s+/).slice(0,2).join(' '));}
function generated(title,category){const c=category||inferCategory(title);return {summary:`Informasi ${title} untuk membantu membandingkan fitur, spesifikasi, harga, dan kecocokannya untuk penggunaan sehari-hari.`,pros:['Informasi produk dirangkum dari data yang tersedia','Dapat dibandingkan dengan produk sejenis',`Cocok dipertimbangkan untuk ${c.toLowerCase()}`],cons:['Harga dan ketersediaan dapat berubah di toko','Spesifikasi mengikuti informasi yang tersedia pada sumber'],specs:{Kategori:c}};}
function parseProductPage(html,sourceUrl){
  const ld=productLd(html)||{}; const offer=Array.isArray(ld.offers)?ld.offers[0]:(ld.offers||{}); const agg=ld.aggregateRating||{}; const nodes=flatten(jsonLdObjects(html)); const human=parseHumanSignals(html);
  const title=clean(ld.name)||clean(first(html,['og:title','twitter:title','title']))||clean(pickObjectValue(nodes,['title','name','productName']));
  const desc=clean(ld.description)||clean(first(html,['og:description','description','twitter:description']))||clean(pickObjectValue(nodes,['description','shortDescription']));
  const image=Array.isArray(ld.image)?ld.image[0]:clean(ld.image)||first(html,['og:image','twitter:image'])||clean(pickObjectValue(nodes,['image','mainImage','main_image_url']));
  const price=num(offer.price)||num(first(html,['product:price:amount','og:price:amount','product:price','price']))||num(pickObjectValue(nodes,['price','salePrice','sale_price','salesPrice','sales_price','minimum_amount']))||human.priceText;
  const low=num(offer.lowPrice),high=num(offer.highPrice);
  const oldPrice=num(offer.highPrice)>price?num(offer.highPrice):num(first(html,['product:price:standard_amount','product:price:original','og:price:original']))||num(pickObjectValue(nodes,['originalPrice','original_price','listPrice','list_price']));
  const brand=clean(ld.brand?.name||ld.brand||first(html,['product:brand','brand']))||clean(pickObjectValue(nodes,['brand','brandName','brand_name']));
  const rating=num(agg.ratingValue)||num(first(html,['ratingValue','product:rating:average','rating']))||num(pickObjectValue(nodes,['rating','ratingValue','averageRating']));
  const reviews=num(agg.reviewCount)||num(agg.ratingCount)||num(first(html,['reviewCount','ratingCount','product:rating:count','review_count']))||num(pickObjectValue(nodes,['reviewCount','review_count','ratingCount']));
  const availability=String(offer.availability||pickObjectValue(nodes,['availability','stockStatus'])).toLowerCase();
  const stock=availability?(!/outofstock|soldout|discontinued/.test(availability)):'';
  const seller=clean(offer.seller?.name||ld.seller?.name||first(html,['seller','shop_name','shopName','product:seller']))||clean(pickObjectValue(nodes,['seller','sellerName','shopName','shop_name','storeName','store_name']));
  const shopName=seller||clean(first(html,['og:site_name']));
  const commissionRate=human.commissionRate!==''?human.commissionRate:num(first(html,['commission','commission_rate','affiliate:commission']));
  const commissionAmount=human.commissionAmount!==''?human.commissionAmount:num(first(html,['commission_amount','affiliate:commission_amount']));
  const unitsSold=human.unitsSold!==''?human.unitsSold:num(pickObjectValue(nodes,['unitsSold','units_sold','soldCount','sold_count']));
  return {title,desc,image,price,oldPrice,priceMin:low||price,priceMax:high||price,oldPriceMin:oldPrice||'',oldPriceMax:oldPrice||'',brand,rating,reviews,stock,seller,shopName,commissionRate,commissionAmount,unitsSold,sourceUrl,rawLd:ld};
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
  const u=allowed(b.affiliateUrl||'');if(!u)return res.status(400).json({ok:false,error:'Link harus HTTPS dan berasal dari marketplace/sumber video yang didukung.'});
  const checkedAt=new Date().toISOString();
  try{
    const fetched=await safeFetch(u.toString()); const r=fetched.r; if(!r.ok)throw new Error(`Sumber mengembalikan HTTP ${r.status}`); const html=await r.text();
    const page=parseProductPage(html,fetched.u.toString()); const title=page.title||clean(b.fileName||'Produk baru').replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '); const category=page.rawLd?.category?.name||page.rawLd?.category||inferCategory(title); const g=generated(title,category);
    let marketplace={enabled:false}; const host=fetched.u.hostname.toLowerCase(); if(/(^|\.)tiktok\.com$|^vt\.tokopedia\.com$/i.test(host)) marketplace=await tiktokLookup({title});
    const apiData=marketplace.product?normalizeTikTok(marketplace.product):{}; const merged={...page,...apiData};
    const hasLiveFacts=[merged.price,merged.shopName,merged.commissionRate,merged.rating,merged.reviews,merged.unitsSold].some(v=>v!==''&&v!==null&&v!==undefined);
    const verificationLevel=apiData.verificationLevel||((hasLiveFacts)?'live-page':'unverified');
    const sourceVerified=verificationLevel!=='unverified';
    const dataSource=apiData.dataSource||(hasLiveFacts?'Halaman marketplace langsung':'Halaman marketplace');
    return res.status(200).json({ok:true,source:fetched.u.hostname,marketplace:/shopee\./i.test(fetched.u.hostname)?'shopee':/tiktok\.|tokopedia\./i.test(fetched.u.hostname)?'tiktok':'other',name:merged.name||title,slug:merged.name||title,brand:merged.brand||inferBrand(title),category:merged.category||category,summary:page.desc||g.summary,pros:g.pros,cons:g.cons,specs:{Kategori:merged.category||category,...(page.rawLd?.additionalProperty||[]).reduce((a,x)=>{if(x?.name)a[x.name]=ldValue(x.value);return a},{})},price:merged.price||'',oldPrice:merged.oldPrice||'',priceMin:merged.priceMin||'',priceMax:merged.priceMax||'',oldPriceMin:merged.oldPriceMin||'',oldPriceMax:merged.oldPriceMax||'',rating:merged.rating||'',reviews:merged.reviews||'',shopName:merged.shopName||page.seller||'',commissionRate:merged.commissionRate??'',commissionAmount:merged.commissionAmount||'',unitsSold:merged.unitsSold??'',stock:merged.stock,productId:merged.productId||'',detailLink:merged.detailLink||'',image:merged.image||'',videoUrl:first(html,['og:video','og:video:url','twitter:player'])||'',dataSource,sourceVerified,verificationLevel,sourceMethod:marketplace.method||'page-metadata',checkedAt,notice:marketplace.error?`API TikTok belum bisa memverifikasi produk: ${marketplace.error}. Data halaman marketplace tetap digunakan jika tersedia.`:verificationLevel==='live-page'?'Data yang tersedia dibaca dari halaman marketplace saat pemeriksaan; harga/komisi dapat berubah dan tetap perlu dicek sebelum publish.':''});
  }catch(e){
    const title=clean(b.fileName||'Produk baru').replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '); const g=generated(title,'Workspace');
    return res.status(200).json({ok:true,source:u.hostname,fallback:true,name:title,slug:title,brand:'',category:'Workspace',summary:g.summary,pros:g.pros,cons:g.cons,specs:g.specs,price:'',oldPrice:'',rating:'',reviews:'',image:'',videoUrl:'',dataSource:'Tidak terverifikasi',sourceVerified:false,verificationLevel:'unverified',checkedAt,notice:`Halaman marketplace tidak bisa dibaca otomatis: ${e.message}. Jangan anggap harga kosong sebagai harga pasti; periksa halaman toko.`});
  }
};
module.exports.config={maxDuration:25};
