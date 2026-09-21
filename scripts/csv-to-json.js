const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const input = process.argv[2] || path.join(root, 'data', 'products.csv');
const output = process.argv[3] || path.join(root, 'products.json');

function parseCSV(text){
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1];
    if(quoted){
      if(ch==='"' && next==='"'){cell+='"'; i++;}
      else if(ch==='"') quoted=false;
      else cell+=ch;
    } else {
      if(ch==='"') quoted=true;
      else if(ch===','){row.push(cell);cell='';}
      else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell='';}
      else if(ch!=='\r') cell+=ch;
    }
  }
  if(cell.length || row.length){row.push(cell);rows.push(row);}
  const headers=rows.shift().map(x=>x.trim());
  return rows.filter(r=>r.some(x=>x.trim()!=='')).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??'').trim()])));
}
function num(v){ if(v===''||v==null) return undefined; const n=Number(String(v).replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:undefined; }
function list(v){ return v ? v.split('|').map(x=>x.trim()).filter(Boolean) : []; }
function specs(v){ const o={}; for(const item of list(v)){ const i=item.indexOf('='); if(i>0)o[item.slice(0,i).trim()]=item.slice(i+1).trim(); } return o; }
function slugify(s){ return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
const rows=parseCSV(fs.readFileSync(input,'utf8').replace(/^\uFEFF/,''));
const products=rows.map((r,i)=>({
 slug:r.slug||slugify(r.name)||`produk-${i+1}`, name:r.name, category:r.category||'Lainnya', ...(r.brand?{brand:r.brand}:{}),
 ...(['price','oldPrice','rating','reviews'].reduce((o,k)=>{const n=num(r[k]); if(n!==undefined)o[k]=n; return o;},{})),
 ...(r.icon?{icon:r.icon}:{}), ...(r.image?{image:r.image}:{}), ...(r.tag?{tag:r.tag}:{}), summary:r.summary||'', pros:list(r.pros), cons:list(r.cons), specs:specs(r.specs), affiliateUrl:r.affiliateUrl||''
}));
fs.writeFileSync(output, JSON.stringify(products,null,2)+'\n');
console.log(`Imported ${products.length} products from ${input} -> ${output}`);
