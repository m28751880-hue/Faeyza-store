const fs = require('node:fs/promises');
const path = require('node:path');

const root = process.cwd();
const localProducts = async () => JSON.parse(await fs.readFile(path.join(root, 'products.json'), 'utf8'));

const { bearer, safeEqual } = require('../security');
function auth(req) { const secret=process.env.CRON_SECRET; if(bearer(req,'CRON_SECRET')) return true; return !!secret && safeEqual(String(req.headers['x-cron-secret']||''),secret); }

async function fetchFeed(url) {
  const r = await fetch(url, { headers: { accept: 'application/json,text/csv' } });
  if (!r.ok) throw new Error(`Feed ${url} returned ${r.status}`);
  const text = await r.text();
  try { const j = JSON.parse(text); return Array.isArray(j) ? j : (j.products || j.data || []); }
  catch { throw new Error('Feed must return JSON array or {products:[...]}/{data:[...]}'); }
}

function normalize(p, provider) {
  const slug = String(p.slug || p.name || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return { ...p, slug, provider, syncedAt: new Date().toISOString() };
}

async function githubCommit(content, message) {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH='main', GITHUB_PRODUCTS_PATH='products.json' } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) throw new Error('GitHub persistence is not configured. Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO.');
  const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PRODUCTS_PATH}`;
  const headers = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' };
  const current = await fetch(`${base}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, { headers });
  let sha;
  if (current.ok) sha = (await current.json()).sha;
  const body = { message, content: Buffer.from(JSON.stringify(content, null, 2)+'\n').toString('base64'), branch: GITHUB_BRANCH, ...(sha ? {sha} : {}) };
  const r = await fetch(base, { method:'PUT', headers, body:JSON.stringify(body) });
  if (!r.ok) throw new Error(`GitHub commit failed: ${r.status} ${await r.text()}`);
  return await r.json();
}

async function runSync(req, res) {
  if (!auth(req)) return res.status(401).json({ ok:false, error:'Unauthorized' });
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const feeds = [];
  if (process.env.SHOPEE_FEED_URL) feeds.push(['shopee', process.env.SHOPEE_FEED_URL]);
  if (process.env.TIKTOK_FEED_URL) feeds.push(['tiktok', process.env.TIKTOK_FEED_URL]);
  if (!feeds.length) return res.status(400).json({ ok:false, error:'No affiliate feed configured. Set SHOPEE_FEED_URL and/or TIKTOK_FEED_URL.' });
  try {
    const existing = await localProducts();
    const map = new Map(existing.map(p => [p.slug, p]));
    const stats = [];
    for (const [provider, feedUrl] of feeds) {
      const rows = await fetchFeed(feedUrl);
      let count=0;
      for (const row of rows) { const p=normalize(row,provider); if(!p.slug) continue; map.set(p.slug,{...(map.get(p.slug)||{}),...p}); count++; }
      stats.push({provider, received: rows.length, accepted: count});
    }
    const products=[...map.values()];
    if (dryRun) return res.status(200).json({ok:true, dryRun:true, products:products.length, feeds:stats, wouldCommit:true});
    const result=await githubCommit(products,`chore(catalog): sync affiliate products ${new Date().toISOString()}`);
    return res.status(200).json({ok:true, dryRun:false, products:products.length, feeds:stats, commit:result.commit?.sha || null});
  } catch (e) { return res.status(500).json({ok:false,error:e.message}); }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method Not Allowed' });
  return runSync(req, res);
};

module.exports.config = { maxDuration: 300 };
