# SEO Audit: standardroofingcompany.net

Audit date: 2026-10-23. Lighthouse 12 (mobile emulation, Moto G Power profile, simulated slow 4G) run against a local static server for both the before and after builds, so the two tables are directly comparable. Production adds HTTP caching, Brotli, and HTTP/2 from Vercel, which can only improve the after numbers. INP has no lab equivalent; Total Blocking Time is reported as the lab proxy, and every page measured 0 to 56 ms, which maps to a "good" INP.

## Before (the site as found)

| Page | Perf | SEO | A11y | Best Practices | LCP | CLS | TBT (INP proxy) | FCP |
|---|---|---|---|---|---|---|---|---|
| / | 98 | 92 | 93 | 96 | 1,389 ms | 0.000 | 0 ms | 1,389 ms |
| /metal-roofing.html | 99 | 92 | 93 | 96 | 1,536 ms | 0.000 | 0 ms | 1,536 ms |
| /roofing-loveland-co.html | 98 | 92 | 93 | 96 | 1,541 ms | 0.000 | 0 ms | 1,541 ms |
| /casualty.html | 99 | 92 | 93 | 96 | 1,537 ms | 0.000 | 0 ms | 1,537 ms |
| /contact.html | 98 | 92 | 93 | 96 | 1,535 ms | 0.000 | 0 ms | 1,535 ms |
| /storm-damage.html | 98 | 92 | 93 | 96 | 1,539 ms | 0.000 | 0 ms | 1,539 ms |

The old site was fast because it was tiny: 31 pages, no images at all, and SVG art inlined. The problems were elsewhere.

### Findings

Routes and metadata: 31 HTML files, all flat .html URLs (roofing-loveland-co.html, metal-roofing.html). Titles and descriptions existed and were unique, canonicals present, OG tags present. Site-wide JSON-LD graph present.

Issues found:

1. Render-blocking Google Fonts request (530 ms estimated savings on mobile; a third-party request on every page, and a console error when the font CDN was unreachable).
2. Generic link text ("Learn more" on 12 links per page) failing the Lighthouse SEO link-text audit on every page (the 92).
3. Accessibility: footer legal text contrast failure, heading order skipped (h4 after h2 in footer), brand link label mismatch.
4. No images anywhere: no photo or illustration, no image schema, nothing for image search, and no OG image variety (one shared og-image.png).
5. Content depth: city pages averaged 700 words and were built from one template with the city swapped (identical headings and near-identical copy). Specialty pages were 1,000 to 1,100 words. Only 10 city pages; mountain towns shared one page. No blog. No financing, warranty, gallery, reviews, or dedicated free-inspection page.
6. Thin or missing service pages: roof replacement, repair, inspections, commercial, and gutters were sections of one services.html; no standing seam, hail damage, storm damage, insurance claim, or roof replacement pages.
7. Casualty section existed but its URLs did not map to the requested structure and there was no appraisal and umpire page.
8. Structured data: RoofingContractor had no street address, listed 20 cities that did not match the site's actual areas, had no sameAs, and service pages used OfferCatalog links to anchors. No Article schema (no blog), no ImageGallery.
9. Lead capture: forms on two pages only (contact, casualty); no photo upload; no storage of leads (email relay only, so a relay failure lost the lead); no rate limiting; only a honeypot and timing check.
10. No sticky CTA on desktop; mobile call bar only.
11. No analytics configured (GA ID hardcoded empty), no Bing verification, no /api/health, llms.txt present but outdated.
12. IndexNow route existed but nothing pinged on deploy.
13. 404 page existed with internal links (kept).
14. Sitemap hand-maintained; robots.txt fine.
15. Cache lifetimes: zero on all static assets (no headers config).
16. CLS 0 and TBT 0 were already good.

## After (this build)

| Page | Perf | SEO | A11y | Best Practices | LCP | CLS | TBT (INP proxy) | FCP |
|---|---|---|---|---|---|---|---|---|
| / | 99 | 100 | 100 | 100 | 2,086 ms | 0.000 | 0 ms | 1,560 ms |
| /services/metal-roofing | 99 | 100 | 100 | 100 | 2,108 ms | 0.021 | 39 ms | 1,505 ms |
| /roofing/loveland | 99 | 100 | 100 | 100 | 2,115 ms | 0.001 | 0 ms | 1,510 ms |
| /casualty | 99 | 100 | 100 | 100 | 2,103 ms | 0.037 | 0 ms | 1,502 ms |
| /blog/how-to-tell-if-your-roof-has-hail-damage-colorado | 98 | 100 | 100 | 100 | 2,260 ms | 0.009 | 56 ms | 1,507 ms |
| /free-roof-inspection | 99 | 100 | 100 | 100 | 1,957 ms | 0.019 | 0 ms | 1,355 ms |
| /contact | 99 | 100 | 100 | 100 | 1,701 ms | 0.042 | 0 ms | 1,360 ms |

LCP rose by roughly 500 ms because every page now has a real hero image (preloaded, WebP, fetchpriority high) where before the LCP element was a text block. It stays well inside the 2.5 s "good" threshold on simulated slow 4G, and the 100 percent inlined CSS and self-hosted fonts removed the third-party request chain entirely.

### What changed

- Build system: content/*.json + scripts/build.js produce dist/ with clean routes. 68 pages (67 indexable + 404), up from 31.
- Every page: unique title under 60 characters with the "| Standard Roofing Company" suffix, meta description 120 to 155 characters ending in a call to action, canonical, OG and Twitter cards with a page-specific 1200x630 image (68 generated), robots meta, RSS link.
- JSON-LD on every page: RoofingContractor (street address, geo, 22 areaServed cities, hours, email, priceRange, sameAs placeholder, offer catalog), WebSite, WebPage/CollectionPage/AboutPage/ContactPage, BreadcrumbList on every nested page (66), Service on 45 service, city, and casualty pages, FAQPage on 59 pages, Article on 12 posts, Blog, ImageGallery, ItemList.
- One H1 per page with the primary keyword; H2/H3 hierarchy from the content files; footer headings demoted to styled h2 so order is logical.
- Images: 146 generated WebP illustrations and PNG social cards, every img with alt, width, height, srcset, lazy loading below the fold, eager + preload on the hero.
- Fonts self-hosted as WOFF2 with font-display swap and unicode-range; critical CSS inlined (the whole stylesheet is 25 KB minified, so it is all inlined and there are zero render-blocking requests).
- main.js deferred; analytics only emitted when GA_MEASUREMENT_ID is set.
- vercel.json: cleanUrls, 301 redirects from every old .html URL to its new route, immutable caching for fonts and images, security headers.
- Sitemap generated from the page registry with lastmod; robots.txt points to it and disallows /api/.
- IndexNow key file at root, /api/indexnow, and scripts/ping-search-engines.js wired to a GitHub Action that fires on each successful production deployment.
- Lead capture: quote form with photo upload on every service, city, and landing page; attorney intake on casualty pages; /api/lead stores every lead and photo in a dedicated Neon Postgres database (LEADS_DATABASE_URL), then emails info@standardroofingcompany.net; honeypot, timing check, per-IP and global rate limits, size caps. /api/photo serves stored photos behind an HMAC token.
- Sticky "Get a Free Inspection" pill on desktop; call + inspection bar on mobile; click-to-call in header, hero, every CTA band, forms, and footer. Phone number lives in content/site.json.
- Trust strip (licensed and insured, Colorado owned, specialty materials, free inspections) on home and lead page.
- /api/health, llms.txt regenerated from content, feed.xml.
- Accessibility: contrast fixed, heading order fixed, descriptive link text, labelled form controls, skip link, aria-current on nav.

### Page inventory (68)

| Section | Count | Avg body words |
|---|---|---|
| Home, hubs, and static pages (home, services, service-areas, about, financing, warranty, gallery, reviews, contact, free-roof-inspection, blog, 404) | 12 | n/a |
| Service pages /services/[slug] | 14 | 1,092 |
| City pages /roofing/[city] | 22 | 831 |
| Casualty /casualty and /casualty/[slug] | 8 | 730 |
| Blog /blog/[slug] | 12 | 1,815 |

Total body copy: about 63,000 words, none of it templated across pages (the validator rejects duplicated openings, and each city page carries its own county, elevation, permit authority, hail dates, HOA notes, and wildfire interface facts).

### Target keywords per page (primary, then secondary)

| Page | Primary keyword | Secondary |
|---|---|---|
| /404 | 404 | page not found, standard roofing company |
| / | roofing contractor loveland co | roofer loveland colorado, northern colorado roofing company, hail damage roof repair loveland |
| /services | roofing services northern colorado | roofing company fort collins loveland, specialty roofing colorado, roof repair and replacement colorado |
| /service-areas | roofing service areas northern colorado | roofer near me loveland, mountain roofing contractor colorado, roofing fort collins greeley windsor |
| /about | about standard roofing company | loveland colorado roofing company, licensed insured roofer loveland, northern colorado roofing contractor |
| /financing | roof financing colorado | finance a new roof loveland, roof replacement payment plans, roof loan northern colorado |
| /warranty | roofing warranty colorado | roof workmanship warranty, manufacturer roof warranty explained, does hail void roof warranty |
| /gallery | roofing gallery colorado | metal roof photos colorado, slate tile cedar roof examples, standing seam metal roof gallery |
| /reviews | standard roofing company reviews | loveland roofer reviews, best roofing company loveland co, northern colorado roofing reviews |
| /contact | contact standard roofing company | roofer loveland phone number, roofing company near me loveland, 1180 e 3rd st loveland |
| /free-roof-inspection | free roof inspection colorado | free roof inspection loveland, free hail damage inspection fort collins, roof inspection near me |
| /blog | colorado roofing blog | roofing guides colorado homeowners, hail damage roof guide, roofing insurance claim guide colorado |
| /services/metal-roofing | metal roofing colorado | metal roof northern colorado, metal roofing loveland, metal roofing fort collins |
| /services/standing-seam-metal-roofing | standing seam metal roof colorado | standing seam roof cost colorado, mechanically seamed metal roof, snap lock metal roof |
| /services/slate-roofing | slate roofing colorado | slate roof repair colorado, natural slate roof installation, slate roof fort collins |
| /services/tile-roofing | tile roofing colorado | concrete tile roof colorado, clay tile roof northern colorado, tile roof underlayment replacement |
| /services/cedar-shake-roofing | cedar shake roofing colorado | cedar shake roof replacement colorado, wood shake roof wildfire code colorado, cedar shake repair northern colorado |
| /services/synthetic-roofing | synthetic roofing colorado | synthetic slate roof colorado, synthetic shake roof colorado, composite slate roofing northern colorado |
| /services/roof-coatings | roof coatings colorado | silicone roof coating northern colorado, commercial roof coating fort collins, flat roof restoration colorado |
| /services/roof-replacement | roof replacement northern colorado | roof replacement loveland, roof replacement cost colorado, new roof fort collins |
| /services/roof-repair | roof repair northern colorado | roof leak repair loveland, roof leak repair fort collins, flashing repair colorado |
| /services/hail-damage-roof-repair | hail damage roof repair colorado | hail damage roof inspection loveland, hail damaged roof fort collins, class 4 shingles colorado |
| /services/storm-damage-roofing | storm damage roofing colorado | emergency roof tarping loveland, wind damage roof repair fort collins, tree fell on roof colorado |
| /services/insurance-claim-roofing | roof insurance claim colorado | insurance roof replacement colorado, acv vs rcv roof claim, recoverable depreciation roof |
| /services/roof-inspections | roof inspection northern colorado | free roof inspection loveland, pre-purchase roof inspection fort collins, pre-listing roof inspection colorado |
| /services/commercial-roofing | commercial roofing northern colorado | flat roof contractor loveland, tpo roofing colorado, epdm roof replacement fort collins |
| /roofing/loveland | loveland roofing | loveland roofing contractor, roof replacement loveland co, hail damage roof repair loveland |
| /roofing/fort-collins | fort collins roofing | fort collins roofing contractor, roof replacement fort collins, hail damage roof repair fort collins |
| /roofing/greeley | greeley roofing | greeley roofing contractor, roof replacement greeley co, hail damage roof repair greeley |
| /roofing/windsor | windsor co roofing | windsor roofing contractor, roof replacement windsor co, hail damage roof repair windsor |
| /roofing/berthoud | berthoud roofing | berthoud roofing contractor, roof replacement berthoud co, hail damage roof repair berthoud |
| /roofing/longmont | longmont roofing | longmont roofing contractor, roof replacement longmont co, hail damage roof repair longmont |
| /roofing/johnstown | johnstown co roofing | johnstown roofing contractor, roof replacement johnstown co, hail damage roof repair johnstown |
| /roofing/wellington | wellington co roofing | wellington roofing contractor, roof replacement wellington co, hail damage roof repair wellington |
| /roofing/timnath | timnath roofing | timnath roofing contractor, roof replacement timnath co, hail damage roof repair timnath |
| /roofing/estes-park | estes park roofing | estes park roofing contractor, roof replacement estes park, metal roofing estes park |
| /roofing/nederland | nederland roofing | nederland co roofing contractor, roof replacement nederland colorado, class a roof nederland |
| /roofing/winter-park | winter park roofing | winter park co roofing contractor, metal roofing winter park colorado, roof snow retention winter park |
| /roofing/granby | granby roofing | granby co roofing contractor, roof replacement granby colorado, metal roofing granby co |
| /roofing/grand-lake | grand lake roofing | grand lake co roofing contractor, cabin roof replacement grand lake colorado, class a roof grand lake |
| /roofing/steamboat-springs | steamboat springs roofing | steamboat springs roofing contractor, metal roofing steamboat springs, ice dam repair steamboat springs |
| /roofing/breckenridge | breckenridge roofing | breckenridge roofing contractor, roof replacement breckenridge colorado, metal roofing breckenridge |
| /roofing/frisco | frisco co roofing | frisco colorado roofing contractor, roof replacement frisco co, metal roofing frisco colorado |
| /roofing/silverthorne | silverthorne roofing | silverthorne co roofing contractor, roof replacement silverthorne colorado, metal roofing silverthorne |
| /roofing/vail | vail roofing | vail colorado roofing contractor, vail design review board roofing, standing seam metal roofing vail |
| /roofing/red-feather-lakes | red feather lakes roofing | roofing red feather lakes co, cabin roof replacement red feather lakes, class a roof larimer county |
| /roofing/glen-haven | glen haven roofing | glen haven co roofing contractor, cabin roof replacement glen haven colorado, north fork big thompson roofing |
| /roofing/drake | drake co roofing | drake colorado roofing contractor, big thompson canyon roofing, cabin roof replacement drake co |
| /casualty | roofing litigation support colorado | roofing expert witness colorado, forensic roof inspection, hail damage expert colorado |
| /casualty/expert-roof-inspections | expert roof inspection colorado | forensic roof inspection, roof inspection for litigation, joint roof inspection protocol |
| /casualty/hail-damage-documentation | hail damage documentation colorado | hail test square inspection, hail damage expert report, slope by slope hail count |
| /casualty/cause-and-origin-reports | roof cause and origin report | roof cause of loss expert colorado, hail vs wear roof opinion, wind damage roof causation |
| /casualty/litigation-support | roofing expert witness colorado | roofing litigation support, construction expert witness roofing, roof claim expert testimony |
| /casualty/appraisal-and-umpire-support | roof appraisal umpire support colorado | insurance appraisal roof estimate, appraisal clause roof dispute, xactimate roof scope review |
| /casualty/construction-defect-review | roofing construction defect expert colorado | roof installation defect review, cdara roof inspection, workmanship vs product defect roof |
| /casualty/fall-protection-standard-of-care | roofing fall protection expert colorado | roofing fall injury standard of care, osha 1926 subpart m expert, roofing jobsite fall investigation |
| /blog/how-to-tell-if-your-roof-has-hail-damage-colorado | hail damage roof signs colorado | how to tell if roof has hail damage, hail damage shingles, colorado hail damage inspection |
| /blog/metal-vs-asphalt-shingles-colorado-30-year-cost-comparison | metal vs asphalt shingles colorado | metal roof vs shingles cost, standing seam metal roof cost colorado, asphalt shingle roof cost colorado |
| /blog/class-4-impact-resistant-shingles-colorado-insurance-discounts | class 4 impact resistant shingles colorado insurance discount | class 4 shingles insurance discount, ul 2218 class 4, impact resistant shingles colorado |
| /blog/what-to-do-after-a-hail-storm-northern-colorado | what to do after a hail storm northern colorado | hail storm checklist, hail damage insurance claim colorado, storm chaser roofers colorado |
| /blog/does-homeowners-insurance-cover-roof-replacement-colorado | does homeowners insurance cover roof replacement colorado | insurance roof replacement colorado, acv vs rcv roof, roof payment schedule insurance |
| /blog/best-roofing-materials-for-wildfire-zones-colorado | best roofing materials for wildfire zones colorado | class a fire rated roof colorado, wildfire resistant roofing, colorado wildfire resiliency code roof |
| /blog/how-long-does-a-roof-last-in-colorado | how long does a roof last in colorado | roof lifespan colorado, asphalt shingle lifespan colorado, metal roof lifespan |
| /blog/slate-roofing-is-it-worth-it | slate roofing colorado | is slate roofing worth it, slate roof cost per square, slate roof weight per square |
| /blog/roof-coatings-for-flat-commercial-roofs-colorado | roof coatings colorado | flat roof coating commercial, silicone roof coating vs acrylic, roof coating cost per square foot |
| /blog/mountain-home-roofing-snow-load-ice-dams-8000-feet | mountain roofing colorado | roof snow load colorado, ice dams colorado mountain home, snow retention metal roof |
| /blog/how-to-read-a-roofing-estimate | how to read a roofing estimate | roofing estimate line items, roofing estimate explained, xactimate roofing estimate |
| /blog/signs-you-need-a-roof-inspection-before-selling-your-home | roof inspection before selling home | selling a house with an old roof colorado, colorado seller property disclosure roof, pre-listing roof inspection |

### Verification steps run

1. node scripts/validate-content.js: schema, length, banned-text (em dashes, names, other companies), allowed tags, link format, FAQ counts, word counts. Passes.
2. node scripts/build.js: 68 pages. Passes.
3. node scripts/check-site.js: crawls dist/, follows every internal href and img src, checks one H1, unique titles and descriptions, canonical match, OG image, JSON-LD parses with required properties per type, FAQ block implies FAQPage, nested pages have BreadcrumbList, every page in the sitemap and every sitemap URL is a page. Result: zero broken links, zero duplicates, zero schema errors.
4. Lighthouse mobile on seven page types: SEO 100 on every page, performance 98 to 99.
5. Structured data validated with a Schema.org-style property check in check-site.js (the hosted validator is network-restricted from the build environment; paste any page URL into https://validator.schema.org/ or Google's Rich Results Test after deploy to confirm).
