// Submits every URL in sitemap.xml to IndexNow (Bing, Yandex, Seznam, Naver, and partners).
// Called by the post-deploy workflow (.github/workflows/post-deploy.yml) and usable by hand:
// GET /api/indexnow?key=<INDEXNOW_KEY> or POST with header x-indexnow-key. 200 or 202 is accepted.
const HOST = 'standardroofingcompany.net';
const KEY = process.env.INDEXNOW_KEY || '7c79ee10fd44001fcfcf4feb232cff02';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const given = (req.query && req.query.key) || req.headers['x-indexnow-key'] || '';
  if (given !== KEY) return res.status(401).json({ error: 'Provide the IndexNow key as ?key= or the x-indexnow-key header.' });
  try {
    const xml = await (await fetch('https://' + HOST + '/sitemap.xml?t=' + Date.now(), { cache: 'no-store' })).text();
    const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    if (!urlList.length) return res.status(500).json({ error: 'sitemap had no URLs' });
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList }),
    });
    const text = await r.text().catch(() => '');
    return res.status(200).json({ indexNowStatus: r.status, accepted: r.status === 200 || r.status === 202, submitted: urlList.length, detail: text.slice(0, 300) });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
