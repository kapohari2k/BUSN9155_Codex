import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { file: '', nav: 'Home', heading: 'Good work. Let your website explain it clearly.' },
  { file: 'about.html', nav: 'About', heading: 'Your business knowledge. A clearer way to say it.' },
  { file: 'audit.html', nav: 'The audit', heading: 'A fresh look at your content. Words ready for your next step.' },
  { file: 'coverage-checklist.html', nav: 'Coverage checklist', heading: 'Changed where you work? Check the whole picture.' },
  { file: 'enquire.html', nav: 'Enquire', heading: 'A clearer next step starts with your question.' },
];
for (const width of [1440, 768, 390, 320]) {
  for (const item of pages) {
    test(`${item.nav}: direct visit, assets, layout and accessibility at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const errors: string[] = [];
      const failed: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
      const response = await page.goto(item.file || './');
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('main h1')).toHaveText(item.heading);
      await expect(page.locator('main')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (width <= 800) await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: item.nav, exact: true })).toHaveAttribute('aria-current', 'page');
      const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
      await page.reload();
      await expect(page.locator('main h1')).toBeVisible();
      const icon = page.locator('link[rel="icon"]');
      await expect(icon).toHaveAttribute('href', /\/BUSN9155_Codex\/assets\/mark-.*\.svg$/);
      expect(errors).toEqual([]); expect(failed).toEqual([]);
    });
  }
}

test('every internal page link and fragment resolves within the deployed base', async ({ page, request }) => {
  for (const item of pages) {
    await page.goto(item.file || './');
    const links = await page.locator('a[href]').evaluateAll(elements => elements.map(el => (el as HTMLAnchorElement).href));
    for (const link of new Set(links)) {
      const url = new URL(link);
      if (url.origin !== 'http://127.0.0.1:4173') continue;
      expect(url.pathname).toMatch(/^\/BUSN9155_Codex\//);
      const response = await request.get(`${url.origin}${url.pathname}`);
      expect(response.status(), link).toBe(200);
      if (url.hash) {
        const html = await response.text();
        expect(html, link).toContain(`id="${decodeURIComponent(url.hash.slice(1))}"`);
      }
    }
  }
});

test('keyboard skip link, mobile menu, Escape and breakpoint reset', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name:'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const menu = page.locator('.menu-toggle');
  await menu.focus(); await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('navigation', {name:'Main navigation'}).getByRole('link', {name:'Home',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused(); await expect(menu).toHaveAttribute('aria-expanded','false');
  await page.setViewportSize({width:1440,height:1000});
  await expect(page.getByRole('navigation', {name:'Main navigation'})).toBeVisible();
  await expect(menu).toBeHidden();
});

test('both visitor journeys are navigable', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', {name:'Explore the review',exact:true}).first().click();
  await page.getByRole('link', {name:'Inspect the sample',exact:true}).click();
  await expect(page).toHaveURL(/audit\.html#sample$/);
  await page.getByRole('link', {name:'Suitability',exact:true}).click();
  await expect(page).toHaveURL(/audit\.html#suitability$/);
  await page.getByRole('link', {name:'Ask whether it fits'}).click();
  await expect(page).toHaveURL(/enquire\.html$/);
  await page.goto('coverage-checklist.html');
  await expect(page.getByRole('link', {name:/Read Google’s official/})).toHaveAttribute('href','https://support.google.com/business/answer/9157481');
  await page.getByRole('link', {name:'Explore the review',exact:true}).first().click();
  await expect(page).toHaveURL(/audit\.html$/);
});

test('no form endpoint or analytics consent means no submissions or tracking', async ({ page }) => {
  const thirdParty: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173/')) thirdParty.push(request.url()); });
  await page.goto('enquire.html?email=private@example.com');
  await expect(page.locator('#form-availability')).toBeVisible();
  await page.getByLabel('Email', {exact:false}).fill('owner@example.com');
  await page.getByLabel('Business website', {exact:false}).fill('https://example.com');
  await page.getByLabel('What would you like reviewed?', {exact:false}).fill('Please review service inclusions.');
  await page.getByRole('button', {name:'Send enquiry'}).click();
  await expect(page.getByRole('status')).toContainText('Nothing has been sent');
  await expect(page.locator('#form-success')).toBeHidden();
  await expect(page.locator('#reason')).toHaveValue('Please review service inclusions.');
  await expect(page.locator('.analytics-banner')).toBeVisible();
  expect(thirdParty).toEqual([]);
});

test('validation is accessible, specific, and retains answers', async ({ page }) => {
  await page.goto('enquire.html');
  await page.getByRole('button', {name:'Send enquiry'}).click();
  await expect(page.locator('#form-errors')).toBeFocused();
  await expect(page.locator('#form-errors li')).toHaveCount(3);
  await page.locator('#form-errors a').first().click();
  await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email').fill('invalid');
  await page.locator('#website').fill('javascript:alert(1)');
  await page.locator('#reason').fill('   ');
  await page.locator('#profile').fill('not a web link');
  await page.getByRole('button', {name:'Send enquiry'}).click();
  await expect(page.locator('#form-errors li')).toHaveCount(4);
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid','true');
  const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
});

test('GTM loads once after consent and receives safe events without direct GA4', async ({ page }) => {
  const requests: string[] = [];
  await page.route('https://**/*', route => {
    requests.push(route.request().url());
    return route.fulfill({status:200,contentType:'text/javascript',body:'/* isolated GTM stub */'});
  });
  await page.goto('enquire.html?email=private@example.com#information-use');
  expect(requests).toEqual([]);
  await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
  await expect.poll(()=>requests.length).toBe(1);
  expect(requests).toEqual(['https://www.googletagmanager.com/gtm.js?id=GTM-PG38VX8P']);
  const events = () => page.evaluate(() => (window.dataLayer || []).filter(item => typeof item === 'object' && item !== null && 'event' in item) as Record<string,unknown>[]);
  expect((await events()).filter(e=>e.event==='gtm.js')).toHaveLength(1);
  expect((await events()).filter(e=>e.event==='page_view')).toEqual([expect.objectContaining({page_location:'https://kapohari2k.github.io/BUSN9155_Codex/enquire.html',page_referrer:''})]);
  await page.locator('#email').fill('private-invalid-value');
  await page.getByRole('button',{name:'Send enquiry'}).click();
  expect((await events()).filter(e=>e.event==='form_start')).toHaveLength(1);
  expect((await events()).filter(e=>e.event==='form_error')).toEqual([expect.objectContaining({error_category:'validation'})]);
  expect(JSON.stringify(await events())).not.toContain('private');
  await page.getByRole('button',{name:'Analytics choices',exact:true}).click();
  await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
  expect(requests).toHaveLength(1);
  expect((await events()).filter(e=>e.event==='page_view')).toHaveLength(1);
});

test('declining GTM prevents script loading on this page and the next', async ({ page }) => {
  const requests: string[] = [];
  await page.route('https://**/*',route=>{requests.push(route.request().url());return route.abort();});
  await page.goto('./');
  await page.getByRole('button',{name:'Continue without analytics'}).click();
  await page.goto('about.html');
  await expect(page.locator('.analytics-banner')).toBeHidden();
  expect(requests).toEqual([]);
  expect(await page.evaluate(()=>window.dataLayer)).toBeUndefined();
});

test('reduced motion, large text and print guide remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.setViewportSize({width:1280,height:900});
  await page.goto('coverage-checklist.html');
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.evaluate(()=> { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(()=> { document.documentElement.style.fontSize = ''; });
  await page.emulateMedia({media:'print'});
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.checklist-steps')).toBeVisible();
  await expect(page.locator('#worked-example')).toBeVisible();
});

test('content remains available and navigation works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({javaScriptEnabled:false, viewport:{width:390,height:844}});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/BUSN9155_Codex/');
  await expect(page.locator('main h1')).toBeVisible();
  await page.getByRole('navigation', {name:'Main navigation'}).getByRole('link',{name:'The audit',exact:true}).click();
  await expect(page.locator('#sample')).toBeVisible();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Enquire',exact:true}).click();
  await expect(page.locator('noscript strong')).toHaveText('This form needs JavaScript to submit.');
  await expect(page.locator('noscript strong')).toBeVisible();
  // Pressing submit cannot fall back to a GET that exposes form answers in the URL.
  await page.locator('#email').fill('private@example.com');
  await expect(page.getByRole('button',{name:'Send enquiry'})).toBeDisabled();
  expect(page.url()).not.toContain('private');
  await context.close();
});
