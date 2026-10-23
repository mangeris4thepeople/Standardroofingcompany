# SEO Playbook: Standard Roofing Company

The site is built. This is the off-site work that turns it into traffic. Do it in order.

## 1. NAP (use this exact text everywhere)

```
Standard Roofing Company
1180 E 3rd St
Loveland, CO 80537
(970) 430-5884
info@standardroofingcompany.net
https://standardroofingcompany.net
Monday to Saturday, 7:00 AM to 6:00 PM
```

Every listing, citation, social profile, and invoice footer uses this text verbatim: no "St." vs "Street" variation, no "Standard Roofing" without "Company", no alternate phone number. Consistency is what local search ranks on. The same text is already in the site footer, the contact page, llms.txt, and the RoofingContractor schema.

## 2. Claim and complete the Google Business Profile

1. Go to business.google.com and sign in with the account that will own the listing (a company Google account, not a personal one). Search for "Standard Roofing Company Loveland". If a listing exists, claim it; if not, create it.
2. Business name: `Standard Roofing Company`. Nothing else in the name field (no city, no keywords; Google suspends listings for this).
3. Business type: choose "service-area business" if customers do not visit the address. You can keep the address on file for verification and hide it, or show it. Hidden address plus service areas is the safe default for a contractor.
4. Categories:
   - Primary: `Roofing Contractor`
   - Secondary: `Metal Roofing Contractor`, `Roof Repair`, `Commercial Roofer` (Google's names may read "Roofing contractor", "Metal roofing contractor", "Roof repair", "Commercial roofing contractor"; pick the closest match)
5. Service areas (add all 20): Loveland CO, Fort Collins CO, Greeley CO, Windsor CO, Berthoud CO, Longmont CO, Johnstown CO, Wellington CO, Timnath CO, Estes Park CO, Nederland CO, Winter Park CO, Granby CO, Grand Lake CO, Steamboat Springs CO, Breckenridge CO, Frisco CO, Silverthorne CO, Vail CO, Red Feather Lakes CO. (Glen Haven and Drake are unincorporated and usually not selectable; Larimer County, CO covers them.)
6. Phone: (970) 430-5884. Website: https://standardroofingcompany.net. Appointment link: https://standardroofingcompany.net/free-roof-inspection.
7. Hours: Monday to Saturday 7:00 AM to 6:00 PM, Sunday closed.
8. Description (750 characters max, keep the first sentence keyword-first):
   `Standard Roofing Company is a licensed and insured roofing contractor in Loveland, Colorado serving Northern Colorado and the mountain towns. We install and repair metal, standing seam, slate, tile, cedar shake, synthetic, and roof coatings, plus asphalt shingle replacement, hail and storm damage repair, insurance claim roofing, and roof inspections for homeowners, HOAs, and commercial property managers. Every job gets a free photo-documented inspection, a written itemized estimate, one accountable project lead, and a clean closeout. We never pay or waive deductibles, as Colorado law requires. Our casualty group also provides expert roof inspections, hail documentation, and cause and origin reports for attorneys and public adjusters.`
9. Services: add each of the 14 service pages as a service, using the page's H1 as the service name and the page's first sentence as the description, with the page URL. Add the casualty services under a "Expert and litigation services" heading.
10. Attributes: "Identifies as Colorado-owned" is not an attribute; skip identity attributes. Do not select veteran-owned. Select "Online estimates" and "Onsite services".
11. Photos: upload the logo (public/images/logo-512.png), a cover image (public/images/og-image.png is 1200x630; Google prefers 1024x576 or larger landscape), and real job-site photos as soon as the first jobs close out. Listings with 100+ photos get materially more calls. Add 3 to 5 photos a week.
12. Verify. Google will offer video verification for a service-area business: a live walkthrough showing the work vehicle, tools, signage, and business documents. Have a vehicle magnet or yard sign, the business license, and an insurance certificate ready before starting.
13. Once live, copy the profile's share URL (Business Profile > Share) into `content/site.json` under `sameAs`, rebuild, and push. That links the website schema to the listing.
14. Turn on messaging, set up the free Google booking link to /free-roof-inspection, and post a Google Post once a week (reuse blog posts).

## 3. Search Console and Bing Webmaster

1. Google Search Console: add property `standardroofingcompany.net` (domain property). Verify by DNS TXT at Namecheap, or use the HTML tag: set `GSC_VERIFICATION` in Vercel project env vars to the token Google gives you (the part after `content="`), redeploy, and verify. The build injects the meta tag and also writes `/<token>.html`. The existing file googleabcedbf3dc9f6325.html is kept in public/ so the earlier verification still works.
2. Submit the sitemap: https://standardroofingcompany.net/sitemap.xml.
3. Request indexing for the home page, /services, /service-areas, /free-roof-inspection, and the three highest-value service pages (hail-damage-roof-repair, roof-replacement, metal-roofing). Google allows about 10 requests a day.
4. Bing Webmaster Tools: import from Search Console (one click) or verify with `BING_VERIFICATION` env var (the build emits the msvalidate.01 meta tag and BingSiteAuth.xml). Submit the same sitemap. IndexNow is already wired, so Bing gets every new page within minutes of a deploy.
5. Google Analytics 4: create a property, copy the G- measurement ID into the `GA_MEASUREMENT_ID` env var in Vercel (production), redeploy. The site then reports page views, phone_click, text_click, cta_click, and generate_lead events. Mark generate_lead and phone_click as key events in GA4.

## 4. First 10 citation sites (submit with the exact NAP above)

1. Google Business Profile (above)
2. Bing Places for Business (bingplaces.com, import from Google)
3. Apple Business Connect (businessconnect.apple.com)
4. Yelp for Business
5. Better Business Bureau (bbb.org, Northern Colorado and Wyoming office)
6. Angi / HomeAdvisor (one profile covers both)
7. Houzz Pro
8. Nextdoor Business (claim for Loveland, then add the surrounding neighborhoods)
9. Facebook Business Page (set the category to Roofing Service, add the NAP, link the website)
10. Loveland Chamber of Commerce member directory (and the Fort Collins Area Chamber once budget allows)

After those: Colorado Roofing Association member directory, Yellow Pages, Manta, Thumbtack, Porch, GAF or Owens Corning contractor locators once manufacturer certification is in place, and the Habitat for Humanity ReStore partner list if a donation relationship exists.

Rules: identical NAP, same category language, same short description, link to the home page, and upload the logo. Record every login in a password manager; citation sites get lost otherwise.

## 5. Reviews

- Ask on closeout, in person, then send the Google review link by text the same day. Target 2 reviews per completed job (homeowner plus spouse or partner if both were involved).
- Reply to every review within 48 hours. Thank by first name, mention the service and the town ("Thanks for trusting us with your Fort Collins hail replacement").
- Once 5 reviews exist, add `AggregateRating` to the RoofingContractor schema in scripts/lib/html.js using the real count and average from the profile, and add a Review widget to /reviews. Never publish ratings the profile does not show.

## 6. 90 day content calendar (2 posts per week, Tuesday and Friday)

The 12 launch posts are live. Each new post follows the blog.json schema (1,200 to 2,000 words, TOC, FAQ, internal links). Target the long tail that the service and city pages cannot.

Week 1
- Tue: How much does a roof replacement cost in Loveland in 2026 (by material, with a table)
- Fri: Hail season in Colorado: month by month, what to expect and when to inspect

Week 2
- Tue: Standing seam vs exposed fastener metal roofs: which one for a Colorado home
- Fri: What a free roof inspection actually covers (and what a bad one skips)

Week 3
- Tue: Cosmetic damage exclusions on metal roofs: what Colorado insurers will and will not pay
- Fri: Ice dams in Fort Collins and Loveland: why they form on Front Range homes too

Week 4
- Tue: Synthetic slate vs real slate: a Colorado cost and weight comparison
- Fri: How to choose a roofer after a hail storm (10 questions and the red-flag answers)

Week 5
- Tue: Roof ventilation in Colorado: the 1/150 rule, ridge vents, and attic heat
- Fri: Recoverable depreciation explained for Colorado roof claims

Week 6
- Tue: Tile roof underlayment replacement: why 25-year-old tile roofs leak in Windsor and Timnath
- Fri: HOA roofing approvals in Northern Colorado: Class 4 rules, color charts, and timelines

Week 7
- Tue: Flat roof options for Greeley commercial buildings: TPO vs EPDM vs coatings
- Fri: Should you file a roof claim? When a repair beats a claim in Colorado

Week 8
- Tue: Cedar shake replacement in wildfire zones: Class A alternatives that keep the look
- Fri: Estes Park roofing permits and the Colorado Wildfire Resiliency Code, explained

Week 9
- Tue: What roofers mean by "per code" on a Colorado estimate
- Fri: Pre-purchase roof inspections for Fort Collins buyers: what to ask for before the inspection deadline

Week 10
- Tue: Snow retention on metal roofs: clamps, rails, and where they go
- Fri: Roof warranties when you sell: transferring manufacturer and workmanship coverage

Week 11
- Tue: Steamboat Springs roofs: what 400 inches of snow does and the roofs that survive it
- Fri: Hail damage on commercial roofs: documenting membrane and HVAC damage for a claim

Week 12
- Tue: Skylight replacement during a reroof: why to do it at the same time
- Fri: Mountain reroof scheduling: why the build season is short and how to get on the calendar

Week 13
- Tue: Roof coatings in winter: temperature limits and when to wait
- Fri: Year one recap: the most common roof problems we found in Northern Colorado in 2026

Each post: publish, add it to the Google Business Profile as a post, share on Facebook and Nextdoor, and link it from one existing page.

## 7. Monthly checklist

- [ ] Search Console: review coverage errors, fix any 404s or redirect chains, check that the sitemap shows all pages as discovered
- [ ] Search Console: export the top 100 queries, note any page ranking 5 to 15 for a high-intent term, and strengthen that page (add a section, an FAQ, an internal link from the home page)
- [ ] Google Business Profile: add 10+ photos, post 4 updates, answer all Q&A, reply to all reviews, confirm hours and holiday hours
- [ ] Reviews: count new reviews; if under the target, call the last five closeouts and ask again
- [ ] Citations: check the top 10 for NAP consistency (a free Moz Local or BrightLocal scan works); fix drift
- [ ] Content: 8 posts published this month, each with FAQ and internal links; update one older post with new facts
- [ ] Links: earn 2 local links a month (chamber, supplier spotlight, HOA newsletter, Habitat partner page, local news on storm response)
- [ ] Technical: run `npm run build && npm run check` locally; run Lighthouse on three pages; confirm /api/health shows leadsDatabase and analytics true
- [ ] Leads: query the leads table (SELECT received_at, name, phone, city, issue, page FROM leads ORDER BY received_at DESC) and confirm every lead was emailed; review which pages produce leads and promote them in nav and internal links
- [ ] After any major hail event: publish a short storm post within 48 hours naming the towns hit, request indexing, and post it to the Business Profile

## 8. Environment variables (Vercel, CYRcom team, project standardroofingcompany)

| Variable | Purpose | Status |
|---|---|---|
| LEADS_DATABASE_URL | Neon Postgres connection string for the leads database | set |
| INDEXNOW_KEY | IndexNow key, must match the key file at the site root | set |
| GA_MEASUREMENT_ID | GA4 measurement ID (G-XXXXXXX); analytics script only ships when set | to set once the GA4 property exists |
| GSC_VERIFICATION | Google Search Console HTML tag token | to set when verifying |
| BING_VERIFICATION | Bing Webmaster msvalidate.01 token | to set when verifying |
| RESEND_API_KEY, LEAD_TO, LEAD_FROM | Optional: send lead emails with photo attachments through Resend instead of the FormSubmit relay | optional |
| CONTACT_TO | FormSubmit destination for lead emails. Currently the alias that delivers to the personal Gmail. To deliver to info@standardroofingcompany.net: click the FormSubmit activation link that arrived in the info@ inbox, then set CONTACT_TO to `info@standardroofingcompany.net` (no redeploy needed; functions read it at runtime). | action needed |

Changing GA, GSC, or Bing values requires a redeploy (they are baked in at build time). CONTACT_TO, LEADS_DATABASE_URL, and RESEND_API_KEY are read at runtime.

Lead email delivery note: the FormSubmit relay accepts posts from browsers only (server-side posts get a 403), so /api/lead stores the lead and the page completes the email from the visitor's browser. If FormSubmit is slow or down the lead is still in the database; check `SELECT * FROM leads WHERE emailed = false` weekly, or add a Resend API key for server-side delivery with photo attachments.
