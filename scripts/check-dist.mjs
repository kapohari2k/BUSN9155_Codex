import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { join } from 'node:path';

const base = process.env.VITE_BASE_PATH || '/BUSN9155_Codex/';
const site = process.env.VITE_SITE_URL || 'https://kapohari2k.github.io/BUSN9155_Codex/';
const pages = ['index.html','about.html','audit.html','coverage-checklist.html','enquire.html'];
const titles = new Set();
const descriptions = new Set();
for (const page of pages) {
  const html = await readFile(join('dist', page), 'utf8');
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1, `${page}: one h1`);
  assert.ok(html.includes('lang="en-AU"'), `${page}: Australian English`);
  assert.ok(!html.includes('<!-- site:') && !html.includes('href="@/'), `${page}: templates replaced`);
  assert.ok(!html.includes('—'), `${page}: no em dashes`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(title && description, `${page}: title and description`);
  titles.add(title); descriptions.add(description);
  const canonical = new URL(page === 'index.html' ? '' : page, site).href;
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${page}: canonical`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (url.startsWith('#') || /^https?:/.test(url)) continue;
    assert.ok(url.startsWith(base), `${page}: ${url} uses project base`);
    const path = url.slice(base.length).split('#')[0] || 'index.html';
    assert.ok((await stat(join('dist', path))).isFile(), `${page}: ${url} exists`);
  }
}
assert.equal(titles.size, 5, 'five unique titles');
assert.equal(descriptions.size, 5, 'five unique descriptions');
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
for (const page of pages) assert.ok(sitemap.includes(new URL(page === 'index.html' ? '' : page, site).href), `sitemap: ${page}`);
assert.ok((await readFile('dist/robots.txt', 'utf8')).includes(new URL('sitemap.xml',site).href));
const assets = await readdir('dist/assets');
assert.ok(assets.some(file => file.endsWith('.svg')), 'imported favicon emitted');
assert.equal(assets.filter(file => file.endsWith('.woff2')).length, 3, 'all imported fonts emitted');
for (const font of ['manrope','newsreader']) assert.ok((await readFile(`dist/assets/font-license-${font}.txt`, 'utf8')).includes('SIL OPEN FONT LICENSE'), `${font} distribution licence`);
const allowed = new Set([...pages,'assets','sitemap.xml','robots.txt']);
for (const entry of await readdir('dist')) assert.ok(allowed.has(entry), `unexpected published item: ${entry}`);
console.log('PASS: five HTML pages, unique metadata, canonical URLs, project-path assets and links, emitted media, sitemap, robots, and publication allowlist.');
