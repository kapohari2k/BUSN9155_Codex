import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { file: '', nav: 'Home', heading: 'Website and SEO audits for Perth cleaners' },
  { file: 'about.html', nav: 'About', heading: 'How Local Lift audits your website' },
  { file: 'audit.html', nav: 'The audit', heading: 'What the website and SEO audit covers' },
  { file: 'sample-audit.html', nav: null, heading: 'Sample website and SEO audit report' },
  { file: 'coverage-checklist.html', nav: 'Coverage checklist', heading: 'Coverage checklist for Perth cleaners' },
  { file: 'enquire.html', nav: 'Enquire', heading: 'Enquire about an audit' },
];
for (const width of [1440, 768, 390, 320]) {
  for (const item of pages) {
    test(`${item.nav ?? "Sample audit report"}: direct visit, assets, layout and accessibility at ${width}px`, async ({ page }) => {
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
      const nav = page.getByRole('navigation', { name: 'Main navigation' });
      if (item.nav) await expect(nav.getByRole('link', { name: item.nav, exact: true })).toHaveAttribute('aria-current', 'page');
      else await expect(nav.locator('[aria-current=page]')).toHaveCount(0);
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

for (const [device, width, height] of [['phone', 390, 844], ['tablet', 768, 1024], ['desktop', 1440, 1000]] as const) {
  test(`both visitor journeys reach the form on ${device}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await page.getByRole('link', { name: 'Explore the audit', exact: true }).first().click();
    await page.getByRole('link', { name: 'Inspect the sample', exact: true }).click();
    await expect(page).toHaveURL(/audit\.html#sample$/);
    await page.getByRole('link', { name: 'Suitability', exact: true }).click();
    await expect(page).toHaveURL(/audit\.html#suitability$/);
    await page.locator('main a[data-event="enquiry"]').first().click();
    await expect(page).toHaveURL(/enquire\.html#enquiry-form$/);
    await expect(page.locator('#enquiry-form')).toBeFocused();
    await expect(page.locator('#email')).toBeInViewport();

    await page.goto('./');
    await page.locator('.guide-promo').click();
    await expect(page.getByRole('link', { name: /Read Google’s official/ })).toHaveAttribute('href', 'https://support.google.com/business/answer/9157481');
    await page.getByRole('button', { name: 'Try the Maylands example' }).click();
    await expect(page.locator('#coverage-result-heading')).toBeFocused();
    await page.getByRole('link', { name: /See the service-area fix/ }).click();
    await expect(page).toHaveURL(/sample-audit\.html#service-area$/);
    await page.locator('main a[data-event="enquiry"]').click();
    await expect(page).toHaveURL(/enquire\.html#enquiry-form$/);
    await expect(page.locator('#email')).toBeInViewport();
  });
}

test('keyboard Enquire targets the form panel, then the first field, including from the same page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  const enquire = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Enquire' });
  await menu.click();
  await enquire.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#enquiry-form')).toBeFocused();
  await expect(page.locator('#enquiry-heading')).toHaveCSS('outline-width', '2px');
  await expect(page.locator('#enquiry-form')).toHaveCSS('outline-style', 'none');
  await expect(page.locator('#email')).toBeInViewport();
  await page.keyboard.press('Tab');
  await expect(page.locator('#email')).toBeFocused();
  expect(await page.locator('#email').evaluate(el => getComputedStyle(el).outlineWidth)).toBe('3px');

  await menu.click();
  await enquire.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#enquiry-form')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#email')).toBeFocused();
});

test('no form endpoint or analytics consent means no submissions or tracking', async ({ page }) => {
  const thirdParty: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173/')) thirdParty.push(request.url()); });
  await page.goto('enquire.html?email=private@example.com');
  await expect(page.locator('#form-availability')).toBeVisible();
  await page.getByLabel('Email', {exact:false}).fill('owner@example.com');
  await page.getByLabel('Business website', {exact:false}).fill('https://example.com');
  await page.locator('#reason').fill('Please review service inclusions.');
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
  await page.locator('#email').press('Tab');
  await expect(page.locator('#email-error')).toBeVisible();
  await expect(page.locator('#email')).toHaveAttribute('aria-describedby', /email-error/);
  await page.locator('#email').fill('owner@example.com');
  await expect(page.locator('#email-error')).toBeEmpty();
  await expect(page.locator('#email')).not.toHaveAttribute('aria-invalid');
  await page.locator('#email').fill('invalid');
  await page.locator('#website').fill('javascript:alert(1)');
  await page.locator('#website').press('Tab');
  await expect(page.locator('#website-error')).toBeVisible();
  await expect(page.locator('#website')).toHaveAttribute('aria-describedby', /website-error/);
  await page.locator('#reason').fill('   ');
  await page.locator('#profile').fill('not a web link');
  await page.getByRole('button', {name:'Send enquiry'}).click();
  await expect(page.locator('#form-errors li')).toHaveCount(4);
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#email')).toHaveValue('invalid');
  await expect(page.locator('#website')).toHaveValue('javascript:alert(1)');
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
  await expect.poll(async () => (await events()).filter(e=>e.event==='page_view')).toEqual([expect.objectContaining({page_location:'https://kapohari2k.github.io/BUSN9155_Codex/enquire.html',page_referrer:''})]);
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
  await expect(page.locator('.coverage-check')).toBeHidden();
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
  await page.goto('http://127.0.0.1:4173/BUSN9155_Codex/coverage-checklist.html');
  await expect(page.locator('.coverage-check')).toBeHidden();
  await expect(page.locator('.checklist-steps')).toBeVisible();
  await context.close();
});

test('coverage update supports keyboard use and leads to the downloadable sample', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('coverage-checklist.html');
  await page.getByRole('button', { name: 'Continue without analytics' }).click();
  const submit = page.getByRole('button', { name: 'Build my coverage update' });
  const result = page.getByRole('region', { name: 'Your coverage update', exact: true });
  const service = page.getByLabel('Cleaning service', { exact: true });
  const suburbs = page.getByLabel('Suburbs you serve for this service');
  await submit.click();
  await expect(result).toBeHidden();
  await expect(service).toBeFocused();
  await page.keyboard.type('Regular house cleaning');
  await page.keyboard.press('Tab');
  await expect(suburbs).toBeFocused();
  await suburbs.fill('Maylands, Bayswater');
  await submit.press('Enter');
  await expect(result.getByRole('heading', { name: 'Your coverage update' })).toBeFocused();
  await expect(result.getByRole('heading', { name: 'Your coverage update' })).toBeInViewport();
  await expect(result.getByText('We provide regular house cleaning in Maylands and Bayswater.')).toBeVisible();
  await expect(result.locator('#coverage-form-copy')).toContainText('Enter your suburb');
  await expect(result.locator('#coverage-actions li')).toHaveCount(3);
  const a11y = await new AxeBuilder({ page }).include('.coverage-check')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);

  const sample = result.getByRole('link', { name: /See the service-area fix/ });
  await sample.press('Enter');
  await expect(page).toHaveURL(/sample-audit\.html#service-area$/);
  const pdf = page.getByRole('link', { name: /Download sample report/ });
  const [download] = await Promise.all([page.waitForEvent('download'), pdf.click()]);
  expect(download.suggestedFilename()).toBe('sample-website-audit-report.pdf');
  expect(await download.failure()).toBeNull();
});

test('coverage update prioritises quote gaps, handles wider Google areas and offers a copy fallback', async ({ page }) => {
  await page.goto('coverage-checklist.html');
  const form = page.locator('#coverage-check-form');
  const actions = page.locator('#coverage-actions li');
  await form.getByRole('button', { name: 'Try the Maylands example' }).click();
  await expect(actions.nth(0)).toContainText('Also listed: Inglewood.');
  await expect(actions.nth(1)).toContainText('Also listed: Inglewood.');
  await expect(actions.nth(2)).toContainText('All entered names match');
  await expect(page.locator('#coverage-result-summary')).toContainText('Check the quote form first');

  await form.getByLabel('Suburbs you serve for this service').fill('Maylands, bayswater; BAYSWATER');
  await form.getByLabel('Quote form options').fill('Maylands, Inglewood');
  await form.getByLabel('Google Business Profile areas').fill('Perth Metro, 6051');
  await expect(page.locator('#coverage-result')).toBeHidden();
  await form.getByRole('button', { name: 'Build my coverage update' }).click();
  await expect(actions.nth(0)).toContainText('Not listed by name: bayswater.');
  await expect(actions.nth(2)).toContainText('Check whether existing wider areas or postcodes');
  await expect(actions.nth(2)).toContainText('Keep areas you serve for other services');
  await expect(page.locator('#coverage-site-copy')).toHaveText('We provide regular house cleaning in Maylands and bayswater.');

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.reject(new Error('Clipboard unavailable')) },
  }));
  await page.getByRole('button', { name: 'Copy update plan' }).click();
  const plain = page.getByRole('textbox', { name: 'Coverage update plan' });
  await expect(plain).toBeFocused();
  await expect(plain).toHaveValue(/Website copy[\s\S]*Quote form helper text[\s\S]*Before publishing/);
  await page.getByRole('button', { name: 'Start another coverage update' }).click();
  await expect(form.getByLabel('Cleaning service', { exact: true })).toHaveValue('');
  await expect(form.getByLabel('Cleaning service', { exact: true })).toBeFocused();
  await expect(page.locator('#coverage-result')).toBeHidden();
});

test('the footer points to one coverage tool and older tool links reach it', async ({ page }) => {
  await page.goto('./');
  const link = page.locator('.site-footer').getByRole('link', { name: 'Coverage checklist' });
  await expect(link).toHaveCount(1);
  await link.click();
  await expect(page).toHaveURL(/coverage-checklist\.html$/);
  await expect(page.locator('.site-footer a[href$="coverage-checklist.html"]')).toHaveCount(0);
  await page.goto('quote-form-fixer.html');
  await expect(page).toHaveURL(/coverage-checklist\.html$/);
  await expect(page.getByRole('heading', { name: 'Build your coverage update' })).toBeVisible();
});

for (const [device, width, height, hasTouch] of [
  ['narrow desktop-mode mobile', 320, 740, false],
  ['touch phone', 390, 844, true],
  ['touch tablet', 768, 1024, true],
  ['desktop', 1440, 1000, false],
] as const) {
  test(`every enquiry entry point reaches an unobstructed form on ${device}`, async ({ browser, baseURL }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      baseURL, viewport: { width, height }, hasTouch, reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const tap = hasTouch ? 'tap' : 'click';
      const header = page.locator('.site-header');
      const heading = page.locator('#enquiry-heading');
      const assertLanding = async (): Promise<void> => {
        await expect(page).toHaveURL(/enquire\.html#enquiry-form$/);
        await expect(heading).toBeInViewport({ ratio: 1 });
        await expect(page.locator('#email')).toBeInViewport({ ratio: 1 });
        await expect(page.locator('#website')).toBeInViewport({ ratio: 1 });
        await expect(page.locator('#enquiry-details :is(input, textarea):focus')).toHaveCount(0);
        const [headerBox, headingBox] = await Promise.all([header.boundingBox(), heading.boundingBox()]);
        expect(headingBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
      };
      for (const item of pages) {
        const path = item.file || './';
        await page.goto(path);
        if (width <= 800) await page.locator('.menu-toggle')[tap]();
        await page.locator('.site-header a[data-event="enquiry"]')[tap]();
        await assertLanding();

        await page.goto(path);
        await page.locator('.site-footer a[data-event="enquiry"]')[tap]();
        await assertLanding();

        await page.goto(path);
        const content = page.locator('main a[data-event="enquiry"]');
        const count = await content.count();
        for (let i = 0; i < count; i++) {
          await content.nth(i)[tap]();
          await assertLanding();
          await page.goBack();
          await expect(page.locator('main h1')).toHaveText(item.heading);
        }
      }

      await page.goto('./');
      await page.getByRole('link', { name: 'See a sample report' })[tap]();
      await expect(page).toHaveURL(/sample-audit\.html$/);
      await expect(page.getByRole('link', { name: /Download sample report/ })).toHaveAttribute('download', '');
      await page.locator('main a[data-event="enquiry"]').first()[tap]();
      await assertLanding();
      await page.goBack();
      await expect(page).toHaveURL(/sample-audit\.html$/);
      await page.goForward();
      await assertLanding();
      await page.reload();
      await assertLanding();
      await page.goto('enquire.html#enquiry-form');
      await assertLanding();
    } finally {
      await context.close();
    }
  });
}

for (const firstVisit of [true, false]) {
  test(`mobile Audit layout is ready before the main bundle (${firstVisit ? 'first visit' : 'saved choice'})`, async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 823 });
    if (!firstVisit) await page.addInitScript(() => localStorage.setItem('local-lift-analytics', 'decline'));
    let releaseBundle!: () => void;
    const bundleReady = new Promise<void>(resolve => { releaseBundle = resolve; });
    await page.route('**/assets/main-*.js', async route => {
      await bundleReady;
      await route.continue();
    });
    await page.goto('audit.html', { waitUntil: 'commit' });
    const main = page.locator('main');
    const banner = page.locator('#analytics-choices');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    const position = () => main.evaluate(el => el.getBoundingClientRect().top);
    let firstPosition: number;
    try {
      await expect(main.locator('h1')).toBeVisible();
      await expect(menu).toBeVisible();
      await expect(page.locator('#primary-nav')).toBeHidden();
      if (firstVisit) await expect(banner).toBeVisible();
      else await expect(banner).toBeHidden();
      await expect(page.locator('.analytics-preferences')).toBeHidden();
      firstPosition = await position();
    } finally {
      releaseBundle();
    }

    await page.waitForLoadState('load');
    await page.evaluate(() => document.fonts.ready);
    expect(await position()).toBeCloseTo(firstPosition, 0);
    await menu.click();
    await expect(page.locator('#primary-nav')).toBeVisible();
  });
}
