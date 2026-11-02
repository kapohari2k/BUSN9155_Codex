import { defineConfig, loadEnv, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const pages = [
  { file: 'index.html', label: 'Home', title: 'Website and enquiry clarity review for Perth cleaners | Local Lift', description: 'A focused content review for owner-led Perth residential cleaners. Get prioritised findings, replacement wording and a clear publishing handover.' },
  { file: 'about.html', label: 'About', title: 'Our approach to clearer cleaning business content | Local Lift', description: 'See how Local Lift compares existing website, Google profile and enquiry content with owner-confirmed facts, then prepares practical changes.' },
  { file: 'audit.html', label: 'The audit', title: 'Cleaning business website audit Perth: content review | Local Lift', description: 'Explore a bounded website content audit for Perth cleaners, with an illustrative sample, exact replacement wording, scope and publishing responsibilities.' },
  { file: 'coverage-checklist.html', label: 'Coverage checklist', title: 'Google Business Profile service area checklist | Local Lift', description: 'Check a changed Google Business Profile service area against your website and enquiry information. A free, practical guide for Perth cleaning business owners.' },
  { file: 'enquire.html', label: 'Enquire', title: 'Enquire about a website clarity review | Local Lift', description: 'Check whether a Local Lift review suits your Perth residential cleaning business. Explain what needs reviewing, with no payment commitment or passwords.' },
];

function siteChrome(base: string, siteUrl: string): Plugin {
  const href = (file: string) => `${base}${file === 'index.html' ? '' : file}`;
  return {
    name: 'local-lift-pages',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const page = pages.find(p => context.filename.endsWith(`/${p.file}`));
        if (!page) return html;
        const nav = pages.map(p => `<a href="${href(p.file)}"${p.file === page.file ? ' aria-current="page"' : ''}${p.file === 'coverage-checklist.html' ? ' data-event="guide" data-placement="header"' : ''}${p.file === 'enquire.html' ? ' class="nav-enquire" data-event="enquiry" data-placement="header"' : ''}>${p.label}${p.file === 'enquire.html' ? ' <span aria-hidden="true">↗</span>' : ''}</a>`).join('');
        const brand = `<a class="brand" href="${href('index.html')}" aria-label="Local Lift home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M5 26V8h6v12h16v6H5Z" fill="currentColor"/><path d="M18 4h11v11h-5v-3l-7 7-4-4 7-6h-2V4Z" fill="#f5ad84"/></svg></span>local lift<span class="brand-dot" aria-hidden="true">.</span></a>`;
        const header = `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="container header-inner">${brand}<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" hidden><span>Menu</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg></button><nav id="primary-nav" class="primary-nav" aria-label="Main navigation">${nav}</nav></div></header>`;
        const footer = `<footer class="site-footer"><div class="container"><div class="footer-top"><div>${brand}<p>Clearer content.<br>A practical next step.</p></div><div><p class="footer-label">For Perth residential cleaners</p><a href="${href('audit.html')}">Explore the review <span aria-hidden="true">↗</span></a><a href="${href('coverage-checklist.html')}" data-event="guide" data-placement="footer">Use the free checklist <span aria-hidden="true">↗</span></a><a href="${href('enquire.html')}" data-event="enquiry" data-placement="footer">Make an enquiry <span aria-hidden="true">↗</span></a></div><div class="footer-note"><p>A focused review of existing website, profile and enquiry content. Your business facts. Prepared wording. You or your web contact publish.</p><a href="${href('about.html')}">How we approach the work</a></div></div><div class="footer-bottom"><p>Local Lift is an educational project for BUSN9155. Examples are illustrative, not client results.</p><div><a href="${href('enquire.html')}#information-use">Information use</a><button class="text-button analytics-preferences" type="button" hidden>Analytics choices</button><span>© ${new Date().getFullYear()} Local Lift</span></div></div></div></footer>`;
        const canonical = new URL(page.file === 'index.html' ? '' : page.file, siteUrl).href;
        return html.replace('<!-- site:head -->', `<title>${page.title}</title><meta name="description" content="${page.description}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Local Lift"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.description}"><meta property="og:url" content="${canonical}"><meta name="theme-color" content="#193b35">`)
          .replace('<!-- site:header -->', header).replace('<!-- site:footer -->', footer)
          .replaceAll('href="@/', `href="${base}`);
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
    plugins: [siteChrome(base, siteUrl.href)],
    build: {
      outDir: 'dist',
      assetsInlineLimit: 0,
      rollupOptions: { input: Object.fromEntries(pages.map(p => [p.file.replace('.html', ''), resolve(process.cwd(), p.file)])) },
    },
  };
});
