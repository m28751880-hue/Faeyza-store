const { bearer, safeEqual, jsonBody } = require('../security');
async function redisCommand(command) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) throw new Error('Redis belum dikonfigurasi.');
  const r = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  return (await r.json()).result;
}
function authorized(req) { if(bearer(req,'CONVERSION_SECRET')) return true; const expected=process.env.CONVERSION_SECRET; const raw=String(req.headers['x-conversion-secret']||''); return !!expected && safeEqual(raw,expected); }
function num(v) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; }
function safeSlug(v) { return String(v || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ ok:false, error:'Unauthorized' });
  try {
    let body; try { body=jsonBody(req, 65536); } catch(e) { return res.status(400).json({ok:false,error:e.message}); }
    const eventId=String(body.event_id||body.eventId||'').slice(0,160);
    if(!eventId) return res.status(400).json({ok:false,error:'event_id wajib diisi'});
    const exists=await redisCommand(['SET',`kj:conversion:event:${eventId}`,'1','NX','EX','31536000']);
    if(exists !== 'OK') return res.status(200).json({ok:true,duplicate:true,event_id:eventId});
    const clickId=String(body.click_id||body.clickId||'').slice(0,120);
    let attribution={};
    if(clickId){ const raw=await redisCommand(['GET',`kj:click:${clickId}`]); if(raw){try{attribution=JSON.parse(raw)}catch{}} }
    const product=safeSlug(body.product_slug||body.product||attribution.productSlug||'unknown');
    const source=String(body.source||attribution.source||'unknown').slice(0,80);
    const commission=num(body.commission);
    const currency=String(body.currency||'IDR').slice(0,10).toUpperCase();
    const day=new Date().toISOString().slice(0,10);
    await redisCommand(['INCR','kj:conversions:total']);
    await redisCommand(['INCRBYFLOAT','kj:commission:total',String(commission)]);
    await redisCommand(['HINCRBY','kj:conversions:daily',day,'1']);
    await redisCommand(['HINCRBY','kj:conversions:products',product,'1']);
    await redisCommand(['HINCRBY','kj:conversions:sources',source,'1']);
    await redisCommand(['HINCRBY','kj:commission:daily',day,String(commission)]);
    await redisCommand(['HINCRBYFLOAT','kj:commission:products',product,String(commission)]);
    await redisCommand(['HINCRBYFLOAT','kj:commission:sources',source,String(commission)]);
    await redisCommand(['HSET',`kj:conversion:events:${eventId}`,'product',product,'source',source,'commission',String(commission),'currency',currency,'clickId',clickId,'createdAt',new Date().toISOString()]);
    console.log(JSON.stringify({event:'affiliate_conversion',eventId,clickId,product,source,commission,currency,attributed:Boolean(attribution.productSlug)}));
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ok:true,duplicate:false,event_id:eventId,attributed:Boolean(attribution.productSlug),product,source,commission,currency});
  } catch(err) { console.error(JSON.stringify({event:'affiliate_conversion_error',message:err.message})); return res.status(500).json({ok:false,error:err.message}); }
};
