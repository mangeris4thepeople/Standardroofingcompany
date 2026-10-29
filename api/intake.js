// Shared intake for the contact forms on every Standard site.
// Each sister site's own /api/contact forwards here server to server. This function:
// 1. Saves the submission to the leads database first (table: submissions), so nothing is lost.
// 2. Emails it through the Gmail relay to that site's inbox.
// 3. Records whether the email went out, so unsent ones can be caught later.
const { clean, sql, ipHash, rateLimited, mailRelay, DB_URL } = require('./_lib');

const SITES = {
  roofing: 'Standard Roofing Company',
  building: 'Standard Building Company',
  development: 'Standard Development Company',
  data: 'Standard Data Company',
  spaceworx: 'Standard SpaceWorX',
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }

  const site = clean(b.site, 40);
  if (!SITES[site]) return res.status(400).json({ ok: false, error: 'Unknown site' });

  const ip = clean(b.ip, 64) || clean((req.headers['x-forwarded-for'] || '').split(',')[0], 64);
  if (rateLimited('intake:' + site + ':' + ip, 6, 10 * 60 * 1000) || rateLimited('intake:global', 120, 60 * 1000)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  const name = clean(b.name, 120);
  const email = clean(b.email, 200);
  const phone = clean(b.phone, 40);
  const message = clean(b.message, 5000);
  const kind = clean(b.kind, 60) || 'contact';
  const page = clean(b.page, 300);
  if (!name || (!email && !phone)) return res.status(400).json({ ok: false, error: 'Missing name or contact' });

  const fields = {};
  const src = b.fields && typeof b.fields === 'object' ? b.fields : {};
  for (const k of Object.keys(src).slice(0, 30)) {
    const v = clean(src[k], 3000);
    if (v) fields[clean(k, 60)] = v;
  }
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  const subject = clean(b.subject, 200) || `Website inquiry: ${name}`;

  let id = null;
  if (DB_URL) {
    try {
      const rows = await sql(
        'INSERT INTO submissions (site, kind, name, email, phone, message, fields, page, ip_hash, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10) RETURNING id',
        [site, kind, name, email, phone, message, JSON.stringify(fields), page, ipHash(ip), clean(b.ua, 300)]
      );
      id = rows && rows[0] ? Number(rows[0].id) : null;
    } catch (err) {
      console.error('Intake store failed', err && err.message);
    }
  }

  const text = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    + (page ? `\nPage: ${page}` : '')
    + (id ? `\nSubmission ID: ${site}-${id}` : '')
    + `\n\nSent from the ${SITES[site]} website.`;
  const out = await mailRelay(site, subject + (id ? ` (#${id})` : ''), text, replyTo);
  if (!out.ok) console.error('Intake mail failed', site, out.status, JSON.stringify(out.data).slice(0, 200));
  if (id) {
    try {
      await sql('UPDATE submissions SET emailed=$2, email_via=$3, email_error=$4 WHERE id=$1', [id, out.ok, out.ok ? 'gmail-relay' : null, out.ok ? null : clean(JSON.stringify(out.data), 300)]);
    } catch (e) {}
  }

  if (!id && !out.ok) return res.status(502).json({ ok: false, error: 'Not delivered' });
  return res.status(200).json({ ok: true, id, emailed: out.ok });
};
