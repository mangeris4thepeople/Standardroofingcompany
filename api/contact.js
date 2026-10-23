// Legacy endpoint kept for any cached pages or bookmarks; same handler as /api/lead.
module.exports = require('./lead.js');
module.exports.config = require('./lead.js').config;
