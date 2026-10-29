// Lead capture for every quote, inspection, and attorney intake form on the site.
// 1. Rejects bots (honeypot field, too-fast submits, per-IP rate limit, size caps).
// 2. Stores the lead and any photos in the leads database (LEADS_DATABASE_URL, Neon).
// 3. Emails the lead to the inbox. Transport: Resend with attachments when RESEND_API_KEY
//    is set, otherwise the Gmail relay (MAIL_RELAY_URL) with photo links. FormSubmit is only a
//    last-resort browser fallback.
const { SITE, LEAD_INBOX_ALIAS, clean, sql, photoToken, ipHash, clientIp, rateLimited, relayEmail, resendEmail, mailRelay, DB_URL } = require('./_lib');

const PHONE = '(970) 430-5884';
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 1.6 * 1024 * 1024; // base64 length per photo
const FIELD_LABELS = { name: 'Name', phone: 'Phone', email: 'Email', address: 'Property address', city: 'City page', service: 'Service page', roof_type: 'Roof type', issue: 'Issue', message: 'Details', matter: 'Matter', firm: 'Firm', role: 'Role', page: 'Page', referrer: 'Referrer' };

module.exports.config = { api: { bodyParser: { sizeLimit: '8mb' } } };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }

  // Bot checks. Bots get a 200 so they do not learn anything.
  if (clean(b.company_website)) return res.status(200).json({ ok: true });
  const started = Number(b.started || 0);
  if (started && Date.now() - started < 3000) return res.status(200).json({ ok: true });
  const ip = clientIp(req);
  if (rateLimited('ip:' + ip, 5, 10 * 60 * 1000) || rateLimited('global', 60, 60 * 1000)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please call or text ' + PHONE + '.' });
  }

  const name = clean(b.name, 120);
  const email = clean(b.email, 200);
  const phone = clean(b.phone, 40);
  if (!name || (!email && !phone)) return res.status(400).json({ ok: false, error: 'Please include your name and a phone number or email.' });
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  const kind = clean(b.form_kind, 40) || 'quote';

  const fields = {};
  for (const k of Object.keys(FIELD_LABELS)) if (clean(b[k])) fields[FIELD_LABELS[k]] = clean(b[k], k === 'message' || k === 'matter' ? 3000 : 300);
  const photos = Array.isArray(b.photos) ? b.photos.slice(0, MAX_PHOTOS).filter((p) => p && typeof p.data === 'string' && p.data.length > 100 && p.data.length <= MAX_PHOTO_BYTES && /^[A-Za-z0-9+/=]+$/.test(p.data)) : [];

  // Store first, so a lead is never lost to an email hiccup.
  let leadId = null;
  const photoLinks = [];
  if (DB_URL) {
    try {
      const rows = await sql(
        'INSERT INTO leads (form_kind, name, phone, email, address, city, roof_type, issue, message, page, source, photo_count, ip_hash, user_agent, raw) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb) RETURNING id',
        [kind, name, phone, email, clean(b.address, 300), clean(b.city, 120), clean(b.roof_type, 60), clean(b.issue, 120), clean(b.message || b.matter, 3000), clean(b.page, 300), clean(b.referrer, 300), photos.length, ipHash(ip), clean(req.headers['user-agent'], 300), JSON.stringify(Object.assign({}, b, { photos: undefined }))]
      );
      leadId = rows && rows[0] ? Number(rows[0].id) : null;
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const r = await sql('INSERT INTO lead_photos (lead_id, filename, content_type, bytes) VALUES ($1,$2,$3,decode($4,\'base64\')) RETURNING id', [leadId, clean(p.name, 120) || `photo-${i + 1}.jpg`, 'image/jpeg', p.data]);
        const pid = r && r[0] ? r[0].id : null;
        if (pid) photoLinks.push(`${SITE}/api/photo?id=${pid}&t=${photoToken(pid)}`);
      }
      if (leadId && photoLinks.length) await sql('UPDATE leads SET photos=$2::jsonb WHERE id=$1', [leadId, JSON.stringify(photoLinks)]);
    } catch (err) {
      console.error('Lead store failed', err && err.message);
    }
  }

  // Email.
  const subject = (kind === 'attorney' ? 'Casualty / Litigation Matter | ' : 'Roof Inspection Request | ') + name + (leadId ? ` (#${leadId})` : '');
  const text = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n') + (photoLinks.length ? '\n\nPhotos:\n' + photoLinks.join('\n') : photos.length ? `\n\n${photos.length} photo(s) attached` : '');
  let emailed = false;
  let emailError = '';
  try {
    const viaResend = await resendEmail(subject, text + `\n\nSource: ${SITE}`, photos.map((p, i) => ({ name: clean(p.name, 120) || `photo-${i + 1}.jpg`, data: p.data })), replyTo);
    if (viaResend.ok) emailed = true;
    else {
      const out = await mailRelay('roofing', subject, text + (leadId ? `\nLead ID: ${leadId}` : '') + `\n\nSource: ${SITE}`, replyTo);
      emailed = out.ok;
      if (!out.ok) { emailError = 'mailrelay ' + out.status + ' ' + JSON.stringify(out.data).slice(0, 200); console.error('Mail relay failed', emailError); }
    }
  } catch (err) {
    emailError = 'exception ' + String(err && err.message).slice(0, 200);
    console.error('Email error', emailError);
  }
  if (leadId && emailed) { try { await sql('UPDATE leads SET emailed=true WHERE id=$1', [leadId]); } catch (e) {} }

  if (!emailed && !leadId) return res.status(502).json({ ok: false, error: 'We could not send that just now. Please call or text ' + PHONE + '.' });
  // When the server relay is refused (FormSubmit only accepts browser posts), the page sends the
  // email itself with the stored photo links; the lead is already saved either way.
  return res.status(200).json({ ok: true, id: leadId, emailed, emailError: emailError || undefined, subject, fields, photos: photoLinks, relay: emailed ? undefined : 'https://formsubmit.co/ajax/' + LEAD_INBOX_ALIAS });
};
