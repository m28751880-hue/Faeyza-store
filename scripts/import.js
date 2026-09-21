const cp=require('child_process'); const path=require('path'); const root=path.resolve(__dirname,'..');
const input=process.argv[2] || path.join(root,'data','products.csv');
cp.execFileSync(process.execPath,[path.join(root,'scripts','csv-to-json.js'),input,path.join(root,'products.json')],{stdio:'inherit'});
cp.execFileSync(process.execPath,[path.join(root,'scripts','validate.js')],{stdio:'inherit'});
cp.execFileSync(process.execPath,[path.join(root,'scripts','generate.js')],{stdio:'inherit'});
