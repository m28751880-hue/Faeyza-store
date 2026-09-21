module.exports = async function handler(req, res) {
  return res.status(200).json({ ok: true, service: 'faeyza-store-v16', time: new Date().toISOString() });
};
