// HTML helpers, shared components, and JSON-LD builders for the static build.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => stripTags(s).split(' ').filter(Boolean).length;
const readingTime = (html) => Math.max(1, Math.round(words(html) / 220));

const ICON = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V3h6v1"/><path d="M8.5 11h7M8.5 15h5"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  mountain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19l6-10 3.5 5.5L15 11l6 8z"/><path d="M9 9l1.5-2.5L12 9"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l9 5-9 5-9-5 9-5z"/><path d="M3 14l9 5 9-5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
};

function fontCss() {
  const f = (family, weight, file) => `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/${file}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`;
  return [
    f('Barlow', 400, 'barlow-latin-400-normal.woff2'),
    f('Barlow', 500, 'barlow-latin-500-normal.woff2'),
    f('Barlow', 600, 'barlow-latin-600-normal.woff2'),
    f('Barlow Condensed', 600, 'barlow-condensed-latin-600-normal.woff2'),
    f('Barlow Condensed', 700, 'barlow-condensed-latin-700-normal.woff2'),
    f('Barlow Condensed', 800, 'barlow-condensed-latin-800-normal.woff2'),
    f('Barlow Condensed', 900, 'barlow-condensed-latin-900-normal.woff2'),
  ].join('');
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

// ---------- images ----------
function img(src, alt, opts = {}) {
  const w = opts.width || 1200, h = opts.height || 800;
  const base = src.replace(/-1200\.webp$/, '');
  const srcset = opts.noSrcset ? '' : ` srcset="${base}-600.webp 600w, ${base}-1200.webp 1200w" sizes="${opts.sizes || '(max-width: 680px) 100vw, (max-width: 1100px) 60vw, 560px'}"`;
  const lazy = opts.eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"';
  return `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}"${srcset}${lazy} decoding="async"${opts.class ? ` class="${opts.class}"` : ''}>`;
}

// ---------- components ----------
function header(site, current) {
  const links = site.nav.map((n) => `<a href="${n.href}"${current === n.href ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="wrap"><span class="tb-left">Northern Colorado and mountain roofing | Licensed and insured</span><a href="tel:${site.phoneE164}" data-cta="call">${ICON.phone}Call or text ${esc(site.phone)}</a></div></div>
<header class="site-header"><div class="wrap">
<a class="brand" href="/" aria-label="Standard Roofing Company home"><span class="wordmark" aria-hidden="true"><span class="wm-top">Standard</span><span class="wm-rule"></span><span class="wm-bot">Roofing</span></span></a>
<button class="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav">${ICON.menu}</button>
<nav class="nav" id="nav" aria-label="Main"><a href="/"${current === '/' ? ' aria-current="page"' : ''}>Home</a>${links}<a class="btn btn-brass" href="/free-roof-inspection" data-cta="nav">Free Inspection</a></nav>
</div></header>`;
}

function footer(site, model) {
  const svc = model.services.map((s) => `<li><a href="/services/${s.slug}">${esc(s.name)}</a></li>`).join('');
  const noco = model.cities.filter((c) => c.region === 'northern-colorado').map((c) => `<li><a href="/roofing/${c.slug}">${esc(c.name)}</a></li>`).join('');
  const mtn = model.cities.filter((c) => c.region === 'mountain').map((c) => `<li><a href="/roofing/${c.slug}">${esc(c.name)}</a></li>`).join('');
  const cas = (model.casualty.pages || []).map((p) => `<li><a href="/casualty/${p.slug}">${esc(p.name)}</a></li>`).join('');
  const a = site.address;
  return `<footer class="site-footer"><div class="wrap">
<div class="foot-grid">
<div><p class="wordmark" aria-hidden="true"><span class="wm-top">Standard</span><span class="wm-rule"></span><span class="wm-bot">Roofing</span></p>
<p class="foot-about">Residential, commercial, and specialty roofing from Loveland, Colorado. Metal, slate, tile, cedar, synthetic, coatings, hail and storm repair, and insurance claim roofing across Northern Colorado and the mountains.</p>
<address class="foot-nap"><strong>${esc(site.name)}</strong><br>${esc(a.street)}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}<br><a href="tel:${site.phoneE164}">${esc(site.phone)}</a><br><a href="mailto:${site.email}">${esc(site.email)}</a><br>${esc(site.hoursDisplay)}</address></div>
<div><h2 class="foot-h">Services</h2><ul>${svc}<li><a href="/services">All services</a></li></ul></div>
<div><h2 class="foot-h">Northern Colorado</h2><ul>${noco}</ul></div>
<div><h2 class="foot-h">Mountain Towns</h2><ul>${mtn}<li><a href="/service-areas">All service areas</a></li></ul></div>
<div><h2 class="foot-h">Attorneys and Adjusters</h2><ul><li><a href="/casualty">Casualty and litigation</a></li>${cas}</ul></div>
<div><h2 class="foot-h">Company</h2><ul>
<li><a href="/about">About</a></li><li><a href="/free-roof-inspection">Free roof inspection</a></li><li><a href="/financing">Financing</a></li><li><a href="/warranty">Warranty</a></li><li><a href="/gallery">Gallery</a></li><li><a href="/reviews">Reviews</a></li><li><a href="/blog">Blog</a></li><li><a href="/contact">Contact</a></li></ul></div>
</div>
<div class="legal"><span>&copy; <span data-year>2026</span> ${esc(site.name)}. All rights reserved.</span><span>Colorado law (C.R.S. 6-22-105) prohibits roofing contractors from paying, waiving, or rebating an insurance deductible. We never do.</span></div>
</div></footer>
<div class="callbar"><a href="tel:${site.phoneE164}" data-cta="callbar">${ICON.phone}Call</a><a href="/free-roof-inspection" data-cta="callbar">${ICON.home}Free Inspection</a></div>
<a class="sticky-cta" href="/free-roof-inspection" data-cta="sticky">${ICON.clipboard}<span>Get a Free Inspection</span></a>`;
}

function breadcrumbs(items) {
  // items: [{name, href}] ending with current page (no href)
  const parts = items.map((it, i) => (it.href ? `<a href="${it.href}">${esc(it.name)}</a>` : `<span aria-current="page">${esc(it.name)}</span>`) + (i < items.length - 1 ? '<span aria-hidden="true">/</span>' : ''));
  return `<nav class="crumbs" aria-label="Breadcrumb">${parts.join('')}</nav>`;
}

function trustStrip(site) {
  const icons = [ICON.shield, ICON.mountain, ICON.layers, ICON.search];
  return `<div class="strip" aria-label="Why Standard Roofing"><div class="wrap">${site.trust.map((t, i) => `<div class="item">${icons[i]}<div><strong>${esc(t.title)}</strong><span>${esc(t.text)}</span></div></div>`).join('')}</div></div>`;
}

function faqBlock(faq, heading) {
  if (!faq || !faq.length) return '';
  return `<section class="sec-faq" id="faq"><div class="wrap narrow"><div class="sec-head"><span class="eyebrow">Questions</span><h2>${esc(heading || 'Frequently asked questions')}</h2></div><div class="faq">${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div></div></section>`;
}

function sectionsBlock(sections, opts = {}) {
  return sections.map((s) => `<section class="prose-sec"${s.id ? ` id="${s.id}"` : ''}><h2>${esc(s.h2)}</h2>${s.html}</section>`).join('');
}

function quoteForm(site, opts = {}) {
  const kind = opts.kind || 'quote';
  const id = opts.id || 'quote-form';
  const title = opts.title || 'Get a free roof inspection';
  const intro = opts.intro || 'Tell us about the roof and attach a few photos if you have them. We reply within one business day with next steps.';
  const cityOpt = opts.city ? `<input type="hidden" name="city" value="${esc(opts.city)}">` : '';
  const svcOpt = opts.service ? `<input type="hidden" name="service" value="${esc(opts.service)}">` : '';
  return `<section class="sec-quote" id="quote"><div class="wrap split">
<div class="reveal"><span class="eyebrow">Free Inspection</span><h2>${esc(title)}</h2><p class="lede">${esc(intro)}</p>
<ul class="checks">
<li>${ICON.check}<div><strong>Photo-documented.</strong> Every slope, penetration, and flashing detail photographed and explained.</div></li>
<li>${ICON.check}<div><strong>Written, itemized.</strong> Materials, quantities, and schedule in writing before any work starts.</div></li>
<li>${ICON.check}<div><strong>No pressure.</strong> If the roof does not need work, the report says so.</div></li></ul>
<p class="call-line">Prefer to talk? <a href="tel:${site.phoneE164}" data-cta="form-call">${ICON.phone}Call or text ${esc(site.phone)}</a></p></div>
<form class="form-card reveal" id="${id}" method="post" action="/api/lead" novalidate data-kind="${kind}">
<div class="form-grid">
<div><label for="${id}-name">Name</label><input id="${id}-name" name="name" type="text" autocomplete="name" required></div>
<div><label for="${id}-phone">Phone</label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
<div><label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" inputmode="email"></div>
<div><label for="${id}-address">Property address</label><input id="${id}-address" name="address" type="text" autocomplete="street-address" placeholder="Street, city"></div>
<div><label for="${id}-roof">Roof type</label><select id="${id}-roof" name="roof_type"><option value="">Not sure</option><option>Asphalt shingle</option><option>Metal</option><option>Tile</option><option>Slate</option><option>Cedar shake</option><option>Synthetic</option><option>Flat or low slope</option></select></div>
<div><label for="${id}-issue">What is going on</label><select id="${id}-issue" name="issue"><option>Hail or storm damage</option><option>Leak or repair</option><option>Replacement quote</option><option>Inspection</option><option>Insurance claim</option><option>New construction</option><option>Commercial roof</option><option>Other</option></select></div>
<div class="full"><label for="${id}-message">Details</label><textarea id="${id}-message" name="message" rows="4" placeholder="Age of the roof, where it leaks, when the storm hit, anything else"></textarea></div>
<div class="full"><label for="${id}-photos">Photos (optional, up to 4)</label><input id="${id}-photos" name="photos" type="file" accept="image/*" multiple><p class="form-note">Phone photos of the roof, the damage, or the attic are plenty. Images are resized before sending.</p></div>
</div>
<div class="hp" aria-hidden="true"><label for="${id}-cw">Company website</label><input id="${id}-cw" name="company_website" type="text" tabindex="-1" autocomplete="off"></div>
<input type="hidden" name="started" value=""><input type="hidden" name="form_kind" value="${kind}">${cityOpt}${svcOpt}
<button class="btn btn-brass" type="submit">${ICON.clipboard}Request my free inspection</button>
<p class="form-status" role="status" aria-live="polite"></p>
<p class="form-note">No obligation. We never pay, waive, or rebate deductibles, as Colorado law requires.</p>
</form></div></section>`;
}

function ctaBand(site, h2, p) {
  return `<section class="cta-band"><svg class="bg" viewBox="0 0 620 220" aria-hidden="true"><path d="M0 220 L310 30 L620 220" fill="none" stroke="#d4b87a" stroke-width="14"/></svg><div class="wrap">
<div><h2>${esc(h2 || 'The next storm is already forming.')}</h2><p>${esc(p || 'Find out what the last one did to your roof before the next one does worse. Free inspection, photos of everything we find.')}</p></div>
<div class="ctas"><a class="btn btn-brass" href="/free-roof-inspection" data-cta="band">Book a free inspection</a><a class="btn btn-ghost" href="tel:${site.phoneE164}" data-cta="band-call">${ICON.phone}${esc(site.phone)}</a></div>
</div></section>`;
}

function cardGrid(items, cls = 'g3') {
  return `<div class="grid ${cls}">${items.map((it) => `<article class="card reveal">${it.img || ''}<h3><a href="${it.href}">${esc(it.title)}</a></h3><p>${esc(it.text)}</p><a class="more" href="${it.href}">${esc(it.cta || ('About ' + it.title))}</a></article>`).join('')}</div>`;
}

function relatedLinks(items, heading) {
  return `<section class="sec-related"><div class="wrap"><div class="sec-head"><span class="eyebrow">Related</span><h2>${esc(heading || 'Related pages')}</h2></div>${cardGrid(items)}</div></section>`;
}

function toc(sections) {
  return `<nav class="toc" aria-label="Table of contents"><h2 class="toc-h">In this guide</h2><ol>${sections.map((s) => `<li><a href="#${s.id}">${esc(s.h2)}</a></li>`).join('')}</ol></nav>`;
}

// ---------- JSON-LD ----------
function orgSchema(site, model) {
  const a = site.address;
  const cities = [].concat(site.serviceAreas.northernColorado, site.serviceAreas.mountain).filter((c, i, arr) => arr.indexOf(c) === i);
  return {
    '@type': 'RoofingContractor',
    '@id': site.url + '/#organization',
    name: site.name,
    url: site.url + '/',
    telephone: site.phoneE164,
    email: site.email,
    logo: site.url + '/images/logo-512.png',
    image: site.url + site.defaultOgImage,
    description: 'Residential, commercial, and specialty roofing contractor based in Loveland, Colorado. Metal, slate, tile, cedar shake, synthetic, and roof coatings, plus hail and storm repair, insurance claim roofing, inspections, and casualty services for attorneys and public adjusters.',
    address: { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressRegion: a.state, postalCode: a.zip, addressCountry: a.country },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    areaServed: cities.map((name) => ({ '@type': 'City', name: name + ', CO' })),
    openingHoursSpecification: site.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    priceRange: site.priceRange,
    sameAs: site.sameAs,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Roofing services',
      itemListElement: model.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${site.url}/services/${s.slug}` } })),
    },
  };
}

function breadcrumbSchema(site, items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.href ? site.url + (it.href === '/' ? '/' : it.href) : undefined })),
  };
}

function faqSchema(faq) {
  return { '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
}

function jsonLd(graph) {
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

// ---------- layout ----------
function layout(page, ctx) {
  // page: { path, title, description, keywords, ogImage, body, graph, current, preloadImage, noindex, type }
  const { site, model, css, gaId, gscToken, bingToken } = ctx;
  const url = site.url + (page.path === '/' ? '/' : page.path);
  const fullTitle = page.title.length > 60 ? page.title : page.title + site.titleSuffix;
  const og = site.url + (page.ogImage || site.defaultOgImage);
  const preload = page.preloadImage ? `<link rel="preload" as="image" href="${page.preloadImage}" fetchpriority="high">` : '';
  const verify = (gscToken ? `<meta name="google-site-verification" content="${esc(gscToken)}">` : '') + (bingToken ? `<meta name="msvalidate.01" content="${esc(bingToken)}">` : '');
  const robots = page.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(page.description)}">
${robots}
<link rel="canonical" href="${url}">
<meta property="og:type" content="${page.type === 'article' ? 'article' : 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(page.ogAlt || page.title + ', Standard Roofing Company')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${og}">
${verify}<meta name="theme-color" content="#050806">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} blog" href="/feed.xml">
<link rel="preload" as="font" type="font/woff2" href="/fonts/barlow-condensed-latin-800-normal.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/barlow-latin-400-normal.woff2" crossorigin>
${preload}<style>${css}</style>
${jsonLd(page.graph)}
</head>
<body>
${header(site, page.current)}
<main id="main">
${page.body}
</main>
${footer(site, model)}
<script src="/main.js" defer></script>
${gaId ? `<script src="/analytics.js" defer></script>` : ''}
</body>
</html>`;
}

module.exports = { esc, stripTags, words, readingTime, ICON, fontCss, minifyCss, img, header, footer, breadcrumbs, trustStrip, faqBlock, sectionsBlock, quoteForm, ctaBand, cardGrid, relatedLinks, toc, orgSchema, breadcrumbSchema, faqSchema, jsonLd, layout };
