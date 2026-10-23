// Serves a lead photo from the leads database. The link is only valid with the HMAC token
// that the lead email carries, so photos are private to whoever receives the lead.
const { sql, photoToken, DB_URL } = require('./_lib');

module.exports = async (req, res) => {
  const id = Number((req.query || {}).id || 0);
  const t = String((req.query || {}).t || '');
  if (!DB_URL || !id || t !== photoToken(id)) return res.status(404).send('Not found');
  try {
    const rows = await sql("SELECT filename, content_type, encode(bytes,'base64') AS b64 FROM lead_photos WHERE id=$1", [id]);
    if (!rows || !rows[0]) return res.status(404).send('Not found');
    const buf = Buffer.from(rows[0].b64, 'base64');
    res.setHeader('Content-Type', rows[0].content_type || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${(rows[0].filename || 'photo.jpg').replace(/[^\w.-]/g, '_')}"`);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(200).send(buf);
  } catch (err) {
    console.error('photo error', err && err.message);
    return res.status(500).send('Error');
  }
};
