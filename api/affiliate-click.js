const fs = require('node:fs/promises');
const path = require('node:path');

async function loadProducts() {
  const raw = await fs.readFile(path.join(process.cwd(), 'products.json'), 'utf8');
  return JSON.parse(raw);
}
function safeSlug(value) { return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function isValidAffiliate(url) { try { const u = new URL(url); return u.protocol === 'https:' && !/^PASTE_/i.test(url); } catch { return false; } }
function makeClickId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`; }
function addTrackingParam(url, key, value) { if (!key) return url; try { const u = new URL(url); u.searchParams.set(key, value); return u.toString(); } catch { return url; } }

async function redisCommand(command) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return false;
  const r = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  return (await r.json()).result;
}

async function persistClick(item, source, clickId) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return { persisted: false, day };
  await redisCommand(['SET', `kj:click:${clickId}`, JSON.stringify({ productSlug: item.slug || safeSlug(item.name), productName: item.name, source, createdAt: now.toISOString() }), 'EX', '2592000']);
  await redisCommand(['INCR', 'kj:clicks:total']);
  await redisCommand(['HINCRBY', 'kj:clicks:daily', day, '1']);
  const productKey = item.slug || safeSlug(item.name);
  await redisCommand(['HINCRBY', 'kj:clicks:products', productKey, '1']);
  await redisCommand(['HINCRBY', 'kj:clicks:sources', source, '1']);
  await redisCommand(['HINCRBY', 'kj:clicks:products:daily', `${day}|${productKey}`, '1']);
  await redisCommand(['HINCRBY', 'kj:clicks:sources:daily', `${day}|${source}`, '1']);
  return { persisted: true, day };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const product = String(req.query?.product || '');
  const source = String(req.query?.source || 'product').slice(0, 40);
  const slug = safeSlug(product);
  if (!slug) return res.status(400).send('Produk tidak ditemukan.');
  try {
    const products = await loadProducts();
    const item = products.find(p => safeSlug(p.slug || p.name) === slug);
    if (!item || !isValidAffiliate(item.affiliateUrl)) return res.status(404).send('Link affiliate belum tersedia untuk produk ini.');
    const clickId = makeClickId();
    const stored = await persistClick(item, source, clickId);
    const destination = addTrackingParam(item.affiliateUrl, process.env.AFFILIATE_CLICK_PARAM, clickId);
    console.log(JSON.stringify({ event: 'affiliate_click', productSlug: item.slug || slug, productName: item.name, source, timestamp: new Date().toISOString(), clickId, persisted: stored.persisted, referrer: req.headers.referer || null, userAgent: req.headers['user-agent'] || null }));
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Location', destination);
    return res.status(302).end();
  } catch (err) {
    console.error(JSON.stringify({ event: 'affiliate_click_error', productSlug: slug, message: err.message }));
    return res.status(500).send('Gagal membuka tautan toko.');
  }
};
