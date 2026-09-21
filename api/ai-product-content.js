const { adminAuth } = require('../security');

function auth(req){return adminAuth(req)}
function parseBody(req){let b=req.body||{};if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}return b}
function extractText(d){if(d&&typeof d.output_text==='string'&&d.output_text.trim())return d.output_text.trim();const out=Array.isArray(d?.output)?d.output:[];for(const item of out){for(const c of (item.content||[])){if(typeof c.text==='string'&&c.text.trim())return c.text.trim()}}return ''}
function cleanJsonText(t){return String(t||'').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim()}
function safeSlug(v){return String(v||'produk').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'produk'}
function fallback(p){const name=p.name||'Produk baru',cat=p.category||'Workspace',brand=p.brand||'';const desc=p.sourceDescription||p.summary||`Informasi ${name} untuk membantu membandingkan fitur, spesifikasi, harga, dan kecocokannya.`;return {summary:desc,pros:[`Data produk dirangkum dari informasi yang tersedia`,`Dapat dibandingkan dengan produk sejenis`,`Relevan untuk kategori ${cat}`],cons:['Harga dan ketersediaan dapat berubah di toko','Periksa spesifikasi dan varian pada halaman sumber sebelum membeli'],specs:Object.assign({Kategori:cat},p.specs||{}),faq:[{q:`Apa yang perlu diperhatikan sebelum membeli ${name}?`,a:'Periksa varian, kompatibilitas, spesifikasi, harga, garansi, ongkir, dan kebijakan retur pada halaman toko.'},{q:`Apakah ${name} cocok untuk kerja?`,a:`Kecocokan bergantung pada kebutuhan dan spesifikasi yang tersedia. Gunakan data produk sebagai dasar perbandingan.`}],seoTitle:`${name} — Review, Spesifikasi & Cek Harga | Faeyza Store`,metaDescription:`Lihat informasi ${name}${brand?` dari ${brand}`:''}, spesifikasi, kelebihan, pertimbangan, dan cek harga di Faeyza Store.`,caption:`${name} — cek review, spesifikasi, dan harga terbaru di Faeyza Store.`}}
function dataUrlParts(dataUrl){const m=String(dataUrl||'').match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);return m?{mime:m[1],base64:m[2]}:null}
async function generatePoseImage(imageData,prompt){
  const src=dataUrlParts(imageData);if(!src)throw new Error('Foto referensi harus berupa data URL gambar.');
  const form=new FormData();
  form.append('model',process.env.OPENAI_IMAGE_MODEL||'gpt-image-2.5-sunburst');
  form.append('image',new Blob([Buffer.from(src.base64,'base64')],{type:src.mime}),'reference.jpg');
  form.append('prompt',prompt);
  form.append('size','1024x1536');
  form.append('quality',process.env.OPENAI_IMAGE_QUALITY||'low');
  form.append('output_format','webp');
  form.append('output_compression','60');
  const r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
  const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||`OpenAI Image HTTP ${r.status}`);
  const b64=d?.data?.[0]?.b64_json;if(!b64)throw new Error('OpenAI tidak mengembalikan gambar.');
  return `data:image/webp;base64,${b64}`;
}
async function generateProductImages(p,count){
  const imageData=p.imageData||p.image||'';if(!dataUrlParts(imageData))return {images:[],notice:'Foto referensi tidak tersedia dalam format yang dapat dikirim ke generator gambar.'};
  const name=p.name||'produk';
  const common=`Buat foto produk fashion/e-commerce yang fotorealistik menggunakan foto referensi sebagai identitas visual utama. Pertahankan orang yang sama: wajah dan ciri wajah, warna dan model rambut, warna kulit, bentuk tubuh yang terlihat, pakaian yang sama persis, warna pakaian, motif, bahan yang tampak, aksesori, dan produk yang sedang dipakai/diperagakan. Jangan mengganti pakaian, wajah, jenis produk, warna, logo, atau detail produk. Hanya ubah pose, sudut kamera, dan komposisi secara wajar. Jangan menambahkan orang lain. Jangan membuat wajah baru atau orang baru. Hasil harus terlihat seperti pemotretan ulang oleh fotografer yang sama, bukan karakter berbeda. Produk: ${name}.`;
  const poses=[
    `${common} Pose 1: berdiri natural menghadap kamera dengan sudut tubuh sedikit 3/4, kedua tangan santai, full body, pencahayaan lembut, latar sederhana.`,
    `${common} Pose 2: berdiri dengan satu kaki sedikit maju dan tubuh 3/4 ke samping, satu tangan menyentuh pakaian/produk secara natural, full body, pencahayaan lembut, latar sederhana.`,
    `${common} Pose 3: pose santai berbeda dari dua pose sebelumnya, sedikit duduk/bersandar secara natural sambil tetap menampilkan pakaian/produk dengan jelas, full body, pencahayaan lembut, latar sederhana.`
  ];
  const wanted=Math.max(3,Math.min(5,Number(count)||3));
  const prompts=poses.concat([
    `${common} Pose 4: berjalan pelan secara natural, sudut kamera sedikit menyamping, pakaian dan produk tetap terlihat jelas, full body, latar sederhana.`,
    `${common} Pose 5: berdiri santai dengan satu tangan di pinggang dan sudut kamera berbeda, full body, latar sederhana.`
  ]).slice(0,wanted);
  const results=await Promise.allSettled(prompts.map(x=>generatePoseImage(imageData,x)));
  const images=results.filter(x=>x.status==='fulfilled').map(x=>x.value);
  const failed=results.filter(x=>x.status==='rejected');
  return {images,notice:failed.length?`${images.length} foto AI berhasil dibuat; ${failed.length} foto gagal dibuat.`:''};
}
module.exports=async function(req,res){
  if(!auth(req))return res.status(401).json({ok:false,error:'Unauthorized'});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  const b=parseBody(req);const p=b.product||{};
  if(!p.name&&!p.sourceDescription&&!p.affiliateUrl)return res.status(400).json({ok:false,error:'Data produk belum cukup.'});
  if(!process.env.OPENAI_API_KEY){return res.status(200).json({ok:true,provider:'template',fallback:true,content:fallback(p),images:[],notice:'OPENAI_API_KEY belum dipasang. Konten dibuat dengan template aman; tambahkan OPENAI_API_KEY di Vercel untuk generasi AI.'})}
  const model=process.env.OPENAI_MODEL||'gpt-5.6-luna';
  const input={name:p.name||'',brand:p.brand||'',category:p.category||'',price:p.price||'',sourceDescription:p.sourceDescription||p.summary||'',sourceSpecs:p.specs||{},sourceUrl:p.affiliateUrl||'',sourceHost:p.sourceHost||'',sourceImageUrl:p.imageUrl||''};
  const prompt=`Kamu adalah editor katalog Faeyza Store berbahasa Indonesia. Buat DRAFT konten produk berdasarkan DATA, foto referensi, dan halaman/link produk. Gunakan web search untuk mencari halaman produk yang tepat dari URL yang diberikan bila perlu. Prioritaskan halaman produk yang sama, bukan produk serupa. Jika informasi harga, varian, bahan, ukuran, fitur, rating, atau spesifikasi tidak ditemukan dengan cukup yakin, jangan mengarang; gunakan bahasa "periksa di halaman toko". Foto hanya dipakai untuk membantu mengenali kategori/produk dan konteks visual, bukan untuk menebak fakta teknis. Jangan menambahkan klaim yang tidak didukung.

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
    return res.status(200).json({ok:true,provider:'openai',model,content,images:imageResult.images,imageNotice:imageResult.notice||'',imageModel:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2.5-sunburst'});
  }catch(e){
    return res.status(200).json({ok:true,provider:'template',fallback:true,content:fallback(p),images:[],notice:`AI gagal digunakan: ${e.message}. Draft template aman dibuat sebagai fallback.`});
  }
};
module.exports.config={maxDuration:60};
