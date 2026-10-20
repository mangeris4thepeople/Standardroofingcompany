// Submits every URL in sitemap.xml to IndexNow (Bing, Yandex, Seznam, Naver, and
// partners) and returns the status IndexNow answered with. Visit /api/indexnow after
// publishing new pages. 200 or 202 means the submission was accepted.
const HOST = 'standardroofingcompany.net';
const KEY = '7c79ee10fd44001fcfcf4feb232cff02';

module.exports = async (req, res) => {
  try {
    const xml = await (await fetch('https://' + HOST + '/sitemap.xml?t=' + Date.now(), { cache: 'no-store' })).text();
    const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList }),
    });
    const text = await r.text().catch(() => '');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ indexNowStatus: r.status, accepted: r.status === 200 || r.status === 202, submitted: urlList.length, detail: text.slice(0, 300) });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
