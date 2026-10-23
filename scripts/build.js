#!/usr/bin/env node
// Static site generator for standardroofingcompany.net.
// Reads content/*.json, writes dist/ with clean routes (dist/services/metal-roofing/index.html),
// sitemap.xml, robots.txt, feed.xml, llms.txt, 404.html, and copies public/ and src/ assets.
const fs = require('fs');
const path = require('path');
const { load, ROOT } = require('./lib/content');
const H = require('./lib/html');

const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');
const TODAY = new Date().toISOString().slice(0, 10);
const GA_ID = process.env.GA_MEASUREMENT_ID || '';
const GSC = process.env.GSC_VERIFICATION || '';
const BING = process.env.BING_VERIFICATION || '';

const model = load();
const { site } = model;
const esc = H.esc;
const svcBySlug = Object.fromEntries(model.services.map((s) => [s.slug, s]));
const cityBySlug = Object.fromEntries(model.cities.map((c) => [c.slug, c]));
const casBySlug = Object.fromEntries((model.casualty.pages || []).map((p) => [p.slug, p]));
const postBySlug = Object.fromEntries(model.blog.map((p) => [p.slug, p]));

const css = H.minifyCss(H.fontCss() + fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8'));
const ctx = { site, model, css, gaId: GA_ID, gscToken: GSC, bingToken: BING };
const pages = []; // { path, lastmod, priority, changefreq, title, description }

function write(route, html, meta) {
  const file = route === '/404' ? path.join(DIST, '404.html') : path.join(DIST, route === '/' ? '' : route, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  if (meta && !meta.noindex) pages.push(Object.assign({ path: route }, meta));
}
function render(route, page, meta) {
  page.path = route;
  const html = H.layout(page, ctx);
  write(route, html, Object.assign({ title: page.title, description: page.description }, meta || {}));
}
const imgSvc = (slug) => `/images/services/${slug}-1200.webp`;
const ogSvc = (slug) => `/images/og/service-${slug}.png`;

// Resolve a related internal path to a card
function cardFor(p) {
  if (p.startsWith('/services/')) { const s = svcBySlug[p.split('/')[2]]; if (s) return { href: p, title: s.name, text: s.summary, img: H.img(imgSvc(s.slug), `${s.name} illustration`, { width: 1200, height: 800 }) }; }
  if (p.startsWith('/roofing/')) { const c = cityBySlug[p.split('/')[2]]; if (c) return { href: p, title: `Roofing in ${c.name}`, text: c.summary }; }
  if (p.startsWith('/casualty/')) { const c = casBySlug[p.split('/')[2]]; if (c) return { href: p, title: c.name, text: c.summary }; }
  if (p.startsWith('/blog/')) { const b = postBySlug[p.split('/')[2]]; if (b) return { href: p, title: b.h1, text: b.excerpt }; }
  const map = { '/free-roof-inspection': ['Free roof inspection', 'Photo-documented, written report, no obligation.'], '/financing': ['Roof financing', 'Pay over time, including the gap between a claim and an upgrade.'], '/warranty': ['Roofing warranties', 'What manufacturer and workmanship warranties cover.'], '/casualty': ['Casualty and litigation', 'Inspections, documentation, and opinions for attorneys and adjusters.'], '/contact': ['Contact', 'Call, text, email, or send the form.'] };
  if (map[p]) return { href: p, title: map[p][0], text: map[p][1] };
  return null;
}

function sideBox(extraHtml) {
  return `<aside class="side">${extraHtml || ''}<div class="notice"><h3>Free inspection</h3><ul><li>Photo-documented, every slope</li><li>Written report and itemized estimate</li><li>No obligation, no deductible games</li></ul><p style="margin:14px 0 0"><a class="btn btn-brass" href="/free-roof-inspection" data-cta="side">Book now</a></p><p class="form-note" style="margin-top:12px">Or call <a href="tel:${site.phoneE164}">${esc(site.phone)}</a></p></div></aside>`;
}

function pageHero(opts) {
  const crumbs = H.breadcrumbs(opts.crumbs);
  const meta = opts.meta ? `<ul class="hero-meta">${opts.meta.map((m) => `<li><strong>${esc(m[0])}</strong>${esc(m[1])}</li>`).join('')}</ul>` : '';
  const image = opts.image ? `<div class="hero-img">${H.img(opts.image, opts.imageAlt, { width: 1200, height: 800, eager: true })}</div>` : '';
  return `<section class="page-hero"><div class="wrap${image ? ' hero-grid' : ''}"><div>${crumbs}<span class="eyebrow">${esc(opts.eyebrow)}</span><h1>${esc(opts.h1)}</h1><p class="lede">${esc(opts.lede)}</p>${meta}<div class="hero-ctas"><a class="btn btn-brass" href="${opts.ctaHref || '#quote'}" data-cta="hero">${H.ICON.clipboard}${esc(opts.cta || 'Get a free inspection')}</a><a class="btn btn-ghost" href="tel:${site.phoneE164}" data-cta="hero-call">${H.ICON.phone}Call ${esc(site.phone)}</a></div></div>${image}</div></section>`;
}

const webPage = (route, name, description, type) => ({ '@type': type || 'WebPage', '@id': site.url + route + '#webpage', url: site.url + route, name, description, isPartOf: { '@id': site.url + '/#website' }, about: { '@id': site.url + '/#organization' }, inLanguage: 'en-US' });
const website = { '@type': 'WebSite', '@id': site.url + '/#website', url: site.url + '/', name: site.name, publisher: { '@id': site.url + '/#organization' } };
const org = H.orgSchema(site, model);

// ---------- HOME ----------
(function home() {
  const p = model.pages.home;
  const storm = fs.readFileSync(path.join(SRC, 'partials', 'storm.svg'), 'utf8');
  const svcCards = model.services.slice(0, 6).map((s) => ({ href: `/services/${s.slug}`, title: s.name, text: s.summary, cta: s.name }));
  const specialty = model.services.filter((s) => ['metal-roofing', 'standing-seam-metal-roofing', 'slate-roofing', 'tile-roofing', 'cedar-shake-roofing', 'synthetic-roofing', 'roof-coatings'].includes(s.slug));
  const repairs = model.services.filter((s) => ['roof-replacement', 'roof-repair', 'hail-damage-roof-repair', 'storm-damage-roofing', 'insurance-claim-roofing', 'roof-inspections', 'commercial-roofing'].includes(s.slug));
  const noco = model.cities.filter((c) => c.region === 'northern-colorado');
  const mtn = model.cities.filter((c) => c.region === 'mountain');
  const posts = model.blog.slice(0, 3);
  const body = `
<section class="hero"><div class="hero-art">${storm}</div><div class="wrap">
<span class="eyebrow">Loveland, Colorado | The Front Range hail belt</span>
<h1>${esc(p.h1)}</h1>
<p class="lede">${esc(p.lede)}</p>
<div class="hero-ctas"><a class="btn btn-brass" href="/free-roof-inspection" data-cta="hero">${H.ICON.clipboard}Get a Free Inspection</a><a class="btn btn-ghost" href="tel:${site.phoneE164}" data-cta="hero-call">${H.ICON.phone}Call ${esc(site.phone)}</a></div>
<ul class="hero-points"><li>${H.ICON.check}Written, itemized estimates</li><li>${H.ICON.check}Photo-documented inspections</li><li>${H.ICON.check}Class 4 impact-resistant options</li><li>${H.ICON.check}We never waive deductibles</li></ul>
</div></section>
${H.trustStrip(site)}
<section><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Repairs, Replacement, Storms</span><h2>Roofing done like construction, because it is.</h2><p class="lede">From a single leak to a full tear-off on a commercial building, we bring the same process: inspect, document, scope, build, and close out clean.</p></div>
${H.cardGrid(repairs.map((s) => ({ href: `/services/${s.slug}`, title: s.name, text: s.summary, cta: s.name, img: H.img(imgSvc(s.slug), `${s.name} in Northern Colorado`, { width: 1200, height: 800 }) })))}</div></section>
<section class="sec-dark"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Specialty Roofing</span><h2>Metal, slate, tile, cedar, synthetic, and coatings</h2><p class="lede">Most roofers sell one product. We install the whole range and tell you which one your roof, your climate, and your insurer actually call for.</p></div>
${H.cardGrid(specialty.map((s) => ({ href: `/services/${s.slug}`, title: s.name, text: s.summary, cta: s.name, img: H.img(imgSvc(s.slug), `${s.name} illustration`, { width: 1200, height: 800 }) })))}
<p style="text-align:center;margin-top:34px"><a class="btn btn-green" href="/services">All roofing services</a></p></div></section>
<section class="sec-cream"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">How It Works</span><h2>Five steps. No guesswork.</h2><p class="lede">Construction-grade closeout: a written scope, a photo record of every stage, and a final walk before the last invoice.</p></div>
<div class="steps reveal"><div class="step"><h3>Inspect</h3><p>Free on-roof inspection. Every slope, penetration, and flashing detail photographed.</p></div><div class="step"><h3>Report</h3><p>A written condition report with photos and a clear recommendation, even if that is "no roof needed."</p></div><div class="step"><h3>Scope and Price</h3><p>Itemized estimate: materials, quantities, and schedule. Insurance scopes reviewed line by line once you sign with us.</p></div><div class="step"><h3>Build</h3><p>One accountable lead on site. Property protected, magnetic sweeps daily, crew briefed before work starts.</p></div><div class="step"><h3>Close Out</h3><p>Final walk, photo closeout package, warranty paperwork, and a clean yard.</p></div></div></div></section>
<section><div class="wrap split"><div class="reveal"><span class="eyebrow">Why Standard</span><h2>Built by builders, not storm chasers.</h2><p class="lede">After every big hail storm, out-of-state crews flood the Front Range and leave when the claims dry up. We live here, we build here, and we answer the phone next year.</p>
<ul class="checks"><li>${H.ICON.check}<div><strong>One project lead runs your job.</strong> Not a salesperson who disappears after you sign.</div></li><li>${H.ICON.check}<div><strong>Code and manufacturer spec.</strong> Ice and water shield, drip edge, ventilation, and fastening done to code and to the manufacturer's install requirements.</div></li><li>${H.ICON.check}<div><strong>Honest insurance help.</strong> We document the damage and, once you sign with us, meet your adjuster. You stay in control of your claim.</div></li><li>${H.ICON.check}<div><strong>Commercial-grade process.</strong> Written scope, real schedule, and photo closeout on every residential roof.</div></li></ul><a class="btn btn-green" href="/about">How we work</a></div>
<div class="reveal"><div class="hero-img">${H.img('/images/areas/front-range-1200.webp', 'Illustration of a shingle roof under a Front Range hail storm', { width: 1200, height: 800 })}</div></div></div></section>
<section class="sec-dark"><div class="wrap split"><div class="reveal"><span class="eyebrow">Casualty and Litigation</span><h2>For attorneys, adjusters, and carriers</h2><p class="lede">Independent roof inspections, hail damage documentation, cause and origin reports, construction defect review, appraisal support, and litigation support, with written reports built to be checked.</p><a class="btn btn-brass" href="/casualty">Casualty services</a></div>
<div class="reveal"><ul class="checks">${(model.casualty.pages || []).slice(0, 5).map((c) => `<li>${H.ICON.check}<div><strong><a href="/casualty/${c.slug}">${esc(c.name)}</a></strong> ${esc(c.summary)}</div></li>`).join('')}</ul></div></div></section>
<section class="sec-cream" id="areas"><div class="wrap split"><div class="reveal"><span class="eyebrow">Service Area</span><h2>Front Range born. Mountain ready.</h2><p class="lede">Based in Loveland and working across Larimer, Weld, and Boulder counties, with project crews for the high country where snow load, ice dams, and wind uplift change how a roof has to be built.</p><p><a class="btn btn-green" href="/service-areas">All service areas</a></p></div>
<div class="reveal"><h3>Northern Colorado</h3><div class="areas">${noco.map((c) => `<span><a href="/roofing/${c.slug}">${esc(c.name)}</a></span>`).join('')}</div><h3 style="margin-top:28px">Mountain Towns</h3><div class="areas mtn">${mtn.map((c) => `<span><a href="/roofing/${c.slug}">${esc(c.name)}</a></span>`).join('')}</div></div></div></section>
${posts.length ? `<section><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Guides</span><h2>Colorado roofing, explained</h2></div><div class="grid g3 post-list">${posts.map((b) => `<article class="card reveal"><time datetime="${b.datePublished}">${fmtDate(b.datePublished)}</time><h3><a href="/blog/${b.slug}">${esc(b.h1)}</a></h3><p>${esc(b.excerpt)}</p><a class="more" href="/blog/${b.slug}">Read: ${esc(b.h1.length > 48 ? b.h1.slice(0, 46) + '...' : b.h1)}</a></article>`).join('')}</div><p style="text-align:center;margin-top:34px"><a class="btn btn-green" href="/blog">All guides</a></p></div></section>` : ''}
${H.quoteForm(site, { id: 'quote-form' })}
${H.ctaBand(site)}`;
  render('/', { title: p.title, description: p.description, body, current: '/', ogImage: '/images/og/home.png', ogAlt: 'Standard Roofing Company, roofing contractor in Loveland, Colorado', graph: [org, website, webPage('/', p.title + site.titleSuffix, p.description)] }, { priority: '1.0', changefreq: 'weekly' });
})();

function fmtDate(d) { const [y, m, day] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); }

// ---------- SERVICES HUB ----------
(function servicesHub() {
  const p = model.pages.services;
  const route = '/services';
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Services' }];
  const body = `${pageHero({ crumbs, eyebrow: 'What we do', h1: p.h1, lede: p.lede, image: '/images/services/roof-replacement-1200.webp', imageAlt: 'Roof replacement in progress, decking, underlayment, and new shingles', ctaHref: '/free-roof-inspection' })}
<section><div class="wrap"><div class="prose">${H.sectionsBlock(p.sections)}</div>
<h2 style="margin-top:40px">Specialty roofing systems</h2>${H.cardGrid(model.services.filter((s) => s.eyebrow === 'Specialty Roofing' || ['metal-roofing', 'standing-seam-metal-roofing', 'slate-roofing', 'tile-roofing', 'cedar-shake-roofing', 'synthetic-roofing', 'roof-coatings'].includes(s.slug)).map((s) => ({ href: `/services/${s.slug}`, title: s.name, text: s.summary, cta: s.name, img: H.img(imgSvc(s.slug), `${s.name} illustration`, { width: 1200, height: 800 }) })))}
<h2 style="margin-top:56px">Repairs, replacement, storms, and inspections</h2>${H.cardGrid(model.services.filter((s) => !['metal-roofing', 'standing-seam-metal-roofing', 'slate-roofing', 'tile-roofing', 'cedar-shake-roofing', 'synthetic-roofing', 'roof-coatings'].includes(s.slug)).map((s) => ({ href: `/services/${s.slug}`, title: s.name, text: s.summary, cta: s.name, img: H.img(imgSvc(s.slug), `${s.name} illustration`, { width: 1200, height: 800 }) })))}</div></section>
${H.quoteForm(site)}${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, p.title + site.titleSuffix, p.description, 'CollectionPage'), H.breadcrumbSchema(site, crumbs), { '@type': 'ItemList', itemListElement: model.services.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: `${site.url}/services/${s.slug}` })) }];
  render(route, { title: p.title, description: p.description, body, current: '/services', ogImage: '/images/og/services.png', graph }, { priority: '0.9', changefreq: 'monthly' });
})();

// ---------- SERVICE PAGES ----------
for (const s of model.services) {
  const route = `/services/${s.slug}`;
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Services', href: '/services' }, { name: s.name }];
  const related = s.related.map((r) => cardFor('/services/' + r)).filter(Boolean);
  const cityLinks = model.cities.slice(0, 10).map((c) => `<a href="/roofing/${c.slug}">${esc(c.name)}</a>`).join(', ');
  const body = `${pageHero({ crumbs, eyebrow: s.eyebrow, h1: s.h1, lede: s.lede, image: imgSvc(s.slug), imageAlt: `${s.name}: illustration of the roof system Standard Roofing Company installs in Colorado`, meta: [['Typical lifespan', s.lifespan], ['Cost framing', s.costRange]] })}
<div class="facts"><div class="wrap"><div class="f"><strong>Lifespan</strong><span>${esc(s.lifespan)}</span></div><div class="f"><strong>Typical cost</strong><span>${esc(s.costRange)}</span></div><div class="f"><strong>Service area</strong><span>Northern Colorado and the mountains</span></div><div class="f"><strong>Inspection</strong><span>Free, photo-documented, written report</span></div></div></div>
<section class="sec-prose"><div class="wrap"><div class="prose">${H.sectionsBlock(s.sections)}<section class="prose-sec"><h2>Where we install ${esc(s.name.toLowerCase())}</h2><p>${cityLinks}, and the mountain towns. See all <a href="/service-areas">service areas</a>.</p></section></div>${sideBox(`<div class="notice"><h3>Related services</h3><ul>${s.related.map((r) => svcBySlug[r] ? `<li><a href="/services/${r}">${esc(svcBySlug[r].name)}</a></li>` : '').join('')}</ul></div>`)}</div></section>
${H.faqBlock(s.faq, `${s.name} questions`)}
${H.relatedLinks(related, 'Related roofing services')}
${H.quoteForm(site, { service: s.name, title: `Get a free ${s.name.toLowerCase()} quote`, intro: 'Tell us about the roof, attach photos if you have them, and we will schedule an on-roof inspection and send a written, itemized estimate.' })}
${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, s.title + site.titleSuffix, s.description), H.breadcrumbSchema(site, crumbs),
    { '@type': 'Service', '@id': site.url + route + '#service', name: s.name, serviceType: s.serviceType, url: site.url + route, description: s.description, provider: { '@id': site.url + '/#organization' }, areaServed: org.areaServed, image: site.url + imgSvc(s.slug), offers: { '@type': 'Offer', priceCurrency: 'USD', description: s.costRange, availability: 'https://schema.org/InStock' } },
    H.faqSchema(s.faq)];
  render(route, { title: s.title, description: s.description, body, current: '/services', ogImage: ogSvc(s.slug), preloadImage: imgSvc(s.slug), graph }, { priority: '0.8', changefreq: 'monthly' });
}

// ---------- SERVICE AREAS HUB ----------
(function areasHub() {
  const p = model.pages['service-areas'];
  const route = '/service-areas';
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Service Areas' }];
  const list = (arr) => `<ul class="hub-list">${arr.map((c) => `<li><a href="/roofing/${c.slug}">Roofing in ${esc(c.name)}, CO</a><span>${esc(c.county)}, ${c.elevationFt.toLocaleString('en-US')} ft</span></li>`).join('')}</ul>`;
  const body = `${pageHero({ crumbs, eyebrow: 'Where we work', h1: p.h1, lede: p.lede, image: '/images/areas/mountain-1200.webp', imageAlt: 'Standing seam metal roof with snow in the Colorado mountains', ctaHref: '/free-roof-inspection' })}
<section><div class="wrap"><div class="prose">${H.sectionsBlock(p.sections)}</div>
<div class="grid g2" style="margin-top:40px"><div><h2>Northern Colorado</h2>${list(model.cities.filter((c) => c.region === 'northern-colorado'))}</div><div><h2>Mountain towns</h2>${list(model.cities.filter((c) => c.region === 'mountain'))}</div></div></div></section>
${H.quoteForm(site)}${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, p.title + site.titleSuffix, p.description, 'CollectionPage'), H.breadcrumbSchema(site, crumbs), { '@type': 'ItemList', itemListElement: model.cities.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `Roofing in ${c.name}, CO`, url: `${site.url}/roofing/${c.slug}` })) }];
  render(route, { title: p.title, description: p.description, body, current: '/service-areas', ogImage: '/images/og/service-areas.png', graph }, { priority: '0.8', changefreq: 'monthly' });
})();

// ---------- CITY PAGES ----------
for (const c of model.cities) {
  const route = `/roofing/${c.slug}`;
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Service Areas', href: '/service-areas' }, { name: c.name }];
  const img = c.region === 'mountain' ? '/images/areas/mountain-1200.webp' : '/images/areas/front-range-1200.webp';
  const related = c.relatedServices.map((r) => cardFor('/services/' + r)).filter(Boolean);
  const neighbors = model.cities.filter((x) => x.region === c.region && x.slug !== c.slug).slice(0, 8).map((x) => `<li><a href="/roofing/${x.slug}">${esc(x.name)}</a></li>`).join('');
  const body = `${pageHero({ crumbs, eyebrow: c.region === 'mountain' ? 'Mountain roofing' : 'Northern Colorado roofing', h1: c.h1, lede: c.lede, image: img, imageAlt: c.region === 'mountain' ? `Mountain roof illustration for ${c.name}, Colorado` : `Front Range hail storm roof illustration for ${c.name}, Colorado`, meta: [['County', c.county], ['Elevation', `${c.elevationFt.toLocaleString('en-US')} feet`], ['Permits', c.permitAuthority]] })}
<div class="facts"><div class="wrap"><div class="f"><strong>County</strong><span>${esc(c.county)}</span></div><div class="f"><strong>Elevation</strong><span>${c.elevationFt.toLocaleString('en-US')} feet</span></div><div class="f"><strong>Permit authority</strong><span>${esc(c.permitAuthority)}</span></div><div class="f"><strong>Wildfire interface</strong><span>${c.wildfireInterface ? 'Yes, Class A roofing matters here' : 'Low; hail and wind are the main risks'}</span></div></div></div>
<section class="sec-prose"><div class="wrap"><div class="prose">${H.sectionsBlock(c.sections)}</div>${sideBox(`<div class="notice"><h3>Services in ${esc(c.name)}</h3><ul>${c.relatedServices.map((r) => svcBySlug[r] ? `<li><a href="/services/${r}">${esc(svcBySlug[r].name)}</a></li>` : '').join('')}</ul></div><div class="notice"><h3>Nearby</h3><ul>${neighbors}</ul></div>`)}</div></section>
${H.faqBlock(c.faq, `Roofing in ${c.name}: questions`)}
${H.relatedLinks(related, `Roofing services in ${c.name}`)}
${H.quoteForm(site, { city: c.name, title: `Free roof inspection in ${c.name}`, intro: `Request an on-roof, photo-documented inspection anywhere in ${c.name} and ${c.county}. Written report, itemized estimate, no obligation.` })}
${H.ctaBand(site, `Roof trouble in ${c.name}?`, 'Hail, wind, snow, or just age: find out what your roof needs before the next storm decides for you.')}`;
  const graph = [org, website, webPage(route, c.title + site.titleSuffix, c.description), H.breadcrumbSchema(site, crumbs),
    { '@type': 'Service', '@id': site.url + route + '#service', name: `Roofing services in ${c.name}, CO`, serviceType: 'Roofing contractor', url: site.url + route, description: c.description, provider: { '@id': site.url + '/#organization' }, areaServed: { '@type': 'City', name: `${c.name}, CO`, geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng }, containedInPlace: { '@type': 'AdministrativeArea', name: c.county } } },
    H.faqSchema(c.faq)];
  render(route, { title: c.title, description: c.description, body, current: '/service-areas', ogImage: `/images/og/city-${c.slug}.png`, preloadImage: img, graph }, { priority: '0.8', changefreq: 'monthly' });
}

// ---------- CASUALTY ----------
if (model.casualty.landing) {
  const L = model.casualty.landing;
  const route = '/casualty';
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Casualty and Litigation' }];
  const pagesCards = model.casualty.pages.map((p) => ({ href: `/casualty/${p.slug}`, title: p.name, text: p.summary, cta: p.name }));
  const body = `${pageHero({ crumbs, eyebrow: 'For attorneys, adjusters, and carriers', h1: L.h1, lede: L.lede, image: '/images/casualty/casualty-1200.webp', imageAlt: 'Inspection report and roof illustration for casualty and litigation support', cta: 'Request a consultation', ctaHref: '#intake' })}
<section><div class="wrap"><h2>Services</h2>${H.cardGrid(pagesCards)}</div></section>
<section class="sec-prose single"><div class="wrap"><div class="prose">${H.sectionsBlock(L.sections)}</div></div></section>
${H.faqBlock(L.faq, 'Engagement questions')}
${attorneyForm()}
${H.ctaBand(site, 'Have a roofing matter?', 'Conflict check, retention letter, and fee schedule on request. Call or send the intake form.')}`;
  const graph = [org, website, webPage(route, L.title + site.titleSuffix, L.description, 'CollectionPage'), H.breadcrumbSchema(site, crumbs), { '@type': 'Service', '@id': site.url + route + '#service', name: 'Roofing casualty and litigation support', serviceType: 'Forensic roof inspection and litigation support', url: site.url + route, description: L.description, provider: { '@id': site.url + '/#organization' }, audience: { '@type': 'Audience', audienceType: 'Attorneys, public adjusters, and insurance carriers' }, areaServed: { '@type': 'State', name: 'Colorado' } }, H.faqSchema(L.faq)];
  render(route, { title: L.title, description: L.description, body, current: '/casualty', ogImage: '/images/og/casualty.png', preloadImage: '/images/casualty/casualty-1200.webp', graph }, { priority: '0.8', changefreq: 'monthly' });

  for (const p of model.casualty.pages) {
    const r = `/casualty/${p.slug}`;
    const cr = [{ name: 'Home', href: '/' }, { name: 'Casualty and Litigation', href: '/casualty' }, { name: p.name }];
    const related = p.related.map((x) => cardFor('/casualty/' + x)).filter(Boolean);
    const body = `${pageHero({ crumbs: cr, eyebrow: p.audience, h1: p.h1, lede: p.lede, image: '/images/casualty/casualty-1200.webp', imageAlt: `${p.name} report illustration`, cta: 'Request a consultation', ctaHref: '#intake' })}
<section class="sec-prose"><div class="wrap"><div class="prose"><div class="deliver"><div class="notice"><h3>Deliverables</h3><ul>${p.deliverables.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div><div class="notice"><h3>Report format</h3><ul>${p.reportFormat.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div></div>${H.sectionsBlock(p.sections)}</div>
<aside class="side"><div class="notice"><h3>Engage us</h3><ul><li>Conflict check first</li><li>Retention letter and fee schedule on request</li><li>Plaintiff, defense, and carrier work</li><li>Statewide travel</li></ul><p style="margin:14px 0 0"><a class="btn btn-brass" href="#intake" data-cta="side">Request a consultation</a></p><p class="form-note" style="margin-top:12px">Or call <a href="tel:${site.phoneE164}">${esc(site.phone)}</a></p></div><div class="notice"><h3>Related</h3><ul>${p.related.map((x) => casBySlug[x] ? `<li><a href="/casualty/${x}">${esc(casBySlug[x].name)}</a></li>` : '').join('')}</ul></div></aside></div></section>
${H.faqBlock(p.faq, `${p.name}: questions`)}
${H.relatedLinks(related, 'Related casualty services')}
${attorneyForm()}`;
    const graph = [org, website, webPage(r, p.title + site.titleSuffix, p.description), H.breadcrumbSchema(site, cr), { '@type': 'Service', '@id': site.url + r + '#service', name: p.name, serviceType: p.serviceType, url: site.url + r, description: p.description, provider: { '@id': site.url + '/#organization' }, audience: { '@type': 'Audience', audienceType: p.audience }, areaServed: { '@type': 'State', name: 'Colorado' } }, H.faqSchema(p.faq)];
    render(r, { title: p.title, description: p.description, body, current: '/casualty', ogImage: `/images/og/casualty-${p.slug}.png`, preloadImage: '/images/casualty/casualty-1200.webp', graph }, { priority: '0.7', changefreq: 'monthly' });
  }
}

function attorneyForm() {
  const id = 'attorney-form';
  return `<section class="sec-quote" id="intake"><div class="wrap split"><div class="reveal"><span class="eyebrow">Intake</span><h2>Request a consultation</h2><p class="lede">Describe the matter in general terms. We run a conflict check before discussing specifics and reply within one business day.</p><p class="call-line">Prefer to talk? <a href="tel:${site.phoneE164}" data-cta="form-call">${H.ICON.phone}${esc(site.phone)}</a> or <a href="mailto:${site.email}">${esc(site.email)}</a></p></div>
<form class="form-card reveal" id="${id}" method="post" action="/api/lead" novalidate data-kind="attorney"><div class="form-grid">
<div><label for="${id}-name">Name</label><input id="${id}-name" name="name" type="text" autocomplete="name" required></div>
<div><label for="${id}-firm">Firm or company</label><input id="${id}-firm" name="firm" type="text" autocomplete="organization"></div>
<div><label for="${id}-role">Role</label><select id="${id}-role" name="role"><option>Attorney</option><option>Paralegal or case manager</option><option>Public adjuster</option><option>Carrier or TPA</option><option>Property manager or HOA</option><option>Other</option></select></div>
<div><label for="${id}-phone">Phone</label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
<div><label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" inputmode="email"></div>
<div><label for="${id}-issue">Service needed</label><select id="${id}-issue" name="issue"><option>Expert roof inspection</option><option>Hail damage documentation</option><option>Cause and origin report</option><option>Litigation support or testimony</option><option>Appraisal or umpire support</option><option>Construction defect review</option><option>Fall protection standard of care</option><option>Not sure yet</option></select></div>
<div class="full"><label for="${id}-matter">Matter summary (parties, property, loss date, deadlines)</label><textarea id="${id}-matter" name="matter" rows="5" required></textarea></div>
<div class="full"><label for="${id}-photos">Photos or documents (optional, images only, up to 4)</label><input id="${id}-photos" name="photos" type="file" accept="image/*" multiple></div></div>
<div class="hp" aria-hidden="true"><label for="${id}-cw">Company website</label><input id="${id}-cw" name="company_website" type="text" tabindex="-1" autocomplete="off"></div>
<input type="hidden" name="started" value=""><input type="hidden" name="form_kind" value="attorney">
<button class="btn btn-brass" type="submit">${H.ICON.clipboard}Send intake</button><p class="form-status" role="status" aria-live="polite"></p>
<p class="form-note">Do not include privileged detail until the conflict check clears. We do not represent policyholders or act as a public adjuster.</p></form></div></section>`;
}

// ---------- BLOG ----------
(function blog() {
  const p = model.pages.blog;
  const route = '/blog';
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Blog' }];
  const cards = model.blog.map((b) => `<article class="card reveal"><span class="cat-pill">${esc(b.category)}</span><time datetime="${b.datePublished}">${fmtDate(b.datePublished)}</time><h3><a href="/blog/${b.slug}">${esc(b.h1)}</a></h3><p>${esc(b.excerpt)}</p><a class="more" href="/blog/${b.slug}">Read: ${esc(b.h1.length > 48 ? b.h1.slice(0, 46) + '...' : b.h1)}</a></article>`).join('');
  const body = `${pageHero({ crumbs, eyebrow: 'Guides', h1: p.h1, lede: p.lede, ctaHref: '/free-roof-inspection' })}
<section><div class="wrap"><div class="grid g3 post-list">${cards}</div></div></section>${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, p.title + site.titleSuffix, p.description, 'CollectionPage'), H.breadcrumbSchema(site, crumbs), { '@type': 'Blog', '@id': site.url + '/blog#blog', url: site.url + '/blog', name: site.name + ' blog', publisher: { '@id': site.url + '/#organization' }, blogPost: model.blog.map((b) => ({ '@type': 'BlogPosting', headline: b.h1, url: `${site.url}/blog/${b.slug}`, datePublished: b.datePublished })) }];
  render(route, { title: p.title, description: p.description, body, current: '/blog', ogImage: '/images/og/blog.png', graph }, { priority: '0.7', changefreq: 'weekly' });

  for (const b of model.blog) {
    const r = `/blog/${b.slug}`;
    const cr = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: b.h1 }];
    const cat = b.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const hero = `/images/blog/${cat}-1200.webp`;
    const related = b.related.map(cardFor).filter(Boolean).slice(0, 3);
    const bodyHtml = b.intro + H.sectionsBlock(b.sections);
    const body = `<section class="page-hero"><div class="wrap narrow">${H.breadcrumbs(cr)}<span class="cat-pill">${esc(b.category)}</span><h1>${esc(b.h1)}</h1><p class="byline"><span>By <strong>${esc(site.name)}</strong></span><span>Published <time datetime="${b.datePublished}">${fmtDate(b.datePublished)}</time></span><span>${H.readingTime(bodyHtml)} min read</span></p></div></section>
<section class="sec-prose single"><div class="wrap"><article class="prose"><div class="hero-img" style="margin-bottom:32px">${H.img(hero, `${b.category} illustration for the guide ${b.h1}`, { width: 1200, height: 800, eager: true })}</div><div class="prose-sec">${b.intro}</div>${H.toc(b.sections)}${H.sectionsBlock(b.sections)}</article></div></section>
${H.faqBlock(b.faq, 'Questions people ask')}
${H.relatedLinks(related, 'Keep reading')}
${H.quoteForm(site)}`;
    const graph = [org, website, webPage(r, b.title + site.titleSuffix, b.description), H.breadcrumbSchema(site, cr),
      { '@type': 'Article', '@id': site.url + r + '#article', headline: b.h1, description: b.description, image: [site.url + `/images/og/blog-${b.slug}.png`, site.url + hero], datePublished: b.datePublished, dateModified: b.dateModified || b.datePublished, author: { '@type': 'Organization', name: site.name, url: site.url + '/' }, publisher: { '@id': site.url + '/#organization' }, mainEntityOfPage: { '@id': site.url + r + '#webpage' }, articleSection: b.category, keywords: b.keywords.join(', '), wordCount: H.words(bodyHtml), inLanguage: 'en-US' },
      H.faqSchema(b.faq)];
    render(r, { title: b.title, description: b.description, body, current: '/blog', type: 'article', ogImage: `/images/og/blog-${b.slug}.png`, preloadImage: hero, graph }, { priority: '0.7', changefreq: 'monthly', lastmod: b.dateModified || b.datePublished });
  }
})();

// ---------- STATIC PAGES ----------
function simplePage(key, route, opts) {
  const p = model.pages[key];
  const crumbs = [{ name: 'Home', href: '/' }, { name: opts.crumb || p.h1 }];
  const body = `${pageHero({ crumbs, eyebrow: opts.eyebrow, h1: p.h1, lede: p.lede, image: opts.image, imageAlt: opts.imageAlt, ctaHref: opts.ctaHref || '/free-roof-inspection' })}
<section class="sec-prose${opts.side ? '' : ' single'}"><div class="wrap"><div class="prose">${H.sectionsBlock(p.sections || [])}${opts.extra || ''}</div>${opts.side ? sideBox() : ''}</div></section>
${p.faq ? H.faqBlock(p.faq) : ''}${opts.form === false ? '' : H.quoteForm(site)}${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, p.title + site.titleSuffix, p.description, opts.type), H.breadcrumbSchema(site, crumbs)].concat(p.faq ? [H.faqSchema(p.faq)] : []).concat(opts.graph || []);
  render(route, { title: p.title, description: p.description, body, current: opts.current || route, ogImage: `/images/og/${key}.png`, preloadImage: opts.image, graph }, { priority: opts.priority || '0.6', changefreq: 'monthly' });
}
simplePage('about', '/about', { eyebrow: 'Company', crumb: 'About', image: '/images/areas/front-range-1200.webp', imageAlt: 'Shingle roof under a Front Range storm, Loveland, Colorado', side: true, type: 'AboutPage', priority: '0.7' });
simplePage('financing', '/financing', { eyebrow: 'Paying for a roof', crumb: 'Financing', image: imgSvc('insurance-claim-roofing'), imageAlt: 'Illustration of a roofing contract and claim paperwork on a roof', side: true });
simplePage('warranty', '/warranty', { eyebrow: 'Protection', crumb: 'Warranty', image: imgSvc('roof-replacement'), imageAlt: 'Roof replacement layers: decking, underlayment, and shingles', side: true });
simplePage('reviews', '/reviews', { eyebrow: 'Reputation', crumb: 'Reviews', image: '/images/areas/front-range-1200.webp', imageAlt: 'Front Range roof illustration', side: true, graph: [] });

// Gallery with ImageGallery schema
(function gallery() {
  const p = model.pages.gallery;
  const route = '/gallery';
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Gallery' }];
  const items = model.services.map((s) => ({ src: `/images/gallery/${s.slug}-1200.webp`, name: s.name, caption: s.summary, href: `/services/${s.slug}` }));
  const figs = items.map((it) => `<figure><a href="${it.href}">${H.img(it.src, `${it.name}: illustrated roof system profile`, { width: 1200, height: 800 })}</a><figcaption><strong>${esc(it.name)}</strong>${esc(it.caption)}</figcaption></figure>`).join('');
  const body = `${pageHero({ crumbs, eyebrow: 'Systems', h1: p.h1, lede: p.lede })}<section><div class="wrap"><div class="gallery">${figs}</div></div></section>${H.quoteForm(site)}${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, p.title + site.titleSuffix, p.description, 'CollectionPage'), H.breadcrumbSchema(site, crumbs), { '@type': 'ImageGallery', '@id': site.url + route + '#gallery', name: p.h1, url: site.url + route, associatedMedia: items.map((it) => ({ '@type': 'ImageObject', contentUrl: site.url + it.src, name: it.name, caption: it.caption, width: 1200, height: 800 })) }];
  render(route, { title: p.title, description: p.description, body, current: '/gallery', ogImage: '/images/og/gallery.png', graph }, { priority: '0.5', changefreq: 'monthly' });
})();

// Contact with NAP and map
(function contact() {
  const p = model.pages.contact;
  const route = '/contact';
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Contact' }];
  const a = site.address;
  const q = encodeURIComponent(`${site.name}, ${a.street}, ${a.city}, ${a.state} ${a.zip}`);
  const body = `${pageHero({ crumbs, eyebrow: 'Get in touch', h1: p.h1, lede: p.lede, ctaHref: '#quote' })}
<section><div class="wrap split"><div class="reveal"><h2>Standard Roofing Company</h2><address class="nap"><strong>${esc(site.name)}</strong><br>${esc(a.street)}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</address>
<ul class="contact-list"><li>${H.ICON.phone}<div><strong>Call or text</strong><a href="tel:${site.phoneE164}" data-cta="contact-call">${esc(site.phone)}</a></div></li><li>${H.ICON.mail}<div><strong>Email</strong><a href="mailto:${site.email}">${esc(site.email)}</a></div></li><li>${H.ICON.clock}<div><strong>Hours</strong>${esc(site.hoursDisplay)}</div></li><li>${H.ICON.pin}<div><strong>Service area</strong>Northern Colorado and the mountain towns. <a href="/service-areas">See every town</a>.</div></li></ul></div>
<div class="reveal"><div class="map-wrap"><iframe title="Map to Standard Roofing Company, ${esc(a.street)}, ${esc(a.city)}, ${esc(a.state)}" src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div></div></div></section>
${H.quoteForm(site, { title: 'Send us the details' })}${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, p.title + site.titleSuffix, p.description, 'ContactPage'), H.breadcrumbSchema(site, crumbs)];
  render(route, { title: p.title, description: p.description, body, current: '/contact', ogImage: '/images/og/contact.png', graph }, { priority: '0.8', changefreq: 'monthly' });
})();

// Free roof inspection lead page
(function freeInspection() {
  const p = model.pages['free-roof-inspection'];
  const route = '/free-roof-inspection';
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Free Roof Inspection' }];
  const body = `${pageHero({ crumbs, eyebrow: 'No obligation', h1: p.h1, lede: p.lede, image: imgSvc('roof-inspections'), imageAlt: 'Roof inspection illustration with magnifier over shingles', ctaHref: '#quote', cta: 'Request my inspection' })}
${H.trustStrip(site)}
${H.quoteForm(site, { id: 'inspection-form', title: 'Request your free inspection', intro: 'Fill this in and we call within one business day to schedule. Add photos if you have them; they help us prioritize storm damage.' })}
<section class="sec-prose single" style="padding-top:0"><div class="wrap"><div class="prose">${H.sectionsBlock(p.sections)}</div></div></section>
${H.faqBlock(p.faq, 'Free inspection questions')}${H.ctaBand(site)}`;
  const graph = [org, website, webPage(route, p.title + site.titleSuffix, p.description), H.breadcrumbSchema(site, crumbs), { '@type': 'Service', '@id': site.url + route + '#service', name: 'Free roof inspection', serviceType: 'Roof inspection', url: site.url + route, description: p.description, provider: { '@id': site.url + '/#organization' }, areaServed: org.areaServed, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }, H.faqSchema(p.faq)];
  render(route, { title: p.title, description: p.description, body, current: route, ogImage: '/images/og/free-roof-inspection.png', preloadImage: imgSvc('roof-inspections'), graph }, { priority: '0.9', changefreq: 'monthly' });
})();

// 404
(function notFound() {
  const p = model.pages['404'];
  const links = [['/services', 'Roofing services'], ['/service-areas', 'Service areas'], ['/services/hail-damage-roof-repair', 'Hail damage repair'], ['/casualty', 'Attorneys and adjusters'], ['/blog', 'Guides'], ['/free-roof-inspection', 'Free inspection'], ['/contact', 'Contact']];
  const body = `<section class="notfound"><div class="wrap"><span class="eyebrow">404</span><h1>${esc(p.h1)}</h1><p class="lede">${esc(p.lede)}</p><div class="areas" style="justify-content:center">${links.map(([h, t]) => `<span><a href="${h}">${esc(t)}</a></span>`).join('')}</div><p style="margin-top:34px"><a class="btn btn-brass" href="/">Back to the home page</a></p></div></section>`;
  render('/404', { title: p.title, description: p.description, body, noindex: true, ogImage: '/images/og/404.png', graph: [org, website, webPage('/404', p.title + site.titleSuffix, p.description)] }, { noindex: true });
})();

// ---------- sitemap, robots, feed, llms.txt, redirects ----------
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site.url}${p.path === '/' ? '/' : p.path}</loc><lastmod>${p.lastmod || TODAY}</lastmod><changefreq>${p.changefreq || 'monthly'}</changefreq><priority>${p.priority || '0.6'}</priority></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(site.name)} blog</title><link>${site.url}/blog</link><description>${esc(model.pages.blog.description)}</description><language>en-us</language><atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>\n${model.blog.map((b) => `<item><title>${esc(b.h1)}</title><link>${site.url}/blog/${b.slug}</link><guid>${site.url}/blog/${b.slug}</guid><pubDate>${new Date(b.datePublished + 'T12:00:00Z').toUTCString()}</pubDate><description>${esc(b.excerpt)}</description></item>`).join('\n')}\n</channel></rss>\n`);

const llms = `# ${site.name}

> Licensed and insured roofing contractor in Loveland, Colorado serving Northern Colorado (Loveland, Fort Collins, Greeley, Windsor, Berthoud, Longmont, Johnstown, Wellington, Timnath, Estes Park) and Colorado mountain towns (Nederland, Winter Park, Granby, Grand Lake, Steamboat Springs, Breckenridge, Frisco, Silverthorne, Vail, Red Feather Lakes, Glen Haven, Drake). Residential and commercial roofing with a specialty focus on metal, standing seam, slate, tile, cedar shake, synthetic, and roof coatings, plus roof repair, hail and storm damage, insurance claim roofing, inspections, and a casualty and litigation group serving attorneys, public adjusters, and carriers.

Business facts (use verbatim): ${site.name}, ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}. Phone ${site.phone}. Email ${site.email}. Hours ${site.hoursDisplay}. Free, photo-documented roof inspections. Written itemized estimates. Colorado law (C.R.S. 6-22-105) prohibits roofers from paying or waiving insurance deductibles and the company never does. The company does not act as a public adjuster.

## Services
${model.services.map((s) => `- [${s.name}](${site.url}/services/${s.slug}): ${s.summary}`).join('\n')}

## Service areas
${model.cities.map((c) => `- [Roofing in ${c.name}, CO](${site.url}/roofing/${c.slug}): ${c.county}, ${c.elevationFt.toLocaleString('en-US')} ft. ${c.summary}`).join('\n')}

## Casualty and litigation (for attorneys, public adjusters, carriers)
- [Overview](${site.url}/casualty)
${(model.casualty.pages || []).map((p) => `- [${p.name}](${site.url}/casualty/${p.slug}): ${p.summary}`).join('\n')}

## Guides
${model.blog.map((b) => `- [${b.h1}](${site.url}/blog/${b.slug}): ${b.excerpt}`).join('\n')}

## Other pages
- [Free roof inspection](${site.url}/free-roof-inspection)
- [About](${site.url}/about)
- [Financing](${site.url}/financing)
- [Warranty](${site.url}/warranty)
- [Gallery](${site.url}/gallery)
- [Reviews](${site.url}/reviews)
- [Contact](${site.url}/contact)
- [Sitemap](${site.url}/sitemap.xml)
`;
fs.writeFileSync(path.join(DIST, 'llms.txt'), llms);

// Copy static assets
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyDir(s, d); } else fs.copyFileSync(s, d);
  }
}
copyDir(PUBLIC, DIST);
fs.mkdirSync(path.join(DIST, 'fonts'), { recursive: true });
copyDir(path.join(SRC, 'fonts'), path.join(DIST, 'fonts'));
fs.writeFileSync(path.join(DIST, 'main.js'), fs.readFileSync(path.join(SRC, 'main.js'), 'utf8').replace('__SMS_NUMBER__', site.phoneE164).replace('__PHONE_DISPLAY__', site.phone));
if (GA_ID) fs.writeFileSync(path.join(DIST, 'analytics.js'), fs.readFileSync(path.join(SRC, 'analytics.js'), 'utf8').replace('__GA_ID__', GA_ID));
if (GSC) fs.writeFileSync(path.join(DIST, `${GSC}.html`), `google-site-verification: ${GSC}.html`);
if (BING) fs.writeFileSync(path.join(DIST, 'BingSiteAuth.xml'), `<?xml version="1.0"?>\n<users><user>${BING}</user></users>\n`);

// Keyword report for the SEO audit
fs.writeFileSync(path.join(ROOT, 'content', 'keyword-report.json'), JSON.stringify(
  [].concat(
    Object.entries(model.pages).map(([k, p]) => ({ path: k === 'home' ? '/' : '/' + k, keywords: p.keywords })),
    model.services.map((s) => ({ path: `/services/${s.slug}`, keywords: s.keywords })),
    model.cities.map((c) => ({ path: `/roofing/${c.slug}`, keywords: c.keywords })),
    model.casualty.landing ? [{ path: '/casualty', keywords: model.casualty.landing.keywords }] : [],
    (model.casualty.pages || []).map((p) => ({ path: `/casualty/${p.slug}`, keywords: p.keywords })),
    model.blog.map((b) => ({ path: `/blog/${b.slug}`, keywords: b.keywords }))
  ), null, 2));

console.log(`Built ${pages.length} indexable pages + 404 into dist/`);
