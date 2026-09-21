module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const supplied = req.headers.authorization === `Bearer ${secret}` || req.headers['x-cron-secret'] === secret;
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
