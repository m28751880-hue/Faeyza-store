async function redisCommand(command) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) throw new Error('Redis belum dikonfigurasi.');
  const r = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  return (await r.json()).result;
}
const { bearer } = require('../security');
function authorized(req) { return bearer(req, 'STATS_TOKEN'); }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function splitDaily(o) {
  const out = {};
  for (const [key, value] of Object.entries(o || {})) {
    const i = key.indexOf('|');
    if (i < 0) continue;
    const day = key.slice(0, i), item = key.slice(i + 1);
    if (!out[item]) out[item] = {};
    out[item][day] = num(value);
  }
  return out;
}
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  try {
    const [total, daily, products, sources, productsDaily, sourcesDaily, pageviewsTotal, pageviewsDaily, pageviewsRoutes, pageviewsRoutesDaily, conversionsTotal, commissionTotal, conversionsDaily, conversionsProducts, conversionsSources, conversionsProductsDaily, commissionDaily, commissionProducts, commissionSources, commissionProductsDaily] = await Promise.all([
      redisCommand(['GET', 'kj:clicks:total']), redisCommand(['HGETALL', 'kj:clicks:daily']), redisCommand(['HGETALL', 'kj:clicks:products']), redisCommand(['HGETALL', 'kj:clicks:sources']), redisCommand(['HGETALL', 'kj:clicks:products:daily']), redisCommand(['HGETALL', 'kj:clicks:sources:daily']),
      redisCommand(['GET', 'kj:pageviews:total']), redisCommand(['HGETALL', 'kj:pageviews:daily']), redisCommand(['HGETALL', 'kj:pageviews:routes']), redisCommand(['HGETALL', 'kj:pageviews:routes:daily']),
      redisCommand(['GET', 'kj:conversions:total']), redisCommand(['GET', 'kj:commission:total']), redisCommand(['HGETALL', 'kj:conversions:daily']), redisCommand(['HGETALL', 'kj:conversions:products']), redisCommand(['HGETALL', 'kj:conversions:sources']), redisCommand(['HGETALL', 'kj:conversions:products:daily']), redisCommand(['HGETALL', 'kj:commission:daily']), redisCommand(['HGETALL', 'kj:commission:products']), redisCommand(['HGETALL', 'kj:commission:sources']), redisCommand(['HGETALL', 'kj:commission:products:daily'])
    ]);
    const sourceMap = sources || {};
    const articleClicks = Object.fromEntries(Object.entries(sourceMap).filter(([k]) => k.startsWith('article:')).map(([k,v]) => [k.slice(8), num(v)]));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true,
      total: num(total), daily: daily || {}, products: products || {}, sources: sourceMap, articleClicks,
      productsDaily: splitDaily(productsDaily), sourcesDaily: splitDaily(sourcesDaily),
      pageviewsTotal: num(pageviewsTotal), pageviewsDaily: pageviewsDaily || {}, pageviewsRoutes: pageviewsRoutes || {}, pageviewsRoutesDaily: splitDaily(pageviewsRoutesDaily),
      conversionsTotal: num(conversionsTotal), commissionTotal: num(commissionTotal), conversionsDaily: conversionsDaily || {}, conversionsProducts: conversionsProducts || {}, conversionsSources: conversionsSources || {}, conversionsProductsDaily: splitDaily(conversionsProductsDaily), commissionDaily: commissionDaily || {}, commissionProducts: commissionProducts || {}, commissionSources: commissionSources || {}, commissionProductsDaily: splitDaily(commissionProductsDaily),
      storage: 'upstash-redis', generatedAt: new Date().toISOString()
    });
  } catch (err) { return res.status(503).json({ ok: false, error: err.message }); }
};
