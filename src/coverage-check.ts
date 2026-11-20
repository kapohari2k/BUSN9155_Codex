import './coverage-check.css';
import { track } from './analytics';

const form = document.querySelector<HTMLElement>('#coverage-check-form')!;
const service = document.querySelector<HTMLInputElement>('#coverage-service')!;
const suburbs = document.querySelector<HTMLTextAreaElement>('#coverage-suburbs')!;
const comparison = document.querySelector<HTMLDetailsElement>('#coverage-compare')!;
const result = document.querySelector<HTMLElement>('#coverage-result')!;
const heading = document.querySelector<HTMLElement>('#coverage-result-heading')!;
const plain = document.querySelector<HTMLDetailsElement>('#coverage-plain')!;
const planText = document.querySelector<HTMLTextAreaElement>('#coverage-plan-text')!;
const copyStatus = document.querySelector<HTMLElement>('#coverage-copy-status')!;
const list = new Intl.ListFormat('en-AU', { type: 'conjunction' });
const retest = 'After publishing, try one suburb you serve and one you don’t on a phone. Check that each sees the right next step.';

const channels = [
  {
    name: 'Quote form',
    input: document.querySelector<HTMLTextAreaElement>('#coverage-quote')!,
    skipped: 'If you use suburb choices, compare them with this service’s list. For a free-text field, explain how you’ll confirm availability.',
    reconcile: 'Check the form for this service and test an eligible suburb before the contact fields.',
  },
  {
    name: 'Website',
    input: document.querySelector<HTMLTextAreaElement>('#coverage-website')!,
    skipped: 'Check the service page and any coverage page for old suburb names or broad claims.',
    reconcile: 'Check the service page and add or correct the names once the owner confirms the coverage.',
  },
  {
    name: 'Google Business Profile',
    input: document.querySelector<HTMLTextAreaElement>('#coverage-profile')!,
    skipped: 'Compare these suburbs with the areas configured for the business as a whole. Check whether a wider area already covers them.',
    reconcile: 'Check whether existing wider areas or postcodes cover the suburbs. Keep areas you serve for other services.',
  },
];

let started = false;
let completed = false;

function areaNames(input: string): Map<string, string> {
  const areas = new Map<string, string>();
  for (const part of input.split(/[,;\n]+/)) {
    const label = part.trim().replace(/^(?:[•●*–—-]\s+|\d+[.)]\s+)/, '').trim().replace(/\s+/g, ' ');
    const key = label.normalize('NFKC').toLocaleLowerCase('en-AU')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (key && !areas.has(key)) areas.set(key, label);
  }
  return areas;
}

function areaError(areas: Map<string, string>, limit: number): string {
  if (!areas.size) return 'Enter area names separated by commas or new lines.';
  if (areas.size > limit || [...areas.values()].some(area => area.length > 70)) {
    return `Enter up to ${limit} names, each 70 characters or fewer.`;
  }
  return '';
}

function setError(input: HTMLElement, message: string): void {
  const error = document.getElementById(`${input.id}-error`)!;
  error.textContent = message;
  error.hidden = !message;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function markStarted(): void {
  if (started) return;
  started = true;
  track('coverage_check_start');
}

for (const input of [service, suburbs, ...channels.map(channel => channel.input)]) {
  input.addEventListener('input', () => {
    setError(input, '');
    result.hidden = true;
    markStarted();
  });
}

function buildUpdate(): void {
  const serviceName = service.value.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  const wanted = areaNames(suburbs.value);
  const observations = channels.map(channel => areaNames(channel.input.value));
  const errors = [
    { input: service, message: /\p{L}/u.test(serviceName) ? '' : 'Enter the name of one cleaning service.' },
    { input: suburbs, message: areaError(wanted, 40) },
    ...channels.map((channel, index) => ({
      input: channel.input,
      message: channel.input.value.trim() ? areaError(observations[index], 80) : '',
    })),
  ];
  errors.forEach(({ input, message }) => setError(input, message));
  const firstError = errors.find(error => error.message);
  if (firstError) {
    if (comparison.contains(firstError.input)) comparison.open = true;
    firstError.input.focus();
    return;
  }

  markStarted();
  const serviceInSentence = serviceName.replace(/^([A-Z])(?=[a-z])/, letter => letter.toLowerCase());
  const areaList = list.format([...wanted.values()]);
  const websiteCopy = `We provide ${serviceInSentence} in ${areaList}.`;
  const quoteCopy = `For ${serviceInSentence}, we serve ${areaList}. Enter your suburb so we can confirm availability before you book.`;
  document.getElementById('coverage-site-copy')!.textContent = websiteCopy;
  document.getElementById('coverage-form-copy')!.textContent = quoteCopy;

  const checks = channels.map((channel, index) => {
    const observed = observations[index];
    if (!observed.size) return { name: channel.name, detail: channel.skipped, missing: false, extra: false };
    const missing = [...wanted].filter(([key]) => !observed.has(key)).map(([, label]) => label);
    const extra = [...observed].filter(([key]) => !wanted.has(key)).map(([, label]) => label);
    const notes: string[] = [];
    if (missing.length) notes.push(`Not listed by name: ${list.format(missing)}.`);
    if (extra.length) notes.push(`Also listed: ${list.format(extra)}.`);
    const detail = notes.length
      ? `${notes.join(' ')} ${channel.reconcile}`
      : 'All entered names match the confirmed list. Check how customers see it before publishing.';
    return { name: channel.name, detail, missing: missing.length > 0, extra: extra.length > 0 };
  });

  document.getElementById('coverage-result-summary')!.textContent = checks[0].missing
    ? 'Check the quote form first. A missing suburb option can stop customers before they reach the contact fields.'
    : checks[0].extra
      ? 'Check the quote form first. An outdated suburb option can make customers expect a quote outside your service area.'
      : 'Copy the wording and use the checks below to decide what to update.';
  const actionList = document.getElementById('coverage-actions')!;
  actionList.replaceChildren(...checks.map(({ name, detail }) => {
    const item = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = name;
    item.append(label, document.createTextNode(`\n${detail}`));
    return item;
  }));
  planText.value = [
    'Coverage update plan',
    `Website copy\n${websiteCopy}\nPlace beside the quote button on the relevant service page.`,
    `Quote form helper text\n${quoteCopy}\nPlace by the suburb field. Check any suburb list for this service.`,
    'Before publishing\n' + checks.map(({ name, detail }) => `${name}\n${detail}`).join('\n\n'),
    'Compare names as entered and verify wider areas, postcodes and different names before changing a list.',
    retest,
  ].join('\n\n');

  plain.open = false;
  copyStatus.textContent = '';
  result.hidden = false;
  heading.focus();
  if (!completed) {
    completed = true;
    track('coverage_check_complete');
  }
}

document.getElementById('coverage-build')!.addEventListener('click', buildUpdate);
service.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    buildUpdate();
  }
});

document.getElementById('coverage-example')!.addEventListener('click', () => {
  service.value = 'Regular house cleaning';
  suburbs.value = 'Maylands, Bayswater';
  channels[0].input.value = 'Maylands, Bayswater, Inglewood';
  channels[1].input.value = 'Maylands, Bayswater, Inglewood';
  channels[2].input.value = 'Maylands, Bayswater';
  comparison.open = true;
  buildUpdate();
});

document.getElementById('coverage-copy')!.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(planText.value);
    copyStatus.textContent = 'Update plan copied.';
  } catch {
    plain.open = true;
    planText.focus();
    planText.select();
    copyStatus.textContent = 'Select and copy the update plan from the text box.';
  }
});

document.getElementById('coverage-restart')!.addEventListener('click', () => {
  for (const input of [service, suburbs, ...channels.map(channel => channel.input)]) {
    input.value = '';
    setError(input, '');
  }
  comparison.open = false;
  result.hidden = true;
  service.focus();
});

form.closest<HTMLElement>('.coverage-check')!.hidden = false;
