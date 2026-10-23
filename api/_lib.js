// Shared helpers for the serverless functions: Neon SQL over HTTP, photo tokens, rate limit.
const crypto = require('crypto');

const SITE = 'https://standardroofingcompany.net';
const LEAD_INBOX_ALIAS = process.env.CONTACT_TO || 'df411baad8fa5e3fa0848e207cddfed8'; // FormSubmit alias for info@standardroofingcompany.net
const DB_URL = process.env.LEADS_DATABASE_URL || '';

const clean = (v, max = 3000) => String(v == null ? '' : v).replace(/\r/g, '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

// Neon serverless HTTP endpoint: POST https://<host>/sql with the connection string in a header.
async function sql(query, params = []) {
  if (!DB_URL) return null;
  const host = new URL(DB_URL).host;
  const r = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': DB_URL, 'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'false' },
    body: JSON.stringify({ query, params }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('db ' + r.status + ' ' + (data.message || JSON.stringify(data).slice(0, 200)));
  return data.rows || [];
}

function secret() {
  return crypto.createHash('sha256').update(DB_URL || 'no-db').digest();
}
function photoToken(id) {
  return crypto.createHmac('sha256', secret()).update(String(id)).digest('hex').slice(0, 32);
}
function ipHash(ip) {
  return crypto.createHash('sha256').update(String(ip || '') + '|src').digest('hex').slice(0, 24);
}
function clientIp(req) {
  const h = req.headers || {};
  return clean(h['x-real-ip'] || (h['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || '', 64);
}

// Per-instance sliding window rate limit. Serverless instances are short-lived, so this is
// a speed bump for bursts, not a hard quota; the honeypot and timing checks do the rest.
const buckets = new Map();
function rateLimited(key, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { buckets.set(key, arr); return true; }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) buckets.clear();
  return false;
}

async function relayEmail(subject, fields, replyTo) {
  const payload = Object.assign({ _subject: subject, _template: 'table', _captcha: 'false' }, fields, { Source: SITE });
  if (replyTo) payload._replyto = replyTo;
  const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(LEAD_INBOX_ALIAS), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: SITE, Referer: SITE + '/' },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok && String(data.success) !== 'false', status: r.status, data };
}

// Optional: Resend transport with real attachments when RESEND_API_KEY and LEAD_TO are set.
async function resendEmail(subject, text, attachments, replyTo) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO || 'info@standardroofingcompany.net';
  const from = process.env.LEAD_FROM || 'Standard Roofing Website <leads@standardroofingcompany.net>';
  if (!key) return { ok: false, skipped: true };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, reply_to: replyTo || undefined, attachments: attachments.map((a) => ({ filename: a.name, content: a.data })) }),
  });
  return { ok: r.ok, status: r.status };
}

module.exports = { SITE, clean, sql, photoToken, ipHash, clientIp, rateLimited, relayEmail, resendEmail, DB_URL };
