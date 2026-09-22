const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const http = require('http');

const root = path.resolve(__dirname, '..');
const pub = path.join(root, 'public');
const failures = [];
const notes = [];
const run = (cmd) => {
  try { return cp.execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }); }
  catch (e) { failures.push(`${cmd}\n${e.stdout || ''}${e.stderr || ''}`); return ''; }
};

console.log('V52 Hobby-Compatible Production QA starting...');
run('node scripts/validate.js');
run('node scripts/admin-check.js');
run('node scripts/generate.js');
run('node scripts/seo-audit.js');

for (const dir of ['public','api','scripts','admin']) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) continue;
  const stack = [base];
  while (stack.length) {
    const d = stack.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(f);
      else if (ent.name.endsWith('.js')) {
        try { cp.execFileSync(process.execPath, ['--check', f], { cwd: root, stdio: 'pipe' }); }
        catch (e) { failures.push(`JS syntax: ${path.relative(root, f)}\n${e.stderr?.toString() || e.message}`); }
      }
    }
  }
}

for (const rel of ['products.json','data/site.json','data/article-topics.json','package.json','vercel.json','pwa-assets/manifest.webmanifest']) {
  try { JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
  catch (e) { failures.push(`Invalid JSON: ${rel}: ${e.message}`); }
}

const htmlFiles = [];
const walk = d => fs.readdirSync(d, {withFileTypes:true}).forEach(e => {
  const f = path.join(d, e.name);
  if (e.isDirectory()) walk(f); else if (e.name.endsWith('.html')) htmlFiles.push(f);
});
walk(pub);
const normalizedRoutes = new Set();
for (const f of htmlFiles) {
  const rel = path.relative(pub, f).replaceAll(path.sep,'/');
  if (rel === '404.html') normalizedRoutes.add('/404.html');
  else if (rel.endsWith('/index.html')) normalizedRoutes.add('/'+rel.slice(0,-10));
  else normalizedRoutes.add('/'+rel);
  const s = fs.readFileSync(f,'utf8');
  const canon = (s.match(/<link rel="canonical" href="([^"]+)"/i)||[])[1];
  if (!canon && !rel.startsWith('admin/')) failures.push(`Missing canonical: ${rel}`);
  const ids = [...s.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
  const dupIds = ids.filter((id,i)=>ids.indexOf(id)!==i);
  if (dupIds.length) failures.push(`Duplicate HTML id(s): ${rel}: ${[...new Set(dupIds)].join(', ')}`);
  for (const m of s.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=/.test(m[0])) failures.push(`Image missing alt: ${rel}`);
  }
}

const sitemap = fs.readFileSync(path.join(pub,'sitemap.xml'),'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if (new Set(locs).size !== locs.length) failures.push('Sitemap contains duplicate loc values');
for (const loc of locs) {
  let u; try { u = new URL(loc); } catch { failures.push(`Invalid sitemap URL: ${loc}`); continue; }
  const route = u.pathname;
  if (route === '/admin/' || route.startsWith('/admin/') || route.startsWith('/api/')) failures.push(`Forbidden sitemap route: ${route}`);
  if (route !== '/' && route !== '/404.html' && !normalizedRoutes.has(route)) {
    const alt = route.endsWith('/') ? route : route + '/';
    if (!normalizedRoutes.has(alt)) failures.push(`Sitemap route has no generated HTML: ${route}`);
  }
}
const robots = fs.readFileSync(path.join(pub,'robots.txt'),'utf8');
if (!/Sitemap:\s+https?:\/\/[^\s]+\/sitemap\.xml/i.test(robots)) failures.push('robots.txt missing sitemap directive');
if (!fs.existsSync(path.join(pub,'offline.html'))) failures.push('PWA offline.html missing');
if (!fs.existsSync(path.join(pub,'manifest.webmanifest'))) failures.push('PWA manifest missing');
if (!fs.existsSync(path.join(pub,'service-worker.js'))) failures.push('Service worker missing');
if (!fs.existsSync(path.join(pub,'icons','icon-192.png')) || !fs.existsSync(path.join(pub,'icons','icon-512.png'))) failures.push('PWA icons missing');

// Basic secret-leak scan over deployable text files.
const secretRe = /(sk-[A-Za-z0-9_-]{20,}|OPENAI_API_KEY\s*[:=]\s*["'][^"']+["']|ADMIN_TOKEN\s*[:=]\s*["'][^"']{12,}["'])/;
for (const f of [...htmlFiles, path.join(pub,'app.js'), path.join(pub,'pwa.js'), path.join(pub,'service-worker.js')]) {
  const s = fs.readFileSync(f,'utf8');
  if (secretRe.test(s)) failures.push(`Possible secret in public asset: ${path.relative(root,f)}`);
}

// Optional local HTTP smoke test. It tests generated static output without needing a Vercel deployment.
const smoke = ['/','/produk/','/artikel/','/perbandingan/','/favorit/','/sitemap.xml','/robots.txt','/manifest.webmanifest','/service-worker.js','/offline.html','/admin/'];
const server = http.createServer((q,r)=>{
  let u = q.url.split('?')[0];
  if (u === '/' || u.endsWith('/')) u += 'index.html';
  const f = path.join(pub, u.replace(/^\//,''));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.writeHead(404).end('404');
  r.writeHead(200).end(fs.readFileSync(f));
});
const request = (port,p) => new Promise(resolve => {
  const req=http.get(`http://127.0.0.1:${port}${p}`, r=>{r.resume();resolve(r.statusCode)});
  req.on('error',()=>resolve(0));
  req.setTimeout(2500,()=>{req.destroy();resolve(0)});
});
(async()=>{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const port = server.address().port;
  for (const p of smoke) { const status=await request(port,p); if (status !== 200) failures.push(`HTTP smoke ${p}: expected 200, got ${status}`); }
  await new Promise(r=>server.close(r));
  if (failures.length) {
    console.error(`\nV52 FINAL PRODUCTION QA FAILED (${failures.length} issue(s))`);
    console.error(failures.join('\n---\n'));
    process.exit(1);
  }
  console.log(`V52 FINAL PRODUCTION QA PASS: ${htmlFiles.length} HTML, ${locs.length} sitemap URLs, ${smoke.length} HTTP routes.`);
  if (notes.length) console.log(notes.join('\n'));
})();
