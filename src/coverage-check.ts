import './coverage-check.css';
import { track } from './analytics';

const advice = {
  quote: {
    label: 'the quote form',
    update: 'Update the suburb options or instructions so customers can request a quote for covered suburbs and see when you’ll confirm availability.',
    unsure: 'Walk through the form on your phone. Check whether a customer can request that service for the suburb and tell when you’ll confirm availability.',
  },
  website: {
    label: 'the website',
    update: 'Update the coverage wording on the relevant service and area pages. Replace any broad or outdated wording with the current areas for that service.',
    unsure: 'Read the relevant service and area pages as a first-time visitor. Check whether you can tell if the service is available in that suburb.',
  },
  profile: {
    label: 'your Google Business Profile',
    update: 'Update your service areas or listed services to reflect your confirmed coverage. Then check how the profile appears publicly.',
    unsure: 'Open the public profile in Google Search or Maps and compare the service areas and services shown with your confirmed coverage.',
  },
} as const;

const form = document.querySelector<HTMLFormElement>('#coverage-check-form')!;
const result = document.querySelector<HTMLElement>('#coverage-result')!;
const heading = document.querySelector<HTMLElement>('#coverage-result-heading')!;
const actions = document.querySelector<HTMLOListElement>('#coverage-actions')!;
const matches = document.querySelector<HTMLElement>('#coverage-matches')!;
const retest = document.querySelector<HTMLElement>('#coverage-retest')!;
const checkHeading = document.querySelector<HTMLElement>('#coverage-check-heading')!;
let started = false;
let completed = false;

form.addEventListener('change', () => {
  result.hidden = true;
  if (started) return;
  started = true;
  track('coverage_check_start');
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const answers = new FormData(form);
  actions.replaceChildren();
  // Show confirmed issues first, prioritising the quote path within each group.
  for (const status of ['update', 'unsure'] as const) {
    for (const [channel, step] of Object.entries(advice)) {
      if (answers.get(channel) !== status) continue;
      const item = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = `${status === 'update' ? 'Update' : 'Verify'} ${step.label}.`;
      item.append(label, ` ${step[status]}`);
      actions.append(item);
    }
  }
  const hasActions = actions.childElementCount > 0;
  actions.hidden = !hasActions;
  matches.hidden = hasActions;
  retest.hidden = !Object.keys(advice).some(channel => answers.get(channel) === 'update');
  result.hidden = false;
  heading.focus();
  if (completed) return;
  completed = true;
  track('coverage_check_complete');
});

document.querySelector<HTMLButtonElement>('#coverage-restart')!.addEventListener('click', () => {
  form.reset();
  result.hidden = true;
  checkHeading.focus();
});

form.closest<HTMLElement>('.coverage-check')!.hidden = false;
