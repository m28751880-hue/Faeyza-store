const { safeEqual } = require('../security');
module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const h=String(req.headers.authorization||''); const m=h.match(/^Bearer\s+(.+)$/i); const supplied = (m&&safeEqual(m[1],secret)) || safeEqual(String(req.headers['x-cron-secret']||''),secret);
  if (!secret || !supplied) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  return res.status(200).json({
    ok: true,
    configured: {
      shopee: !!process.env.SHOPEE_FEED_URL,
      tiktok: !!process.env.TIKTOK_FEED_URL,
      github: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO)
    },
    branch: process.env.GITHUB_BRANCH || 'main'
  });
};
