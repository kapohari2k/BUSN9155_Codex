import { expect, test, type Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const decline = (page: Page) => page.getByRole('button', { name: 'Continue without analytics' });
const allow = (page: Page) => page.getByRole('button', { name: 'Allow analytics', exact: true });
const preferences = (page: Page) => page.getByRole('button', { name: 'Analytics choices' });
const banner = (page: Page) => page.getByRole('region', { name: 'Optional analytics' });

test('first-visit keyboard choice keeps focus and scroll at the start of the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(banner(page)).toBeVisible();
  const appearance = (button: HTMLButtonElement) => {
    const style = getComputedStyle(button);
    return [style.backgroundColor, style.color, style.borderColor, style.minHeight];
  };
  expect(await decline(page).evaluate(appearance)).toEqual(await allow(page).evaluate(appearance));
  await decline(page).focus();
  await expect(decline(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(banner(page)).toBeHidden();
  await expect(page.locator('main')).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.keyboard.press('Tab');
  await expect(page.locator('main a').first()).toBeFocused();
});

test('footer choices restore the opener after Escape, Close and saving', async ({ page }) => {
  await page.goto('./');
  await preferences(page).click();
  await expect(preferences(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(banner(page).getByRole('heading')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(preferences(page)).toBeFocused();
  await expect(preferences(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(banner(page)).toBeVisible(); // Closing without choosing leaves the initial prompt available.
  await preferences(page).press('Enter');
  await decline(page).click();
  await expect(preferences(page)).toBeFocused();
  await expect(banner(page)).toBeHidden();
  await preferences(page).press('Enter');
  await page.getByRole('button', { name: 'Close preferences' }).click();
  await expect(preferences(page)).toBeFocused();
  await expect(banner(page)).toBeHidden();
});

test('mocked GTM stays silent until consent and stops after cross-tab withdrawal', async ({ page, context }) => {
  const transport: URL[] = [];
  const scripts: string[] = [];
  const mockContainer = `
    (() => {
      let allowed = false;
      const observe = item => {
        if (item[0] === 'consent') {
          allowed = item[2].analytics_storage === 'granted';
        } else if (allowed && item.event && !item.event.startsWith('gtm.')) {
          const params = new URLSearchParams({ event: item.event, page: item.page_location });
          fetch('https://analytics.google.com/g/collect?' + params, { mode: 'no-cors' }).catch(() => {});
        }
      };
      window.dataLayer.forEach(observe);
      const push = window.dataLayer.push.bind(window.dataLayer);
      window.dataLayer.push = (...items) => {
        items.forEach(observe);
        return push(...items);
      };
    })();`;
  await context.route('https://**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtm.js') {
      scripts.push(url.href);
      return route.fulfill({ contentType: 'text/javascript', body: mockContainer });
    }
    if (url.hostname === 'analytics.google.com' && url.pathname === '/g/collect') {
      transport.push(url);
      return route.fulfill({ status: 204 });
    }
    return route.abort();
  });
  const eventCount = (name: string) => transport.filter(url => url.searchParams.get('event') === name).length;
  await page.goto('enquire.html?email=example%40example.com#enquiry-form');
  expect(scripts).toEqual([]);
  expect(transport).toEqual([]);
  await decline(page).click();
  await page.goto('enquire.html#information-use');
  expect(scripts).toEqual([]);
  expect(transport).toEqual([]);

  await preferences(page).click();
  await allow(page).click();
  await expect.poll(() => eventCount('page_view')).toBe(1);
  expect(scripts).toEqual(['https://www.googletagmanager.com/gtm.js?id=GTM-PG38VX8P']);
  expect(transport[0].searchParams.get('page')).toBe('https://kapohari2k.github.io/BUSN9155_Codex/enquire.html');
  await page.locator('#email').fill('synthetic-owner@example.com');
  await page.locator('#website').fill('example.com');
  await expect.poll(() => eventCount('form_start')).toBe(1);
  await page.locator('.nav-enquire').click();
  await expect(page).toHaveURL(/enquire\.html#enquiry-form$/);
  await expect.poll(() => eventCount('enquiry_cta_click')).toBe(1);
  expect(eventCount('page_view')).toBe(1);
  expect(transport.map(url => url.href).join(' ')).not.toContain('synthetic-owner');

  const second = await context.newPage();
  await second.goto('about.html');
  await expect.poll(() => eventCount('page_view')).toBe(2);
  await preferences(second).click();
  await decline(second).click();
  await expect(preferences(second)).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some(entry => {
    const values = Array.from(entry as ArrayLike<unknown>);
    return values[0] === 'consent' && values[1] === 'update' &&
      (values[2] as { analytics_storage: string }).analytics_storage === 'denied';
  }))).toBe(true);

  const fromWithdrawal = transport.length;
  await expect(page.locator('#email')).toHaveValue('synthetic-owner@example.com');
  await page.locator('.nav-enquire').click();
  await second.locator('.nav-enquire').click();
  await expect(second.locator('#email')).toBeVisible();
  expect(transport).toHaveLength(fromWithdrawal);
  expect(scripts).toHaveLength(2);
  expect(eventCount('generate_lead')).toBe(0);
});

test('withdrawal during GTM download clears pending events and a later opt-in sends one view', async ({ page }) => {
  let releaseDownload: () => void;
  const pending = new Promise<void>(resolve => { releaseDownload = resolve; });
  await page.route('https://**/*', async route => {
    if (!route.request().url().startsWith('https://www.googletagmanager.com/gtm.js?')) return route.abort();
    await pending;
    return route.fulfill({
      contentType: 'text/javascript',
      body: 'document.documentElement.dataset.stubLoaded = "true";',
    });
  });
  const events = () => page.evaluate(() => (window.dataLayer || []).filter(item => 'event' in Object(item)));
  await page.goto('enquire.html');
  await allow(page).click();
  await page.locator('#email').fill('synthetic-owner@example.com');
  await preferences(page).click();
  await decline(page).click();
  releaseDownload!();
  await expect(page.locator('html')).toHaveAttribute('data-stub-loaded', 'true');
  expect(await events()).toEqual([expect.objectContaining({ event: 'gtm.js' })]);
  const defaultConsent = await page.evaluate(() => Array.from(window.dataLayer![0] as ArrayLike<unknown>));
  expect(defaultConsent).toEqual(['consent', 'default', expect.objectContaining({ analytics_storage: 'denied' })]);
  await preferences(page).click();
  await allow(page).click();
  expect(await events()).toEqual([
    expect.objectContaining({ event: 'gtm.js' }),
    expect.objectContaining({ event: 'page_view' }),
  ]);
});
