const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const root = path.resolve(__dirname, '..');
const bad = [];
function walk(dir){
  for(const name of fs.readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','.git'].includes(name.name)) continue;
    const p=path.join(dir,name.name);
    if(name.isDirectory()) walk(p); else yieldFile(p);
  }
}
function yieldFile(p){
  const rel=path.relative(root,p).replaceAll('\\','/');
  if((/^\.env($|\.)/.test(path.basename(p)) && path.basename(p) !== '.env.example') || /(^|\/)(id_rsa|.*\.pem|.*\.key)$/.test(rel)) bad.push(`secret-like file: ${rel}`);
  if(/(^|\/)(debug|tmp|temp|test-fixtures?)\//i.test(rel)) bad.push(`dev artifact path: ${rel}`);
}
walk(root);
for(const f of ['products.json','data/site.json','vercel.json','package.json']) if(!fs.existsSync(path.join(root,f))) bad.push(`missing required file: ${f}`);
const htmlDir=path.join(root,'public');
if(fs.existsSync(htmlDir)){
  const stack=[]; (function scan(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory()) scan(p); else if(e.name.endsWith('.html')) stack.push(p);}})(htmlDir);
  const site = JSON.parse(fs.readFileSync(path.join(root,'data/site.json'),'utf8'));
  const configured = process.env.SITE_URL || site.url || '';
  const shouldCheckExample = configured && !/example\.com/i.test(configured);
  for(const p of stack){const s=fs.readFileSync(p,'utf8'); if(/localhost:\d+/i.test(s) || (shouldCheckExample && /example\.com/i.test(s))) bad.push(`dev/example URL in ${path.relative(root,p)}`);}
}
try { execFileSync(process.execPath,[path.join(__dirname,'generate.js')],{cwd:root,stdio:'ignore'}); } catch(e) { bad.push('production build script failed'); }
if(bad.length){ console.error('PRODUCTION CHECK FAIL'); bad.forEach(x=>console.error(' - '+x)); process.exit(1); }
const apiFiles = fs.readdirSync(path.join(root, 'api')).filter(f => f.endsWith('.js'));
if (apiFiles.length > 11) throw new Error(`Hobby deploy guard: ${apiFiles.length} Serverless Functions terdeteksi; V57 menargetkan <=11.`);
console.log(`Hobby deploy guard: ${apiFiles.length} API functions.`);

console.log('PRODUCTION CHECK PASS: release files and generated HTML are production-clean');
