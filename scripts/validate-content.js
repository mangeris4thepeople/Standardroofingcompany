#!/usr/bin/env node
// Validates content/*.json against the rules in content/README.md.
// Usage: node scripts/validate-content.js [services|cities|casualty|blog|pages]
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SUFFIX = ' | Standard Roofing Company';
const ALLOWED_TAGS = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'h3', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br']);
const BANNED = [/\u2014/, /\u2013/, /\bDoug\b/i, /Mangeris/i, /Hausmann/i, /Standard Building/i, /Standard Data/i, /Brinkmann/i, /Mak0/i, /superintendent at/i, /years in business/i, /\bveteran[- ]owned/i];

let problems = 0;
const bad = (file, id, msg) => { problems++; console.log(`  [${file}] ${id}: ${msg}`); };

function words(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}
function checkText(file, id, label, text) {
  const s = String(text == null ? '' : text);
  for (const re of BANNED) if (re.test(s)) bad(file, id, `${label} contains banned text (${re})`);
}
function checkHtml(file, id, label, html) {
  checkText(file, id, label, html);
  const tags = [...String(html || '').matchAll(/<\/?([a-zA-Z0-9]+)[^>]*>/g)].map((m) => m[1].toLowerCase());
  for (const t of new Set(tags)) if (!ALLOWED_TAGS.has(t)) bad(file, id, `${label} uses disallowed tag <${t}>`);
  if (/style=/.test(html || '')) bad(file, id, `${label} has inline style`);
  for (const m of String(html || '').matchAll(/href="([^"]*)"/g)) {
    const h = m[1];
    if (/\.html(#|$)/.test(h)) bad(file, id, `${label} links to .html (${h})`);
    if (!/^(\/|https?:|mailto:|tel:|#)/.test(h)) bad(file, id, `${label} has a relative link (${h})`);
  }
}
function checkMeta(file, p, id) {
  checkText(file, id, 'title', p.title);
  checkText(file, id, 'description', p.description);
  checkText(file, id, 'h1', p.h1);
  checkText(file, id, 'lede', p.lede);
  if (!p.title) bad(file, id, 'missing title');
  else if ((p.title + SUFFIX).length > 60) bad(file, id, `title too long with suffix (${(p.title + SUFFIX).length} > 60): "${p.title}"`);
  if (!p.description) bad(file, id, 'missing description');
  else {
    if (p.description.length > 155) bad(file, id, `description too long (${p.description.length} > 155)`);
    if (p.description.length < 110) bad(file, id, `description too short (${p.description.length} < 110)`);
  }
  if (!p.h1) bad(file, id, 'missing h1');
  if (!Array.isArray(p.keywords) || p.keywords.length < 3) bad(file, id, 'keywords needs 3+ entries');
}
function checkSections(file, p, id, min, max) {
  if (!Array.isArray(p.sections) || !p.sections.length) return bad(file, id, 'missing sections');
  let total = words(p.intro || '');
  p.sections.forEach((s, i) => {
    if (!s.h2) bad(file, id, `section ${i} missing h2`);
    checkText(file, id, `section ${i} h2`, s.h2);
    checkHtml(file, id, `section ${i} html`, s.html);
    if (/<h[12]\b/i.test(s.html || '')) bad(file, id, `section ${i} html contains h1/h2`);
    total += words(s.html);
  });
  if (total < min) bad(file, id, `body too short: ${total} words (min ${min})`);
  if (total > max) bad(file, id, `body too long: ${total} words (max ${max})`);
  return total;
}
function checkFaq(file, p, id, min, max) {
  if (!Array.isArray(p.faq)) return bad(file, id, 'missing faq');
  if (p.faq.length < min || p.faq.length > max) bad(file, id, `faq count ${p.faq.length}, expected ${min} to ${max}`);
  p.faq.forEach((f, i) => {
    if (!f.q || !f.a) bad(file, id, `faq ${i} missing q or a`);
    checkText(file, id, `faq ${i}`, f.q + ' ' + f.a);
    const w = words(f.a);
    if (w < 25) bad(file, id, `faq ${i} answer too short (${w} words)`);
    if (w > 110) bad(file, id, `faq ${i} answer too long (${w} words)`);
  });
}
function load(name) {
  const file = path.join(ROOT, 'content', name + '.json');
  if (!fs.existsSync(file)) { console.log(`  [${name}.json] not present yet`); return null; }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { bad(name, '-', 'invalid JSON: ' + e.message); return null; }
}

const only = process.argv[2];
const report = {};

if (!only || only === 'services') {
  const data = load('services');
  if (data) {
    const slugs = new Set(data.map((s) => s.slug));
    const expected = ['metal-roofing', 'standing-seam-metal-roofing', 'slate-roofing', 'tile-roofing', 'cedar-shake-roofing', 'synthetic-roofing', 'roof-coatings', 'commercial-roofing', 'roof-repair', 'hail-damage-roof-repair', 'storm-damage-roofing', 'roof-inspections', 'roof-replacement', 'insurance-claim-roofing'];
    for (const e of expected) if (!slugs.has(e)) bad('services', e, 'missing service');
    const seen = new Set();
    for (const s of data) {
      if (seen.has(s.slug)) bad('services', s.slug, 'duplicate slug'); seen.add(s.slug);
      checkMeta('services', s, s.slug);
      for (const k of ['name', 'serviceType', 'lede', 'summary', 'lifespan', 'costRange', 'eyebrow']) if (!s[k]) bad('services', s.slug, `missing ${k}`);
      const w = checkSections('services', s, s.slug, 600, 1300);
      checkFaq('services', s, s.slug, 5, 5);
      if (!Array.isArray(s.related) || s.related.length !== 3) bad('services', s.slug, 'related must have exactly 3 slugs');
      else for (const r of s.related) if (!slugs.has(r)) bad('services', s.slug, `related slug not found: ${r}`);
      if (s.related && s.related.includes(s.slug)) bad('services', s.slug, 'related includes itself');
      report[`/services/${s.slug}`] = { words: w, keywords: s.keywords };
    }
  }
}

if (!only || only === 'cities') {
  const data = load('cities');
  if (data) {
    const expected = ['loveland', 'fort-collins', 'greeley', 'windsor', 'berthoud', 'longmont', 'johnstown', 'wellington', 'timnath', 'estes-park', 'nederland', 'winter-park', 'granby', 'grand-lake', 'steamboat-springs', 'breckenridge', 'frisco', 'silverthorne', 'vail', 'red-feather-lakes', 'glen-haven', 'drake'];
    const slugs = new Set(data.map((c) => c.slug));
    for (const e of expected) if (!slugs.has(e)) bad('cities', e, 'missing city');
    const services = load('services');
    const serviceSlugs = new Set((services || []).map((s) => s.slug));
    const firstSentences = new Map();
    for (const c of data) {
      checkMeta('cities', c, c.slug);
      for (const k of ['name', 'county', 'elevationFt', 'lat', 'lng', 'region', 'permitAuthority', 'lede', 'summary']) if (c[k] == null || c[k] === '') bad('cities', c.slug, `missing ${k}`);
      if (typeof c.wildfireInterface !== 'boolean') bad('cities', c.slug, 'wildfireInterface must be boolean');
      if (!['northern-colorado', 'mountain'].includes(c.region)) bad('cities', c.slug, 'region must be northern-colorado or mountain');
      const w = checkSections('cities', c, c.slug, 600, 1100);
      checkFaq('cities', c, c.slug, 3, 5);
      if (!Array.isArray(c.relatedServices) || c.relatedServices.length !== 4) bad('cities', c.slug, 'relatedServices must have exactly 4 slugs');
      else if (serviceSlugs.size) for (const r of c.relatedServices) if (!serviceSlugs.has(r)) bad('cities', c.slug, `relatedServices slug not found: ${r}`);
      const all = c.sections.map((s) => s.html).join(' ');
      if (!/hail/i.test(all)) bad('cities', c.slug, 'no hail history mentioned');
      if (!/permit/i.test(all)) bad('cities', c.slug, 'permit authority not discussed');
      if (!/HOA/.test(all)) bad('cities', c.slug, 'HOA considerations missing');
      if (!new RegExp(c.county.split(' ')[0], 'i').test(all)) bad('cities', c.slug, 'county not mentioned in body');
      if (!/\b\d{1,2},\d{3}\s*(feet|ft)\b/i.test(all)) bad('cities', c.slug, 'elevation in feet not mentioned in body');
      if (c.wildfireInterface && !/ember|wildfire|wildland/i.test(all)) bad('cities', c.slug, 'wildfire interface flagged but not discussed');
      // crude duplication check: first sentence of first section
      const fs1 = (c.sections[0].html || '').replace(/<[^>]+>/g, ' ').replace(c.name, 'CITY').trim().slice(0, 90);
      if (firstSentences.has(fs1)) bad('cities', c.slug, `first sentence duplicates ${firstSentences.get(fs1)}`);
      firstSentences.set(fs1, c.slug);
      report[`/roofing/${c.slug}`] = { words: w, keywords: c.keywords };
    }
  }
}

if (!only || only === 'casualty') {
  const data = load('casualty');
  if (data) {
    const L = data.landing || {};
    checkMeta('casualty', L, 'landing');
    checkSections('casualty', L, 'landing', 500, 1100);
    checkFaq('casualty', L, 'landing', 3, 6);
    const expected = ['expert-roof-inspections', 'hail-damage-documentation', 'cause-and-origin-reports', 'litigation-support', 'appraisal-and-umpire-support'];
    const slugs = new Set((data.pages || []).map((p) => p.slug));
    for (const e of expected) if (!slugs.has(e)) bad('casualty', e, 'missing page');
    for (const p of data.pages || []) {
      checkMeta('casualty', p, p.slug);
      for (const k of ['name', 'serviceType', 'lede', 'summary', 'audience']) if (!p[k]) bad('casualty', p.slug, `missing ${k}`);
      if (!Array.isArray(p.deliverables) || p.deliverables.length < 4) bad('casualty', p.slug, 'deliverables needs 4+ items');
      if (!Array.isArray(p.reportFormat) || p.reportFormat.length < 3) bad('casualty', p.slug, 'reportFormat needs 3+ items');
      const w = checkSections('casualty', p, p.slug, 600, 1200);
      checkFaq('casualty', p, p.slug, 4, 6);
      if (!Array.isArray(p.related) || p.related.length < 2) bad('casualty', p.slug, 'related needs 2+ slugs');
      else for (const r of p.related) if (!slugs.has(r)) bad('casualty', p.slug, `related slug not found: ${r}`);
      report[`/casualty/${p.slug}`] = { words: w, keywords: p.keywords };
    }
  }
}

if (!only || only === 'blog') {
  let data = load('blog');
  if (!data) {
    // Parts written by separate authors are merged at build time.
    data = [];
    for (const part of ['blog-a', 'blog-b']) { const d = load(part); if (d) data = data.concat(d); }
    if (!data.length) data = null;
  }
  if (data) {
    if (data.length !== 12 && !process.argv.includes('--partial')) bad('blog', '-', `expected 12 posts, found ${data.length}`);
    const seen = new Set();
    for (const p of data) {
      if (seen.has(p.slug)) bad('blog', p.slug, 'duplicate slug'); seen.add(p.slug);
      checkMeta('blog', p, p.slug);
      for (const k of ['category', 'datePublished', 'excerpt', 'intro']) if (!p[k]) bad('blog', p.slug, `missing ${k}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.datePublished || '')) bad('blog', p.slug, 'datePublished must be YYYY-MM-DD');
      checkHtml('blog', p.slug, 'intro', p.intro);
      const w = checkSections('blog', p, p.slug, 1200, 2100);
      const ids = new Set();
      (p.sections || []).forEach((s, i) => {
        if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) bad('blog', p.slug, `section ${i} needs a slug id`);
        if (ids.has(s.id)) bad('blog', p.slug, `duplicate section id ${s.id}`); ids.add(s.id);
      });
      checkFaq('blog', p, p.slug, 4, 6);
      if (!Array.isArray(p.related) || p.related.length < 3) bad('blog', p.slug, 'related needs 3+ internal paths');
      else for (const r of p.related) if (!r.startsWith('/')) bad('blog', p.slug, `related must be an internal path: ${r}`);
      report[`/blog/${p.slug}`] = { words: w, keywords: p.keywords };
    }
  }
}

if (!only || only === 'pages') {
  const data = load('pages');
  if (data) {
    for (const [key, p] of Object.entries(data)) {
      checkMeta('pages', p, key);
      if (p.sections) p.sections.forEach((s, i) => { checkText('pages', key, `section ${i} h2`, s.h2); checkHtml('pages', key, `section ${i} html`, s.html); });
      if (p.faq) checkFaq('pages', p, key, 1, 8);
      report[`/${key === 'home' ? '' : key}`] = { words: p.sections ? p.sections.reduce((n, s) => n + words(s.html), 0) : 0, keywords: p.keywords };
    }
  }
}

if (process.argv.includes('--report')) {
  fs.writeFileSync(path.join(ROOT, 'content', 'keyword-report.json'), JSON.stringify(report, null, 2));
  console.log('wrote content/keyword-report.json');
}
console.log(problems ? `\n${problems} problem(s) found` : '\nAll content checks passed');
process.exit(problems ? 1 : 0);
