// Form relay for standardroofingcompany.net.
// Site forms post JSON here; this forwards the request by email. The destination
// inbox exists only on the server (env CONTACT_TO or the fallback below) and is
// never sent to the browser.
const DESTINATION = process.env.CONTACT_TO || 'douglas.mangeris@gmail.com';
const SITE = 'https://standardroofingcompany.net';
const PHONE = '(970) 430-5884';

const clean = (v, max = 3000) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max);
const SKIP = new Set(['company_website', 'started', '_subject', '_replyto', '_template', '_captcha', '_cc', '_next', '_autoresponse']);

async function relay(subject, fields, replyTo) {
  const payload = Object.assign({ _subject: subject, _template: 'table', _captcha: 'false' }, fields, { Source: SITE });
  if (replyTo) payload._replyto = replyTo;
  const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(DESTINATION), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: SITE, Referer: SITE + '/' },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok && String(data.success) !== 'false', status: r.status, data };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const b = req.body || {};
  if (clean(b.company_website)) return res.status(200).json({ ok: true }); // bot trap

  const fields = {};
  for (const [k, v] of Object.entries(b)) {
    if (SKIP.has(k) || Object.keys(fields).length >= 25) continue;
    const key = clean(k, 40).replace(/[^\w ]/g, '').replace(/_/g, ' ');
    if (key) fields[key.charAt(0).toUpperCase() + key.slice(1)] = clean(v);
  }
  const name = clean(b.name, 120);
  const email = clean(b.email, 200);
  const phone = clean(b.phone, 40);
  if (!name || (!email && !phone)) {
    return res.status(400).json({ ok: false, error: 'Please include your name and a phone number or email.' });
  }
  const subject = clean(b._subject, 150) || 'Roof Inspection Request | ' + name;
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';

  try {
    const out = await relay(subject, fields, replyTo);
    if (!out.ok) {
      console.error('Relay failed', out.status, JSON.stringify(out.data).slice(0, 500));
      return res.status(502).json({ ok: false, error: 'We could not send that just now. Please call or text ' + PHONE + '.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Relay error', err);
    return res.status(502).json({ ok: false, error: 'We could not send that just now. Please call or text ' + PHONE + '.' });
  }
};
