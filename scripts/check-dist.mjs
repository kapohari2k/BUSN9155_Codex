import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { join } from 'node:path';

const base = process.env.VITE_BASE_PATH || '/BUSN9155_Codex/';
const site = process.env.VITE_SITE_URL || 'https://kapohari2k.github.io/BUSN9155_Codex/';
const pages = ['index.html','about.html','audit.html','sample-audit.html','coverage-checklist.html','quote-form-fixer.html','enquire.html'];
const titles = new Set();
const descriptions = new Set();
let hasIntroVideo = false;
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
  assert.ok(html.includes(`property="og:url" content="${canonical}"`), `${page}: Open Graph URL`);
  assert.ok(html.includes(`property="og:title" content="${title}"`), `${page}: Open Graph title`);
  assert.ok(html.includes(`property="og:description" content="${description}"`), `${page}: Open Graph description`);
  for (const [link] of html.matchAll(/<a\b[^>]*\bdata-event="enquiry"[^>]*>/g)) {
    assert.equal(link.match(/\bhref="([^"]+)"/)?.[1], `${base}enquire.html#enquiry-form`, `${page}: enquiry CTA targets the form`);
  }
  if (html.includes('class="intro-video-transcript"')) {
    assert.equal(page, 'audit.html', 'intro video belongs on the Audit page');
    assert.ok(html.includes('>View the sample audit</a>'), 'intro video links to the sample report');
    hasIntroVideo = true;
  }
  for (const match of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    const url = match[1];
    if (url.startsWith('#') || /^https?:/.test(url)) continue;
    assert.ok(url.startsWith(base), `${page}: ${url} uses project base`);
    const path = url.slice(base.length).split('#')[0] || 'index.html';
    assert.ok((await stat(join('dist', path))).isFile(), `${page}: ${url} exists`);
  }
}
assert.equal(titles.size, pages.length, 'unique titles');
assert.equal(descriptions.size, pages.length, 'unique descriptions');
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
assert.deepEqual(sitemapUrls.sort(), pages.map(page => new URL(page === 'index.html' ? '' : page, site).href).sort(), 'sitemap contains exactly the canonical HTML URLs');
assert.ok((await readFile('dist/robots.txt', 'utf8')).includes(new URL('sitemap.xml',site).href));
const assets = await readdir('dist/assets');
assert.ok(assets.some(file => file.endsWith('.svg')), 'imported favicon emitted');
assert.equal(assets.filter(file => file.endsWith('.woff2')).length, 3, 'all imported fonts emitted');
for (const font of ['manrope','newsreader']) assert.ok((await readFile(`dist/assets/font-license-${font}.txt`, 'utf8')).includes('SIL OPEN FONT LICENSE'), `${font} distribution licence`);
const allowed = new Set([...pages,'assets','resources','sitemap.xml','robots.txt']);
for (const entry of await readdir('dist')) assert.ok(allowed.has(entry), `unexpected published item: ${entry}`);
const resources = ['sample-audit-report-cover.webp', 'sample-website-audit-report.pdf'];
if (hasIntroVideo) {
  resources.unshift('intro');
  assert.deepEqual((await readdir('dist/resources/intro')).sort(), ['captions-en.vtt', 'local-lift-intro.mp4', 'poster.webp', 'transcript.txt']);
  assert.match(await readFile('dist/resources/intro/captions-en.vtt', 'utf8'), /^WEBVTT\b/);
}
assert.deepEqual((await readdir('dist/resources')).sort(), resources);
console.log('PASS: HTML pages, unique metadata, canonical URLs, project-path assets and links, emitted media, sitemap, robots, and publication allowlist.');
