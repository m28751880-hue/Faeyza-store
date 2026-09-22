const crypto = require('node:crypto');
const { safeEqual } = require('../security');

async function redisCommand(command) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) throw new Error('Redis belum dikonfigurasi.');
  const r = await fetch(base, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify(command) });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  return (await r.json()).result;
}
function auth(req){ const s=process.env.PROVIDER_SYNC_SECRET; if(!s) return false; const h=String(req.headers.authorization||''); const m=h.match(/^Bearer\s+(.+)$/i); return (m&&safeEqual(m[1],s)) || safeEqual(String(req.headers['x-provider-sync-secret']||''),s); }
function num(v){ const n=Number(v); return Number.isFinite(n)&&n>=0?n:0; }
function slug(v){ return String(v||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function sign(path, query, body, secret){
  const q=Object.entries(query).filter(([k])=>k!=='sign'&&k!=='access_token').sort(([a],[b])=>a.localeCompare(b));
  let raw=secret+path+q.map(([k,v])=>k+v).join('')+(body||'')+secret;
  return crypto.createHmac('sha256',secret).update(raw).digest('hex');
}
async function tiktokTrace(){
  const appKey=process.env.TIKTOK_APP_KEY;
  const appSecret=process.env.TIKTOK_APP_SECRET;
  const accessToken=process.env.TIKTOK_CREATOR_ACCESS_TOKEN;
  if(!appKey||!appSecret||!accessToken) throw new Error('TIKTOK_APP_KEY, TIKTOK_APP_SECRET, dan TIKTOK_CREATOR_ACCESS_TOKEN wajib diisi.');
  const version=process.env.TIKTOK_TRACE_API_VERSION||'202505';
  const now=Math.floor(Date.now()/1000);
  const from=Number(process.env.TIKTOK_TRACE_TIME_GE||Math.floor(Date.now()/1000)-86400);
  const to=Number(process.env.TIKTOK_TRACE_TIME_LT||now);
  const base='https://open-api.tiktokglobalshop.com';
  let pageToken=''; let all=[]; let guard=0;
  do {
    const q={app_key:appKey,time_ge:from,time_lt:to,time_type:process.env.TIKTOK_TRACE_TIME_TYPE||'PAY_TIME',page_size:'50',timestamp:String(now)};
    if(pageToken) q.page_token=pageToken;
    q.sign=sign(`/affiliate_creator/${version}/orders/trace/search`,q,'',appSecret);
    const u=new URL(`${base}/affiliate_creator/${version}/orders/trace/search`); Object.entries(q).forEach(([k,v])=>u.searchParams.set(k,v));
    const r=await fetch(u,{method:'POST',headers:{'content-type':'application/json','x-tts-access-token':accessToken},body:'{}'});
    const data=await r.json();
    if(!r.ok||data.code!==0) throw new Error(`TikTok API ${r.status}: ${data.message||'request gagal'}`);
    all=all.concat(data.data?.orders||[]); pageToken=data.data?.next_page_token||data.data?.page_token||''; guard++;
  } while(pageToken&&guard<20);
  return all;
}
async function record(order){
  const eventId=`tiktok:${order.id}`;
  const exists=await redisCommand(['SET',`kj:conversion:event:${eventId}`,'1','NX','EX','31536000']);
  if(exists!=='OK') return {duplicate:true,eventId};
  const skus=order.skus||[];
  let commission=0, product='unknown';
  for(const s of skus){ commission+=num(s.actual_commission?.amount ?? s.actual_commission); product=slug(s.product_id||product); }
  const currency=skus[0]?.actual_commission?.currency||skus[0]?.price?.currency||'IDR';
  const source='tiktok'; const day=new Date().toISOString().slice(0,10);
  await redisCommand(['INCR','kj:conversions:total']);
  await redisCommand(['INCRBYFLOAT','kj:commission:total',String(commission)]);
  await redisCommand(['HINCRBY','kj:conversions:daily',day,'1']);
  await redisCommand(['HINCRBY','kj:conversions:products',product,'1']);
  await redisCommand(['HINCRBY','kj:conversions:sources',source,'1']);
  await redisCommand(['HINCRBYFLOAT','kj:commission:daily',day,String(commission)]);
  await redisCommand(['HINCRBYFLOAT','kj:commission:products',product,String(commission)]);
  await redisCommand(['HINCRBYFLOAT','kj:commission:sources',source,String(commission)]);
  await redisCommand(['HSET',`kj:conversion:events:${eventId}`,'provider','tiktok','orderId',String(order.id),'status',String(order.status||''),'product',product,'commission',String(commission),'currency',currency,'createdAt',new Date().toISOString()]);
  return {duplicate:false,eventId,product,commission,currency,status:order.status};
}
module.exports=async function(req,res){
  if(req.method!=='GET'&&req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  if(!auth(req)) return res.status(401).json({ok:false,error:'Unauthorized'});
  try { const orders=await tiktokTrace(); const results=[]; for(const o of orders) results.push(await record(o)); return res.status(200).json({ok:true,provider:'tiktok',orders:orders.length,processed:results.filter(x=>!x.duplicate).length,duplicates:results.filter(x=>x.duplicate).length,results}); }
  catch(err){ console.error(JSON.stringify({event:'tiktok_affiliate_sync_error',message:err.message})); return res.status(502).json({ok:false,error:err.message}); }
};
