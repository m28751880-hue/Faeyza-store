const fs = require('node:fs/promises');
const path = require('node:path');
const { bearer, jsonBody, adminPassword, adminAuth, setAdminSession, clearAdminSession, safeEqual } = require('../security');

function auth(req) { return adminAuth(req); }

function safeSlug(v) {
  return String(v || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function normalizeProduct(p) {
  const name = String(p.name || '').trim();
  const slug = safeSlug(p.slug || name);
  const price = p.price === '' || p.price == null ? '' : Number(p.price);
  const rating = p.rating === '' || p.rating == null ? '' : Number(p.rating);
  const reviews = p.reviews === '' || p.reviews == null ? '' : Number(p.reviews);
  return { ...p, name, slug, price: Number.isFinite(price) ? price : '', rating: Number.isFinite(rating) ? rating : '', reviews: Number.isFinite(reviews) ? reviews : '', active: p.active !== false };
}
async function readProducts() {
  return JSON.parse(await fs.readFile(path.join(process.cwd(),'products.json'),'utf8'));
}
async function githubCommit(products, message) {
  const {GITHUB_TOKEN,GITHUB_OWNER,GITHUB_REPO,GITHUB_BRANCH='main',GITHUB_PRODUCTS_PATH='products.json'} = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) throw new Error('GitHub persistence belum dikonfigurasi. Isi GITHUB_TOKEN, GITHUB_OWNER, dan GITHUB_REPO.');
  const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PRODUCTS_PATH}`;
  const headers = {Authorization:`Bearer ${GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
  const current = await fetch(`${base}?ref=${encodeURIComponent(GITHUB_BRANCH)}`,{headers});
  let sha; if(current.ok) sha=(await current.json()).sha;
  const body={message,content:Buffer.from(JSON.stringify(products,null,2)+'\n').toString('base64'),branch:GITHUB_BRANCH,...(sha?{sha}:{})};
  const r=await fetch(base,{method:'PUT',headers,body:JSON.stringify(body)});
  if(!r.ok) throw new Error(`GitHub commit gagal: ${r.status}`);
  return r.json();
}
module.exports = async function handler(req,res){
  try {
    if(req.method!=='POST' && req.method!=='GET') return res.status(405).json({ok:false,error:'Method not allowed'});
    let body={};
    if(req.method==='POST'){ try { body=jsonBody(req, 4194304); } catch(e) { return res.status(400).json({ok:false,error:e.message}); } }
    if(req.method==='POST' && body.action==='login'){
      const password=adminPassword();
      if(!password || !safeEqual(String(body.password||''),password)) return res.status(401).json({ok:false,error:'Kata sandi admin salah.'});
      setAdminSession(res);
      return res.status(200).json({ok:true,message:'Login admin berhasil.',expiresInHours:12});
    }
    if(req.method==='POST' && body.action==='logout'){ clearAdminSession(res); return res.status(200).json({ok:true}); }
    if(!auth(req)) return res.status(401).json({ok:false,error:'Sesi admin tidak valid atau sudah kedaluwarsa.'});
    if(req.method==='GET') return res.status(200).json({ok:true,products:await readProducts()});
    if(!Array.isArray(body.products)) return res.status(400).json({ok:false,error:'products harus berupa array.'});
    const products=body.products.map(normalizeProduct);
    const seen=new Set();
    for(const p of products){
      if(!p.name || !p.slug) return res.status(400).json({ok:false,error:'Setiap produk wajib memiliki name/slug.'});
      if(p.verificationRequired === true && p.sourceVerified !== true) return res.status(400).json({ok:false,error:`Produk belum terverifikasi: ${p.name||'(tanpa nama)'}. Verifikasi dari screenshot atau sumber resmi sebelum publish.`});
      if(String(p.category||'').trim().toLowerCase()==='workspace' || String(p.name||'').trim().toLowerCase()==='produk belum teridentifikasi' || /^(IMG|DSC|DCIM|WA|Screenshot|Screen Shot|Photo|Foto|Image)[ _-]?\d{3,}/i.test(String(p.name||'').trim())) return res.status(400).json({ok:false,error:`Identitas produk masih berupa fallback: ${p.name||'(tanpa nama)'}.`});
      if(seen.has(p.slug)) return res.status(400).json({ok:false,error:`Slug duplikat: ${p.slug}`});
      seen.add(p.slug);
      if(p.rating!=='' && (p.rating<0 || p.rating>5)) return res.status(400).json({ok:false,error:`Rating tidak valid: ${p.name}`});
      if(p.price!=='' && p.price<0) return res.status(400).json({ok:false,error:`Harga tidak valid: ${p.name}`});
    }
    const result=await githubCommit(products,`chore(catalog): admin update ${new Date().toISOString()}`);
    return res.status(200).json({ok:true,products:products.length,active:products.filter(p=>p.active!==false).length,commit:result.commit?.sha||null});
  } catch(e){ return res.status(500).json({ok:false,error:e.message}); }
};
module.exports.config={maxDuration:30};
