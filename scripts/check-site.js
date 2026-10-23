#!/usr/bin/env node
// Crawls dist/ and verifies: every internal link resolves, every page has one H1, a unique
// title under 60 chars and a unique description under 160, a canonical, OG image, JSON-LD
// that parses with the expected types, alt text on every image, and sitemap coverage.
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const SITE = 'https://standardroofingcompany.net';
let problems = 0;
const bad = (page, msg) => { problems++; console.log(`  ${page}: ${msg}`); };

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(DIST);
const routes = new Map();
for (const f of files) {
  const rel = '/' + path.relative(DIST, f).replace(/\\/g, '/');
  const route = rel === '/index.html' ? '/' : rel.replace(/\/index\.html$/, '').replace(/\.html$/, '');
  routes.set(route, fs.readFileSync(f, 'utf8'));
}
function exists(target) {
  const [p0] = target.split('#');
  const p = p0.split('?')[0];
  if (!p || p === '') return true;
  if (routes.has(p)) return true;
  if (p.startsWith('/api/')) return fs.existsSync(path.join(__dirname, '..', 'api', p.split('/')[2].replace(/\.js$/, '') + '.js'));
  const file = path.join(DIST, p);
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

const titles = new Map(), descs = new Map();
const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const inSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/'));
const types = {};

for (const [route, html] of routes) {
  const is404 = route === '/404';
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (!title) bad(route, 'missing title');
  if (title.length > 60) bad(route, `title ${title.length} chars: "${title}"`);
  if (titles.has(title)) bad(route, `duplicate title with ${titles.get(title)}`); titles.set(title, route);
  if (!desc) bad(route, 'missing description');
  if (desc.length > 160) bad(route, `description ${desc.length} chars`);
  if (descs.has(desc)) bad(route, `duplicate description with ${descs.get(desc)}`); descs.set(desc, route);
  if (!canon) bad(route, 'missing canonical');
  else if (!is404 && canon !== SITE + (route === '/' ? '/' : route)) bad(route, `canonical mismatch ${canon}`);
  if (h1s.length !== 1) bad(route, `${h1s.length} h1 tags`);
  if (!/property="og:image" content="https:/.test(html)) bad(route, 'missing og:image');
  if (!/name="twitter:card"/.test(html)) bad(route, 'missing twitter card');
  if (/\u2014|\u2013/.test(html)) bad(route, 'contains an em or en dash');
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0];
    if (!/\balt="/.test(t)) bad(route, 'img without alt: ' + t.slice(0, 80));
    if (!/\bwidth="/.test(t) || !/\bheight="/.test(t)) bad(route, 'img without width/height: ' + t.slice(0, 80));
    const src = (t.match(/\bsrc="([^"]+)"/) || [])[1];
    if (src && src.startsWith('/') && !exists(src)) bad(route, 'missing image ' + src);
  }
  for (const m of html.matchAll(/\bhref="([^"]+)"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|tel:|sms:|#)/.test(h)) continue;
    if (!h.startsWith('/')) { bad(route, 'relative link ' + h); continue; }
    if (/\.html(#|$)/.test(h)) bad(route, 'link to .html ' + h);
    if (!exists(h)) bad(route, 'broken link ' + h);
    if (h.includes('#')) {
      const [p, frag] = h.split('#');
      const target = routes.get(p || route);
      if (target && frag && !new RegExp(`id="${frag}"`).test(target)) bad(route, `missing anchor ${h}`);
    }
  }
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!lds.length) bad(route, 'no JSON-LD');
  for (const l of lds) {
    try {
      const j = JSON.parse(l[1]);
      const graph = j['@graph'] || [j];
      for (const node of graph) {
        types[node['@type']] = (types[node['@type']] || 0) + 1;
        if (node['@type'] === 'BreadcrumbList') for (const it of node.itemListElement) { if (!it.name) bad(route, 'breadcrumb item without name'); }
        if (node['@type'] === 'FAQPage') for (const q of node.mainEntity) { if (!q.name || !q.acceptedAnswer || !q.acceptedAnswer.text) bad(route, 'FAQ question incomplete'); }
        if (node['@type'] === 'Article') for (const k of ['headline', 'datePublished', 'author', 'publisher', 'image']) if (!node[k]) bad(route, 'Article missing ' + k);
        if (node['@type'] === 'RoofingContractor') for (const k of ['name', 'address', 'geo', 'telephone', 'openingHoursSpecification', 'areaServed', 'priceRange', 'email']) if (!node[k]) bad(route, 'RoofingContractor missing ' + k);
        if (node['@type'] === 'Service') for (const k of ['name', 'provider', 'serviceType']) if (!node[k]) bad(route, 'Service missing ' + k);
      }
    } catch (e) { bad(route, 'invalid JSON-LD: ' + e.message); }
  }
  if (!is404 && !inSitemap.has(route)) bad(route, 'not in sitemap');
  if (is404 && inSitemap.has(route)) bad(route, '404 should not be in sitemap');
  // FAQ block present => FAQPage schema present
  if (/class="faq"/.test(html) && !/"FAQPage"/.test(html)) bad(route, 'FAQ block without FAQPage schema');
  // breadcrumbs on nested pages
  if (route !== '/' && !is404 && !/"BreadcrumbList"/.test(html)) bad(route, 'nested page without BreadcrumbList');
}
for (const s of inSitemap) if (!routes.has(s)) bad(s, 'in sitemap but no page');

console.log(`\nPages: ${routes.size} (${inSitemap.size} in sitemap). Schema types:`, types);
console.log(problems ? `${problems} problem(s)` : 'Site check passed: zero broken links, unique titles and descriptions, valid structured data.');
process.exit(problems ? 1 : 0);
