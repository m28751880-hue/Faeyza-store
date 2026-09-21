const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const products=JSON.parse(fs.readFileSync(path.join(root,'products.json'),'utf8'));
const errs=[], warns=[]; const seen=new Set();
const site=JSON.parse(fs.readFileSync(path.join(root,'data','site.json'),'utf8'));
const base=(process.env.SITE_URL||'https://example.com').replace(/\/$/,'');
for(const [i,p] of products.entries()){
  if(!p.name||!p.category||!p.summary) errs.push(`Produk ${i+1}: name/category/summary wajib diisi`);
  if(seen.has(p.slug)) errs.push(`Slug duplikat: ${p.slug}`); seen.add(p.slug);
  if(p.rating!=null && (p.rating<0||p.rating>5)) errs.push(`${p.slug}: rating harus 0–5`);
  if(p.reviews!=null && p.reviews<0) errs.push(`${p.slug}: reviews tidak boleh negatif`);
  if(p.affiliateUrl && /^PASTE_/i.test(p.affiliateUrl)) warns.push(`${p.slug}: affiliateUrl masih placeholder`);
}
const publicDir=path.join(root,'public');
const html=[]; const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const f=path.join(d,e.name);e.isDirectory()?walk(f):e.name.endsWith('.html')&&html.push(f)}); walk(publicDir);
const localRoutes=new Set(['/','/produk/','/artikel/','/perbandingan/','/favorit/','/404.html','/kebijakan/affiliate/']);
for(const p of products)localRoutes.add(`/produk/${p.slug}/`);
for(const c of new Set(products.map(p=>p.category)))localRoutes.add(`/kategori/${String(c).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}/`);
for(const f of html){
  const rel=path.relative(publicDir,f).replaceAll(path.sep,'/');
  const s=fs.readFileSync(f,'utf8');
  const title=(s.match(/<title>([^<]*)<\/title>/i)||[])[1]||'';
  const desc=(s.match(/<meta name="description" content="([^"]*)"/i)||[])[1]||'';
  const canonical=(s.match(/<link rel="canonical" href="([^"]+)"/i)||[])[1]||'';
  const robots=(s.match(/<meta name="robots" content="([^"]+)"/i)||[])[1]||'';
  const isAdmin=rel==='admin/index.html'||rel.startsWith('admin/');
  const isUtility=rel==='favorit/index.html'||rel==='offline.html'||rel==='404.html';
  if(!isAdmin&&!isUtility){
    if(title.length<10||title.length>75) errs.push(`Title panjang/pendek: ${rel} (${title.length})`);
    if(desc.length<50||desc.length>160) errs.push(`Meta description panjang/pendek: ${rel} (${desc.length})`);
    if(!canonical) errs.push(`Canonical hilang: ${rel}`);
    if(!/og:title/i.test(s)||!/<meta name="twitter:card"/i.test(s)) errs.push(`Social metadata kurang: ${rel}`);
  }
  if(isAdmin && !/noindex/i.test(robots)) errs.push(`Admin harus noindex: ${rel}`);
  if(rel==='404.html' && !/noindex/i.test(robots)) errs.push('404 harus noindex');
  for(const m of s.matchAll(/<img\b[^>]*>/gi)) if(!/\balt\s*=/.test(m[0])) errs.push(`Image tanpa alt: ${rel}`);
  if(isAdmin) continue;
  for(const m of s.matchAll(/href="([^"]+)"/gi)){
    const href=m[1]; if(href.includes('encodeURIComponent')||href.includes("'+")||href.includes('\${')) continue; if(!href.startsWith('/')) continue;
    const clean=href.split('#')[0].split('?')[0]; if(!clean||clean.startsWith('/api/')) continue;
    if(clean==='/admin/'||clean.startsWith('/admin/')) continue;
    const route=clean.endsWith('/')?clean:clean+'/';
    if(route!== '/style.css/' && !localRoutes.has(route) && !fs.existsSync(path.join(publicDir,clean.replace(/^\//,'')))) warns.push(`Internal link belum terdaftar: ${rel} -> ${href}`);
  }
}
const sm=fs.readFileSync(path.join(publicDir,'sitemap.xml'),'utf8');
const locs=[...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(new Set(locs).size!==locs.length) errs.push('Sitemap memiliki URL duplikat');
if(!locs.length) errs.push('Sitemap kosong');
if(!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sm)) errs.push('Sitemap belum memiliki lastmod');
if(!/<priority>/.test(sm)||!/<changefreq>/.test(sm)) warns.push('Sitemap tidak memakai priority/changefreq');
const robotsTxt=fs.readFileSync(path.join(publicDir,'robots.txt'),'utf8');
if(!robotsTxt.includes(`Sitemap: ${base}/sitemap.xml`)) errs.push('robots.txt tidak menunjuk sitemap yang sesuai SITE_URL');
if(errs.length){console.error(errs.join('\n'));process.exit(1)}
console.log(`SEO audit OK: ${products.length} produk, ${html.length} HTML, ${locs.length} URL sitemap.`); if(warns.length)console.warn('\nPeringatan:\n'+warns.slice(0,30).join('\n'));
