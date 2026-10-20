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

## Deploy

**Cloudflare Pages:** Connect this repo, framework preset "None", build command empty, output directory `/`.

**GitHub Pages:** Settings > Pages > Deploy from branch > `main` / root.

## Settings to change

In `main.js`, the `CONFIG` block at the top:

- `FORM_ENDPOINT`: paste a Formspree, Web3Forms, or Worker URL to receive form submissions directly. Left empty, forms open a pre-filled email to `LEAD_EMAIL`, or a pre-filled text message to the business line if `LEAD_EMAIL` is also empty.
- `LEAD_EMAIL`: where form requests go.

Domain: canonical URLs, `sitemap.xml`, and `robots.txt` assume `https://standardroofingcompany.net`. Find and replace if the domain is different.

Analytics: add the Google Analytics tag to the `<head>` of each page when a property is created.

## Brand

Forest green `#14261d` and brass `#b08d57`, Barlow Condensed headings.
