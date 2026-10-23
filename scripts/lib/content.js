// Loads and merges the content JSON files into one site model.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONTENT = path.join(ROOT, 'content');

function readJson(name, optional) {
  const file = path.join(CONTENT, name + '.json');
  if (!fs.existsSync(file)) {
    if (optional) return null;
    throw new Error('Missing content file: ' + file);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function load() {
  const site = readJson('site');
  const services = [].concat(readJson('services', true) || [], readJson('services-b', true) || []);
  const cities = [].concat(readJson('cities', true) || [], readJson('cities-mountain', true) || []);
  const casualty = readJson('casualty', true) || { landing: null, pages: [] };
  const blog = (readJson('blog', true) || [].concat(readJson('blog-a', true) || [], readJson('blog-b', true) || []))
    .slice()
    .sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1));
  const pages = readJson('pages');

  const order = ['metal-roofing', 'standing-seam-metal-roofing', 'slate-roofing', 'tile-roofing', 'cedar-shake-roofing', 'synthetic-roofing', 'roof-coatings', 'roof-replacement', 'roof-repair', 'hail-damage-roof-repair', 'storm-damage-roofing', 'insurance-claim-roofing', 'roof-inspections', 'commercial-roofing'];
  services.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  const cityOrder = [].concat(
    ['loveland', 'fort-collins', 'greeley', 'windsor', 'berthoud', 'longmont', 'johnstown', 'wellington', 'timnath', 'estes-park'],
    ['nederland', 'winter-park', 'granby', 'grand-lake', 'steamboat-springs', 'breckenridge', 'frisco', 'silverthorne', 'vail', 'red-feather-lakes', 'glen-haven', 'drake']
  );
  cities.sort((a, b) => cityOrder.indexOf(a.slug) - cityOrder.indexOf(b.slug));

  return { site, services, cities, casualty, blog, pages };
}

module.exports = { load, ROOT, CONTENT };
