let products=[],token='';
const $=s=>document.querySelector(s);
const SCREENSHOT_STATE_KEY='faeyza:screenshot-verification:v64';
const loginGate=$('#loginGate'),adminApp=$('#adminApp'),loginStatus=$('#loginStatus');
function persistVerifiedScreenshot(state){try{if(!state){sessionStorage.removeItem(SCREENSHOT_STATE_KEY);return;}const copy={...state,imageData:state.imageData||''};sessionStorage.setItem(SCREENSHOT_STATE_KEY,JSON.stringify(copy));}catch(_){} }
function clearVerifiedScreenshot(){window.__verifiedScreenshot=null;persistVerifiedScreenshot(null)}
function restoreVerifiedScreenshot(){try{const raw=sessionStorage.getItem(SCREENSHOT_STATE_KEY);if(!raw)return;const d=JSON.parse(raw);if(!d||!d.name&&!d.imageData)return;window.__verifiedScreenshot=d;if(d.affiliateUrl)$('#quickUrl').value=d.affiliateUrl;if(d.imageData){$('#verificationPreview').innerHTML=`<div class="ai-preview-title">🔎 Screenshot verifikasi dipulihkan dari sesi sebelumnya</div><img src="${esc(d.imageData)}" alt="Screenshot halaman produk"><p class="note">Data screenshot tetap dipakai sampai kamu mengganti screenshot atau link.</p>`;$('#verificationPreview').dataset.data=d.imageData;}if(d.sourceVerified)renderOcrReview(d);setStatus(d.sourceVerified?'Verifikasi screenshot dipulihkan. Data ini akan dipakai sebagai sumber utama saat membuat konten.':'Kandidat OCR dipulihkan. Periksa lalu konfirmasi sebelum membuat konten.',Boolean(d.sourceVerified));}catch(_){clearVerifiedScreenshot()}}
function showLogin(){loginGate.hidden=false;adminApp.hidden=true;$('#adminPassword').focus()}
function showAdmin(){loginGate.hidden=true;adminApp.hidden=false;load().then(()=>{if(sanitizeLegacyProducts())render();restoreVerifiedScreenshot()})}
async function login(){const password=$('#adminPassword').value;loginStatus.textContent='Memeriksa...';try{const r=await fetch('/api/admin-products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',password})});const d=await r.json();if(!r.ok)throw Error(d.error||'Login gagal');$('#adminPassword').value='';loginStatus.textContent='Login berhasil.';showAdmin()}catch(e){loginStatus.textContent=e.message;}}
$('#loginButton').onclick=login;$('#adminPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
$('#logout').onclick=async()=>{try{await fetch('/api/admin-products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})})}catch(_){} showLogin()};const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function setStatus(s,ok=true){$('#status').textContent=s;$('#status').className='card '+(ok?'ok':'err')}
function isLegacyPhotoName(v){return /^(IMG|DSC|DCIM|WA|Screenshot|Screen Shot|Photo|Foto|Image)[ _-]?\d{3,}/i.test(String(v||'').trim())}
function sanitizeLegacyProducts(){let changed=false;products=products.map(p=>{const name=String(p.name||'').trim(),cat=String(p.category||'').trim().toLowerCase(),brand=String(p.brand||'').trim();if(isLegacyPhotoName(name)&&(!cat||cat==='workspace'||cat==='belum ditentukan'||isLegacyPhotoName(brand))){changed=true;return {...p,name:'Produk belum teridentifikasi',slug:'',category:'Belum ditentukan',brand:'',sourceVerified:false,verificationLevel:'unverified',verificationRequired:true} }return p});return changed}
function filtered(){const q=$('#search').value.trim().toLowerCase(),a=$('#active').value;return products.map((p,i)=>({p,i})).filter(x=>(!q||[x.p.name,x.p.slug,x.p.category,x.p.brand].join(' ').toLowerCase().includes(q))&&(a==='all'||(a==='active'?x.p.active!==false:x.p.active===false)))}
function render(){const list=filtered();$('#stats').innerHTML=`<div class="card"><b>${products.length}</b> total · <b>${products.filter(p=>p.active!==false).length}</b> aktif · <b>${products.filter(p=>p.active===false).length}</b> nonaktif · <b>${new Set(products.map(x=>x.category).filter(Boolean)).size}</b> kategori</div>`;$('#editor').innerHTML=list.map(({p,i})=>`<article class="card"><div class="row"><h3>${esc(p.name||'Produk baru')}</h3><label class="switch"><input type="checkbox" data-i="${i}" data-k="active" ${p.active!==false?'checked':''}> Aktif</label></div><div class="grid"><label>Nama<input data-i="${i}" data-k="name" value="${esc(p.name)}"></label><label>Slug<input data-i="${i}" data-k="slug" value="${esc(p.slug)}"></label><label>Kategori<input data-i="${i}" data-k="category" value="${esc(p.category)}"></label><label>Brand<input data-i="${i}" data-k="brand" value="${esc(p.brand)}"></label><label>Harga<input type="number" data-i="${i}" data-k="price" value="${esc(p.price)}"></label><label>Harga Lama<input type="number" data-i="${i}" data-k="oldPrice" value="${esc(p.oldPrice)}"></label><label>Rating<input type="number" step="0.1" min="0" max="5" data-i="${i}" data-k="rating" value="${esc(p.rating)}"></label><label>Reviews<input type="number" min="0" data-i="${i}" data-k="reviews" value="${esc(p.reviews)}"></label><label>Affiliate URL<input data-i="${i}" data-k="affiliateUrl" value="${esc(p.affiliateUrl)}"></label><label>Gambar URL<input data-i="${i}" data-k="image" value="${esc(p.image?.startsWith('data:')?'[Foto tersimpan]':p.image)}"></label><label class="full">Foto Tambahan<input data-i="${i}" data-k="images" value="${esc((p.images||[]).length+' foto tambahan tersimpan')}" readonly></label><label>Video Referensi URL<input data-i="${i}" data-k="videoUrl" value="${esc(p.videoUrl)}"></label><label class="full">Ringkasan<textarea data-i="${i}" data-k="summary">${esc(p.summary)}</textarea></label><label>SEO Title<input data-i="${i}" data-k="seoTitle" value="${esc(p.seoTitle||'')}"></label><label>Meta Description<textarea data-i="${i}" data-k="metaDescription">${esc(p.metaDescription||'')}</textarea></label><label class="full">Kelebihan<textarea data-i="${i}" data-k="pros">${esc((p.pros||[]).join('\n'))}</textarea></label><label class="full">Pertimbangan<textarea data-i="${i}" data-k="cons">${esc((p.cons||[]).join('\n'))}</textarea></label><label class="full">FAQ JSON<textarea data-i="${i}" data-k="faq">${esc(JSON.stringify(p.faq||[],null,2))}</textarea></label><label class="full">Caption<textarea data-i="${i}" data-k="caption">${esc(p.caption||'')}</textarea></label></div>${p.image?`<img class="admin-thumb" src="${esc(p.image)}" alt="Foto utama ${esc(p.name||'produk')}">`:''}${Array.isArray(p.images)&&p.images.length?`<div class="admin-ai-gallery"><b>Galeri Foto Tambahan (${p.images.length})</b><div class="admin-ai-grid">${p.images.map((src,j)=>`<img class="admin-thumb" src="${esc(src)}" alt="Foto tambahan ${j+1}">`).join('')}</div></div>`:''}<div class="share-actions"><button class="share-btn" data-share-index="${i}">📤 Bagikan Produk</button>${p.affiliateUrl?`<button class="share-btn" data-refresh-index="${i}">🔄 Cek Ulang Link</button><button class="share-btn" data-open-link-index="${i}">🔗 Buka & Verifikasi</button>`:""}</div><p class="note">Video dapat berupa YouTube, TikTok, Shopee, atau direct MP4. Jika sumber tidak mengizinkan embed, tombol akan membuka video di sumbernya.</p></article>`).join('')||'<div class="card">Tidak ada produk yang cocok.</div>';document.querySelectorAll('[data-i]').forEach(el=>el.oninput=()=>{const i=+el.dataset.i,k=el.dataset.k;if(k==='active')products[i][k]=el.checked;else if(['price','oldPrice','rating','reviews'].includes(k))products[i][k]=el.value===''?'':Number(el.value);else if(k==='pros'||k==='cons')products[i][k]=el.value.split(/\n|\|/).map(x=>x.trim()).filter(Boolean);else if(k==='faq'){try{products[i][k]=JSON.parse(el.value||'[]')}catch(_){products[i][k]=products[i][k]||[]}}else if(k==='image'&&el.value==='[Foto tersimpan]'){}else if(k==='images'){}else products[i][k]=el.value})}
function productUrl(p){return `${location.origin}/produk/${encodeURIComponent(p.slug||'')}/`}
function shareCaption(p,url){const name=p.name||'Produk pilihan';const price=p.price?`Harga tercatat: ${Number(p.price).toLocaleString('id-ID')}\n`:'';const summary=(p.summary||'').replace(/\s+/g,' ').trim();const short=summary.length>150?summary.slice(0,147)+'...':summary;const cat=p.category?`Kategori: ${p.category}\n`:'';const tags=['#Faeyza Store'];if(p.category)tags.push('#'+String(p.category).toLowerCase().replace(/[^a-z0-9]+/g,''));tags.push('#rekomendasi','#setupkerja');return `🔎 ${name}\n\n${short||'Lihat review, spesifikasi, kelebihan, dan pertimbangannya di Faeyza Store.'}\n\n${price}${cat}👉 Cek review & harga:\n${url}\n\n${tags.join(' ')}`}
function openShare(i){const p=products[i];if(!p)return;const url=productUrl(p),caption=shareCaption(p,url);$('#shareModal').hidden=false;$('#shareProductName').textContent=p.name||'Produk';$('#shareUrl').value=url;$('#shareCaption').value=caption;$('#qrBox').hidden=true;$('#downloadQr').hidden=true;$('#shareStatus').textContent='';window.__shareProduct={p,url,caption}}
function closeShare(){$('#shareModal').hidden=true;window.__shareProduct=null}
function copyText(text){return navigator.clipboard?.writeText(text).then(()=>true).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok})}
function showShareStatus(t){$('#shareStatus').textContent=t}
function makeQr(){const d=window.__shareProduct;if(!d)return;const box=$('#qrBox');box.innerHTML='';box.hidden=false;if(typeof QRCode==='undefined'){showShareStatus('QR library belum termuat. Pastikan perangkat terhubung internet lalu buka ulang halaman admin.');return}new QRCode(box,{text:d.url,width:256,height:256,correctLevel:QRCode.CorrectLevel.M});$('#downloadQr').hidden=false;showShareStatus('QR Code siap. Kamu bisa simpan lalu pasang di video, poster, atau postingan.')}
$('#editor').addEventListener('click',async e=>{const b=e.target.closest('[data-share-index]');if(b){openShare(+b.dataset.shareIndex);return}const ob=e.target.closest('[data-open-link-index]');if(ob){const p=products[+ob.dataset.openLinkIndex];if(p?.affiliateUrl)window.open(p.finalUrl||p.affiliateUrl,'_blank','noopener,noreferrer');return}const rb=e.target.closest('[data-refresh-index]');if(!rb)return;const i=+rb.dataset.refreshIndex,p=products[i];if(!p?.affiliateUrl)return;rb.disabled=true;rb.textContent='⏳ Memeriksa...';setStatus('Mengecek ulang data dari link sumber...');try{const r=await fetch('/api/admin-product-inspect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({affiliateUrl:p.affiliateUrl,fileName:p.name||'produk'})});const d=await r.json();if(!r.ok)throw Error(d.error||'Gagal memeriksa link');const verified=Boolean(d.sourceVerified);products[i]={...p,name:verified&&d.name?p.name:d.name||p.name,brand:verified?((d.brand??p.brand)||''):(d.brand||p.brand||''),category:verified&&d.category?p.category:(d.category||p.category||'Belum ditentukan'),price:d.price!==''?d.price:p.price,oldPrice:d.oldPrice!==''?d.oldPrice:p.oldPrice,rating:d.rating!==''?d.rating:p.rating,reviews:d.reviews!==''?d.reviews:p.reviews,shopName:d.shopName||p.shopName||'',commissionRate:d.commissionRate!==''?d.commissionRate:p.commissionRate,commissionAmount:d.commissionAmount!==''?d.commissionAmount:p.commissionAmount,unitsSold:d.unitsSold!==''?d.unitsSold:p.unitsSold,stock:d.stock!==''&&d.stock!==undefined?d.stock:p.stock,priceMin:d.priceMin!==''?d.priceMin:p.priceMin,priceMax:d.priceMax!==''?d.priceMax:p.priceMax,oldPriceMin:d.oldPriceMin!==''?d.oldPriceMin:p.oldPriceMin,oldPriceMax:d.oldPriceMax!==''?d.oldPriceMax:p.oldPriceMax,image:p.image||d.image,marketplace:d.marketplace||p.marketplace,dataSource:d.dataSource||p.dataSource,sourceVerified:verified,sourceMethod:d.sourceMethod||p.sourceMethod,sourceCheckedAt:d.checkedAt||new Date().toISOString(),finalUrl:d.finalUrl||p.finalUrl,sourceSignals:d.sourceSignals||p.sourceSignals,redirectChain:d.redirectChain||p.redirectChain,productId:d.productId||p.productId,detailLink:d.detailLink||p.detailLink};setStatus(verified?'Data link berhasil diperbarui dan fakta marketplace dipertahankan.':'Link diperiksa ulang, tetapi data masih belum terverifikasi.');render()}catch(err){setStatus('Gagal cek ulang: '+err.message,false)}finally{rb.disabled=false}});document.querySelectorAll('[data-close-share]').forEach(x=>x.addEventListener('click',closeShare));$('#shareModal').addEventListener('click',async e=>{const b=e.target.closest('[data-share]');if(!b)return;const d=window.__shareProduct;if(!d)return;if(b.dataset.share==='copy'){await copyText(d.url);showShareStatus('Link produk tersalin.')}if(b.dataset.share==='copycaption'){await copyText(d.caption);showShareStatus('Caption + link tersalin. Siap ditempel ke TikTok/Instagram/Facebook.')}if(b.dataset.share==='whatsapp'){location.href='https://wa.me/?text='+encodeURIComponent(d.caption)}if(b.dataset.share==='facebook'){window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(d.url),'_blank','noopener,noreferrer');showShareStatus('Halaman Facebook Share dibuka.')}if(b.dataset.share==='native'){if(navigator.share){try{await navigator.share({title:d.p.name||'Faeyza Store',text:d.caption,url:d.url})}catch(_){}}else{await copyText(d.caption);showShareStatus('Fitur Bagikan tidak tersedia. Caption + link sudah disalin.')}}if(b.dataset.share==='qr')makeQr()});$('#downloadQr').addEventListener('click',()=>{const img=$('#qrBox img'),canvas=$('#qrBox canvas');const src=img?.src||canvas?.toDataURL('image/png');if(!src)return showShareStatus('QR belum dibuat.');const a=document.createElement('a');a.href=src;a.download='faeyza-store-qr.png';a.click();showShareStatus('QR PNG disiapkan untuk disimpan.')});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#shareModal').hidden)closeShare()});

function sanitizeLegacyProducts(list){
  return (Array.isArray(list)?list:[]).map(p=>{
    const name=String(p?.name||'').trim();
    const brand=String(p?.brand||'').trim();
    const category=String(p?.category||'').trim();
    const generic=/^(IMG|DSC|DCIM|WA|Screenshot|Screen Shot|Photo|Foto|Image)[ _-]?\d{3,}/i.test(name);
    const genericBrand=/^(IMG|DSC|DCIM|WA|Screenshot|Screen Shot|Photo|Foto|Image)[ _-]?\d{3,}/i.test(brand);
    if(generic && (category.toLowerCase()==='workspace' || genericBrand)){
      return {...p, name:'Produk belum teridentifikasi', slug:'', brand:'', category:'Belum ditentukan', tag:'', sourceVerified:false, dataSource:p.dataSource||'Belum terverifikasi'};
    }
    return p;
  });
}
async function load(){token='session';setStatus('Memuat katalog...');try{const r=await fetch('/api/admin-products',{headers:{Authorization:'Bearer '+token}}),d=await r.json();if(!r.ok)throw Error(d.error||'Gagal');products=sanitizeLegacyProducts(d.products||[]);const repaired=(d.products||[]).length-products.filter(p=>String(p.category||'').toLowerCase()==='workspace').length;setStatus(`Katalog dimuat: ${products.length} produk.${repaired?' Data lama yang terindikasi salah sudah ditandai untuk diperiksa.':''}`);render()}catch(e){setStatus(e.message,false)}}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()}
function parseCSV(t){const rows=[];let row=[],cell='',quote=false;for(let i=0;i<t.length;i++){const c=t[i],n=t[i+1];if(c==='"'&&quote&&n==='"'){cell+='"';i++;continue}if(c==='"'){quote=!quote;continue}if(c===','&&!quote){row.push(cell);cell='';continue}if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(x=>x!==''))rows.push(row);row=[];continue}cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const h=rows.shift()||[];return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??'']))) }
async function imageData(file,max=1200,quality=.78){if(!file)return '';return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const scale=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));const ctx=c.getContext('2d');ctx.drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',quality))};im.onerror=reject;im.src=r.result};r.onerror=reject;r.readAsDataURL(file)})}
async function compactDataUrl(dataUrl){if(!dataUrl||!dataUrl.startsWith('data:image/'))return dataUrl;return await new Promise((resolve)=>{const im=new Image();im.onload=()=>{const max=900,scale=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.65))};im.onerror=()=>resolve(dataUrl);im.src=dataUrl})}
$('#quickImage').onchange=async e=>{const files=[...e.target.files].slice(0,5);if(!files.length)return;try{if(e.target.files.length>5){setStatus('Maksimal 5 foto. Hanya 5 foto pertama yang dipakai.',false)}const images=[];for(const f of files){images.push(await imageData(f,1100,.72))}$('#imagePreview').innerHTML=images.map((d,i)=>`<img src="${d}" alt="Foto produk ${i+1}">`).join('');$('#imagePreview').dataset.data=images[0]||'';$('#imagePreview').dataset.gallery=JSON.stringify(images);$('#aiImagePreview').innerHTML=`<div class="ai-preview-title">📸 ${images.length} foto manual siap — foto pertama menjadi foto utama</div><div class="ai-preview-grid">${images.map((src,i)=>`<img src="${src}" alt="Foto manual ${i+1}">`).join('')}</div>`;setStatus(`${images.length} foto manual siap. Klik Buat Konten Otomatis untuk membaca link dan mengisi konten teks.`,true)}catch(err){setStatus('Foto gagal diproses: '+err.message,false)}};
$('#quickScreenshot').onchange=async e=>{const f=e.target.files[0];if(!f)return;clearVerifiedScreenshot();try{const d=await imageData(f,1400,.68);$('#verificationPreview').innerHTML=`<div class="ai-preview-title">🔎 Screenshot siap — ${esc(f.name||'screenshot')}</div><img src="${d}" alt="Screenshot halaman produk"><p class="note">Pastikan nama produk dan minimal satu detail pendukung terlihat jelas.</p>`;$('#verificationPreview').dataset.data=d;$('#marketplaceStatus').innerHTML='';setStatus('Screenshot siap. Sekarang klik Verifikasi dari Screenshot.',true)}catch(err){setStatus('Screenshot gagal diproses: '+err.message,false)}};

function parseOcrProductText(text){
 const raw=String(text||'').replace(/\r/g,'');
 const lines=raw.split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
 const joined=lines.join(' ');
 const moneyToNumber=(v)=>{if(!v)return '';let x=String(v).replace(/Rp\.?\s*/ig,'').replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!x)return '';if(x.includes('.')&&x.includes(','))x=x.replace(/\./g,'').replace(',','.');else if(x.includes('.')&&/\.\d{3}$/.test(x))x=x.replace(/\./g,'');else if(x.includes(',')&&/,\d{3}$/.test(x))x=x.replace(/,/g,'');else x=x.replace(/,/g,'.');const n=Number(x);return Number.isFinite(n)?Math.round(n):''};
 const priceMatches=[...raw.matchAll(/Rp\.?\s*([0-9][0-9.\s]*(?:,[0-9]+)?)/ig)].map(m=>moneyToNumber(m[1])).filter(Boolean);
 const uniquePrices=[...new Set(priceMatches)];
 const ratingM=raw.match(/(?:rating|penilaian|star|bintang)\s*[:\-]?\s*([0-5](?:[.,][0-9])?)/i) || raw.match(/\b([0-5][.,][0-9])\s*(?:\/\s*5|★|stars?)\b/i);
 const reviewsM=raw.match(/(?:ulasan|review|reviews)\s*[:\-]?\s*([0-9][0-9.,]*)/i) || raw.match(/([0-9][0-9.,]*)[ \t]*(?:ulasan|review|reviews)/i);
 const soldM=raw.match(/(?:terjual|sold|produk terjual)\s*[:\-]?\s*([0-9][0-9.,]*)/i) || raw.match(/([0-9][0-9.,]*)[ \t]*(?:terjual|sold|produk terjual)/i);
 const shopM=raw.match(/(?:toko|shop)\s*[:\-]?\s*([^\n|]{2,80})/i);
 const productIdM=raw.match(/(?:produk|product)\s*(?:id|kode)\s*[:#\-]?\s*([A-Za-z0-9_-]{4,})/i);
 const price=uniquePrices.length?uniquePrices[0]:'';
 // Jangan menganggap harga yang sama, yang muncul berulang karena UI Shopee, sebagai harga lama.
 // Harga lama hanya diisi bila OCR menemukan angka harga lain yang benar-benar berbeda.
 const oldCandidates=uniquePrices.filter(n=>n!==price);
 const oldPrice=oldCandidates.length?Math.max(...oldCandidates):'';
 let name='';
 const bad=/^(rp|harga|terjual|rating|ulasan|review|toko|shop|bagikan|beli|checkout|gratis|voucher|diskon|home|beranda|detail|spesifikasi|deskripsi|produk|shopee|follow|chat|online|varian|warna|ukuran|pilih|opsi|jumlah|komentar|penilaian)\b/i;
 const titleCandidates=[];
 for(const line of lines){
   const clean=line.replace(/^[•·|>]+\s*/,'').trim();
   if(clean.length<8||clean.length>180||bad.test(clean)) continue;
   if(/https?:\/\//i.test(clean)||/Rp\.?\s*\d/i.test(clean)||/\d+%/.test(clean)) continue;
   if(/^(?:[0-9\s.,]+|[A-Z0-9_-]{1,12})$/.test(clean)) continue;
   if(/^(?:variasi|variant|warna|ukuran|size|pilih)\s*[:：]/i.test(clean)) continue;
   const variationNoise=/\b(ld|lingkar dada|panjang|size|ukuran|warna|polka|cream|hitam|putih|merah|navy|coklat)\b/i.test(clean);
   const score=(clean.split(/\s+/).length>=3?3:0)+(clean.length>=18?2:0)+(variationNoise?-3:0)+(lines.indexOf(line)<Math.max(1,lines.length/2)?2:0);
   titleCandidates.push({text:clean,score});
 }
 titleCandidates.sort((a,b)=>b.score-a.score||b.text.length-a.text.length);
 name=titleCandidates[0]?.text||'';
 let brand='';
 const brandM=raw.match(/(?:brand|merek)\s*[:\-]\s*([^\n|]{2,60})/i); if(brandM)brand=brandM[1].trim();
 let category='';
 const catM=raw.match(/(?:kategori|category)\s*[:\-]\s*([^\n|]{2,60})/i); if(catM)category=catM[1].trim();
 let rating=ratingM?String(ratingM[1]).replace(',','.') : '';
 let reviews=reviewsM?moneyToNumber(reviewsM[1]):'';
 let unitsSold=soldM?moneyToNumber(soldM[1]):'';
 return {name,brand,category,price,oldPrice,rating,reviews,unitsSold,shopName:shopM?shopM[1].trim():'',productUrl:(raw.match(/https?:\/\/[^\s]+/i)||[])[0]||'',productId:productIdM?productIdM[1]:'',ocrText:raw, evidence:[], _lines:lines};
}
async function runLocalScreenshotOCR(img){
 if(!window.Tesseract)throw new Error('OCR lokal belum termuat. Periksa koneksi internet lalu buka ulang halaman admin.');
 setStatus('OCR lokal sedang membaca teks screenshot...');
 const result=await Tesseract.recognize(img,'eng',{logger:m=>{if(m&&m.status&&typeof m.progress==='number'){const pct=Math.round(m.progress*100);if(pct>=0&&pct<=100)$('#status').textContent=`OCR lokal: ${m.status} ${pct}%`;}}});
 const text=result?.data?.text||'';
 const out=parseOcrProductText(text);
 const corroborating=Boolean(out.price||out.shopName||out.rating||out.reviews||out.unitsSold||out.productUrl||out.brand||out.category);
 const hasIdentity=Boolean(out.name&&corroborating);
 out.sourceVerified=hasIdentity; out.verificationLevel=hasIdentity?'screenshot-ocr-pending-confirmation':'unverified'; out.dataSource='OCR lokal dari screenshot'; out.sourceMethod='browser-ocr'; out.checkedAt=new Date().toISOString();
 out.verificationNote=hasIdentity?'OCR menemukan nama produk dan minimal satu data pendukung. Konfirmasi hasil sebelum dianggap terverifikasi.':'OCR belum menemukan nama produk + data pendukung yang cukup. Gunakan screenshot yang lebih tajam/crop bagian nama dan harga/toko.';
 return out;
}
function renderOcrReview(c){
 const rows=[['Nama',c.name],['Brand',c.brand],['Kategori',c.category],['Harga',c.price?('Rp '+Number(c.price).toLocaleString('id-ID')):''],['Harga lama',c.oldPrice?('Rp '+Number(c.oldPrice).toLocaleString('id-ID')):''],['Rating',c.rating],['Ulasan',c.reviews],['Terjual',c.unitsSold],['Toko',c.shopName]];
 const verified=Boolean(c.sourceVerified);
 $('#marketplaceStatus').innerHTML=`<div class="marketplace-badge ${verified?'verified':'unverified'}">${verified?(c.confirmedByUser?'✓ Data screenshot dikonfirmasi pengguna':'⚠ Hasil OCR lokal — belum dikonfirmasi'):'⚠ OCR belum menemukan bukti yang cukup'}</div><div class="marketplace-grid">${rows.map(([k,v])=>`<span>${k}: <b>${esc(v||'-')}</b></span>`).join('')}</div><p class="note">Sumber utama: screenshot produk yang kamu pilih. OCR hanya membaca teks yang terlihat; data dari halaman Shopee yang gagal dibaca otomatis tidak akan menggantikan data screenshot.</p>${verified&&!c.confirmedByUser?'<button id="confirmOcr" class="primary">✅ Konfirmasi Data OCR</button>':''}`;
 const btn=$('#confirmOcr'); if(btn)btn.onclick=()=>{window.__verifiedScreenshot={...c,sourceVerified:true,verificationLevel:'screenshot-ocr-verified',verificationNote:'Dikonfirmasi pengguna setelah pemeriksaan hasil OCR.',confirmedByUser:true};persistVerifiedScreenshot(window.__verifiedScreenshot);setStatus('Data screenshot dikonfirmasi. Sekarang klik Buat Konten Otomatis. Data ini tidak akan diganti oleh kegagalan pembacaan halaman Shopee.',true);renderOcrReview(window.__verifiedScreenshot);};
}

$('#verifyScreenshot').onclick=async()=>{
 const affiliateUrl=$('#quickUrl').value.trim();
 const img=$('#verificationPreview').dataset.data||'';
 if(!affiliateUrl)return setStatus('Masukkan link Shopee terlebih dahulu.',false);
 if(!img)return setStatus('Unggah screenshot halaman produk terlebih dahulu.',false);
 if(img.length>2200000)return setStatus('Screenshot terlalu besar setelah kompresi. Gunakan screenshot yang lebih sederhana atau crop bagian produk.',false);
 const b=$('#verifyScreenshot');b.disabled=true;setStatus('Memeriksa screenshot...');
 try{
   // Prefer the existing AI vision path when available. If billing/credits/API are unavailable,
   // automatically fall back to browser OCR so screenshot verification can continue without API credit.
   let d=null;
   try{
     const r=await fetch('/api/ai-product-content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'screenshot-verify',product:{imageData:img,affiliateUrl}})});
     const j=await r.json().catch(()=>({}));
     if(r.ok&&j?.content){d={...j.content,sourceVerified:Boolean(j.sourceVerified),verificationLevel:j.verificationLevel||'unverified',dataSource:j.dataSource||'AI vision dari screenshot',sourceMethod:'ai-vision',checkedAt:j.checkedAt||new Date().toISOString()};}
     else throw new Error(j?.error||`AI vision HTTP ${r.status}`);
   }catch(aiErr){
     setStatus('AI vision tidak tersedia. Beralih ke OCR lokal tanpa kredit API...');
     d=await runLocalScreenshotOCR(img);
     d.aiFallbackReason=String(aiErr.message||aiErr);
   }
   const persistedImage=await compactDataUrl(img);
   window.__verifiedScreenshot={...d,imageData:persistedImage,affiliateUrl:d.productUrl||affiliateUrl,sourceVerified:Boolean(d.sourceVerified),verificationLevel:d.verificationLevel||'unverified',checkedAt:d.checkedAt||new Date().toISOString()};
   persistVerifiedScreenshot(window.__verifiedScreenshot);
   if(d.sourceMethod==='browser-ocr'){
     $('#quickUrl').value=d.productUrl||affiliateUrl;
     renderOcrReview(window.__verifiedScreenshot);
     setStatus(d.sourceVerified?'OCR menemukan kandidat data. Periksa lalu klik Konfirmasi Data OCR.':'OCR belum cukup membaca screenshot. Gunakan screenshot yang lebih tajam.',d.sourceVerified);
   }else{
     $('#quickUrl').value=d.productUrl||affiliateUrl;
     $('#marketplaceStatus').innerHTML=`<div class="marketplace-badge ${d.sourceVerified?'verified':'unverified'}">${d.sourceVerified?'✓ Data diverifikasi dari screenshot halaman produk':'⚠ Screenshot belum cukup untuk mengidentifikasi produk'}</div><div class="marketplace-grid"><span>Nama: <b>${esc(d.name||'-')}</b></span><span>Harga: <b>${d.price?('Rp '+Number(d.price).toLocaleString('id-ID')):'-'}</b></span><span>Toko: <b>${esc(d.shopName||'-')}</b></span><span>Rating: <b>${esc(d.rating||'-')}</b></span><span>Ulasan: <b>${d.reviews?Number(d.reviews).toLocaleString('id-ID'):'-'}</b></span><span>Terjual: <b>${d.unitsSold!==''&&d.unitsSold!==undefined?esc(d.unitsSold):'-'}</b></span></div><p class="note">Sumber utama: screenshot halaman produk. Data yang tidak terlihat tetap kosong dan tidak diganti oleh hasil pembacaan halaman marketplace.</p>`;
     setStatus(d.sourceVerified?'Screenshot berhasil diverifikasi. Sekarang klik Buat Konten Otomatis.':'Screenshot belum cukup jelas. Gunakan screenshot yang menampilkan nama produk dan detail pendukung.',d.sourceVerified);
   }
 }catch(e){setStatus('Verifikasi screenshot gagal: '+e.message,false)}finally{b.disabled=false}
};
$('#auto').onclick=async()=>{
 token='session';
 const affiliateUrl=$('#quickUrl').value.trim();
 const files=[...$('#quickImage').files].slice(0,5);
 let verifiedShot=window.__verifiedScreenshot||null;
 if(verifiedShot && verifiedShot.affiliateUrl && affiliateUrl && verifiedShot.affiliateUrl!==affiliateUrl && verifiedShot.productUrl!==affiliateUrl){
   clearVerifiedScreenshot(); verifiedShot=null;
 }
 if(verifiedShot&&!verifiedShot.sourceVerified)return setStatus('Hasil OCR belum dikonfirmasi. Klik Konfirmasi Data OCR sebelum membuat konten.',false);
 if(!affiliateUrl)return setStatus('Masukkan link produk/affiliate.',false);
 if(!files.length&&!verifiedShot)return setStatus('Masukkan foto produk atau verifikasi screenshot halaman produk terlebih dahulu.',false);
 setStatus('Sedang mengambil data produk dan menyiapkan konten...');
 try{
  const images=[]; for(const f of files) images.push(await imageData(f,1100,.72));
  const image=images[0]||verifiedShot?.imageData||'';
  const gallery=[]; for(const src of images) gallery.push(await compactDataUrl(src));
  if(!gallery.length&&verifiedShot?.imageData) gallery.push(await compactDataUrl(verifiedShot.imageData));
  let inspectUrl=affiliateUrl;
  let d;
  if(verifiedShot){
   const v=verifiedShot;
   d={name:v.name||'',brand:v.brand||'',category:v.category||'Belum ditentukan',price:v.price||'',oldPrice:v.oldPrice||'',rating:v.rating||'',reviews:v.reviews||'',unitsSold:v.unitsSold||'',shopName:v.shopName||'',stock:v.stock||'',specs:v.specs||{},sourceVerified:Boolean(v.sourceVerified&&v.name),verificationLevel:v.sourceVerified?'screenshot-ocr-verified':'unverified',dataSource:v.sourceVerified?'Screenshot halaman produk — data dikonfirmasi pengguna':'Screenshot belum cukup',sourceMethod:'screenshot',checkedAt:v.checkedAt||new Date().toISOString(),finalUrl:v.productUrl||affiliateUrl,source:'Shopee',sourceSignals:{source:'Shopee',initialHost:'',finalHost:'',redirects:[],note:'Data fakta diambil dari screenshot yang diberikan pengguna; tidak diganti oleh pembacaan halaman Shopee.'},redirectChain:[]};
   if(d.sourceVerified)$('#quickUrl').value=d.finalUrl||affiliateUrl;
  }else{
   const r=await fetch('/api/admin-product-inspect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({affiliateUrl:inspectUrl,fileName:files[0]?.name||'produk-screenshot.jpg'})});
   d=await r.json();
   if(!r.ok)throw Error(d.error||'Gagal mengambil data');
  }
  if(d.needsUserResolve){
   window.open(d.actionUrl||inspectUrl,'_blank','noopener,noreferrer');
   setStatus('Shopee menolak pembacaan otomatis untuk link pendek ini. Link sudah dibuka. Salin URL produk HTTPS dari halaman Shopee, lalu tempel pada kotak Link.',false);
   const resolved=window.prompt('Tempel URL produk Shopee HTTPS yang tampil setelah link dibuka:','');
   if(resolved&&/^https:\/\/(www\.)?shopee\.co\.id\//i.test(resolved.trim())){
    inspectUrl=resolved.trim(); $('#quickUrl').value=inspectUrl;
    r=await fetch('/api/admin-product-inspect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({affiliateUrl:inspectUrl,fileName:files[0]?.name||'produk-screenshot.jpg'})});
    d=await r.json(); if(!r.ok)throw Error(d.error||'Gagal memeriksa URL produk');
   }else throw Error('URL produk Shopee belum dimasukkan. Gunakan URL HTTPS produk, bukan link pendek.');
  }
  const videoUrl=$('#quickVideo').value.trim()||d.videoUrl||'';
  const sourceSignals=d.sourceSignals||{};
  let product={name:d.name||'Produk belum teridentifikasi',slug:d.slug||d.name,category:d.category||'Belum ditentukan',brand:d.brand||'',price:d.price||'',oldPrice:d.oldPrice||'',rating:d.rating||'',reviews:d.reviews||'',summary:d.summary||'',pros:d.pros||[],cons:d.cons||[],specs:d.specs||{},affiliateUrl:affiliateUrl,image:image||d.image||'',images:gallery,videoUrl,active:true,tag:'Pilihan Populer',shopName:d.shopName||'',commissionRate:d.commissionRate??'',commissionAmount:d.commissionAmount||'',unitsSold:d.unitsSold??'',stock:d.stock,priceMin:d.priceMin||'',priceMax:d.priceMax||'',oldPriceMin:d.oldPriceMin||'',oldPriceMax:d.oldPriceMax||'',marketplace:d.source||'',dataSource:d.dataSource||'',sourceVerified:Boolean(d.sourceVerified),verificationRequired:true,sourceMethod:d.sourceMethod||'',sourceCheckedAt:d.checkedAt||'',finalUrl:d.finalUrl||'',sourceSignals,redirectChain:d.redirectChain||[]};
  $('#marketplaceStatus').innerHTML=`<div class="marketplace-badge ${(d.verificationLevel||'unverified')==='unverified'?'unverified':'verified'}">${(d.verificationLevel||'unverified')==='official-api'?'✓ Data terverifikasi via API resmi':(d.verificationLevel||'live-page')==='live-page'?'✓ Data dibaca dari halaman sumber saat ini':(d.verificationLevel||'')==='screenshot-verified'?'✓ Data diverifikasi dari screenshot':'⚠ Data belum terverifikasi'} · ${esc(d.dataSource||'Sumber halaman')} · diperiksa ${esc(d.checkedAt||'-')}</div><div class="source-detect"><b>🔎 Asal link:</b> ${esc(sourceSignals.source||d.source||'Tidak diketahui')} ${sourceSignals.initialHost&&sourceSignals.finalHost?`<span>(${esc(sourceSignals.initialHost)} → ${esc(sourceSignals.finalHost)})</span>`:''}<br><b>Jalur:</b> ${sourceSignals.redirects?.length?sourceSignals.redirects.map(x=>esc(x.from)+' → '+esc(x.to)).join(' → '):'langsung / tidak ada redirect HTTP'}<br><small>${esc(sourceSignals.note||'Server tidak akan mengarang fakta marketplace.')}</small></div><div class="marketplace-grid"><span>Harga: <b>${d.price?('Rp '+Number(d.price).toLocaleString('id-ID')):'tidak tersedia'}</b></span><span>Toko: <b>${esc(d.shopName||'-')}</b></span><span>Komisi: <b>${d.commissionRate!==''?esc(d.commissionRate)+'%':'-'}</b></span><span>Terjual: <b>${d.unitsSold!==''&&d.unitsSold!==undefined?Number(d.unitsSold).toLocaleString('id-ID'):'-'}</b></span><span>Rating: <b>${d.rating||'-'}</b></span><span>Ulasan: <b>${d.reviews?Number(d.reviews).toLocaleString('id-ID'):'-'}</b></span></div>${d.notice?`<p class="note">${esc(d.notice)}</p>`:''}`;
  if(!product.sourceVerified)return setStatus('Data produk belum terverifikasi. Unggah screenshot halaman produk, jalankan verifikasi, lalu konfirmasi hasil OCR/AI sebelum membuat konten.',false);
  setStatus('AI hanya digunakan untuk konten teks. Data fakta marketplace dipertahankan dari sumber verifikasi...');
  const ai=await fetch('/api/ai-product-content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:{...product,sourceDescription:d.summary||'',sourceHost:d.source||'',imageUrl:d.image||'',imageData:image},generateImages:false,imageCount:0})});
  const ad=await ai.json(); if(!ai.ok)throw Error(ad.error||'Gagal membuat konten');
  const c=ad.content||{};
  product={...product,...c,affiliateUrl:product.affiliateUrl,image:product.image,images:gallery,name:product.sourceVerified?product.name:(c.name||product.name),brand:product.sourceVerified?product.brand:(c.brand||product.brand),category:product.sourceVerified?product.category:(c.category||product.category),price:product.price,oldPrice:product.oldPrice,rating:product.rating,reviews:product.reviews,shopName:product.shopName,commissionRate:product.commissionRate,commissionAmount:product.commissionAmount,unitsSold:product.unitsSold,stock:product.stock,priceMin:product.priceMin,priceMax:product.priceMax,oldPriceMin:product.oldPriceMin,oldPriceMax:product.oldPriceMax,marketplace:product.marketplace,dataSource:product.dataSource,sourceVerified:product.sourceVerified,sourceMethod:product.sourceMethod,sourceCheckedAt:product.sourceCheckedAt,finalUrl:product.finalUrl,sourceSignals:product.sourceSignals,redirectChain:product.redirectChain};
  products.unshift(product); $('#imagePreview').innerHTML=gallery.map((src,i)=>`<img src="${src}" alt="Foto produk ${i+1}">`).join(''); $('#aiImagePreview').innerHTML=`<div class="ai-preview-title">📸 ${gallery.length} foto tersimpan sementara</div><div class="ai-preview-grid">${gallery.map((src,i)=>`<img src="${src}" alt="Foto produk ${i+1}">`).join('')}</div>`;
  let msg=(d.sourceVerified?'Data produk berhasil diverifikasi. ':'Data produk belum terverifikasi penuh. ')+`${gallery.length} foto tersimpan. `; if(ad.imageNotice)msg+=ad.imageNotice+' '; msg+='Periksa lalu klik Simpan & Publish.'; setStatus(msg,true); render(); window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
 }catch(e){setStatus('Gagal membuat produk otomatis: '+e.message,false)}
};
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.name.toLowerCase().endsWith('.xlsx')){if(!window.XLSX)throw Error('Parser Excel belum tersedia.');const data=await f.arrayBuffer();const wb=XLSX.read(data,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];products=XLSX.utils.sheet_to_json(ws,{defval:''}).map(x=>({...x,active:x.active!==false&&String(x.active).toLowerCase()!=='false'}));}else{const t=await f.text();products=f.name.toLowerCase().endsWith('.json')?JSON.parse(t):parseCSV(t)}setStatus(`Import preview: ${products.length} produk. Periksa lalu klik Simpan & Publish.`);render()}catch(err){setStatus('Import gagal: '+err.message,false)}};
$('#publish').onclick=async()=>{if(!token)token='session';if(!products.length)return setStatus('Katalog kosong.',false);const blocked=products.filter(p=>!String(p.name||'').trim()||!String(p.category||'').trim()||String(p.category).toLowerCase()==='belum ditentukan'||String(p.name).toLowerCase()==='produk belum teridentifikasi'|| (p.verificationRequired===true && p.sourceVerified!==true));if(blocked.length)return setStatus(`${blocked.length} produk belum siap dipublish. pastikan nama/kategori benar dan produk berstatus terverifikasi; produk yang belum terverifikasi tidak dapat dipublish.`,false);setStatus('Menyimpan ke GitHub...');try{const r=await fetch('/api/admin-products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({products})});const d=await r.json();if(!r.ok)throw Error(d.error||'Gagal menyimpan');setStatus(`Berhasil dipublish: ${d.products} produk (${d.active} aktif). Commit ${d.commit||'-'}. Vercel akan membuat deployment baru jika repository terhubung.`)}catch(e){setStatus(e.message,false)}};

(async()=>{try{const r=await fetch('/api/admin-products',{credentials:'same-origin'});if(r.ok)showAdmin();else showLogin()}catch(_){showLogin()}})();
