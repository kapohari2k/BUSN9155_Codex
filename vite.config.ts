import { defineConfig, loadEnv, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { analyticsConfig, analyticsStorageKey } from './src/analytics-config.ts';

const pages = [
  { file: 'index.html', label: 'Home', title: 'Website and SEO Audits for Perth Cleaners | Local Lift', description: 'Local Lift audits websites for owner-led residential cleaning businesses in Perth. Get prioritised SEO and enquiry findings, suggested copy and a publishing handover.' },
  { file: 'about.html', label: 'About', title: 'How Local Lift Audits Perth Cleaning Websites', description: 'See how Local Lift reviews a cleaning business website, checks findings with the owner and prepares specific recommendations for the owner or their web contact to publish.' },
  { file: 'audit.html', label: 'The audit', title: 'Website and SEO Audit Scope for Perth Cleaners | Local Lift', description: 'See what Local Lift checks for Perth cleaners, from service pages and Google Business Profile to mobile loading and quote forms. Read a sample audit report.' },
  { file: 'sample-audit.html', label: 'Sample audit report', title: 'Sample Website and SEO Audit Report for a Perth Cleaner | Local Lift', description: 'Read a sample Local Lift audit report with three worked examples, replacement wording, publishing responsibilities and follow-up checks.' },
  { file: 'coverage-checklist.html', label: 'Coverage checklist', title: 'Service Area Checklist for Perth Cleaners | Local Lift', description: 'Check whether customers see the right suburbs on Google, your website and your quote form. Get prioritised next steps for your Perth cleaning business.' },
  { file: 'enquire.html', label: 'Enquire', title: 'Enquire About a Website and SEO Audit | Local Lift', description: 'Tell Local Lift about your Perth cleaning business and what you want checked. Use the short enquiry form to discuss fit and scope before committing.' },
];

const analyticsPanel = `<section id="analytics-choices" class="analytics-banner" aria-labelledby="analytics-title" hidden>
  <div class="container analytics-inner">
    <div><h2 id="analytics-title" tabindex="-1">Optional analytics</h2><p>Google Analytics measures site use. Enquiry answers stay out of analytics. Change your choice in the footer.</p></div>
    <div class="analytics-actions">
      <button type="button" data-choice="allow">Allow analytics</button>
      <button type="button" data-choice="decline">Continue without analytics</button>
      <button type="button" class="analytics-close" hidden>Close preferences</button>
    </div>
  </div>
</section>`;

// Set the first-render layout before the parser reaches main. The deferred module binds the controls.
const preparePageChrome = `<script>
(() => {
  const header = document.querySelector('.site-header');
  header.classList.add('site-header-ready');
  if (matchMedia('(max-width: 800px)').matches) {
    header.querySelector('.menu-toggle').hidden = false;
    header.querySelector('.primary-nav').hidden = true;
  }
  document.documentElement.style.setProperty('--site-header-height', header.offsetHeight + 'px');
  const panel = document.getElementById('analytics-choices');
  if (panel) {
    let choice;
    try { choice = localStorage.getItem(${JSON.stringify(analyticsStorageKey)}); } catch {}
    panel.hidden = choice === 'allow' || choice === 'decline';
  }
})();
</script>`;

function introVideo(base: string): string {
  const folder = 'resources/intro';
  const sampleLink = `<a class="text-link" href="${base}sample-audit.html" data-event="sample" data-placement="audit-report">View the sample audit</a>`;
  const files = ['local-lift-intro.mp4', 'poster.webp', 'captions-en.vtt', 'transcript.txt'];
  const present = files.filter(file => existsSync(resolve(`public/${folder}/${file}`)));
  if (!present.length) return sampleLink;
  if (present.length !== files.length) throw new Error('The intro video needs its MP4, poster, captions and transcript together.');
  const text = readFileSync(resolve(`public/${folder}/transcript.txt`), 'utf8').trim();
  if (!text) throw new Error('The intro video transcript is empty.');
  const transcript = text.split(/\r?\n\s*\r?\n/).map(paragraph =>
    `<p>${paragraph.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`,
  ).join('');
  return `<div class="audit-intro-video">
      <video controls playsinline preload="none" width="960" height="540" poster="${base}${folder}/poster.webp" aria-label="How Local Lift reviews the path from Google to your quote form">
        <source src="${base}${folder}/local-lift-intro.mp4" type="video/mp4">
        <track kind="captions" label="English" srclang="en" src="${base}${folder}/captions-en.vtt">
        <a href="${base}${folder}/local-lift-intro.mp4">Download the intro video</a>
      </video>
      ${sampleLink}
      <p class="caption">Presented by a fictional, AI-generated spokesperson.</p>
      <details class="intro-video-transcript">
        <summary>Read the video transcript</summary>
        ${transcript}
      </details>
    </div>`;
}

function siteChrome(base: string, siteUrl: string, showAnalyticsChoices: boolean): Plugin {
  const href = (file: string) => `${base}${file === 'index.html' ? '' : file}`;
  const enquiryHref = `${href('enquire.html')}#enquiry-form`;
  return {
    name: 'local-lift-pages',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const page = pages.find(p => context.filename.endsWith(`/${p.file}`));
        if (!page) return html;
        const nav = pages.filter(p => p.file !== 'sample-audit.html').map(p => `<a href="${p.file === 'enquire.html' ? enquiryHref : href(p.file)}"${p.file === page.file ? ' aria-current="page"' : ''}${p.file === 'coverage-checklist.html' ? ' data-event="guide" data-placement="header"' : ''}${p.file === 'enquire.html' ? ' class="nav-enquire" data-event="enquiry" data-placement="header"' : ''}>${p.label}${p.file === 'enquire.html' ? ' <span aria-hidden="true">↗</span>' : ''}</a>`).join('');
        const brand = `<a class="brand" href="${href('index.html')}" aria-label="Local Lift home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M5 26V8h6v12h16v6H5Z" fill="currentColor"/><path d="M18 4h11v11h-5v-3l-7 7-4-4 7-6h-2V4Z" fill="#f5ad84"/></svg></span>local lift<span class="brand-dot" aria-hidden="true">.</span></a>`;
        const header = `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="container header-inner">${brand}<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" hidden><span>Menu</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg></button><nav id="primary-nav" class="primary-nav" aria-label="Main navigation">${nav}</nav></div></header>`;
        const footer = `<footer class="site-footer"><div class="container"><div class="footer-top"><div>${brand}<p>Website and SEO audits.</p></div><div><p class="footer-label">For Perth residential cleaners</p><a href="${href('audit.html')}">Explore the audit <span aria-hidden="true">↗</span></a><a href="${href('coverage-checklist.html')}" data-event="guide" data-placement="footer">Use the free checklist <span aria-hidden="true">↗</span></a><a href="${enquiryHref}" data-event="enquiry" data-placement="footer">Make an enquiry <span aria-hidden="true">↗</span></a></div><div class="footer-note"><p>Prioritised findings and practical changes for your website, Google profile and enquiry journey. You or your web contact publish.</p><a href="${href('about.html')}">How we approach the work</a></div></div><div class="footer-bottom"><p>Local Lift is an educational project for BUSN9155. Examples are illustrative, not client results.</p><div><a href="${href('enquire.html')}#information-use">Information use</a><button class="text-button analytics-preferences" type="button" hidden>Analytics choices</button><span>© ${new Date().getFullYear()} Local Lift</span></div></div></div></footer>`;
        const canonical = new URL(page.file === 'index.html' ? '' : page.file, siteUrl).href;
        return html.replace('<!-- site:head -->', `<title>${page.title}</title><meta name="description" content="${page.description}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Local Lift"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.description}"><meta property="og:url" content="${canonical}"><meta name="theme-color" content="#193b35">`)
          .replace('<!-- site:header -->', header + (showAnalyticsChoices ? analyticsPanel : '') + preparePageChrome).replace('<!-- site:footer -->', footer)
          .replaceAll('href="@/', `href="${base}`)
          .replace('<!-- site:intro-video -->', () => page.file === 'audit.html' ? introVideo(base) : '');
      },
    },
    generateBundle() {
      for (const font of ['manrope', 'newsreader']) {
        this.emitFile({ type: 'asset', fileName: `assets/font-license-${font}.txt`, source: readFileSync(resolve(process.cwd(), `node_modules/@fontsource-variable/${font}/LICENSE`), 'utf8') });
      }
      const urls = pages.map(p => new URL(p.file === 'index.html' ? '' : p.file, siteUrl).href);
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>\n` });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', siteUrl).href}\n` });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = process.env.VITE_BASE_PATH ?? (command === 'build' ? '/BUSN9155_Codex/' : '/');
  if (!base.startsWith('/') || !base.endsWith('/') || base.includes('"') || base.includes('<')) throw new Error('VITE_BASE_PATH must be an absolute path ending in /.');
  const siteUrl = new URL(env.VITE_SITE_URL || 'https://kapohari2k.github.io/BUSN9155_Codex/');
  if (siteUrl.protocol !== 'https:' || siteUrl.search || siteUrl.hash || !siteUrl.pathname.endsWith('/')) throw new Error('VITE_SITE_URL must be an HTTPS site directory URL ending in /.');
  return {
    base: process.env.VITE_BASE_PATH ?? (command === 'build' ? '/BUSN9155_Codex/' : '/'),
    plugins: [siteChrome(base, siteUrl.href, analyticsConfig(env.VITE_GTM_CONTAINER_ID, env.VITE_GA4_MEASUREMENT_ID).configured)],
    build: {
      outDir: 'dist',
      assetsInlineLimit: 0,
      rollupOptions: { input: Object.fromEntries(pages.map(p => [p.file.replace('.html', ''), resolve(process.cwd(), p.file)])) },
    },
  };
});
