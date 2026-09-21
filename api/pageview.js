async function redisCommand(command) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return false;
  const r = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  return (await r.json()).result;
}
function safePath(value) {
  const p = String(value || '/').slice(0, 300);
  if (!p.startsWith('/') || p.startsWith('//') || p.startsWith('/api/') || p.startsWith('/admin/')) return '/';
  return p.replace(/\?.*$/, '') || '/';
}
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
    const route = safePath(body.path);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await redisCommand(['INCR', 'kj:pageviews:total']);
      await redisCommand(['HINCRBY', 'kj:pageviews:daily', day, '1']);
      await redisCommand(['HINCRBY', 'kj:pageviews:routes', route, '1']);
      await redisCommand(['HINCRBY', 'kj:pageviews:routes:daily', `${day}|${route}`, '1']);
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(204).end();
  } catch (err) {
    console.error(JSON.stringify({ event: 'pageview_error', message: err.message }));
    return res.status(204).end();
  }
};
