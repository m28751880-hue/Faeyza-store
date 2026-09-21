const crypto = require('node:crypto');
function safeEqual(a,b){
  const aa=Buffer.from(String(a||'')); const bb=Buffer.from(String(b||''));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function bearer(req, envName){
  const expected=process.env[envName]; if(!expected) return false;
  const h=String(req.headers.authorization||'');
  const m=h.match(/^Bearer\s+(.+)$/i); return !!m && safeEqual(m[1], expected);
}
function jsonBody(req,max=262144){
  const len=Number(req.headers['content-length']||0); if(len>max) throw new Error('Payload terlalu besar.');
  let b=req.body||{}; if(typeof b==='string'){if(Buffer.byteLength(b,'utf8')>max) throw new Error('Payload terlalu besar.'); try{b=JSON.parse(b)}catch{throw new Error('JSON tidak valid.')}} return b;
}
function adminPassword(){ return process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || ''; }
function adminSessionSecret(){ return adminPassword(); }
function signSession(exp){ return crypto.createHmac('sha256',adminSessionSecret()).update(String(exp)).digest('hex'); }
function parseCookies(req){
  const raw=String(req.headers.cookie||''); const out={};
  for(const part of raw.split(';')){ const i=part.indexOf('='); if(i>0) out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim()); }
  return out;
}
function adminSession(req){
  const secret=adminSessionSecret(); if(!secret) return false;
  const v=parseCookies(req).kn_admin_session; if(!v) return false;
  const [exp,sig]=String(v).split('.'); const n=Number(exp);
  if(!Number.isSafeInteger(n) || n < Math.floor(Date.now()/1000) || !sig) return false;
  return safeEqual(sig,signSession(n));
}
function adminAuth(req){ return adminSession(req) || bearer(req,'ADMIN_PASSWORD') || bearer(req,'ADMIN_TOKEN'); }
function setAdminSession(res, hours=12){
  const exp=Math.floor(Date.now()/1000)+hours*3600; const sig=signSession(exp);
  res.setHeader('Set-Cookie',`kn_admin_session=${exp}.${sig}; Path=/; Max-Age=${hours*3600}; HttpOnly; Secure; SameSite=Strict`);
}
function clearAdminSession(res){ res.setHeader('Set-Cookie','kn_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'); }
module.exports={safeEqual,bearer,jsonBody,adminPassword,adminSession,adminAuth,setAdminSession,clearAdminSession};
