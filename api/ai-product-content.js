const { adminAuth } = require('../security');

function auth(req){return adminAuth(req)}
function parseBody(req){let b=req.body||{};if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}return b}
function extractText(d){if(d&&typeof d.output_text==='string'&&d.output_text.trim())return d.output_text.trim();const out=Array.isArray(d?.output)?d.output:[];for(const item of out){for(const c of (item.content||[])){if(typeof c.text==='string'&&c.text.trim())return c.text.trim()}}return ''}
function cleanJsonText(t){return String(t||'').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim()}
function safeSlug(v){return String(v||'produk').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'produk'}
function fallback(p){const name=p.name||'Produk baru',cat=p.category||'Belum ditentukan',brand=p.brand||'';const desc=p.sourceDescription||p.summary||`Informasi ${name} untuk membantu membandingkan fitur, spesifikasi, harga, dan kecocokannya.`;return {summary:desc,pros:[`Data produk dirangkum dari informasi yang tersedia`,`Dapat dibandingkan dengan produk sejenis`,`Relevan untuk kategori ${cat}`],cons:['Harga dan ketersediaan dapat berubah di toko','Periksa spesifikasi dan varian pada halaman sumber sebelum membeli'],specs:Object.assign({Kategori:cat},p.specs||{}),faq:[{q:`Apa yang perlu diperhatikan sebelum membeli ${name}?`,a:'Periksa varian, kompatibilitas, spesifikasi, harga, garansi, ongkir, dan kebijakan retur pada halaman toko.'},{q:`Apakah ${name} cocok untuk kerja?`,a:`Kecocokan bergantung pada kebutuhan dan spesifikasi yang tersedia. Gunakan data produk sebagai dasar perbandingan.`}],seoTitle:`${name} — Review, Spesifikasi & Cek Harga | Faeyza Store`,metaDescription:`Lihat informasi ${name}${brand?` dari ${brand}`:''}, spesifikasi, kelebihan, pertimbangan, dan cek harga di Faeyza Store.`,caption:`${name} — cek review, spesifikasi, dan harga terbaru di Faeyza Store.`}}
function dataUrlParts(dataUrl){const m=String(dataUrl||'').match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);return m?{mime:m[1],base64:m[2]}:null}
async function requestImageEdit(imageData,prompt,model,n=1){
  const src=dataUrlParts(imageData);if(!src)throw new Error('Foto referensi harus berupa data URL gambar.');
  const makeForm=(field)=>{
    const form=new FormData();
    form.append('model',model);
    form.append(field,new Blob([Buffer.from(src.base64,'base64')],{type:src.mime}),'reference.jpg');
    form.append('prompt',prompt);
    form.append('size','1024x1536');
    form.append('quality',process.env.OPENAI_IMAGE_QUALITY||'low');
    form.append('output_format','webp');
    form.append('output_compression','60');
    form.append('n',String(n));
    return form;
  };
  let r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:makeForm('image[]')});
  let d=await r.json().catch(()=>({}));
  if(!r.ok && /image\[\]/i.test(String(d?.error?.message||''))){
    r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:makeForm('image')});
    d=await r.json().catch(()=>({}));
  }
  if(!r.ok)throw new Error(d?.error?.message||`OpenAI Image HTTP ${r.status}`);
  const images=(Array.isArray(d?.data)?d.data:[]).map(x=>x?.b64_json).filter(Boolean).map(b64=>`data:image/webp;base64,${b64}`);
  if(!images.length)throw new Error('OpenAI tidak mengembalikan gambar.');
  return images;
}
async function generatePoseImages(imageData,prompt,count){
  const wanted=Math.max(3,Math.min(5,Number(count)||3));
  const model=process.env.OPENAI_IMAGE_MODEL||'gpt-image-2';
  try{
    const batch=await requestImageEdit(imageData,prompt,model,wanted);
    if(batch.length>=wanted)return batch.slice(0,wanted);
  }catch(batchError){
    // Some API gateways/accounts accept image editing but are less reliable with n>1.
    // Retry one image per request so 3–5 requested outputs can still be collected.
  }
  const jobs=Array.from({length:wanted},(_,i)=>requestImageEdit(imageData,`${prompt} Variasi pose ke-${i+1}: gunakan pose dan sudut kamera yang berbeda dari variasi lain.`,model,1));
  const settled=await Promise.allSettled(jobs);
  const images=settled.filter(x=>x.status==='fulfilled').flatMap(x=>x.value||[]).slice(0,wanted);
  if(!images.length){
    const errors=settled.filter(x=>x.status==='rejected').map(x=>x.reason?.message).filter(Boolean);
    throw new Error(errors[0]||'OpenAI tidak mengembalikan gambar.');
  }
  return images;
}
async function generateProductImages(p,count){
  const imageData=p.imageData||p.image||'';if(!dataUrlParts(imageData))return {images:[],notice:'Foto referensi tidak tersedia dalam format yang dapat dikirim ke generator gambar.'};
  const wanted=Math.max(3,Math.min(5,Number(count)||3));
  const name=p.name||'produk';
  const prompt=`Buat ${wanted} foto produk fashion/e-commerce yang fotorealistik menggunakan foto referensi sebagai identitas visual utama. Pertahankan orang yang sama pada semua hasil: wajah dan ciri wajah, warna dan model rambut, warna kulit, bentuk tubuh yang terlihat, pakaian yang sama persis, warna pakaian, motif, bahan yang tampak, aksesori, dan produk yang sedang dipakai/diperagakan. Jangan mengganti pakaian, wajah, jenis produk, warna, logo, atau detail produk. Jangan menambahkan orang lain. Setiap hasil HARUS memakai pose dan sudut kamera yang berbeda, tetapi tetap merupakan orang dan produk yang sama. Buat variasi: berdiri menghadap kamera, pose 3/4, pose santai sedikit bersandar/duduk, berjalan natural, dan satu pose tangan di pinggang; gunakan sebanyak ${wanted} variasi pertama. Full body bila memungkinkan, pencahayaan lembut, latar sederhana, gaya foto katalog marketplace. Produk: ${name}.`;
  try{
    const images=await generatePoseImages(imageData,prompt,wanted);
    const failed=wanted-images.length;
    return {images,notice:failed>0?`${images.length} foto AI berhasil dibuat; ${failed} foto gagal dibuat.`:`${images.length} foto AI berhasil dibuat.`};
  }catch(e){
    return {images:[],notice:`0 foto AI berhasil dibuat; ${wanted} foto gagal dibuat. ${e.message}`};
  }
}
module.exports=async function(req,res){
  if(!auth(req))return res.status(401).json({ok:false,error:'Unauthorized'});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  const b=parseBody(req);const p=b.product||{};
  if(b.mode==='screenshot-verify'){
    if(!p.imageData)return res.status(400).json({ok:false,error:'Screenshot produk belum diberikan.'});
    if(!process.env.OPENAI_API_KEY)return res.status(503).json({ok:false,error:'OPENAI_API_KEY belum dipasang. Verifikasi screenshot membutuhkan AI vision.'});
    const verifyModel=process.env.OPENAI_MODEL||'gpt-5.6-luna';
    const verifyPrompt=`Kamu adalah pemeriksa data katalog e-commerce. Baca screenshot halaman produk yang diberikan. HANYA ambil fakta yang benar-benar terlihat pada screenshot. Jangan menebak, jangan melengkapi dari pengetahuan umum, jangan mencari produk serupa, dan jangan menggunakan nama file gambar sebagai nama produk. Jika suatu data tidak terlihat jelas, kembalikan string kosong.

Ekstrak jika terlihat: nama produk, brand, kategori yang dapat dibaca dari breadcrumb/label, harga sekarang, harga lama/coret, rating, jumlah ulasan, jumlah terjual, nama toko, stok, dan ringkasan spesifikasi yang tertulis. Jika screenshot memperlihatkan URL produk, ekstrak juga productUrl.

Kembalikan HANYA JSON valid: {"name":"","brand":"","category":"","price":"","oldPrice":"","rating":"","reviews":"","unitsSold":"","shopName":"","stock":"","productUrl":"","specs":{},"evidence":[]}.

Setiap item evidence harus berupa deskripsi singkat tentang teks/area yang terlihat, bukan fakta baru.`;
    try{
      const src=dataUrlParts(p.imageData); if(!src)throw new Error('Screenshot harus berupa data URL gambar.');
      const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:verifyModel,input:[{role:'user',content:[{type:'input_text',text:verifyPrompt},{type:'input_image',image_url:p.imageData}]}]})});
      const d=await r.json(); if(!r.ok)throw new Error(d?.error?.message||`OpenAI HTTP ${r.status}`);
      const raw=cleanJsonText(extractText(d)); let out; try{out=JSON.parse(raw)}catch{throw new Error('AI mengembalikan format verifikasi yang tidak valid.');}
      const name=String(out.name||'').trim();
      const corroborating=Boolean(String(out.price||'').trim()||String(out.shopName||'').trim()||String(out.rating||'').trim()||String(out.reviews||'').trim()||String(out.unitsSold||'').trim()||String(out.productUrl||'').trim()||(out.specs&&Object.keys(out.specs).length));
      const hasIdentity=Boolean(name && corroborating);
      if(!hasIdentity) out.verificationNote='Screenshot belum memuat cukup bukti untuk verifikasi identitas produk. Tampilkan nama produk dan minimal satu detail pendukung (mis. harga/toko/rating/spesifikasi).';
      return res.status(200).json({ok:true,provider:'openai-vision',model:verifyModel,sourceVerified:hasIdentity,verificationLevel:hasIdentity?'screenshot-verified':'unverified',dataSource:'Screenshot halaman produk',checkedAt:new Date().toISOString(),content:out});
    }catch(e){return res.status(502).json({ok:false,error:`Verifikasi screenshot gagal: ${e.message}`});}
  }
  if(!p.name&&!p.sourceDescription&&!p.affiliateUrl)return res.status(400).json({ok:false,error:'Data produk belum cukup.'});
  if(!process.env.OPENAI_API_KEY){return res.status(200).json({ok:true,provider:'template',fallback:true,content:fallback(p),images:[],notice:'OPENAI_API_KEY belum dipasang. Konten dibuat dengan template aman; tambahkan OPENAI_API_KEY di Vercel untuk generasi AI.'})}
  const model=process.env.OPENAI_MODEL||'gpt-5.6-luna';
  const input={name:p.name||'',brand:p.brand||'',category:p.category||'',price:p.price||'',sourceDescription:p.sourceDescription||p.summary||'',sourceSpecs:p.specs||{},sourceUrl:p.affiliateUrl||'',sourceHost:p.sourceHost||'',sourceImageUrl:p.imageUrl||'',finalUrl:p.finalUrl||'',sourceSignals:p.sourceSignals||{},redirectChain:p.redirectChain||[]};
  const prompt=`Kamu adalah editor katalog Faeyza Store berbahasa Indonesia. Buat DRAFT konten produk berdasarkan DATA, foto referensi, dan halaman/link produk. LANGKAH PERTAMA: gunakan URL PRODUK yang diberikan sebagai target utama dan cari/buka halaman produk yang sama melalui web search bila data server tidak lengkap. Jika URL adalah short-link/redirect, telusuri tujuan akhirnya sebelum mencari produk. Prioritaskan halaman produk yang sama, bukan produk serupa. Jika menemukan halaman produk yang sama, gunakan nama, brand, kategori, harga, rating, ulasan, toko, jumlah terjual, dan spesifikasi hanya dari halaman tersebut atau data resmi yang jelas terkait halaman tersebut. Gunakan sourceSignals, finalUrl, dan redirectChain sebagai bukti teknis asal/jalur URL, bukan sebagai bukti fakta produk. Sistem dapat mengetahui domain sumber dan redirect HTTP, tetapi tidak boleh mengklaim bahwa link pasti membuka aplikasi Android/iOS karena keputusan itu ditentukan oleh perangkat/browser. Jika informasi harga, varian, bahan, ukuran, fitur, rating, atau spesifikasi tidak ditemukan dengan cukup yakin, jangan mengarang; gunakan bahasa "periksa di halaman toko". Jika kategori/nama produk belum terverifikasi, gunakan foto untuk mengenali jenis produk hanya jika visualnya jelas. Jangan mengarang merek, model, harga, ukuran, bahan, fitur teknis, rating, atau spesifikasi dari foto. Jika tidak cukup jelas, gunakan kategori "Belum ditentukan" dan nama "Produk belum teridentifikasi". Jangan menambahkan klaim yang tidak didukung.

Kembalikan HANYA JSON valid dengan bentuk: {"name":"...","brand":"...","category":"...","price":"","oldPrice":"","summary":"...","pros":["..."],"cons":["..."],"specs":{"kunci":"nilai"},"faq":[{"q":"...","a":"..."}],"seoTitle":"...","metaDescription":"...","caption":"..."}. Maksimal 3 pros, 3 cons, 8 specs, 4 FAQ. Summary 2-3 kalimat. SEO title <= 65 karakter bila memungkinkan. Meta description <= 160 karakter bila memungkinkan. Caption <= 350 karakter. Jika data sumber bertentangan, pilih data dari halaman produk yang paling spesifik dan tetap hati-hati.

DATA:
${JSON.stringify(input)}\n\nURL PRODUK: ${p.affiliateUrl||'(tidak ada)'}`;
  try{
    const contentParts=[{type:'input_text',text:prompt}];
    const img=p.imageData||p.image||'';if(dataUrlParts(img))contentParts.push({type:'input_image',image_url:img});
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,input:[{role:'user',content:contentParts}],tools:[{type:'web_search',search_context_size:'low'}]})});
    const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||`OpenAI HTTP ${r.status}`);
    const raw=cleanJsonText(extractText(d));let content;try{content=JSON.parse(raw)}catch{throw new Error('Respons AI bukan JSON valid.')}
    let imageResult={images:[],notice:''};
    if(b.generateImages!==false){try{imageResult=await generateProductImages(p,Math.max(3,Math.min(5,Number(b.imageCount)||3)))}catch(e){imageResult={images:[],notice:`Foto AI gagal dibuat: ${e.message}`}}}
    return res.status(200).json({ok:true,provider:'openai',model,content,images:imageResult.images,imageNotice:imageResult.notice||'',imageModel:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2'});
  }catch(e){
    return res.status(200).json({ok:true,provider:'template',fallback:true,content:fallback(p),images:[],notice:`AI gagal digunakan: ${e.message}. Draft template aman dibuat sebagai fallback.`});
  }
};
module.exports.config={maxDuration:60};
