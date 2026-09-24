let products=[],token='';
const $=s=>document.querySelector(s);
const SCREENSHOT_STATE_KEY='faeyza:screenshot-verification:v71';
const loginGate=$('#loginGate'),adminApp=$('#adminApp'),loginStatus=$('#loginStatus');
function persistVerifiedScreenshot(state){try{if(!state){sessionStorage.removeItem(SCREENSHOT_STATE_KEY);return;}const copy={...state,imageData:state.imageData||''};sessionStorage.setItem(SCREENSHOT_STATE_KEY,JSON.stringify(copy));}catch(_){} }
function clearVerifiedScreenshot(){window.__verifiedScreenshot=null;persistVerifiedScreenshot(null)}
function restoreVerifiedScreenshot(){try{const raw=sessionStorage.getItem(SCREENSHOT_STATE_KEY);if(!raw)return;const d=JSON.parse(raw);if(!d||!d.name&&!d.imageData)return;const incomplete=!String(d.name||'').trim()||!String(d.price??'').trim()||!String(d.shopName||'').trim();if(d.confirmedByUser&&incomplete){d.sourceVerified=false;d.verificationLevel='needs-recheck';d.verificationNote='Data sesi sebelumnya belum lengkap. Screenshot harus diperiksa ulang agar fakta yang terlihat seperti harga dan toko tidak terlewat.';}window.__verifiedScreenshot=d;if(d.affiliateUrl)$('#quickUrl').value=d.affiliateUrl;if(d.imageData){$('#verificationPreview').innerHTML=`<div class="ai-preview-title">🔎 Screenshot verifikasi dipulihkan dari sesi sebelumnya</div><img src="${esc(d.imageData)}" alt="Screenshot halaman produk"><p class="note">Screenshot lama dipertahankan. Jika ada fakta yang kosong, klik Verifikasi dari Screenshot untuk membaca ulang screenshot.</p>`;$('#verificationPreview').dataset.data=d.imageData;}if(d.sourceVerified)renderOcrReview(d);else if(d.name)renderOcrReview(d);setStatus(incomplete?'Screenshot dipulihkan, tetapi data sebelumnya belum lengkap. Klik Verifikasi dari Screenshot agar nama, harga, toko, rating, ulasan, dan terjual dibaca ulang.':'Verifikasi screenshot dipulihkan.',Boolean(d.sourceVerified));}catch(_){clearVerifiedScreenshot()}}
function showLogin(){loginGate.hidden=false;adminApp.hidden=true;$('#adminPassword').focus()}
function showAdmin(){loginGate.hidden=true;adminApp.hidden=false;load().then(()=>{if(sanitizeLegacyProducts())render();restoreVerifiedScreenshot()})}
async function login(){const password=$('#adminPassword').value;loginStatus.textContent='Memeriksa...';try{const r=await fetch('/api/admin-products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',password})});const d=await r.json();if(!r.ok)throw Error(d.error||'Login gagal');$('#adminPassword').value='';loginStatus.textContent='Login berhasil.';showAdmin()}catch(e){loginStatus.textContent=e.message;}}
$('#loginButton').onclick=login;$('#adminPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
$('#logout').onclick=async()=>{try{await fetch('/api/admin-products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})})}catch(_){} showLogin()};const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function setStatus(s,ok=true){const el=$('#status');if(!el)return;el.textContent=s;el.className='card '+(ok?'ok':'err');el.setAttribute('role','status');el.setAttribute('aria-live','polite');try{el.scrollIntoView({behavior:'smooth',block:'center'})}catch(_){} }
function isLegacyPhotoName(v){return /^(IMG|DSC|DCIM|WA|Screenshot|Screen Shot|Photo|Foto|Image)[ _-]?\d{3,}/i.test(String(v||'').trim())}
function sanitizeLegacyProducts(){let changed=false;products=products.map(p=>{const name=String(p.name||'').trim(),cat=String(p.category||'').trim().toLowerCase(),brand=String(p.brand||'').trim();if(isLegacyPhotoName(name)&&(!cat||cat==='workspace'||cat==='belum ditentukan'||isLegacyPhotoName(brand))){changed=true;return {...p,name:'Produk belum teridentifikasi',slug:'',category:'Belum ditentukan',brand:'',sourceVerified:false,verificationLevel:'unverified',verificationRequired:true} }return p});return changed}
function filtered(){const q=$('#search').value.trim().toLowerCase(),a=$('#active').value;return products.map((p,i)=>({p,i})).filter(x=>(!q||[x.p.name,x.p.slug,x.p.category,x.p.brand].join(' ').toLowerCase().includes(q))&&(a==='all'||(a==='active'?x.p.active!==false:x.p.active===false)))}
function render(){
 const list=filtered();
 $('#stats').innerHTML=`<div class="card"><b>${products.length}</b> total · <b>${products.filter(p=>p.active!==false).length}</b> aktif · <b>${products.filter(p=>p.active===false).length}</b> nonaktif · <b>${new Set(products.map(x=>x.category).filter(Boolean)).size}</b> kategori</div>`;
 $('#editor').innerHTML=list.map(({p,i})=>{
   const factFields=[
    ['Nama','name'],['Slug','slug'],['Kategori','category'],['Brand','brand'],
    ['Harga','price','number'],['Harga Lama','oldPrice','number'],['Rating','rating','number'],['Ulasan','reviews','number'],
    ['Terjual','unitsSold','number'],['Toko','shopName'],['Stok','stock'],['Komisi %','commissionRate','number'],['Komisi Rp','commissionAmount','number'],
    ['Harga Min','priceMin','number'],['Harga Max','priceMax','number'],['Harga Lama Min','oldPriceMin','number'],['Harga Lama Max','oldPriceMax','number'],
    ['Marketplace','marketplace'],['Product ID','productId'],['Detail Link','detailLink']
   ];
   const facts=factFields.map(([label,k,type='text'])=>`<label>${label}<input data-i="${i}" data-k="${k}" type="${type}" ${type==='number'?'step="any"':''} value="${esc(p[k]??'')}"></label>`).join('');
   const contentComplete=Boolean(String(p.summary||'').trim()&&String(p.seoTitle||'').trim()&&String(p.metaDescription||'').trim()&&String(p.caption||'').trim()&&Array.isArray(p.pros)&&p.pros.length&&Array.isArray(p.cons)&&p.cons.length&&Array.isArray(p.faq)&&p.faq.length&&p.specs&&Object.keys(p.specs).length);
   return `<article class="card">
    <div class="row"><h3>${esc(p.name||'Produk baru')}</h3><label class="switch"><input type="checkbox" data-i="${i}" data-k="active" ${p.active!==false?'checked':''}> Aktif</label></div>
    <div class="marketplace-badge ${p.sourceVerified?'verified':'unverified'}">${p.sourceVerified?'✓ Data sumber terverifikasi':'⚠ Data sumber belum terverifikasi'} · ${esc(p.dataSource||'Sumber belum ditentukan')}</div>
    <div class="grid">${facts}
      <label>Affiliate URL<input data-i="${i}" data-k="affiliateUrl" value="${esc(p.affiliateUrl)}"></label>
      <label>Gambar URL<input data-i="${i}" data-k="image" value="${esc(p.image?.startsWith('data:')?'[Foto tersimpan]':p.image)}"></label>
      <label class="full">Foto Tambahan<input data-i="${i}" data-k="images" value="${esc((p.images||[]).length+' foto tambahan tersimpan')}" readonly></label>
      <label>Video Referensi URL<input data-i="${i}" data-k="videoUrl" value="${esc(p.videoUrl)}"></label>
      
      <label>Tag<input data-i="${i}" data-k="tag" value="${esc(p.tag||'')}"></label>
      <label class="full">Ringkasan<textarea data-i="${i}" data-k="summary">${esc(p.summary)}</textarea></label>
      <label>SEO Title<input data-i="${i}" data-k="seoTitle" value="${esc(p.seoTitle||'')}"></label>
      <label>Meta Description<textarea data-i="${i}" data-k="metaDescription">${esc(p.metaDescription||'')}</textarea></label>
      <label class="full">Spesifikasi JSON<textarea data-i="${i}" data-k="specs">${esc(JSON.stringify(p.specs||{},null,2))}</textarea></label>
      <label class="full">Kelebihan<textarea data-i="${i}" data-k="pros">${esc((p.pros||[]).join('\n'))}</textarea></label>
      <label class="full">Pertimbangan<textarea data-i="${i}" data-k="cons">${esc((p.cons||[]).join('\n'))}</textarea></label>
      <label class="full">FAQ JSON<textarea data-i="${i}" data-k="faq">${esc(JSON.stringify(p.faq||[],null,2))}</textarea></label>
      <label class="full">Caption<textarea data-i="${i}" data-k="caption">${esc(p.caption||'')}</textarea></label>
      <label class="full">Sumber Data<textarea data-i="${i}" data-k="dataSource">${esc(p.dataSource||'')}</textarea></label>
      <label>Metode Sumber<input data-i="${i}" data-k="sourceMethod" value="${esc(p.sourceMethod||'')}"></label>
      <label>Diperiksa<input data-i="${i}" data-k="sourceCheckedAt" value="${esc(p.sourceCheckedAt||'')}"></label>
      <label>Final URL<input data-i="${i}" data-k="finalUrl" value="${esc(p.finalUrl||'')}"></label>
      <label class="full">Catatan Sinyal Sumber<textarea data-i="${i}" data-k="sourceSignalsText" readonly>${esc(p.sourceSignals?.note||'')}</textarea></label>
    </div>
    <div class="marketplace-status"><b>${contentComplete?'✓ Semua kolom konten utama terisi':'⚠ Konten belum lengkap'}</b><br><small>Data yang tidak terlihat pada sumber ditulis sebagai “Tidak tercantum pada sumber yang diverifikasi”, bukan ditebak.</small></div>
    ${p.image?`<img class="admin-thumb" src="${esc(p.image)}" alt="Foto utama ${esc(p.name||'produk')}">`:''}
    ${Array.isArray(p.images)&&p.images.length?`<div class="admin-ai-gallery"><b>Galeri Foto Tambahan (${p.images.length})</b><div class="admin-ai-grid">${p.images.map((src,j)=>`<img class="admin-thumb" src="${esc(src)}" alt="Foto tambahan ${j+1}">`).join('')}</div></div>`:''}
    <div class="share-actions"><button class="share-btn" data-share-index="${i}">📤 Bagikan Produk</button>${p.affiliateUrl?`<button class="share-btn" data-refresh-index="${i}">🔄 Cek Ulang Link</button><button class="share-btn" data-open-link-index="${i}">🔗 Buka & Verifikasi</button>`:''}</div>
    <p class="note">Video dapat berupa YouTube, TikTok, Shopee, atau direct MP4. Jika sumber tidak mengizinkan embed, tombol akan membuka video di sumbernya.</p>
   </article>`;
 }).join('')||'<div class="card">Tidak ada produk yang cocok.</div>';
 document.querySelectorAll('[data-i]').forEach(el=>el.oninput=()=>{
   const i=+el.dataset.i,k=el.dataset.k;
   if(k==='active')products[i][k]=el.checked;
   else if(['price','oldPrice','rating','reviews','unitsSold','commissionRate','commissionAmount','priceMin','priceMax','oldPriceMin','oldPriceMax'].includes(k))products[i][k]=el.value===''?'':Number(el.value);
   else if(k==='pros'||k==='cons')products[i][k]=el.value.split(/\n|\|/).map(x=>x.trim()).filter(Boolean);
   else if(k==='faq'||k==='specs'){try{products[i][k]=JSON.parse(el.value||(k==='specs'?'{}':'[]'))}catch(_){products[i][k]=products[i][k]||('specs'===k?{}:[])}}
   else if(k==='image'&&el.value==='[Foto tersimpan]'){}
   else if(k==='images'||k==='sourceSignalsText'){}
   else products[i][k]=el.value;
 });
}
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
 const moneyToNumber=(v)=>{if(!v)return '';let x=String(v).replace(/Rp\.?\s*/ig,'').replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!x)return '';if(x.includes('.')&&x.includes(','))x=x.replace(/\./g,'').replace(',','.');else if(x.includes('.')&&/\.\d{3}$/.test(x))x=x.replace(/\./g,'');else if(x.includes(',')&&/,\d{3}$/.test(x))x=x.replace(/,/g,'');else x=x.replace(/,/g,'.');const n=Number(x);return Number.isFinite(n)?Math.round(n):''};
 const priceMatches=[...raw.matchAll(/Rp\.?\s*([0-9][0-9.\s]*(?:,[0-9]+)?)/ig)].map(m=>moneyToNumber(m[1])).filter(Boolean);
 const uniquePrices=[...new Set(priceMatches)];
 const ratingM=raw.match(/(?:rating|penilaian|star|bintang)\s*[:\-]?\s*([0-5](?:[.,][0-9])?)/i) || raw.match(/\b([0-5][.,][0-9])\s*(?:\/\s*5|★|stars?)\b/i);
 const reviewsM=raw.match(/(?:ulasan|review|reviews)\s*[:\-]?\s*([0-9][0-9.,]*)/i) || raw.match(/([0-9][0-9.,]*)[ \t]*(?:ulasan|review|reviews)/i);
 const soldM=raw.match(/(?:terjual|sold|produk terjual)\s*[:\-]?\s*([0-9][0-9.,]*)/i) || raw.match(/([0-9][0-9.,]*)[ \t]*(?:terjual|sold|produk terjual)/i);
 const shopM=raw.match(/(?:toko|shop|seller|penjual)\s*[:\-]?\s*([^\n|]{2,80})/i);
 const shopCandidates=lines.filter(x=>/\b(?:official|official\s*store|store|shop|boutique|fashion|collection|seller|penjual)\b/i.test(x)&&x.length>=3&&x.length<=100);
 const cleanShop=(v)=>{const x=String(v||'').replace(/^[|:：\-\s]+|[|:：\-\s]+$/g,'').trim();if(!x||x.length<3||/^(?:in|on|of|the|official|store|shop|seller|penjual)$/i.test(x))return '';return x};
 const detectedShop=cleanShop(shopM?shopM[1]:'')||cleanShop(shopCandidates[0]||'');
 const productIdM=raw.match(/(?:produk|product)\s*(?:id|kode)\s*[:#\-]?\s*([A-Za-z0-9_-]{4,})/i);
 const price=uniquePrices.length?uniquePrices[0]:'';
 const oldCandidates=uniquePrices.filter(n=>n!==price);
 const oldPrice=oldCandidates.length?Math.max(...oldCandidates):'';
 const bad=/^(rp|harga|terjual|rating|ulasan|review|toko|shop|bagikan|beli|checkout|gratis|voucher|diskon|home|beranda|detail|spesifikasi|deskripsi|produk|shopee|follow|chat|online|varian|warna|ukuran|pilih|opsi|jumlah|komentar|penilaian|informasi|keterangan|penjualan|pengiriman)\b/i;
 const titleCandidates=[];
 for(let idx=0;idx<lines.length;idx++){
   let clean=lines[idx].replace(/^[•·|>]+\s*/,'').trim();
   clean=clean.replace(/^(?:nama\s*produk|nama|judul\s*produk)\s*[:：-]\s*/i,'').trim();
   // OCR Shopee sering menempelkan label variasi pada baris judul. Buang labelnya,
   // tetapi jangan membuang kata warna/model yang memang bisa menjadi bagian nama produk.
   clean=clean.replace(/^(?:variasi|variant)\s*[:：-]\s*/i,'').trim();
   if(clean.length<8||clean.length>180||bad.test(clean)) continue;
   if(/https?:\/\//i.test(clean)||/Rp\.?\s*\d/i.test(clean)||/\d+%/.test(clean)) continue;
   if(/^(?:[0-9\s.,]+|[A-Z0-9_-]{1,12})$/.test(clean)) continue;
   if(/^(?:warna|ukuran|size|pilih|opsi)\s*[:：]/i.test(clean)) continue;
   const isVariationLine=/^(?:ld|lingkar dada|panjang|lebar|tinggi|size|ukuran|warna)\b\s*[:：-]/i.test(clean);
   const looksLikeTitle=/\b(?:baju|gamis|dress|kemeja|blouse|tunik|kaos|hijab|jilbab|mukena|celana|rok|sepatu|sandal|tas|jaket|outer|cardigan|set|pakaian|busana|polka|motif)\b/i.test(clean);
   const score=(clean.split(/\s+/).length>=3?3:0)+(clean.length>=18?2:0)+(looksLikeTitle?4:0)+(isVariationLine?-8:0)+(idx<Math.max(2,Math.ceil(lines.length*.45))?2:0);
   titleCandidates.push({text:clean,score,idx});
 }
 titleCandidates.sort((a,b)=>b.score-a.score||a.idx-b.idx||b.text.length-a.text.length);
 let name=titleCandidates[0]?.text||'';
 // Hindari kandidat yang sebenarnya hanya detail variasi/ukuran.
 if(/^(?:ld|lingkar dada|panjang|lebar|tinggi|size|ukuran|warna)\b/i.test(name)) name='';
 let brand='';
 const brandM=raw.match(/(?:brand|merek)\s*[:\-]\s*([^\n|]{2,60})/i); if(brandM)brand=brandM[1].trim();
 let category='';
 const catM=raw.match(/(?:kategori|category)\s*[:\-]\s*([^\n|]{2,60})/i); if(catM)category=catM[1].trim();
 let rating=ratingM?String(ratingM[1]).replace(',','.') : '';
 let reviews=reviewsM?moneyToNumber(reviewsM[1]):'';
 let unitsSold=soldM?moneyToNumber(soldM[1]):'';
 return {name,brand,category,price,oldPrice,rating,reviews,unitsSold,shopName:detectedShop,productUrl:(raw.match(/https?:\/\/[^\s]+/i)||[])[0]||'',productId:productIdM?productIdM[1]:'',ocrText:raw, evidence:[], _lines:lines};
}
async function runLocalScreenshotOCR(img){
 if(!window.Tesseract)throw new Error('OCR lokal belum termuat. Periksa koneksi internet lalu buka ulang halaman admin.');
 setStatus('OCR lokal sedang membaca screenshot dengan beberapa pembacaan...');
 const makeVariant=(src,mode)=>new Promise((resolve)=>{const im=new Image();im.onload=()=>{const scale=mode==='sharp'?Math.min(2.5,1800/Math.max(im.width,im.height)):Math.min(1.8,1500/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));const x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);if(mode==='sharp'){const id=x.getImageData(0,0,c.width,c.height),d=id.data;for(let i=0;i<d.length;i+=4){const y=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);const v=Math.max(0,Math.min(255,(y-128)*1.55+128));d[i]=d[i+1]=d[i+2]=v;}x.putImageData(id,0,0);}resolve(c.toDataURL('image/jpeg',.88));};im.onerror=()=>resolve(src);im.src=src});
 const variants=[img,await makeVariant(img,'sharp')];let texts=[];
 for(let i=0;i<variants.length;i++){try{const result=await Tesseract.recognize(variants[i],'eng',{logger:m=>{if(m&&m.status&&typeof m.progress==='number'){const pct=Math.round(((i+m.progress)/variants.length)*100);if(pct>=0&&pct<=100)$('#status').textContent=`OCR lokal: ${m.status} ${pct}%`;}}});texts.push(result?.data?.text||'');}catch(_){} }
 const parsed=texts.map(parseOcrProductText);
 const pick=(k)=>{for(const d of parsed){if(d&&String(d[k]??'').trim())return d[k];}return ''};
 const out={...parsed[0],name:pick('name'),brand:pick('brand'),category:pick('category'),price:pick('price'),oldPrice:pick('oldPrice'),rating:pick('rating'),reviews:pick('reviews'),unitsSold:pick('unitsSold'),shopName:pick('shopName'),productUrl:pick('productUrl'),productId:pick('productId'),ocrText:texts.filter(Boolean).join('\n\n--- OCR PASS ---\n')};
 const corroborating=Boolean(out.price||out.shopName||out.rating||out.reviews||out.unitsSold||out.productUrl||out.brand||out.category);
 const hasIdentity=Boolean(out.name&&corroborating);
 out.sourceVerified=hasIdentity;out.verificationLevel=hasIdentity?'screenshot-ocr-pending-confirmation':'unverified';out.dataSource='OCR lokal multi-pass dari screenshot';out.sourceMethod='browser-ocr-multipass';out.checkedAt=new Date().toISOString();
 out.verificationNote=hasIdentity?'OCR multi-pass menemukan nama produk dan data pendukung. Periksa hasil sebelum konfirmasi.':'OCR belum cukup membaca screenshot. Gunakan screenshot asli halaman Shopee dengan resolusi tinggi dan klik Verifikasi lagi.';
 return out;
}
function renderOcrReview(c){
 const field=(k,label,type='text',step='')=>`<label class="ocr-edit-field">${label}<input data-ocr-edit="${k}" type="${type}" ${step?`step="${step}"`:''} value="${esc(c[k]??'')}"></label>`;
 const verified=Boolean(c.sourceVerified);
 const editable=`<div class="ocr-edit-grid">
   ${field('name','Nama Produk')}${field('brand','Brand')}${field('category','Kategori')}
   ${field('price','Harga','number')}${field('oldPrice','Harga Lama','number')}${field('rating','Rating','number','0.1')}
   ${field('reviews','Ulasan','number')}${field('unitsSold','Terjual','number')}${field('shopName','Toko')}${field('stock','Stok')}
 </div><label class="ocr-spec-field">Spesifikasi yang terlihat<textarea data-ocr-edit="specsText">${esc(JSON.stringify(c.specs||{},null,2))}</textarea></label>`;
 const action=verified&&!c.confirmedByUser?'<button id="confirmOcr" class="primary">✅ Simpan & Konfirmasi Data</button>':'';
 $('#marketplaceStatus').innerHTML=`<div class="marketplace-badge ${verified?'verified':'unverified'}">${verified?(c.confirmedByUser?'✓ Data screenshot dikonfirmasi pengguna':'⚠ Hasil OCR lokal — periksa & koreksi sebelum konfirmasi'):'⚠ OCR belum menemukan bukti yang cukup'}</div>${editable}<p class="note">Periksa terutama <b>Nama Produk, Harga, dan Toko</b>. OCR lokal sekarang membaca screenshot lebih dari sekali; jika masih kosong, klik <b>Verifikasi dari Screenshot</b> lagi dengan screenshot asli/resolusi tinggi. Data yang kamu konfirmasi akan dikunci sebagai sumber fakta dan AI tidak boleh mengganti nama, kategori, brand, harga, rating, toko, atau jumlah terjual.</p>${action}`;
 document.querySelectorAll('[data-ocr-edit]').forEach(el=>el.oninput=()=>{const k=el.dataset.ocrEdit;if(k==='specsText'){try{c.specs=JSON.parse(el.value||'{}')}catch(_){c.specs=c.specs||{}}}else c[k]=el.value;});
 const btn=$('#confirmOcr'); if(btn)btn.onclick=()=>{
   const cleanNumber=(k)=>{if(c[k]===''||c[k]===null||c[k]===undefined)return '';const n=Number(c[k]);return Number.isFinite(n)?n:''};
   c.name=String(c.name||'').trim(); c.brand=String(c.brand||'').trim(); c.category=String(c.category||'').trim(); c.shopName=String(c.shopName||'').trim(); c.stock=String(c.stock||'').trim();
   c.price=cleanNumber('price');c.oldPrice=cleanNumber('oldPrice');c.rating=cleanNumber('rating');c.reviews=cleanNumber('reviews');c.unitsSold=cleanNumber('unitsSold');
   if(!c.name)return setStatus('Nama Produk wajib diisi sebelum konfirmasi.',false);
   if(!c.category)c.category='Tidak tercantum pada sumber yang diverifikasi.';
   if(!c.brand)c.brand='Tidak tercantum pada sumber yang diverifikasi.';
   if(!c.shopName)c.shopName='Tidak tercantum pada sumber yang diverifikasi.';
   if(!c.stock)c.stock='Tidak tercantum pada sumber yang diverifikasi.';
   if(!c.specs||typeof c.specs!=='object')c.specs={};
   window.__verifiedScreenshot={...c,sourceVerified:true,verificationLevel:'screenshot-ocr-verified',verificationNote:'Dikonfirmasi pengguna setelah pemeriksaan dan koreksi hasil OCR.',confirmedByUser:true};
   persistVerifiedScreenshot(window.__verifiedScreenshot);
   setStatus('Data screenshot dikonfirmasi. Data fakta yang sudah kamu koreksi akan dikunci saat membuat konten.',true);
   renderOcrReview(window.__verifiedScreenshot);
 };
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
 if(verifiedShot&&!verifiedShot.sourceVerified)return setStatus('Hasil OCR belum dikonfirmasi. Periksa Nama Produk lalu klik Simpan & Konfirmasi Data.',false);
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
  const detailLink=d.detailLink||d.productUrl||d.finalUrl||affiliateUrl||'';
  const productId=d.productId||'';
  let product={name:d.name||'Produk belum teridentifikasi',slug:d.slug||d.name,category:d.category||'Belum ditentukan',brand:d.brand||'',price:d.price||'',oldPrice:d.oldPrice||'',rating:d.rating||'',reviews:d.reviews||'',summary:d.summary||'',pros:d.pros||[],cons:d.cons||[],specs:d.specs||{},affiliateUrl:affiliateUrl,image:image||d.image||'',images:gallery,videoUrl,active:true,tag:'Pilihan Populer',shopName:d.shopName||'',commissionRate:d.commissionRate??'',commissionAmount:d.commissionAmount||'',unitsSold:d.unitsSold??'',stock:d.stock??'',priceMin:d.priceMin||'',priceMax:d.priceMax||'',oldPriceMin:d.oldPriceMin||'',oldPriceMax:d.oldPriceMax||'',marketplace:d.source||'',productId,detailLink,dataSource:d.dataSource||'',sourceVerified:Boolean(d.sourceVerified),verificationRequired:true,sourceFactLock:Boolean(verifiedShot?.confirmedByUser),sourceMethod:d.sourceMethod||'',sourceCheckedAt:d.checkedAt||'',finalUrl:d.finalUrl||detailLink,sourceSignals,redirectChain:d.redirectChain||[]};
  const sourceIsVerified=Boolean(d.sourceVerified) || ['official-api','live-page','screenshot-verified','screenshot-ocr-verified'].includes(String(d.verificationLevel||''));
  const sourceLabel=(d.confirmedByUser||d.sourceFactLock||d.verificationLevel==='screenshot-ocr-verified'||d.verificationLevel==='screenshot-verified')?'✓ Data screenshot dikonfirmasi pengguna':(d.verificationLevel==='official-api'?'✓ Data terverifikasi via API resmi':d.verificationLevel==='live-page'?'✓ Data dibaca dari halaman sumber saat ini':sourceIsVerified?'✓ Data diverifikasi dari screenshot':'⚠ Data belum terverifikasi');
  $('#marketplaceStatus').innerHTML=`<div class="marketplace-badge ${sourceIsVerified?'verified':'unverified'}">${sourceLabel} · ${esc(d.dataSource||'Sumber halaman')} · diperiksa ${esc(d.checkedAt||'-')}</div><div class="source-detect"><b>🔎 Asal link:</b> ${esc(sourceSignals.source||d.source||'Tidak diketahui')} ${sourceSignals.initialHost&&sourceSignals.finalHost?`<span>(${esc(sourceSignals.initialHost)} → ${esc(sourceSignals.finalHost)})</span>`:''}<br><b>Jalur:</b> ${sourceSignals.redirects?.length?sourceSignals.redirects.map(x=>esc(x.from)+' → '+esc(x.to)).join(' → '):'langsung / tidak ada redirect HTTP'}<br><small>${esc(sourceSignals.note||'Server tidak akan mengarang fakta marketplace.')}</small></div><div class="marketplace-grid"><span>Harga: <b>${d.price?('Rp '+Number(d.price).toLocaleString('id-ID')):'tidak tersedia'}</b></span><span>Toko: <b>${esc(d.shopName||'-')}</b></span><span>Komisi: <b>${d.commissionRate!==''?esc(d.commissionRate)+'%':'-'}</b></span><span>Terjual: <b>${d.unitsSold!==''&&d.unitsSold!==undefined?Number(d.unitsSold).toLocaleString('id-ID'):'-'}</b></span><span>Rating: <b>${d.rating||'-'}</b></span><span>Ulasan: <b>${d.reviews?Number(d.reviews).toLocaleString('id-ID'):'-'}</b></span></div>${d.notice?`<p class="note">${esc(d.notice)}</p>`:''}`;
  if(!product.sourceVerified)return setStatus('Data produk belum terverifikasi. Unggah screenshot halaman produk, jalankan verifikasi, lalu konfirmasi hasil OCR/AI sebelum membuat konten.',false);
  setStatus('AI hanya digunakan untuk konten teks. Data fakta marketplace dipertahankan dari sumber verifikasi...');
  const ai=await fetch('/api/ai-product-content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:{...product,sourceDescription:d.summary||'',sourceHost:d.source||'',imageUrl:d.image||'',imageData:image},generateImages:false,imageCount:0})});
  const ad=await ai.json(); if(!ai.ok)throw Error(ad.error||'Gagal membuat konten');
  const c=ad.content||{};
  product={...product,...c,affiliateUrl:product.affiliateUrl,image:product.image,images:gallery,name:product.sourceVerified?product.name:(c.name||product.name),brand:product.sourceVerified?product.brand:(c.brand||product.brand),category:product.sourceVerified?product.category:(c.category||product.category),price:product.price,oldPrice:product.oldPrice,rating:product.rating,reviews:product.reviews,shopName:product.shopName,commissionRate:product.commissionRate,commissionAmount:product.commissionAmount,unitsSold:product.unitsSold,stock:product.stock,priceMin:product.priceMin,priceMax:product.priceMax,oldPriceMin:product.oldPriceMin,oldPriceMax:product.oldPriceMax,marketplace:product.marketplace,dataSource:product.dataSource,sourceVerified:product.sourceVerified,sourceFactLock:product.sourceFactLock,sourceMethod:product.sourceMethod,sourceCheckedAt:product.sourceCheckedAt,finalUrl:product.finalUrl,sourceSignals:product.sourceSignals,redirectChain:product.redirectChain,specs:product.sourceFactLock?product.specs:(c.specs||product.specs),seoTitle:c.seoTitle||product.seoTitle,metaDescription:c.metaDescription||product.metaDescription,caption:c.caption||product.caption,faq:c.faq||product.faq,pros:c.pros||product.pros,cons:c.cons||product.cons,summary:c.summary||product.summary};
  products.unshift(product); $('#imagePreview').innerHTML=gallery.map((src,i)=>`<img src="${src}" alt="Foto produk ${i+1}">`).join(''); $('#aiImagePreview').innerHTML=`<div class="ai-preview-title">📸 ${gallery.length} foto tersimpan sementara</div><div class="ai-preview-grid">${gallery.map((src,i)=>`<img src="${src}" alt="Foto produk ${i+1}">`).join('')}</div>`;
  let msg=(d.sourceVerified?'Data produk berhasil diverifikasi. ':'Data produk belum terverifikasi penuh. ')+`${gallery.length} foto tersimpan. `; if(ad.imageNotice)msg+=ad.imageNotice+' '; msg+='Periksa lalu klik Simpan & Publish.'; setStatus(msg,true); render(); window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
 }catch(e){setStatus('Gagal membuat produk otomatis: '+e.message,false)}
};
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.name.toLowerCase().endsWith('.xlsx')){if(!window.XLSX)throw Error('Parser Excel belum tersedia.');const data=await f.arrayBuffer();const wb=XLSX.read(data,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];products=XLSX.utils.sheet_to_json(ws,{defval:''}).map(x=>({...x,active:x.active!==false&&String(x.active).toLowerCase()!=='false'}));}else{const t=await f.text();products=f.name.toLowerCase().endsWith('.json')?JSON.parse(t):parseCSV(t)}setStatus(`Import preview: ${products.length} produk. Periksa lalu klik Simpan & Publish.`);render()}catch(err){setStatus('Import gagal: '+err.message,false)}};
$('#publish').onclick=async()=>{
  const btn=$('#publish');
  if(btn.disabled)return;
  if(!token)token='session';
  if(!products.length)return setStatus('Katalog kosong.',false);
  try{
    const blocked=products.filter(p=>{
      const factKeys=['name','slug','category','brand','price','oldPrice','rating','reviews','unitsSold','shopName','stock','commissionRate','commissionAmount','priceMin','priceMax','oldPriceMin','oldPriceMax','marketplace','affiliateUrl','image','dataSource','sourceMethod','sourceCheckedAt'];
      const factsOk=factKeys.every(k=>String(p[k]??'').trim()!=='');
      const contentOk=String(p.summary||'').trim()&&String(p.seoTitle||'').trim()&&String(p.metaDescription||'').trim()&&String(p.caption||'').trim()&&Array.isArray(p.pros)&&p.pros.length&&Array.isArray(p.cons)&&p.cons.length&&Array.isArray(p.faq)&&p.faq.length&&p.specs&&Object.keys(p.specs).length;
      return !factsOk||!String(p.name||'').trim()||!String(p.category||'').trim()||String(p.category).toLowerCase()==='belum ditentukan'||String(p.name).toLowerCase()==='produk belum teridentifikasi'||!contentOk||(p.verificationRequired===true&&p.sourceVerified!==true);
    });
    if(blocked.length){
      const names=blocked.slice(0,3).map(p=>p.name||'Produk tanpa nama').join(', ');
      return setStatus(`Tidak bisa publish: ${blocked.length} produk masih belum lengkap. Contoh: ${names}. Periksa kartu produk yang bertanda ⚠.`,false);
    }
    btn.disabled=true;const oldText=btn.textContent;btn.textContent='⏳ Menyimpan...';setStatus('Menyimpan & Publish ke server…');
    const r=await fetch('/api/admin-products',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({products})});
    let d={};try{d=await r.json()}catch(_){d={error:`Server mengembalikan HTTP ${r.status}`}};
    if(!r.ok)throw Error(d.error||`Gagal menyimpan (HTTP ${r.status})`);
    setStatus(`✓ Berhasil dipublish: ${d.products} produk (${d.active} aktif). Commit: ${d.commit||'-'}.`,true);
  }catch(e){setStatus(`✕ Publish gagal: ${e.message}`,false)}finally{btn.disabled=false;btn.textContent=oldText||'Simpan & Publish'}
};

(async()=>{try{const r=await fetch('/api/admin-products',{credentials:'same-origin'});if(r.ok)showAdmin();else showLogin()}catch(_){showLogin()}})();
