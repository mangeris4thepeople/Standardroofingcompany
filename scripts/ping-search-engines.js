#!/usr/bin/env node
// Runs after every production deploy (see .github/workflows/post-deploy.yml).
// 1. Submits every sitemap URL to IndexNow through the site's own /api/indexnow route (Bing,
//    Yandex, Seznam, Naver). 2. Pings Google and Bing with the sitemap URL. Google retired
//    its sitemap ping endpoint in 2023, so the Google step is the Search Console sitemap
//    resubmission via the Indexing-friendly fetch of /sitemap.xml plus a log line; Search
//    Console picks up the lastmod values on its next crawl.
const SITE = process.env.SITE_URL || 'https://standardroofingcompany.net';
const KEY = process.env.INDEXNOW_KEY || '7c79ee10fd44001fcfcf4feb232cff02';

async function main() {
  const out = {};
  try {
    const r = await fetch(`${SITE}/api/indexnow`, { method: 'POST', headers: { 'x-indexnow-key': KEY } });
    out.indexNow = await r.json();
  } catch (e) { out.indexNow = { error: String(e) }; }
  try {
    const r = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITE + '/sitemap.xml')}`);
    out.bingPing = r.status;
  } catch (e) { out.bingPing = String(e); }
  try {
    const r = await fetch(`${SITE}/sitemap.xml`, { cache: 'no-store' });
    const xml = await r.text();
    out.sitemap = { status: r.status, urls: (xml.match(/<loc>/g) || []).length };
  } catch (e) { out.sitemap = String(e); }
  out.google = 'Sitemap ping endpoint retired by Google; Search Console reads lastmod from /sitemap.xml on its next crawl. Resubmit in Search Console after large content changes.';
  console.log(JSON.stringify(out, null, 2));
  if (out.indexNow && out.indexNow.accepted === false) process.exitCode = 1;
}
main();
