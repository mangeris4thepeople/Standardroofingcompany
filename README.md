# Standard Roofing Company

Website for Standard Roofing Company, Loveland, Colorado.

Plain static site: HTML, CSS, and one JS file. No build step, no dependencies.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `services.html` | Replacement, repair, commercial, inspections, gutters |
| `storm-damage.html` | Hail and storm damage, insurance help, Colorado roofing law, FAQ |
| `casualty.html` | Casualty and litigation services for attorneys, with attorney intake form |
| `about.html` | Company story and credentials |
| `contact.html` | Free inspection request form |
| `404.html` | Not found page |
| `specialty-roofing.html` | Specialty roofing hub with comparison table |
| `metal-roofing.html`, `slate-roofing.html`, `tile-roofing.html`, `cedar-shake-roofing.html`, `synthetic-roofing.html`, `roof-coatings.html` | Specialty system pages, each with FAQ schema |
| `service-areas.html` | Service area hub |
| `roofing-<city>-co.html` | City pages: Loveland, Fort Collins, Windsor, Greeley, Longmont, Estes Park, Berthoud, Johnstown, Timnath, Wellington |
| `mountain-roofing.html` | Vail, Avon, Aspen, Steamboat, Winter Park, Copper Mountain |

## SEO

- Every page carries a JSON-LD `@graph`: RoofingContractor organization, WebSite, WebPage, BreadcrumbList, and Service or FAQPage where they apply.
- `og-image.png` (1200x630) is the share image; the SVG is kept for reference only.
- `sitemap.xml` lists all indexable pages with `lastmod`. `llms.txt` summarizes the site for AI crawlers.
- The specialty and city pages are generated from a content file. To change copy across many pages at once, edit the generator rather than each HTML file by hand.

## Deploy

**Vercel:** the repo is connected; every push to `main` deploys to standardroofingcompany.net. Framework preset "Other", no build command, output directory `/`.

## Settings to change

In `main.js`, the `CONFIG` block at the top:

- `FORM_ENDPOINT`: FormSubmit endpoint that emails each form request to the lead inbox. Currently `https://formsubmit.co/ajax/info@standardroofingcompany.net`. FormSubmit sends a one-time activation email to that inbox on the first submission; click it once or requests will not be delivered.
- `LEAD_EMAIL`: `info@standardroofingcompany.net`. If the endpoint fails, the visitor's email app opens with the request addressed here.

Domain: canonical URLs, `sitemap.xml`, and `robots.txt` assume `https://standardroofingcompany.net`. Find and replace if the domain is different.

Analytics: every page loads `analytics.js`. Set `GA_ID` at the top of that file to the GA4 measurement ID (starts with G-) and the whole site starts reporting page views plus `phone_click`, `text_click`, and `generate_lead` events. Left empty, it does nothing.

## Brand

Storm theme: near-black forest green (`#050806` to `#121e17`), burnished brass `#a8844e`, bone text `#d6cfbf`, Barlow Condensed headings. The home hero is an animated supercell (lightning flash, falling hail, drifting clouds); all motion stops for visitors with reduced-motion turned on.
