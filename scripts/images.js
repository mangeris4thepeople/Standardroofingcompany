#!/usr/bin/env node
// Generates every raster image the site uses (WebP illustrations, OG cards, logo) from
// SVG drawn in code. Run once after changing content or art: `node scripts/images.js`.
// Outputs are committed under public/images so the Vercel build needs no image tooling.
const fs = require('fs');
const path = require('path');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const { load } = require('./lib/content');

const OUT = path.join(__dirname, '..', 'public', 'images');
const C = { void: '#050806', g900: '#0c1410', g800: '#121e17', g700: '#1a2a20', g600: '#27402f', brass: '#a8844e', brassL: '#cdb07a', bone: '#ddd6c6', white: '#f1ece0', slate: '#8f978f' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function sky(id = 'sky') {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1712"/><stop offset=".45" stop-color="#16231a"/><stop offset=".8" stop-color="#2a3a24"/><stop offset="1" stop-color="#46562e"/></linearGradient>
<radialGradient id="${id}-glow" cx=".7" cy=".6" r=".5"><stop offset="0" stop-color="#7a8c46" stop-opacity=".5"/><stop offset="1" stop-color="#5b6b3a" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050806" stop-opacity="0"/><stop offset="1" stop-color="#050806" stop-opacity=".9"/></linearGradient>
<filter id="${id}-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="18"/></filter></defs>
<rect width="1200" height="800" fill="url(#${id})"/><rect width="1200" height="800" fill="url(#${id}-glow)"/>
<g filter="url(#${id}-blur)"><ellipse cx="220" cy="70" rx="420" ry="130" fill="#030504"/><ellipse cx="800" cy="90" rx="520" ry="150" fill="#060a08"/><ellipse cx="1120" cy="170" rx="330" ry="130" fill="#040705"/><ellipse cx="640" cy="230" rx="420" ry="55" fill="#1d2a1f"/></g>
<path d="M0 520 L140 420 L260 470 L400 360 L530 450 L680 350 L820 430 L960 380 L1100 300 L1200 370 V800 H0Z" fill="#070c09"/>`;
}

// A roof plane in mild perspective: the quadrilateral we fill with a material pattern.
const ROOF = 'M120 760 L560 330 L1120 330 L1200 760 Z';
const RIDGE = 'M548 324 L1128 324';

function patternShingle(id, fill = '#0c1510', line = '#040705') {
  return `<pattern id="${id}" width="64" height="30" patternUnits="userSpaceOnUse"><rect width="64" height="30" fill="${fill}"/><path d="M0 29.5h64M32 0v15M0 15h64M16 15v15M48 15v15" stroke="${line}" stroke-width="2"/><path d="M0 14h64" stroke="#17241b" stroke-width="1"/></pattern>`;
}
function patternSeam(id, gap = 54) {
  return `<pattern id="${id}" width="${gap}" height="800" patternUnits="userSpaceOnUse" patternTransform="skewX(-16)"><rect width="${gap}" height="800" fill="#1b2a22"/><rect x="0" width="5" height="800" fill="#0a120d"/><rect x="5" width="3" height="800" fill="#33483a"/><rect x="${gap - 4}" width="4" height="800" fill="#0a120d"/></pattern>`;
}
function patternSlate(id) {
  const cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const tone = ['#1a2328', '#202b30', '#161e22', '#1d2529'][(r + c) % 4];
    cells.push(`<rect x="${c * 30 + (r % 2 ? 15 : 0)}" y="${r * 22}" width="29" height="23" fill="${tone}" stroke="#05080a" stroke-width="1.5"/>`);
  }
  return `<pattern id="${id}" width="120" height="88" patternUnits="userSpaceOnUse">${cells.join('')}</pattern>`;
}
function patternTile(id) {
  return `<pattern id="${id}" width="48" height="36" patternUnits="userSpaceOnUse"><rect width="48" height="36" fill="#3a2a22"/><path d="M0 36 C12 22, 36 22, 48 36" fill="#5b3f30" stroke="#1d130f" stroke-width="2"/><path d="M0 18 C12 4, 36 4, 48 18" fill="#6a4a37" stroke="#1d130f" stroke-width="2"/><path d="M0 0 C12 -14, 36 -14, 48 0" fill="#5b3f30" stroke="#1d130f" stroke-width="2"/></pattern>`;
}
function patternCedar(id, tone = ['#4a3824', '#5a4530', '#3f2f1e', '#55412b']) {
  const cells = [];
  let x = 0; let i = 0;
  const widths = [26, 34, 22, 30, 28, 20, 36];
  for (let r = 0; r < 3; r++) {
    x = r % 2 ? -14 : 0;
    while (x < 200) { const w = widths[(i + r) % widths.length]; cells.push(`<rect x="${x}" y="${r * 34}" width="${w - 2}" height="36" fill="${tone[i % tone.length]}" stroke="#120d08" stroke-width="2"/>`); x += w; i++; }
  }
  return `<pattern id="${id}" width="196" height="102" patternUnits="userSpaceOnUse">${cells.join('')}</pattern>`;
}
function patternMembrane(id, fill = '#9fa49a') {
  return `<pattern id="${id}" width="140" height="140" patternUnits="userSpaceOnUse"><rect width="140" height="140" fill="${fill}"/><path d="M0 139h140M139 0v140" stroke="#7d8278" stroke-width="3"/></pattern>`;
}

function roofScene(pattern, extra = '', opts = {}) {
  return `<g><path d="${ROOF}" fill="url(#p)" stroke="#030504" stroke-width="3"/>${extra}<path d="${RIDGE}" stroke="${C.brass}" stroke-width="8"/><path d="M120 760 L560 330" stroke="${C.brass}" stroke-width="5" opacity=".9"/></g>`;
}

const ART = {
  'metal-roofing': () => ({ defs: patternSeam('p', 70), extra: `<g opacity=".25"><path d="M680 330 L600 760" stroke="#9aa58f" stroke-width="40" filter="url(#sky-blur)"/></g>` }),
  'standing-seam-metal-roofing': () => ({ defs: patternSeam('p', 44), extra: `<g><rect x="760" y="520" width="150" height="10" rx="3" fill="${C.brassL}" opacity=".9"/><rect x="820" y="590" width="150" height="10" rx="3" fill="${C.brassL}" opacity=".9"/></g>` }),
  'slate-roofing': () => ({ defs: patternSlate('p'), extra: '' }),
  'tile-roofing': () => ({ defs: patternTile('p'), extra: '' }),
  'cedar-shake-roofing': () => ({ defs: patternCedar('p'), extra: '' }),
  'synthetic-roofing': () => ({ defs: patternCedar('p', ['#2b2f33', '#343a3f', '#262a2e', '#30363b']), extra: '' }),
  'roof-coatings': () => ({ flat: true, defs: patternMembrane('p', '#c9cbc2'), extra: `<rect x="700" y="380" width="170" height="110" fill="#262b26" stroke="#0c100d" stroke-width="3"/><rect x="720" y="360" width="130" height="24" fill="#3a403a"/><path d="M160 470 L1140 470" stroke="#eef0e8" stroke-width="22" opacity=".5"/>` }),
  'commercial-roofing': () => ({ flat: true, defs: patternMembrane('p', '#8a8f86'), extra: `<rect x="360" y="400" width="200" height="120" fill="#262b26" stroke="#0c100d" stroke-width="3"/><rect x="860" y="430" width="150" height="90" fill="#262b26" stroke="#0c100d" stroke-width="3"/><circle cx="640" cy="560" r="18" fill="#3a403a" stroke="#0c100d" stroke-width="3"/>` }),
  'roof-repair': () => ({ defs: patternShingle('p'), extra: `<rect x="760" y="470" width="200" height="110" fill="#1c2b22" stroke="${C.brassL}" stroke-width="4" stroke-dasharray="12 8"/><path d="M800 525h120M860 500v50" stroke="${C.brassL}" stroke-width="5"/>` }),
  'hail-damage-roof-repair': () => ({ defs: patternShingle('p'), extra: [[700, 440], [820, 500], [930, 420], [760, 600], [1000, 560], [880, 650], [660, 540]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#0a120d" stroke="#5f6b5a" stroke-width="3"/><circle cx="${x - 4}" cy="${y - 4}" r="6" fill="#36423a"/>`).join('') + `<g stroke="#d9dccb" stroke-width="2.5" stroke-linecap="round" opacity=".7">${[[200, 120], [330, 60], [460, 160], [590, 90], [720, 40], [850, 150], [980, 70], [1100, 120], [260, 240], [520, 250], [900, 250]].map(([x, y]) => `<path d="M${x} ${y} l-6 18"/>`).join('')}</g>` }),
  'storm-damage-roofing': () => ({ defs: patternShingle('p'), extra: `<path d="M880 470 L940 420 L1010 470 L950 520Z" fill="#1f2d24" stroke="${C.brassL}" stroke-width="3"/><g stroke="#9aa58f" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M200 160 q60 -30 120 0 t120 0"/><path d="M300 230 q60 -30 120 0 t120 0"/><path d="M700 150 q60 -30 120 0 t120 0"/></g>` }),
  'roof-inspections': () => ({ defs: patternShingle('p'), extra: `<circle cx="850" cy="520" r="110" fill="none" stroke="${C.brassL}" stroke-width="10"/><path d="M930 600 L1040 710" stroke="${C.brassL}" stroke-width="16" stroke-linecap="round"/><circle cx="850" cy="520" r="98" fill="#f1ece0" opacity=".06"/>` }),
  'roof-replacement': () => ({ defs: patternShingle('p'), extra: `<path d="M560 330 L1120 330 L1140 420 L580 420Z" fill="#6b5a3a"/><path d="M580 420 L1140 420 L1165 520 L600 520Z" fill="#2b2f2b"/><path d="M600 520 L1165 520 L1200 760 L720 760Z" fill="url(#p)"/><path d="M580 420 L1140 420" stroke="#d9c9a0" stroke-width="3"/><path d="M600 520 L1165 520" stroke="#0a120d" stroke-width="3"/>` }),
  'insurance-claim-roofing': () => ({ defs: patternShingle('p'), extra: `<rect x="740" y="430" width="230" height="290" rx="8" fill="#ddd6c6" stroke="#8d7a4f" stroke-width="4"/><rect x="800" y="412" width="110" height="36" rx="6" fill="#8d7a4f"/><g stroke="#27402f" stroke-width="8" stroke-linecap="round"><path d="M775 510h160M775 560h160M775 610h110"/></g><path d="M770 670 l20 20 40 -45" fill="none" stroke="#27402f" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` }),
  'front-range': () => ({ defs: patternShingle('p'), extra: `<g stroke="#d9dccb" stroke-width="2" stroke-linecap="round" opacity=".5">${[[150, 120], [300, 80], [450, 170], [600, 60], [750, 140], [900, 90], [1050, 160]].map(([x, y]) => `<path d="M${x} ${y} l-6 18"/>`).join('')}</g>` }),
  'mountain': () => ({ defs: patternSeam('p', 50), extra: `<path d="M0 420 L180 250 L300 330 L430 200 L560 300 L700 180 L860 290 L1000 210 L1200 330" fill="none" stroke="#9aa58f" stroke-width="3" opacity=".5"/><path d="M560 330 L1120 330 L1140 300 L580 300Z" fill="#e8ebe2" opacity=".85"/><path d="M120 760 L560 330 L580 300 L140 740Z" fill="#e8ebe2" opacity=".55"/>` }),
  'casualty': () => ({ defs: patternShingle('p'), extra: `<rect x="720" y="420" width="260" height="300" rx="6" fill="#ddd6c6" stroke="#8d7a4f" stroke-width="4"/><g stroke="#27402f" stroke-width="6" stroke-linecap="round"><path d="M750 480h200M750 520h200M750 560h140M750 600h200M750 640h90"/></g><rect x="880" y="620" width="70" height="70" rx="35" fill="none" stroke="${C.brass}" stroke-width="6"/>` }),
  'blog': () => ({ defs: patternShingle('p'), extra: '' }),
};

function flatScene(extra) {
  return `<g><path d="M160 480 L1140 480 L1200 560 L120 560Z" fill="#0b120e"/><path d="M160 480 L1140 480 L1140 440 L160 440Z" fill="url(#p)" stroke="#0a0f0c" stroke-width="3"/><path d="M160 440 L1140 440" stroke="${C.brass}" stroke-width="8"/>${extra}</g>`;
}

function sceneSvg(key, label) {
  const art = (ART[key] || ART.blog)();
  const body = art.flat ? flatScene(art.extra) : roofScene('p', art.extra);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">${sky('sky')}<defs>${art.defs}</defs>${body}<rect y="640" width="1200" height="160" fill="url(#sky-fog)"/>
<text x="64" y="730" font-family="Barlow Condensed ExtraBold, Barlow Condensed, DejaVu Sans Condensed, sans-serif" font-weight="800" font-size="54" fill="${C.white}" letter-spacing="2">${esc(label.toUpperCase())}</text>
<text x="64" y="764" font-family="Barlow Condensed, DejaVu Sans Condensed, sans-serif" font-weight="700" font-size="22" fill="${C.brassL}" letter-spacing="6">STANDARD ROOFING COMPANY | LOVELAND, COLORADO</text></svg>`;
}

function wrapTitle(t, max = 26) {
  const out = []; let line = '';
  for (const w of t.split(' ')) { if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  if (line) out.push(line);
  return out.slice(0, 3);
}

function ogSvg(title, kicker, key) {
  const art = (ART[key] || ART.blog)();
  const lines = wrapTitle(title);
  const size = lines.some((l) => l.length > 22) ? 72 : 84;
  const text = lines.map((l, i) => `<text x="70" y="${300 + i * (size + 8)}" font-family="Barlow Condensed ExtraBold, Barlow Condensed, DejaVu Sans Condensed, sans-serif" font-weight="800" font-size="${size}" fill="${C.white}" letter-spacing="1">${esc(l.toUpperCase())}</text>`).join('');
  const body = art.flat ? flatScene(art.extra) : roofScene('p', art.extra);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><g transform="translate(0,-85)">${sky('sky')}<defs>${art.defs}</defs><g transform="translate(300,60) scale(.75)" opacity=".55">${body}</g></g>
<rect width="1200" height="630" fill="#050806" opacity=".35"/><rect width="640" height="630" fill="url(#sky-fog)" transform="rotate(-90 315 315) translate(-25)"/>
<text x="70" y="200" font-family="Barlow Condensed, DejaVu Sans Condensed, sans-serif" font-weight="700" font-size="26" fill="${C.brass}" letter-spacing="8">${esc(kicker.toUpperCase())}</text>${text}
<rect x="70" y="520" width="80" height="4" fill="${C.brass}"/>
<text x="70" y="572" font-family="Barlow Condensed, DejaVu Sans Condensed, sans-serif" font-weight="700" font-size="30" fill="${C.bone}" letter-spacing="5">STANDARD ROOFING COMPANY</text>
<text x="70" y="604" font-family="Barlow, DejaVu Sans, sans-serif" font-size="20" fill="${C.slate}">Loveland, Colorado | Northern Colorado and the mountains | standardroofingcompany.net</text></svg>`;
}

function logoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><rect width="512" height="512" rx="64" fill="#050806"/><path d="M64 352 L256 160 L448 352" fill="none" stroke="${C.brass}" stroke-width="34" stroke-linejoin="miter"/><path d="M256 160v60" stroke="${C.brass}" stroke-width="14"/><text x="256" y="430" text-anchor="middle" font-family="Barlow Condensed Black, Barlow Condensed, DejaVu Sans Condensed, sans-serif" font-weight="900" font-size="92" fill="${C.white}" letter-spacing="4">SRC</text></svg>`;
}

async function writeWebp(svg, file, width) {
  await sharp(Buffer.from(svg)).resize(width).webp({ quality: 78 }).toFile(file);
}
async function writePng(svg, file, width) {
  await sharp(Buffer.from(svg)).resize(width).png({ compressionLevel: 9, palette: true }).toFile(file);
}

async function main() {
  const model = load();
  const dirs = ['services', 'areas', 'casualty', 'blog', 'og', 'gallery'];
  for (const d of dirs) fs.mkdirSync(path.join(OUT, d), { recursive: true });

  const jobs = [];
  const scene = (key, label, dir, name) => {
    const svg = sceneSvg(key, label);
    jobs.push(writeWebp(svg, path.join(OUT, dir, `${name}-1200.webp`), 1200));
    jobs.push(writeWebp(svg, path.join(OUT, dir, `${name}-600.webp`), 600));
  };
  const og = (key, title, kicker, name) => jobs.push(writePng(ogSvg(title, kicker, key), path.join(OUT, 'og', `${name}.png`), 1200));

  for (const s of model.services) { scene(s.slug, s.name, 'services', s.slug); og(s.slug, s.name, 'Roofing services, Colorado', 'service-' + s.slug); }
  scene('front-range', 'Northern Colorado', 'areas', 'front-range');
  scene('mountain', 'Mountain Towns', 'areas', 'mountain');
  for (const c of model.cities) og(c.region === 'mountain' ? 'mountain' : 'front-range', `Roofing in ${c.name}, CO`, c.county, 'city-' + c.slug);
  scene('casualty', 'Casualty and Litigation', 'casualty', 'casualty');
  og('casualty', 'Casualty and Litigation Support', 'For attorneys and adjusters', 'casualty');
  for (const p of model.casualty.pages || []) og('casualty', p.name, 'Casualty and litigation', 'casualty-' + p.slug);
  const cats = {};
  for (const p of model.blog) {
    const cat = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const key = { 'hail-and-storms': 'hail-damage-roof-repair', materials: 'slate-roofing', insurance: 'insurance-claim-roofing', maintenance: 'roof-inspections', commercial: 'commercial-roofing', mountain: 'mountain', 'buying-a-roof': 'roof-replacement' }[cat] || 'blog';
    if (!cats[cat]) { cats[cat] = true; scene(key, p.category, 'blog', cat); }
    og(key, p.h1.replace(/\s*\(.*?\)\s*/g, ' ').trim(), 'From the blog', 'blog-' + p.slug);
  }
  const statics = [
    ['home', 'Roofing Contractor Loveland, Colorado', 'Standard Roofing Company', 'front-range'],
    ['services', 'Roofing Services in Northern Colorado', 'Residential and commercial', 'roof-replacement'],
    ['service-areas', 'Roofing Service Areas', 'Front Range and mountain towns', 'mountain'],
    ['about', 'About Standard Roofing Company', 'Loveland, Colorado', 'front-range'],
    ['financing', 'Roof Financing in Colorado', 'Pay over time', 'insurance-claim-roofing'],
    ['warranty', 'Roofing Warranty Explained', 'What is covered', 'roof-replacement'],
    ['gallery', 'Roofing Systems Gallery', 'Metal, slate, tile, cedar, synthetic', 'slate-roofing'],
    ['reviews', 'Reviews', 'Standard Roofing Company', 'front-range'],
    ['contact', 'Contact Standard Roofing Company', 'Loveland, Colorado', 'roof-inspections'],
    ['free-roof-inspection', 'Free Roof Inspection', 'Northern Colorado and the mountains', 'roof-inspections'],
    ['blog', 'Colorado Roofing Guides', 'The Standard Roofing blog', 'blog'],
    ['404', 'Page Not Found', 'Standard Roofing Company', 'storm-damage-roofing'],
  ];
  for (const [name, title, kicker, key] of statics) og(key, title, kicker, name);
  // Gallery: one illustration per specialty system plus commercial and replacement.
  for (const s of model.services) {
    const svg = sceneSvg(s.slug, s.name);
    jobs.push(writeWebp(svg, path.join(OUT, 'gallery', `${s.slug}-1200.webp`), 1200));
    jobs.push(writeWebp(svg, path.join(OUT, 'gallery', `${s.slug}-600.webp`), 600));
  }
  jobs.push(writePng(logoSvg(512), path.join(OUT, 'logo-512.png'), 512));
  jobs.push(writePng(ogSvg('Roofing Contractor Loveland, Colorado', 'Standard Roofing Company', 'front-range'), path.join(OUT, 'og-image.png'), 1200));
  await Promise.all(jobs);
  console.log(`wrote ${jobs.length} images to public/images`);
}

main().catch((e) => { console.error(e); process.exit(1); });
