# Content files

All page copy lives in these JSON files. `scripts/build.js` turns them into HTML in `dist/`.
Edit copy here, never in `dist/`. Run `node scripts/validate-content.js` after editing.

## Hard rules for every file

- Never use an em dash or an en dash anywhere. Use a comma, a period, a colon, or the word "to".
- No founder name, no biography, no personal background, no other company names. The site sells roofing only.
- Do not invent credentials, awards, years in business, project counts, review counts, or star ratings.
- Facts that are allowed because they are already established on the site: Standard Roofing Company, 1180 E 3rd St, Loveland, CO 80537; info@standardroofingcompany.net; (970) 430-5884; licensed and insured; hours Monday to Saturday 7am to 6pm; free inspections; Colorado law (C.R.S. 6-22-105) prohibits roofers from paying or waiving deductibles and we never do; written itemized estimates; photo-documented inspections.
- Cost figures are framed as typical Colorado ranges, always with "varies by" language. Never promise a price.
- Warranty talk describes what manufacturer and workmanship warranties typically cover and what to ask for. Do not state a specific company warranty term unless it is in `site.json`.
- `html` fields may contain only these tags: `<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<a href="...">`, `<h3>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`. No `<h1>` or `<h2>` inside `html` (section headings come from the `h2` field). No inline styles, no scripts, no images.
- Internal links use clean site paths: `/services/metal-roofing`, `/roofing/fort-collins`, `/casualty/litigation-support`, `/blog/how-to-tell-if-your-roof-has-hail-damage-colorado`, `/free-roof-inspection`, `/contact`, `/financing`, `/warranty`, `/about`, `/gallery`, `/reviews`, `/services`, `/service-areas`, `/casualty`, `/blog`. Never link to `.html` files.
- Titles: under 60 characters total INCLUDING the suffix ` | Standard Roofing Company` (26 characters). So the part you write must be 33 characters or fewer, keyword first.
- Meta descriptions: 120 to 155 characters, contain the primary keyword, end with a call to action such as "Get a free inspection."
- Every page needs a `keywords` array: the primary keyword first, then 3 to 6 secondary keywords.

## site.json

Business facts. Read it, do not edit it unless a fact is wrong.

## services.json

Array of 14 service objects. Route: `/services/<slug>`.

```json
{
  "slug": "metal-roofing",
  "name": "Metal Roofing",
  "serviceType": "Metal roofing installation",
  "h1": "Metal Roofing in Northern Colorado",
  "title": "Metal Roofing Northern Colorado",
  "description": "...",
  "keywords": ["metal roofing colorado", "..."],
  "eyebrow": "Specialty Roofing",
  "lede": "One or two sentence hook under the H1, 25 to 45 words.",
  "summary": "One sentence for cards and hub pages, under 30 words.",
  "lifespan": "40 to 70 years",
  "costRange": "$...",
  "sections": [
    { "h2": "What metal roofing is", "html": "<p>...</p>" },
    { "h2": "Why it suits Colorado", "html": "..." }
  ],
  "faq": [ { "q": "...", "a": "..." } ],
  "related": ["standing-seam-metal-roofing", "hail-damage-roof-repair", "roof-replacement"]
}
```

Required section coverage, in this order, using these or similar H2s: what the material or service is; why it suits Colorado (hail, UV at altitude, snow load, wildfire ember resistance, wind); lifespan and maintenance; cost range framing; warranty and what to ask for. 600 to 1,200 words across `sections` (excluding FAQ). Exactly 5 FAQ items, each answer 40 to 90 words. `related` holds exactly 3 slugs of other service pages. Each page must be specific to its service. No page may share more than a sentence with another.

## cities.json

Array of 22 city objects. Route: `/roofing/<slug>`.

```json
{
  "slug": "fort-collins",
  "name": "Fort Collins",
  "county": "Larimer County",
  "elevationFt": 5003,
  "lat": 40.5853,
  "lng": -105.0844,
  "region": "northern-colorado" | "mountain",
  "permitAuthority": "City of Fort Collins Building Services",
  "wildfireInterface": false,
  "h1": "Roofing in Fort Collins, CO",
  "title": "Fort Collins Roofing Contractor",
  "description": "...",
  "keywords": ["fort collins roofing", "..."],
  "lede": "...",
  "summary": "...",
  "sections": [ { "h2": "...", "html": "..." } ],
  "faq": [ { "q": "...", "a": "..." } ],
  "relatedServices": ["roof-replacement", "hail-damage-roof-repair", "metal-roofing", "roof-inspections"]
}
```

Each city page must be genuinely local and 600 to 1,000 words across `sections`. Cover: the county and elevation; the housing stock and typical roof types in that specific town (which neighborhoods, what era of construction, what is common on the roofs there); documented local hail history with dates where known (research it; do not invent storms); wildfire interface and ember exposure where relevant (required for Estes Park, Nederland, Red Feather Lakes, Glen Haven, Drake, Grand Lake, and any other town inside the wildland urban interface); snow load and ice dam realities for mountain towns; HOA and architectural review considerations; the exact permit authority and what it inspects. 3 to 5 FAQ items. `relatedServices` holds 4 service slugs that fit that town. Do not produce the same page with the city name swapped: each page should read as if written by someone who has roofed in that town.

## casualty.json

Object with `landing` plus `pages` array. Routes: `/casualty` and `/casualty/<slug>`.

```json
{
  "landing": { "h1": "...", "title": "...", "description": "...", "keywords": [], "lede": "...", "sections": [], "faq": [] },
  "pages": [
    {
      "slug": "expert-roof-inspections",
      "name": "Expert Roof Inspections",
      "serviceType": "...",
      "h1": "...", "title": "...", "description": "...", "keywords": [], "lede": "...", "summary": "...",
      "audience": "Attorneys, public adjusters, and carriers",
      "deliverables": ["...", "..."],
      "reportFormat": ["...", "..."],
      "sections": [ { "h2": "...", "html": "..." } ],
      "faq": [ { "q": "...", "a": "..." } ],
      "related": ["litigation-support", "cause-and-origin-reports"]
    }
  ]
}
```

Professional tone. Lists deliverables, explains report format, no promises about outcomes, and never offers to represent a policyholder or act as a public adjuster. 600 to 1,000 words per page across `sections`. 4 to 6 FAQ items.

## blog.json

Array of 12 post objects. Route: `/blog/<slug>`.

```json
{
  "slug": "how-to-tell-if-your-roof-has-hail-damage-colorado",
  "h1": "How to Tell If Your Roof Has Hail Damage (Colorado Guide)",
  "title": "Hail Damage Roof Signs Colorado",
  "description": "...",
  "keywords": [],
  "category": "Hail and Storms",
  "datePublished": "2026-10-23",
  "excerpt": "Two sentences for the blog index, under 45 words.",
  "intro": "<p>Opening paragraph or two before the table of contents.</p>",
  "sections": [ { "id": "section-slug", "h2": "...", "html": "..." } ],
  "faq": [ { "q": "...", "a": "..." } ],
  "related": ["/services/hail-damage-roof-repair", "/blog/what-to-do-after-a-hail-storm-northern-colorado"]
}
```

1,200 to 2,000 words across `intro` and `sections` combined. Every section needs a unique `id` (used for the table of contents). 4 to 6 FAQ items. `related` holds 3 to 5 internal paths. Real search intent, specific to Colorado, with concrete numbers where they are real (hail sizes, UL 2218 classes, code references, Colorado statutes). No invented statistics.

## pages.json

Static page copy (about, financing, warranty, gallery, reviews, contact, free-roof-inspection, hubs). Same `sections` and `faq` shape.
