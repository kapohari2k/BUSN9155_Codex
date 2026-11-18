import { test, expect, type Page } from '@playwright/test';

const endpoint = 'https://formspree.io/f/localLiftTestOnly';
const dataCalls = (page: Page) => page.evaluate(() => (window.dataLayer || []).map(item => Array.from(item as ArrayLike<unknown>)));
const eventCalls = async (page: Page, name: string) => (await dataCalls(page)).filter(call => call[0] === 'event' && call[1] === name);

test.beforeEach(async ({ page }) => {
  // Block every external destination. Tests never contact a form service or Google.
  await page.route('https://**/*', route => route.request().url().startsWith('https://www.googletagmanager.com/gtag/js?')
    ? route.fulfill({status:200,contentType:'text/javascript',body:'/* isolated GA transport stub */'})
    : route.abort('blockedbyclient'));
});

async function openForm(page: Page, allow = true): Promise<void> {
  await page.goto('enquire.html?email=private-query@example.com#information-use');
  if (allow) {
    await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
    await expect.poll(() => eventCalls(page, 'page_view')).toHaveLength(1);
  }
  await expect(page.locator('#form-availability')).toBeHidden();
}
async function fillForm(page: Page): Promise<void> {
  await page.locator('#email').fill('owner-private@example.com');
  await page.locator('#website').fill('https://example.com/private-path?customer=secret');
  await page.locator('#reason').fill('Private free text: review inclusions.');
}

test('edited fields validate on mouse exit while untouched fields stay quiet', async ({ page }) => {
  await openForm(page);
  const email = page.locator('#email');
  const website = page.locator('#website');
  const emailError = page.locator('#email-error');
  const websiteError = page.locator('#website-error');

  await email.click();
  await website.click();
  await expect(emailError).toBeEmpty();
  await expect(email).not.toHaveAttribute('aria-invalid');
  await email.click();
  await page.keyboard.type('owner-invalid');
  await expect(emailError).toBeEmpty();
  const websiteBefore = await website.boundingBox();
  expect(websiteBefore).not.toBeNull();
  await website.click();
  await expect(website).toBeFocused();
  await expect(emailError).toContainText('Enter a valid email address');
  expect((await website.boundingBox())?.y).toBe(websiteBefore!.y);
  await expect(email).toHaveAttribute('aria-describedby', /\bemail-error\b/);
  await expect(email).toHaveValue('owner-invalid');

  await page.keyboard.type('ftp://example.com');
  await expect(websiteError).toBeEmpty();
  const bounds = await website.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(6, bounds!.y + bounds!.height / 2);
  await expect(website).not.toBeFocused();
  await expect(websiteError).toContainText('domain');
  await expect(website).toHaveAttribute('aria-describedby', /\bwebsite-error\b/);
  await expect(website).toHaveValue('ftp://example.com');
  await expect(page.locator('#form-errors')).toBeHidden();

  await email.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.type('owner-test@example.com');
  await expect(emailError).toBeEmpty();
  await expect(email).toBeFocused();
  await expect(email).not.toHaveAttribute('aria-invalid');
  expect(await eventCalls(page, 'form_start')).toHaveLength(1);
  expect(await eventCalls(page, 'form_error')).toHaveLength(0);
  expect(await eventCalls(page, 'generate_lead')).toHaveLength(0);
});

test('a click outside validates edits even when the browser retains input focus', async ({ page }) => {
  await openForm(page);
  const email = page.locator('#email');
  const heading = page.locator('#enquiry-heading');
  // Model a browser retaining focus on a pointer click on non-focusable text.
  await heading.evaluate(element => element.addEventListener('mousedown', event => event.preventDefault(), { once: true }));
  await email.click();
  await page.keyboard.type('owner@example');
  await expect(page.locator('#email-error')).toBeEmpty();
  await heading.click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#email-error')).toContainText('Enter a valid email address');
});

test('Tab keeps its destination when an edited field is empty or corrected', async ({ page }) => {
  await openForm(page);
  const email = page.locator('#email');
  const website = page.locator('#website');
  const websiteError = page.locator('#website-error');
  const reason = page.locator('#reason');
  await email.focus();
  await page.keyboard.press('Tab');
  await expect(website).toBeFocused();
  await expect(page.locator('#email-error')).toBeEmpty();
  await page.keyboard.type('example');
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Backspace');
  await expect(websiteError).toBeEmpty();
  await page.keyboard.press('Tab');
  await expect(reason).toBeFocused();
  await expect(websiteError).toContainText('Enter your business website address');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.type('example.com');
  await expect(website).toBeFocused();
  await expect(websiteError).toBeEmpty();
  await expect(website).not.toHaveAttribute('aria-invalid');
  await page.keyboard.press('Tab');
  await expect(reason).toBeFocused();
  await expect(page.locator('#form-errors')).toBeHidden();
});

test.describe('touch enquiry', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('mobile taps validate edited fields and preserve the tapped destination', async ({ page }) => {
    await openForm(page);
    const email = page.locator('#email');
    const website = page.locator('#website');
    const reason = page.locator('#reason');
    await expect(email).toHaveAttribute('inputmode', 'email');
    await expect(website).toHaveAttribute('inputmode', 'url');
    await email.tap();
    await website.tap();
    await expect(page.locator('#email-error')).toBeEmpty();
    await page.keyboard.type('broken..example.com');
    await expect(page.locator('#website-error')).toBeEmpty();
    await reason.tap();
    await expect(reason).toBeFocused();
    await expect(website).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#website-error')).toContainText('domain');
    await website.tap();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('www.example.com');
    await expect(website).toBeFocused();
    await expect(page.locator('#website-error')).toBeEmpty();
    await expect(page.locator('#reason-error')).toBeEmpty();
    await expect(page.locator('#form-errors')).toBeHidden();
    expect(await eventCalls(page, 'form_start')).toHaveLength(1);
  });
});

test('GA stays unloaded until permission, then sends one safe page view', async ({ page }) => {
  let scripts = 0;
  page.on('request', request => { if (request.url().includes('googletagmanager.com')) scripts++; });
  await openForm(page,false);
  expect(scripts).toBe(0); expect(await dataCalls(page)).toEqual([]);
  await page.getByRole('button',{name:'Continue without analytics'}).click();
  expect(scripts).toBe(0);
  await page.getByRole('button',{name:'Analytics choices',exact:true}).click();
  await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
  await expect.poll(()=>scripts).toBe(1);
  expect(await eventCalls(page,'page_view')).toEqual([['event','page_view', {
    page_location:'https://kapohari2k.github.io/BUSN9155_Codex/enquire.html',page_referrer:'',page_title:await page.title(),
  }]]);
  const config = (await dataCalls(page)).find(call=>call[0] === 'config');
  expect(config?.[2]).toMatchObject({send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
  await page.getByRole('button',{name:'Analytics choices',exact:true}).click();
  await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
  expect(await eventCalls(page,'page_view')).toHaveLength(1);
  expect(scripts).toBe(1);
});

test('confirmed acceptance alone shows success and generates one lead', async ({ page }) => {
  let requests = 0;
  let payload: Record<string,string> = {};
  await page.route(endpoint, async route => { requests++; payload = route.request().postDataJSON(); await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}); });
  await openForm(page); await fillForm(page);
  await page.getByRole('button',{name:'Send enquiry'}).click();
  await expect(page.locator('#form-success')).toBeVisible();
  await expect(page.locator('#form-success')).toBeFocused();
  await expect(page.locator('#enquiry-details')).toBeHidden();
  expect(requests).toBe(1);
  expect(payload).toEqual({email:'owner-private@example.com',website:'https://example.com/private-path?customer=secret',reason:'Private free text: review inclusions.'});
  expect(await eventCalls(page,'generate_lead')).toHaveLength(1);
  expect(await eventCalls(page,'form_start')).toHaveLength(1);
  expect(await eventCalls(page,'form_error')).toHaveLength(0);
  const serialised = JSON.stringify(await dataCalls(page));
  for (const forbidden of ['owner-private','private-path','customer=secret','Private free text','private-query']) expect(serialised).not.toContain(forbidden);
  expect(new URL(page.url()).search).toBe('?email=private-query@example.com');
});

test('pending state prevents duplicate submissions', async ({ page }) => {
  let requests = 0;
  let accept: (()=>void) | undefined;
  await page.route(endpoint, async route => {
    requests++;
    await new Promise<void>(resolve=> { accept=resolve; });
    await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
  });
  await openForm(page); await fillForm(page);
  await page.getByRole('button',{name:'Send enquiry'}).dblclick();
  await expect(page.getByRole('button',{name:'Sending enquiry…'})).toBeDisabled();
  await expect(page.locator('#enquiry-details')).toHaveAttribute('aria-busy','true');
  await expect(page.getByRole('status')).toContainText('Please wait');
  await page.locator('#enquiry-details').evaluate(form => { form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); });
  expect(requests).toBe(1); expect(await eventCalls(page,'generate_lead')).toHaveLength(0);
  accept!();
  await expect(page.locator('#form-success')).toBeVisible();
  expect(await eventCalls(page,'generate_lead')).toHaveLength(1);
});

for (const [label,status,body,category] of [
  ['service rejection',422,'{"errors":[{"message":"Private service detail"}]}','service'],
  ['rate limit',429,'{}','service'],
  ['service outage',503,'{}','service'],
  ['missing acceptance',200,'{}','unconfirmed'],
  ['negative acceptance',200,'{"ok":false}','unconfirmed'],
  ['non-JSON acceptance',200,'not-json','unconfirmed'],
] as const) {
  test(`${label}: answers retained, safe error and no false lead`, async ({ page }) => {
    await page.route(endpoint, route=>route.fulfill({status,contentType:'application/json',body}));
    await openForm(page); await fillForm(page);
    await page.getByRole('button',{name:'Send enquiry'}).click();
    await expect(page.locator('#form-status')).toHaveAttribute('data-state','error');
    await expect(page.locator('#reason')).toHaveValue('Private free text: review inclusions.');
    await expect(page.locator('#form-success')).toBeHidden();
    await expect(page.getByRole('button',{name:'Try again'})).toBeEnabled();
    expect(await eventCalls(page,'generate_lead')).toHaveLength(0);
    expect(await eventCalls(page,'form_error')).toEqual([['event','form_error',{error_category:category}]]);
    expect(await page.locator('#form-status').textContent()).not.toContain('Private service detail');
  });
}

test('network failure can be retried without re-entering answers', async ({ page }) => {
  let attempts = 0;
  await page.route(endpoint, route => ++attempts === 1 ? route.abort('failed') : route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
  await openForm(page); await fillForm(page);
  await page.getByRole('button',{name:'Send enquiry'}).click();
  await expect(page.getByRole('status')).toContainText('connection problem');
  expect(await eventCalls(page,'form_error')).toEqual([['event','form_error',{error_category:'network'}]]);
  expect(await eventCalls(page,'generate_lead')).toHaveLength(0);
  await page.getByRole('button',{name:'Try again'}).click();
  await expect(page.locator('#form-success')).toBeVisible();
  expect(attempts).toBe(2); expect(await eventCalls(page,'generate_lead')).toHaveLength(1);
});

test('timeout is distinct and does not assert receipt', async ({ page }) => {
  await page.clock.install();
  await page.route(endpoint, () => { /* Intentionally leave the isolated request pending. */ });
  await openForm(page); await fillForm(page);
  await page.getByRole('button',{name:'Send enquiry'}).click();
  await expect(page.locator('#enquiry-details')).toHaveAttribute('aria-busy','true');
  await page.clock.fastForward(15001);
  await expect(page.getByRole('status')).toContainText('Receipt is uncertain');
  await expect(page.locator('#reason')).toHaveValue('Private free text: review inclusions.');
  expect(await eventCalls(page,'form_error')).toEqual([['event','form_error',{error_category:'timeout'}]]);
  expect(await eventCalls(page,'generate_lead')).toHaveLength(0);
});

test('validation produces a category, never form contents', async ({ page }) => {
  await openForm(page);
  await page.locator('#email').fill('private-invalid');
  await page.getByRole('button',{name:'Send enquiry'}).click();
  await expect(page.locator('#form-errors')).toBeFocused();
  expect(await eventCalls(page,'form_error')).toEqual([['event','form_error',{error_category:'validation'}]]);
  expect(JSON.stringify(await dataCalls(page))).not.toContain('private-invalid');
});

test('CTA, sample and guide events use only approved placement labels', async ({ page }) => {
  await openForm(page);
  for (const [selector,name,label] of [
    ['.nav-enquire','enquiry_cta_click','header'],
    ['a[data-event="sample"]','sample_select','enquire-aside'],
    ['#primary-nav a[data-event="guide"]','guide_select','header'],
  ]) {
    const link = page.locator(selector).first();
    await link.evaluate(element=>element.addEventListener('click',event=>event.preventDefault()));
    await link.click();
    expect(await eventCalls(page,name)).toEqual([['event',name,{placement:label}]]);
  }
});

test('revoking analytics keeps answers and blocks further application events', async ({ page }) => {
  await openForm(page); await fillForm(page);
  const before = (await dataCalls(page)).filter(call=>call[0]==='event').length;
  await page.getByRole('button',{name:'Analytics choices',exact:true}).click();
  await page.getByRole('button',{name:'Continue without analytics'}).click();
  await expect(page.locator('#reason')).toHaveValue('Private free text: review inclusions.');
  await page.locator('#email').fill('invalid');
  await page.getByRole('button',{name:'Send enquiry'}).click();
  expect((await dataCalls(page)).filter(call=>call[0]==='event')).toHaveLength(before);
  await page.reload();
  expect(await dataCalls(page)).toEqual([]);
  await expect(page.locator('.analytics-banner')).toBeHidden();
});

test('analytics remains off if browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){ throw new DOMException('Blocked','SecurityError'); }}));
  await openForm(page,false);
  await expect(page.locator('#enquiry-form')).toBeVisible();
  expect(await dataCalls(page)).toEqual([]);
  await page.getByRole('button',{name:'Continue without analytics'}).click();
  await fillForm(page);
  await expect(page.locator('#reason')).toHaveValue('Private free text: review inclusions.');
});

for (const [entered, expected] of [
  ['example.com', 'https://example.com'],
  ['www.example.com', 'https://www.example.com'],
  ['http://example.com/cleaning', 'http://example.com/cleaning'],
  ['  https://example.com/quote?service=home#details  ', 'https://example.com/quote?service=home#details'],
] as const) {
  test(`submits a normalised website from ${JSON.stringify(entered)}`, async ({ page }) => {
    let payload: Record<string, string> | undefined;
    await page.route(endpoint, async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await openForm(page);
    await fillForm(page);
    await page.locator('#website').fill(entered);
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.locator('#form-success')).toBeVisible();
    expect(payload?.website).toBe(expected);
    expect(payload).not.toHaveProperty('profile');
    expect(await eventCalls(page, 'generate_lead')).toHaveLength(1);
  });
}

test('clipboard website and profile links are normalised only in the provider payload', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  let payload: Record<string, string> | undefined;
  await page.route(endpoint, async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await openForm(page);
  await fillForm(page);
  const website = page.locator('#website');
  const profile = page.locator('#profile');
  for (const { field, pasted, error } of [
    { field: website, pasted: '  www.example.com/synthetic?quote=synthetic#booking  ', error: '#website-error' },
    { field: profile, pasted: '  maps.app.goo.gl/LocalLiftSynthetic  ', error: '#profile-error' },
  ]) {
    await field.fill('ftp://example.com');
    await field.press('Tab');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await field.click();
    await page.keyboard.press('Control+a');
    await page.evaluate(value => navigator.clipboard.writeText(value), pasted);
    await page.keyboard.press('Control+v');
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(pasted);
    await expect(page.locator(error)).toBeEmpty();
  }
  await page.locator('#submit-enquiry').click();
  await expect(page.locator('#form-success')).toBeVisible();
  expect(payload?.website).toBe('https://www.example.com/synthetic?quote=synthetic#booking');
  expect(payload?.profile).toBe('https://maps.app.goo.gl/LocalLiftSynthetic');
  expect(await eventCalls(page, 'form_start')).toHaveLength(1);
  expect(await eventCalls(page, 'generate_lead')).toHaveLength(1);
  expect(JSON.stringify(await dataCalls(page))).not.toMatch(/LocalLiftSynthetic|quote=synthetic/);
});

test('malformed or unsupported website and profile links cannot reach the provider or count as a lead', async ({ page }) => {
  let attempts = 0;
  await page.route(endpoint, route => {
    attempts++;
    return route.fulfill({ json: { ok: true } });
  });
  await openForm(page);
  await fillForm(page);
  const website = page.locator('#website');
  const profile = page.locator('#profile');
  for (const value of ['https:/example.com', 'example..com', 'https://exa mple.com', 'ftp://example.com', 'javascript:alert(1)', 'https://person@example.com', '   ']) {
    await website.fill(value);
    await website.press('Tab');
    await expect(website).toHaveAttribute('aria-invalid', 'true');
    await expect(website).toHaveValue(value);
  }
  await website.fill('www.example.com');
  await expect(website).not.toHaveAttribute('aria-invalid');
  await profile.fill('mailto:owner@example.com');
  await expect(profile).not.toHaveAttribute('aria-invalid');
  await page.locator('#submit-enquiry').click();
  await expect(page.locator('#form-errors')).toBeFocused();
  await expect(profile).toHaveAttribute('aria-invalid', 'true');
  expect(attempts).toBe(0);
  expect(await eventCalls(page, 'generate_lead')).toHaveLength(0);
  expect(await eventCalls(page, 'form_start')).toHaveLength(1);
});
