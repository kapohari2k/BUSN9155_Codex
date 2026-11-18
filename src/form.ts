import './enquire.css';
import { track, type ErrorCategory } from './analytics';
import { iconMarkup } from './icons';

const rawEndpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT?.trim() || '';
const endpoint = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(rawEndpoint) ? rawEndpoint : '';
const fieldNames = ['email', 'website', 'reason', 'profile'] as const;
type FieldName = typeof fieldNames[number];

const labels: Record<FieldName, string> = {
  email: 'Email',
  website: 'Business website',
  reason: 'Review reason',
  profile: 'Google Business Profile link',
};

function normaliseWebAddress(value: string): string | undefined {
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
  const address = hasScheme ? value : `https://${value}`;
  const authority = address.match(/^https?:\/\/([^/?#]+)/i)?.[1];
  if (!authority || authority.includes('@') || /[\s\\<>\u0000-\u001f\u007f]/u.test(address)) return;

  try {
    const hostname = new URL(address).hostname.replace(/\.$/, '');
    if (hostname.startsWith('[')) return address;
    if (/^[\d.]+$/.test(hostname)) {
      // Do not accept single integers or shortened forms that URL silently interprets as IPv4.
      return authority.split(':')[0] === hostname ? address : undefined;
    }
    const parts = hostname.split('.');
    if (hostname.length <= 253 && parts.length > 1 && parts.every(part => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(part))) {
      return address;
    }
  } catch {
    return;
  }
}

export function initForm(): void {
  const form = document.querySelector<HTMLFormElement>('#enquiry-details');
  if (!form) return;
  const availability = document.querySelector<HTMLElement>('#form-availability')!;
  availability.hidden = !!endpoint;
  const status = document.querySelector<HTMLElement>('#form-status')!;
  const summary = document.querySelector<HTMLElement>('#form-errors')!;
  const submit = document.querySelector<HTMLButtonElement>('#submit-enquiry')!;
  submit.disabled = false;
  const success = document.querySelector<HTMLElement>('#form-success')!;
  const fields = {
    email: form.elements.namedItem('email') as HTMLInputElement,
    website: form.elements.namedItem('website') as HTMLInputElement,
    reason: form.elements.namedItem('reason') as HTMLTextAreaElement,
    profile: form.elements.namedItem('profile') as HTMLInputElement,
  };
  const errors = new Map<FieldName, string>();
  let pending = false;
  let complete = false;
  let started = false;

  const markStarted = (): void => {
    if (started) return;
    started = true;
    track('form_start');
  };

  form.addEventListener('focusin', event => {
    if (event.target instanceof Element && event.target.matches('input, textarea, button[type=submit]')) markStarted();
  });

  function validate(name: FieldName): string {
    const value = fields[name].value.trim();
    switch (name) {
      case 'email':
        if (!value) return 'Enter your email address so we can reply.';
        return fields.email.validity.typeMismatch ? 'Enter a valid email address, such as name@example.com.au.' : '';
      case 'website':
        if (!value) return 'Enter your business website address.';
        return normaliseWebAddress(value) ? '' : 'Use a domain such as example.com.au or a link starting with https:// or http://.';
      case 'reason':
        return value ? '' : 'Tell us what you would like reviewed.';
      case 'profile':
        return !value || normaliseWebAddress(value) ? '' : 'Enter a public listing link such as maps.app.goo.gl/example, or leave this field blank.';
    }
  }

  function setFieldError(name: FieldName, message: string): boolean {
    if ((errors.get(name) || '') === message) return false;
    const error = document.getElementById(`${name}-error`)!;
    error.textContent = message;
    if (message) {
      errors.set(name, message);
      fields[name].setAttribute('aria-invalid', 'true');
    } else {
      errors.delete(name);
      fields[name].removeAttribute('aria-invalid');
    }
    return true;
  }

  function updateSummary(): void {
    summary.replaceChildren();
    summary.hidden = errors.size === 0;
    if (summary.hidden) return;
    const intro = document.createElement('p');
    intro.textContent = 'Please check the following fields.';
    const list = document.createElement('ul');
    for (const name of fieldNames) {
      const message = errors.get(name);
      if (!message) continue;
      const link = document.createElement('a');
      link.href = `#${name}`;
      link.textContent = `${labels[name]}: ${message}`;
      link.addEventListener('click', event => {
        event.preventDefault();
        fields[name].focus();
      });
      const item = document.createElement('li');
      item.append(link);
      list.append(item);
    }
    summary.append(intro, list);
  }

  for (const name of fieldNames) {
    if (name !== 'reason') {
      fields[name].addEventListener('blur', () => {
        if (setFieldError(name, validate(name)) && !summary.hidden) updateSummary();
      });
    }
    fields[name].addEventListener('input', () => {
      if (errors.has(name) && !validate(name) && setFieldError(name, '') && !summary.hidden) updateSummary();
    });
  }

  const reportFailure = (category: ErrorCategory, message: string): void => {
    status.dataset.state = 'error';
    status.textContent = message;
    track('form_error', { error_category: category });
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || complete) return;
    markStarted();
    status.textContent = '';
    status.removeAttribute('data-state');
    for (const name of fieldNames) setFieldError(name, validate(name));
    updateSummary();
    if (errors.size) {
      summary.focus();
      track('form_error', { error_category: 'validation' });
      return;
    }
    if (!endpoint) {
      reportFailure('unavailable', 'Enquiries are not open yet. Nothing has been sent. Your answers remain here for this visit.');
      return;
    }
    const website = normaliseWebAddress(fields.website.value.trim())!;
    const profile = normaliseWebAddress(fields.profile.value.trim());
    const payload = { email: fields.email.value.trim(), website, reason: fields.reason.value.trim(), ...(profile ? { profile } : {}) };
    pending = true;
    submit.disabled = true;
    submit.textContent = 'Sending enquiry…';
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'pending';
    status.textContent = 'Sending your enquiry. Please wait for confirmation.';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
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
      submit.innerHTML = `${status.dataset.state === 'error' ? 'Try again' : 'Send enquiry'} <span aria-hidden="true">${iconMarkup('↗')}</span>`;
    }
  });
}
