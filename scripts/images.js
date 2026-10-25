#!/usr/bin/env node
// Generates every raster image the site uses (WebP illustrations, OG cards, logo, favicons)
// from SVG drawn in code. Run after changing content or art: `node scripts/images.js`.
// Outputs are committed under public/ so the Vercel build needs no image tooling.
//
// Art direction (Copper and Granite): close-up, text-free material studies and
// illustrated scenes. No words are baked into card art, so any crop stays clean.
// OG share cards are the only images that carry text.
const fs = require('fs');
const path = require('path');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const { load } = require('./lib/content');

const PUB = path.join(__dirname, '..', 'public');
const OUT = path.join(PUB, 'images');
const C = {
  ink: '#14171b', ink2: '#1d2228', storm: '#24384a', storm2: '#3a5470', steel: '#8d9aa6',
  copper: '#c4672f', copperL: '#e8a06c', copperD: '#8a4219', paper: '#f6f3ee', bone: '#e7e0d4', white: '#ffffff',
};
const DISPLAY = 'ArchivoX Black, Archivo, DejaVu Sans, sans-serif';
const DISPLAY_B = 'ArchivoX Bold, Archivo, DejaVu Sans, sans-serif';
const BODY = 'ArchivoN Regular, Archivo, DejaVu Sans, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Deterministic randomness so rebuilds produce identical files.
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// ---------- shared finishing layers ----------
function finish(id, opts = {}) {
  const grain = opts.grain === false ? '' : `<rect width="1200" height="800" filter="url(#${id}-gr)" opacity="${opts.grainOpacity || 0.5}"/>`;
  return `<defs>
<filter id="${id}-gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${opts.grainFreq || 0.9}" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -0.78"/></filter>
<linearGradient id="${id}-sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${opts.sun == null ? 0.22 : opts.sun}"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${opts.vig == null ? 0.5 : opts.vig}"/></radialGradient>
</defs>${grain}<rect width="1200" height="800" fill="url(#${id}-sun)"/><rect width="1200" height="800" fill="url(#${id}-vig)"/>`;
}

// Copper ridge cap crossing the top of a material study.
function ridge(id, y1 = 150, y2 = 70) {
  return `<defs><linearGradient id="${id}-rc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.copperL}"/><stop offset=".45" stop-color="${C.copper}"/><stop offset="1" stop-color="${C.copperD}"/></linearGradient></defs>
<path d="M-20 ${y1 + 26} L1220 ${y2 + 26} L1220 ${y2 + 60} L-20 ${y1 + 60}Z" fill="#000" opacity=".35"/>
<path d="M-20 ${y1} L1220 ${y2} L1220 ${y2 + 44} L-20 ${y1 + 44}Z" fill="url(#${id}-rc)"/>
<path d="M-20 ${y1 + 3} L1220 ${y2 + 3}" stroke="#ffd2ad" stroke-width="3" opacity=".75"/>
<path d="M-20 ${y1 - 400} L1220 ${y2 - 400} L1220 ${y2} L-20 ${y1}Z" fill="${C.ink}"/>
<path d="M-20 ${y1 - 400} L1220 ${y2 - 400} L1220 ${y2} L-20 ${y1}Z" fill="url(#${id}-skyc)"/>
<defs><linearGradient id="${id}-skyc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.storm}"/><stop offset="1" stop-color="${C.storm2}"/></linearGradient></defs>`;
}

// ---------- material builders (each returns SVG drawn over a 1200x800 field) ----------
function shingles(seed = 1, opts = {}) {
  const r = rng(seed);
  const tones = opts.tones || ['#3d4146', '#363a3f', '#43474c', '#33373b', '#3a3e43'];
  const out = [];
  const course = 64, tab = 104;
  for (let row = -4; row < 18; row++) {
    const y = row * course;
    const off = (row % 2 ? tab / 2 : 0) + (r() * 10 - 5);
    for (let x = -tab * 3 + off; x < 1500; x += tab) {
      const t = pick(r, tones);
      out.push(`<rect x="${x.toFixed(1)}" y="${y}" width="${tab - 3}" height="${course + 4}" fill="${t}"/>`);
    }
    out.push(`<rect x="-400" y="${y + course - 2}" width="2000" height="8" fill="#16181b" opacity=".85"/>`);
    out.push(`<rect x="-400" y="${y + course + 6}" width="2000" height="2" fill="#5a5f66" opacity=".35"/>`);
  }
  return `<g transform="rotate(${opts.rot == null ? -5 : opts.rot} 600 400)">${out.join('')}</g>`;
}

function slates(seed = 2, tones, opts = {}) {
  const r = rng(seed);
  tones = tones || ['#4a535d', '#556069', '#3f4851', '#5e6973', '#4c5660', '#58626c'];
  const out = [];
  const exp = opts.exp || 98, h = exp * 2;
  for (let row = -4; row < 14; row++) {
    const y = row * exp;
    let x = -300 + (row % 2 ? -55 : 0);
    while (x < 1500) {
      const w = (opts.uniform ? 140 : 118 + Math.floor(r() * 62));
      const t = pick(r, tones);
      const ch = opts.chamfer ? `<path d="M${x + 2} ${y + h - 14} L${x + 16} ${y + h} L${x + 2} ${y + h}Z" fill="#101215"/><path d="M${x + w - 4} ${y + h - 14} L${x + w - 18} ${y + h} L${x + w - 4} ${y + h}Z" fill="#101215"/>` : '';
      out.push(`<rect x="${x}" y="${y}" width="${w - 4}" height="${h}" fill="${t}" rx="2"/><rect x="${x}" y="${y + h - 5}" width="${w - 4}" height="5" fill="#000" opacity=".35"/><rect x="${x}" y="${y + exp}" width="${w - 4}" height="2" fill="#fff" opacity=".08"/>${ch}`);
      x += w;
    }
    out.push(`<rect x="-400" y="${y + exp - 1}" width="2000" height="6" fill="#0d0f12" opacity=".55"/>`);
  }
  return `<g transform="rotate(${opts.rot == null ? -4 : opts.rot} 600 400)">${out.join('')}</g>`;
}

function cedar(seed = 3) {
  const r = rng(seed);
  const tones = ['#8a5a32', '#9b6a3d', '#7a4d2a', '#a77548', '#6f4524', '#93633a'];
  const out = [];
  const exp = 84;
  for (let row = -4; row < 14; row++) {
    const y = row * exp;
    let x = -300 + r() * 60;
    while (x < 1500) {
      const w = 48 + Math.floor(r() * 92);
      const t = pick(r, tones);
      let grain = '';
      for (let g = 0; g < 4; g++) { const gx = x + 6 + r() * (w - 16); grain += `<path d="M${gx.toFixed(1)} ${y + 4} q${(r() * 6 - 3).toFixed(1)} ${exp} ${(r() * 4 - 2).toFixed(1)} ${exp * 2 - 10}" stroke="#3a2412" stroke-width="${(1 + r() * 1.5).toFixed(1)}" fill="none" opacity=".35"/>`; }
      out.push(`<rect x="${x.toFixed(1)}" y="${y}" width="${w - 5}" height="${exp * 2}" fill="${t}"/>${grain}<path d="M${x.toFixed(1)} ${y + exp * 2 - 4} l${w - 5} ${(r() * 8 - 4).toFixed(1)}" stroke="#2a190b" stroke-width="5" opacity=".6"/>`);
      x += w;
    }
    out.push(`<rect x="-400" y="${y + exp - 2}" width="2000" height="7" fill="#1e1309" opacity=".7"/>`);
  }
  return `<g transform="rotate(-4 600 400)">${out.join('')}</g>`;
}

function barrelTile() {
  const out = [`<defs><linearGradient id="cap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a321a"/><stop offset=".3" stop-color="#c2643a"/><stop offset=".55" stop-color="#e2915e"/><stop offset=".8" stop-color="#b65630"/><stop offset="1" stop-color="#6c2b15"/></linearGradient>
<linearGradient id="pan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4f1f0e"/><stop offset=".5" stop-color="#8e4023"/><stop offset="1" stop-color="#4f1f0e"/></linearGradient></defs>`];
  const colW = 150, course = 120;
  for (let x = -300; x < 1500; x += colW) out.push(`<rect x="${x}" y="-400" width="${colW}" height="1700" fill="url(#pan)"/>`);
  for (let x = -300; x < 1500; x += colW) {
    for (let y = -400; y < 1300; y += course) {
      out.push(`<path d="M${x + colW / 2 - 52} ${y + course + 8} C${x + colW / 2 - 58} ${y + 30}, ${x + colW / 2 + 58} ${y + 30}, ${x + colW / 2 + 52} ${y + course + 8} Z" fill="#000" opacity=".3" transform="translate(6 6)"/>`);
      out.push(`<path d="M${x + colW / 2 - 52} ${y + course + 8} L${x + colW / 2 - 46} ${y} L${x + colW / 2 + 46} ${y} L${x + colW / 2 + 52} ${y + course + 8} Z" fill="url(#cap)"/>`);
      out.push(`<path d="M${x + colW / 2 - 52} ${y + course + 6} Q${x + colW / 2} ${y + course - 14} ${x + colW / 2 + 52} ${y + course + 6}" stroke="#3d160a" stroke-width="5" fill="none" opacity=".75"/>`);
    }
  }
  return `<g transform="rotate(-6 600 400)">${out.join('')}</g>`;
}

function seams(opts = {}) {
  const w = opts.width || 132;
  const base = opts.base || ['#7e3c19', '#c06a36', '#e49a64', '#b25c2c', '#723414'];
  const out = [`<defs><linearGradient id="pnl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${base[0]}"/><stop offset=".25" stop-color="${base[1]}"/><stop offset=".5" stop-color="${base[2]}"/><stop offset=".78" stop-color="${base[3]}"/><stop offset="1" stop-color="${base[4]}"/></linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>`];
  for (let x = -400; x < 1600; x += w) {
    out.push(`<rect x="${x}" y="-400" width="${w}" height="1700" fill="url(#pnl)"/>`);
    out.push(`<rect x="${x + w - 12}" y="-400" width="5" height="1700" fill="${opts.rib || '#ffd0a6'}" opacity=".85"/><rect x="${x + w - 7}" y="-400" width="9" height="1700" fill="#000" opacity=".45"/>`);
    if (opts.fasteners) for (let y = -360; y < 1300; y += 170) out.push(`<circle cx="${x + w / 2}" cy="${y}" r="6" fill="#20262c"/><circle cx="${x + w / 2 - 2}" cy="${y - 2}" r="2.5" fill="#cfd6dc" opacity=".6"/>`);
    if (opts.ribs) for (let k = 1; k < 3; k++) out.push(`<rect x="${x + (w * k) / 3 - 2}" y="-400" width="4" height="1700" fill="#000" opacity=".18"/>`);
  }
  out.push(`<rect x="-400" y="-400" width="2000" height="1700" fill="url(#sheen)"/>`);
  return `<g transform="translate(600 400) rotate(${opts.rot == null ? 10 : opts.rot}) translate(-600 -400)">${out.join('')}</g>`;
}

function membrane(fill, seam, seed = 4) {
  const r = rng(seed);
  const out = [`<rect x="-200" y="-200" width="1600" height="1200" fill="${fill}"/>`];
  for (let x = -200; x < 1400; x += 230) out.push(`<rect x="${x}" y="-200" width="10" height="1200" fill="${seam}" opacity=".9"/><rect x="${x + 10}" y="-200" width="3" height="1200" fill="#fff" opacity=".5"/>`);
  for (let i = 0; i < 40; i++) out.push(`<circle cx="${(r() * 1200).toFixed(0)}" cy="${(r() * 800).toFixed(0)}" r="${(20 + r() * 80).toFixed(0)}" fill="#000" opacity="${(r() * 0.035).toFixed(3)}"/>`);
  return out.join('');
}

// ---------- badges and marks ----------
const ICONS = {
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  clip: '<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V2.8h6V4"/><path d="M8.5 13l2.5 2.5 4.5-5"/>',
  lens: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5.5 5.5"/>',
  scale: '<path d="M12 3v17"/><path d="M7.5 20.5h9"/><path d="M4.5 7h15"/><path d="M4.5 7l-3 6.5a3.2 3.2 0 0 0 6 0z"/><path d="M19.5 7l-3 6.5a3.2 3.2 0 0 0 6 0z"/>',
  layers: '<path d="M12 3.5l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
};
function badge(icon, cx = 800, cy = 420, rr = 122) {
  const s = (rr * 1.25) / 24;
  return `<g><circle cx="${cx + 10}" cy="${cy + 16}" r="${rr}" fill="#000" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="${rr}" fill="${C.paper}"/><circle cx="${cx}" cy="${cy}" r="${rr - 14}" fill="none" stroke="${C.copper}" stroke-width="5"/>
<g transform="translate(${cx - 12 * s} ${cy - 12 * s}) scale(${s})" fill="none" stroke="${C.ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</g></g>`;
}

function hailHits(seed = 9, chalk = true, count = 26) {
  const r = rng(seed);
  const out = [];
  const pts = [];
  for (let i = 0; i < count; i++) pts.push([120 + r() * 960, 180 + r() * 560]);
  for (const [x, y] of pts) {
    const rr = 9 + r() * 9;
    out.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rr.toFixed(1)}" fill="#15171a"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(rr * 0.55).toFixed(1)}" fill="#0b0c0e"/><path d="M${(x - rr).toFixed(0)} ${(y - 2).toFixed(0)} a${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${(rr * 1.6).toFixed(1)} ${(-rr * 0.7).toFixed(1)}" stroke="#7d828a" stroke-width="2" fill="none" opacity=".6"/>`);
    if (chalk && r() > 0.25) out.push(`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(rr + 14).toFixed(0)}" ry="${(rr + 10).toFixed(0)}" transform="rotate(${(r() * 60 - 30).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})" fill="none" stroke="#f4f1ea" stroke-width="4.5" stroke-dasharray="${(60 + r() * 30).toFixed(0)} 9" opacity=".92"/>`);
  }
  return out.join('');
}

function testSquare() {
  const ticks = [];
  for (let i = 1; i < 10; i++) ticks.push(`<path d="M${300 + i * 34} 214 v16M${300 + i * 34} 540 v-16M300 ${214 + i * 34.4} h16M640 ${214 + i * 34.4} h-16"/>`);
  return `<g transform="rotate(-6 470 380)" stroke="#f4f1ea" stroke-width="6" fill="none" stroke-linecap="round" opacity=".95"><rect x="300" y="214" width="340" height="326"/>${ticks.join('')}</g>`;
}

// ---------- art registry ----------
// Each entry returns a full 1200x800 SVG body.
const ART = {
  'metal-roofing': () => seams({ base: ['#3c454e', '#5b6772', '#7d8a95', '#56626c', '#353d45'], rib: '#c9d2da', fasteners: true, ribs: true, width: 150, rot: 9 }) + ridge('m', 130, 40) + finish('m', { sun: 0.18 }),
  'standing-seam-metal-roofing': () => seams({ rot: 10 }) + ridge('s', 120, 40) + `<g opacity=".95"><rect x="420" y="430" width="560" height="14" rx="3" fill="#e8d9c8" transform="rotate(-4 700 437)"/><rect x="300" y="610" width="560" height="14" rx="3" fill="#e8d9c8" transform="rotate(-4 580 617)"/></g>` + finish('s', { grain: false, sun: 0.25 }),
  'slate-roofing': () => slates(21) + ridge('sl', 140, 60) + finish('sl'),
  'tile-roofing': () => barrelTile() + ridge('t', 110, 30) + finish('t', { grainOpacity: 0.35 }),
  'cedar-shake-roofing': () => cedar(33) + ridge('c', 130, 50) + finish('c', { grainOpacity: 0.35 }),
  'synthetic-roofing': () => slates(44, ['#2c3034', '#33383d', '#282c30', '#3a3f45', '#30353a'], { uniform: true, chamfer: true, exp: 92 }) + ridge('sy', 130, 50) + finish('sy', { sun: 0.3 }),
  'roof-coatings': () => `${membrane('#9da1a3', '#83888b', 5)}<path d="M560 -50 L1260 -50 L1260 850 L360 850Z" fill="#f7f7f4"/><path d="M560 -50 L360 850" stroke="#ffffff" stroke-width="26" opacity=".9"/><path d="M548 -50 L348 850" stroke="#c9ccc9" stroke-width="6"/>
<g transform="rotate(12 470 420)"><rect x="380" y="380" width="200" height="64" rx="30" fill="#e9e9e4" stroke="#b9bcb8" stroke-width="4"/><rect x="380" y="380" width="200" height="22" rx="11" fill="#fff" opacity=".8"/><path d="M590 412 h40 v160 h-24" stroke="${C.ink}" stroke-width="12" fill="none" stroke-linejoin="round"/><rect x="590" y="566" width="30" height="230" rx="8" fill="${C.copper}"/></g>
<rect x="150" y="300" width="180" height="120" fill="#5d6366"/><rect x="150" y="300" width="180" height="20" fill="#767c80"/>` + finish('rc', { grainOpacity: 0.25, vig: 0.4 }),
  'commercial-roofing': () => `${membrane('#e9ebe9', '#c8ccca', 6)}<rect x="0" y="0" width="1200" height="46" fill="#4a5056"/><rect x="0" y="754" width="1200" height="46" fill="#4a5056"/><rect x="0" y="0" width="40" height="800" fill="#4a5056"/>
${[[160, 140, 240, 170], [760, 470, 260, 190]].map(([x, y, w, h]) => `<rect x="${x + 14}" y="${y + 18}" width="${w}" height="${h}" fill="#000" opacity=".22"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#b9bfc4" stroke="#7d858c" stroke-width="4"/><circle cx="${x + w * 0.3}" cy="${y + h * 0.5}" r="${h * 0.3}" fill="#5f676e"/><circle cx="${x + w * 0.3}" cy="${y + h * 0.5}" r="${h * 0.08}" fill="#2d3237"/><path d="M${x + w * 0.62} ${y + 24} v${h - 48} M${x + w * 0.74} ${y + 24} v${h - 48} M${x + w * 0.86} ${y + 24} v${h - 48}" stroke="#7d858c" stroke-width="5"/>`).join('')}
${Array.from({ length: 9 }, (_, i) => `<rect x="${470 + i * 34}" y="${120 + i * 66}" width="64" height="52" fill="#8f969b" stroke="#6c7378" stroke-width="3"/>`).join('')}<circle cx="1040" cy="200" r="26" fill="#6b7279"/><circle cx="1040" cy="200" r="12" fill="#2d3237"/>` + finish('cr', { grainOpacity: 0.2, vig: 0.4, sun: 0.1 }),
  'roof-repair': () => shingles(11) + `<g transform="rotate(-5 600 400)"><rect x="566" y="326" width="101" height="68" fill="#4b4f55"/><rect x="566" y="326" width="101" height="68" fill="none" stroke="${C.copperL}" stroke-width="6" stroke-dasharray="16 10"/></g>` + badge('wrench', 860, 470) + finish('rr'),
  'hail-damage-roof-repair': () => shingles(12) + hailHits(12) + finish('hd'),
  'storm-damage-roofing': () => shingles(13) + `<g transform="rotate(-5 600 400)">${[[360, 256], [464, 256], [412, 320], [880, 576]].map(([x, y]) => `<rect x="${x}" y="${y}" width="101" height="68" fill="#b6b2a6"/><path d="M${x} ${y + 10} h101" stroke="#8e8a7f" stroke-width="3"/><path d="M${x} ${y + 30} h101" stroke="#8e8a7f" stroke-width="2" opacity=".6"/>`).join('')}<path d="M570 330 l110 -60 l-6 76z" fill="#2c3034"/><path d="M570 330 l110 -60" stroke="#5a5f66" stroke-width="3"/></g>` + badge('wind', 840, 470) + finish('sd'),
  'insurance-claim-roofing': () => shingles(14) + hailHits(14, true, 9) + badge('clip', 820, 430) + finish('ic'),
  'roof-inspections': () => shingles(15) + hailHits(15, false, 12) + testSquare() + badge('lens', 900, 560, 104) + finish('ri'),
  'roof-replacement': () => `${shingles(16)}<g transform="rotate(-5 600 400)"><path d="M640 -300 L1500 -300 L1500 1200 L460 1200Z" fill="#c9c7c0"/>${Array.from({ length: 18 }, (_, i) => `<path d="M${640 - i * 0} ${-300 + i * 90} L1500 ${-300 + i * 90}" stroke="#a5a39b" stroke-width="3"/>`).join('')}<path d="M640 -300 L460 1200" stroke="#1a1c1f" stroke-width="10"/>
<path d="M960 -300 L1500 -300 L1500 1200 L820 1200Z" fill="#c59a62"/>${Array.from({ length: 30 }, (_, i) => `<path d="M${960 + i * 22} -300 L${820 + i * 22} 1200" stroke="#a87d47" stroke-width="2" opacity=".5"/>`).join('')}<path d="M950 -300 L810 1200" stroke="#6e512d" stroke-width="6"/><path d="M1250 -300 L1110 1200" stroke="#6e512d" stroke-width="5"/></g>` + finish('rp', { grainOpacity: 0.35 }),
  'casualty': () => slates(51, ['#3c444d', '#454e57', '#373f47', '#4c555e']) + badge('scale', 740, 430, 132) + finish('ca'),
  'front-range': () => sceneFrontRange(),
  'mountain': () => sceneMountain(),
  'blog': () => shingles(17) + ridge('b', 140, 60) + finish('b'),
};

function sceneFrontRange() {
  const r = rng(71);
  const hail = Array.from({ length: 90 }, () => { const x = r() * 1300 - 50, y = r() * 520; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-7 20" />`; }).join('');
  return `<defs><linearGradient id="fr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a24"/><stop offset=".45" stop-color="#24384a"/><stop offset=".78" stop-color="#4d6a84"/><stop offset="1" stop-color="#c49673"/></linearGradient>
<linearGradient id="fr-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f45"/><stop offset="1" stop-color="#25292e"/></linearGradient>
<pattern id="fr-sh" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="40" height="22" fill="url(#fr-roof)"/><path d="M0 21h40M20 0v11M0 11h40M10 11v11M30 11v11" stroke="#17191c" stroke-width="2"/></pattern>
<filter id="fr-b" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter></defs>
<rect width="1200" height="800" fill="url(#fr-sky)"/>
<g filter="url(#fr-b)" opacity=".9"><ellipse cx="250" cy="90" rx="420" ry="120" fill="#0b1118"/><ellipse cx="850" cy="60" rx="520" ry="130" fill="#0e151d"/><ellipse cx="700" cy="250" rx="380" ry="60" fill="#2d4357"/></g>
<path d="M0 470 L120 410 L210 430 L330 350 L410 380 L470 330 L540 372 L640 300 L700 330 L780 290 L900 360 L1010 330 L1200 400 V800 H0Z" fill="#2c3d4f"/>
<path d="M0 540 L160 480 L300 510 L450 450 L600 500 L760 460 L920 510 L1080 470 L1200 500 V800 H0Z" fill="#1f2c39"/>
<g stroke="#e4ebf0" stroke-width="2.2" stroke-linecap="round" opacity=".55">${hail}</g>
<path d="M0 640 L1200 600 V800 H0Z" fill="#141b22"/>
<path d="M420 680 L700 390 L980 680Z" fill="url(#fr-sh)"/>
<path d="M700 390 L1180 390 L1300 680 L980 680Z" fill="url(#fr-sh)"/><path d="M700 390 L1180 390 L1300 680 L980 680Z" fill="#000" opacity=".25"/>
<path d="M694 384 L1186 384" stroke="${C.copper}" stroke-width="12" stroke-linecap="round"/><path d="M412 688 L700 386 L988 688" fill="none" stroke="${C.copper}" stroke-width="10" stroke-linejoin="round"/>
<rect x="520" y="680" width="420" height="140" fill="#e7e0d4"/><rect x="980" y="680" width="300" height="140" fill="#c9c1b2"/>
<rect x="660" y="560" width="80" height="70" fill="#f2b56b"/><path d="M700 560v70M660 595h80" stroke="#7a5326" stroke-width="5"/>
${finish('fr', { grainOpacity: 0.3, sun: 0.05, vig: 0.45 })}`;
}

function sceneMountain() {
  const r = rng(72);
  const snow = Array.from({ length: 80 }, () => `<circle cx="${(r() * 1200).toFixed(0)}" cy="${(r() * 640).toFixed(0)}" r="${(1.5 + r() * 3).toFixed(1)}"/>`).join('');
  const pines = Array.from({ length: 22 }, (_, i) => { const x = i * 60 - 20 + r() * 30, h = 120 + r() * 120, b = 640; return `<path d="M${x.toFixed(0)} ${(b - h).toFixed(0)} L${(x + h * 0.22).toFixed(0)} ${b} L${(x - h * 0.22).toFixed(0)} ${b}Z"/>`; }).join('');
  return `<defs><linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c7d9b"/><stop offset=".6" stop-color="#a9bfd1"/><stop offset="1" stop-color="#e6edf2"/></linearGradient>
<linearGradient id="mt-p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2b3238"/><stop offset=".5" stop-color="#465059"/><stop offset="1" stop-color="#2b3238"/></linearGradient>
<pattern id="mt-seam" width="34" height="100" patternUnits="userSpaceOnUse"><rect width="34" height="100" fill="url(#mt-p)"/><rect x="30" width="4" height="100" fill="#11161a"/><rect x="28" width="2" height="100" fill="#8a96a0"/></pattern></defs>
<rect width="1200" height="800" fill="url(#mt-sky)"/>
<path d="M0 420 L150 300 L240 340 L380 190 L470 260 L560 210 L700 330 L820 230 L960 300 L1080 240 L1200 300 V800 H0Z" fill="#7d93a8"/>
<path d="M380 190 L430 236 L405 240 L440 280 L360 230Z M820 230 L860 262 L835 266 L870 300 L800 262Z M150 300 L190 330 L160 332 L130 320Z" fill="#f5f8fb"/>
<path d="M0 520 L200 430 L330 470 L520 380 L700 470 L880 400 L1060 460 L1200 430 V800 H0Z" fill="#4f6577"/>
<g fill="#22313d">${pines}</g>
<path d="M0 640 H1200 V800 H0Z" fill="#eef3f6"/>
<path d="M330 700 L640 330 L950 700Z" fill="url(#mt-seam)"/>
<path d="M330 700 L640 330 L950 700" fill="none" stroke="${C.copper}" stroke-width="12" stroke-linejoin="round"/>
<path d="M352 676 L640 352 L928 676 L880 690 L640 410 L400 690Z" fill="#f7fafc" opacity=".92"/>
<rect x="390" y="700" width="500" height="120" fill="#6b4a2e"/><rect x="560" y="720" width="160" height="80" fill="#f2b56b"/><path d="M640 720v80M560 760h160" stroke="#4a3018" stroke-width="5"/>
<g fill="#fff" opacity=".85">${snow}</g>
${finish('mt', { grainOpacity: 0.2, sun: 0.1, vig: 0.3 })}`;
}

function art(key) {
  const fn = ART[key] || ART.blog;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="${C.ink}"/>${fn()}</svg>`;
}

// ---------- OG cards (1200x630, the only images with words) ----------
function wrapTitle(t, max = 12) {
  const out = []; let line = '';
  for (const w of t.split(' ')) { if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  if (line) out.push(line);
  return out;
}
function ogSvg(title, kicker, key) {
  const inner = (ART[key] || ART.blog)();
  let lines = wrapTitle(title.toUpperCase());
  if (lines.length > 5) lines = wrapTitle(title.toUpperCase(), 17);
  const size = lines.some((l) => l.length > 13) ? 36 : lines.length > 4 ? 38 : lines.length > 3 ? 44 : lines.some((l) => l.length > 11) ? 48 : 56;
  const top = 214 + size + 16;
  const text = lines.map((l, i) => `<text x="72" y="${top + i * (size + 10)}" font-family="${DISPLAY}" font-size="${size}" fill="${C.white}" letter-spacing="-.5">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><clipPath id="og-clip"><path d="M700 0 H1200 V630 H560Z"/></clipPath></defs>
<rect width="1200" height="630" fill="${C.ink}"/>
<g clip-path="url(#og-clip)"><svg x="420" y="0" width="780" height="630" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"><rect width="1200" height="800" fill="${C.ink}"/>${inner}</svg></g>
<path d="M700 0 L560 630" stroke="${C.copper}" stroke-width="10"/>
${markGlyph(72, 64, 64)}
<text x="152" y="92" font-family="${DISPLAY}" font-size="24" fill="${C.white}" letter-spacing="1">STANDARD ROOFING</text>
<text x="152" y="120" font-family="${DISPLAY_B}" font-size="15" fill="${C.copperL}" letter-spacing="5">LOVELAND, COLORADO</text>
<text x="72" y="214" font-family="${DISPLAY_B}" font-size="18" fill="${C.copperL}" letter-spacing="4">${esc(kicker.toUpperCase())}</text>
${text}
<rect x="72" y="540" width="56" height="5" fill="${C.copper}"/>
<text x="72" y="584" font-family="${BODY}" font-size="21" fill="${C.bone}">Free inspections | (970) 430-5884 | standardroofingcompany.net</text></svg>`;
}

// ---------- logo mark ----------
// A copper roof peak over two courses, inside a graphite tile.
function markGlyph(x, y, size, bg = C.ink2) {
  const s = size / 64;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect width="64" height="64" rx="10" fill="${bg}"/><path d="M11 33 L32 13 L53 33" fill="none" stroke="${C.copper}" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/><path d="M17 40 H47" stroke="${C.bone}" stroke-width="5"/><path d="M17 50 H47" stroke="${C.bone}" stroke-width="5" opacity=".6"/></g>`;
}
function markSvg(size, bg = C.ink) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${markGlyph(0, 0, 64, bg)}</svg>`;
}
function logoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="${C.ink}"/>${markGlyph(156, 96, 200, C.ink2)}
<text x="256" y="380" text-anchor="middle" font-family="${DISPLAY}" font-size="50" fill="${C.white}">STANDARD</text>
<text x="256" y="424" text-anchor="middle" font-family="${DISPLAY_B}" font-size="25" fill="${C.copperL}" letter-spacing="9">ROOFING CO.</text></svg>`;
}

async function writeWebp(svg, file, width) { await sharp(Buffer.from(svg)).resize(width).webp({ quality: 80 }).toFile(file); }
async function writePng(svg, file, width) { await sharp(Buffer.from(svg)).resize(width).png({ compressionLevel: 9, palette: true }).toFile(file); }

async function main() {
  const model = load();
  const only = process.env.ONLY;
  for (const d of ['services', 'areas', 'casualty', 'blog', 'og', 'gallery']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const jobs = [];
  const cache = {};
  const scene = (key, dir, name) => {
    if (only && !only.split(',').includes(key)) return;
    const svg = cache[key] || (cache[key] = art(key));
    jobs.push(writeWebp(svg, path.join(OUT, dir, `${name}-1200.webp`), 1200));
    jobs.push(writeWebp(svg, path.join(OUT, dir, `${name}-600.webp`), 600));
  };
  const og = (key, title, kicker, name) => { if (!only) jobs.push(writePng(ogSvg(title, kicker, key), path.join(OUT, 'og', `${name}.png`), 1200)); };

  for (const s of model.services) { scene(s.slug, 'services', s.slug); scene(s.slug, 'gallery', s.slug); og(s.slug, s.name, 'Roofing services, Colorado', 'service-' + s.slug); }
  scene('front-range', 'areas', 'front-range');
  scene('mountain', 'areas', 'mountain');
  for (const c of model.cities) og(c.region === 'mountain' ? 'mountain' : 'front-range', `Roofing in ${c.name}, CO`, c.county, 'city-' + c.slug);
  scene('casualty', 'casualty', 'casualty');
  og('casualty', 'Casualty and Litigation Support', 'For attorneys and adjusters', 'casualty');
  for (const p of model.casualty.pages || []) og('casualty', p.name, 'Casualty and litigation', 'casualty-' + p.slug);
  const cats = {};
  for (const p of model.blog) {
    const cat = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const key = { 'hail-and-storms': 'hail-damage-roof-repair', materials: 'slate-roofing', insurance: 'insurance-claim-roofing', maintenance: 'roof-inspections', commercial: 'commercial-roofing', mountain: 'mountain', 'buying-a-roof': 'standing-seam-metal-roofing' }[cat] || 'blog';
    if (!cats[cat]) { cats[cat] = true; scene(key, 'blog', cat); }
    og(key, p.h1.replace(/\s*\(.*?\)\s*/g, ' ').trim(), 'From the blog', 'blog-' + p.slug);
  }
  const statics = [
    ['home', 'Roofing Contractor in Loveland, Colorado', 'Standard Roofing Company', 'front-range'],
    ['services', 'Roofing Services in Northern Colorado', 'Every system, done right', 'standing-seam-metal-roofing'],
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
  if (!only) {
    jobs.push(writePng(ogSvg('Roofing Contractor in Loveland, Colorado', 'Standard Roofing Company', 'front-range'), path.join(OUT, 'og-image.png'), 1200));
    jobs.push(writePng(ogSvg('Roofing Contractor in Loveland, Colorado', 'Standard Roofing Company', 'front-range'), path.join(PUB, 'og-image.png'), 1200));
    jobs.push(writePng(logoSvg(), path.join(OUT, 'logo-512.png'), 512));
    jobs.push(writePng(markSvg(180), path.join(PUB, 'apple-touch-icon.png'), 180));
    jobs.push(sharp(Buffer.from(markSvg(48))).resize(32).png().toFile(path.join(PUB, 'favicon-32.png')));
    fs.writeFileSync(path.join(PUB, 'favicon.svg'), markSvg(64));
    // favicon.ico: a single 32px PNG wrapped in an ICO header (supported by every current browser).
    jobs.push(sharp(Buffer.from(markSvg(64))).resize(32).png().toBuffer().then((png) => {
      const head = Buffer.alloc(22);
      head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
      head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
      head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
      fs.writeFileSync(path.join(PUB, 'favicon.ico'), Buffer.concat([head, png]));
    }));
  }
  await Promise.all(jobs);
  console.log(`wrote ${jobs.length} images`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { art, ogSvg, markGlyph, C };
