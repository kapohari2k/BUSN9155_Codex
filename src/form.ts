import { track, type ErrorCategory } from './analytics';
import { iconMarkup } from './icons';

const rawEndpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT?.trim() || '';
const endpoint = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(rawEndpoint) ? rawEndpoint : '';
const validWebUrl = (value: string): boolean => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
};

export function initForm(): void {
  const form = document.querySelector<HTMLFormElement>('#enquiry-form');
  if (!form) return;
  const availability = document.querySelector<HTMLElement>('#form-availability')!;
  availability.hidden = !!endpoint;
  const status = document.querySelector<HTMLElement>('#form-status')!;
  const summary = document.querySelector<HTMLElement>('#form-errors')!;
  const submit = document.querySelector<HTMLButtonElement>('#submit-enquiry')!;
  submit.disabled = false;
  const success = document.querySelector<HTMLElement>('#form-success')!;
  let pending = false;
  let complete = false;
  let started = false;
  let lastFailure: ErrorCategory | undefined;
  const fields = ['email', 'website', 'reason', 'profile'] as const;
  const labels = { email: 'Email', website: 'Business website', reason: 'Review reason', profile: 'Google profile link' };

  form.addEventListener('focusin', () => {
    if (!started) { started = true; track('form_start'); }
  });
  const reportFailure = (category: ErrorCategory, message: string): void => {
    lastFailure = category;
    status.dataset.state = 'error';
    status.textContent = message;
    track('form_error', { error_category: category });
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || complete) return;
    summary.hidden = true;
    summary.replaceChildren();
    status.textContent = '';
    status.removeAttribute('data-state');
    const values = Object.fromEntries(fields.map(name => [name, (form.elements.namedItem(name) as HTMLInputElement).value.trim()])) as Record<typeof fields[number], string>;
    const errors: Partial<Record<typeof fields[number], string>> = {};
    const email = form.elements.namedItem('email') as HTMLInputElement;
    if (!values.email || email.validity.typeMismatch) errors.email = 'Enter an email address where you can receive a reply.';
    if (!values.website || !validWebUrl(values.website)) errors.website = 'Enter the business website URL, starting with https:// or http://.';
    if (!values.reason) errors.reason = 'Tell us what you would like reviewed.';
    if (values.profile && !validWebUrl(values.profile)) errors.profile = 'Enter a full web link or leave the optional profile field blank.';
    for (const name of fields) {
      const input = form.elements.namedItem(name) as HTMLInputElement;
      const error = document.getElementById(`${name}-error`)!;
      error.hidden = !errors[name];
      error.textContent = errors[name] || '';
      if (errors[name]) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    if (Object.keys(errors).length) {
      const intro = document.createElement('p');
      intro.textContent = 'Please check the following fields.';
      const list = document.createElement('ul');
      for (const name of fields) {
        if (!errors[name]) continue;
        const link = document.createElement('a');
        link.href = `#${name}`;
        link.textContent = `${labels[name]}: ${errors[name]}`;
        link.addEventListener('click', event => { event.preventDefault(); document.getElementById(name)?.focus(); });
        const item = document.createElement('li'); item.append(link); list.append(item);
      }
      summary.append(intro, list);
      summary.hidden = false;
      summary.focus();
      track('form_error', { error_category: 'validation' });
      return;
    }
    if (!endpoint) {
      reportFailure('unavailable', 'Enquiries are not open yet. Nothing has been sent. Your answers remain here for this visit.');
      return;
    }
    pending = true;
    lastFailure = undefined;
    submit.disabled = true;
    submit.textContent = 'Sending enquiry…';
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'pending';
    status.textContent = 'Sending your enquiry. Please wait for confirmation.';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    const publisher = (new FormData(form).get('publisher') as string) || '';
    const payload: Record<string, string> = { email: values.email, website: values.website, reason: values.reason };
    if (values.profile) payload.profile = values.profile;
    if (['me','web_contact','needs_confirmation'].includes(publisher)) payload.publisher = publisher;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) {
        reportFailure('service', 'The enquiry service could not accept this request. Your answers are still here. Please try again later.');
        return;
      }
      const result: unknown = await response.json().catch(() => null);
      if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
        reportFailure('unconfirmed', 'We could not confirm receipt. Your answers are still here. To avoid a duplicate, wait before trying again.');
        return;
      }
      complete = true;
      form.hidden = true;
      success.hidden = false;
      success.focus();
      track('generate_lead');
      form.reset();
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      reportFailure(aborted ? 'timeout' : 'network', aborted
        ? 'Confirmation took too long. Your answers are still here. Receipt is uncertain, so wait before retrying to avoid a duplicate.'
        : 'A connection problem prevented confirmation. Your answers are still here. Check your connection, then retry.');
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
      submit.disabled = false;
      submit.innerHTML = `${lastFailure ? 'Try again' : 'Send enquiry'} <span aria-hidden="true">${iconMarkup('↗')}</span>`;
    }
  });
}
