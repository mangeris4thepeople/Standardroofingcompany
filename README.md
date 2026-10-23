# Standard Roofing Company

Website for Standard Roofing Company, Loveland, Colorado. Live at https://standardroofingcompany.net on Vercel (CYRcom team).

Static site generated from JSON content. No framework; Node 20, one dev dependency (sharp, for images).

## Layout

| Path | What |
| --- | --- |
| `content/*.json` | All copy. `site.json` holds business facts (phone, address, hours, nav). `services.json` (14), `cities.json` (22), `casualty.json` (landing + 7), `blog.json` (12), `pages.json` (home, hubs, about, financing, warranty, gallery, reviews, contact, free inspection, 404). Rules in `content/README.md`. |
| `scripts/build.js` | Generates `dist/`: clean routes, metadata, JSON-LD, sitemap.xml, robots.txt, feed.xml, llms.txt, 404.html. |
| `scripts/lib/` | `content.js` (loader), `html.js` (components, layout, schema builders). |
| `scripts/images.js` | Draws every illustration, OG card, and the logo from SVG and writes WebP/PNG to `public/images/`. Outputs are committed; rerun only after changing art or adding pages. |
| `scripts/validate-content.js` | Enforces the content rules (lengths, word counts, banned text, tags, links). Runs before every build. |
| `scripts/check-site.js` | Crawls `dist/`: broken links, unique titles and descriptions, one H1, alt text, schema validity, sitemap coverage. |
| `scripts/ping-search-engines.js` | IndexNow and Bing sitemap ping; run by `.github/workflows/post-deploy.yml` after each production deploy. |
| `src/styles.css`, `src/main.js`, `src/analytics.js`, `src/fonts/`, `src/partials/` | Styles (inlined at build), site script, GA4 script, self-hosted Barlow WOFF2, home hero SVG. |
| `public/` | Static files copied to `dist/` as-is (favicons, IndexNow key file, verification files, images). |
| `api/` | Vercel functions: `lead.js` (form handler, stores to Neon and emails), `photo.js` (serves stored lead photos), `indexnow.js`, `health.js`, `contact.js` (legacy alias). |
| `vercel.json` | Build command, clean URLs, 301s from the old `.html` URLs, cache and security headers. |
| `SEO_AUDIT.md`, `SEO_PLAYBOOK.md` | Before/after audit and the off-site checklist (Google Business Profile, citations, content calendar). |

## Commands

```
npm install          # once
npm run build        # validate content, then build dist/
npm run check        # crawl dist/ for broken links, duplicates, schema problems
npm run serve        # preview dist/ locally
npm run images       # regenerate public/images (only after art or page changes)
```

Vercel runs `npm run build` and serves `dist/`.

## Editing copy

Edit the JSON in `content/`, run `npm run build`, commit, push to `main`. Never edit `dist/`.
Rules worth repeating: no em dashes anywhere, no people or other companies, titles 33 characters or fewer (the suffix is added), descriptions 120 to 155 characters with a call to action. The validator will tell you exactly what to fix.

Adding a blog post: append an object to `content/blog.json` (copy the shape of an existing one), run `npm run images` so it gets an OG card, build, push. It appears in the blog index, the home page, the sitemap, feed.xml, and llms.txt automatically.

Adding a city or service: append to `cities.json` or `services.json` with the same fields, run `npm run images`, build. The validator expects the full lists; extend the `expected` arrays in `scripts/validate-content.js` if you add beyond them.

Changing the phone number: `content/site.json` (`phone` and `phoneE164`), rebuild. Every call button, tel: link, form fallback, and schema updates.

## Leads

Forms post JSON to `/api/lead`. The function rejects bots (honeypot, timing, rate limit), inserts the lead into the `leads` table (and photos into `lead_photos`) in the Neon database named `srcleads`, then emails `info@standardroofingcompany.net` with the fields and private photo links. If the database is unreachable the email still goes out; if email fails the lead is still stored. `/api/health` reports which integrations are configured.

Query recent leads: `SELECT received_at, form_kind, name, phone, email, city, issue, page, emailed FROM leads ORDER BY received_at DESC LIMIT 50;`

## Environment variables

See the table at the end of `SEO_PLAYBOOK.md`. `LEADS_DATABASE_URL` and `INDEXNOW_KEY` are set. `GA_MEASUREMENT_ID`, `GSC_VERIFICATION`, and `BING_VERIFICATION` are read at build time; set them in the Vercel project and redeploy.

## Brand

Storm theme: near-black forest green, burnished brass `#a8844e`, bone text, Barlow Condensed headings. The home hero is an animated supercell; all motion stops for visitors with reduced-motion on.
