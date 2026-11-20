import './coverage-check.css';
import { track } from './analytics';

const advice = {
  quote: {
    yes: ['Unblock quote requests from the suburb.', 'Add the suburb to the quote form’s choices for that service, or allow customers to type it if you confirm coverage manually. On a phone, check that a customer can move on to the contact details.'],
    no: ['Show the service exclusion before asking for contact details.', 'Put “We don’t offer [service] in [suburb]” beside the service or suburb field. If you offer other services there, keep those quote options available.'],
    unclear: ['Check what happens after a customer enters the suburb.', 'If the form accepts any suburb for manual review, explain when you’ll confirm coverage. Try one suburb you serve and one you don’t on a phone, stopping before you send the form.'],
  },
  website: {
    yes: ['Add the suburb to the relevant service page.', 'Place a line like “We offer [service] in [suburb]” near the quote button. Check that the coverage page gives the same answer.'],
    no: ['Replace the coverage claim on the service page.', 'If the page says “all of Perth”, list the areas you actually cover for that service. If the suburb appears in an old list, remove it from that service’s list.'],
    unclear: ['Answer the coverage question next to the quote button.', 'State which suburbs you serve for this service, or explain how customers can confirm availability. Make the service and coverage pages agree.'],
  },
  profile: {
    yes: ['Review the missing area on Google.', 'Open your Business Profile’s service-area settings. If no configured area covers the suburb, add the appropriate area and then check the public listing.'],
    no: ['Check whether any other service still covers the suburb.', 'Keep the suburb in your Google service area if you still serve it for another service. Make the exclusion clear on the relevant service page. If the business no longer serves the suburb at all, review the profile’s service-area settings.'],
    unclear: ['Check the service areas configured on Google.', 'Open the profile’s service-area settings and see whether a listed suburb, postcode or area covers this location before editing the public profile.'],
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
  const serves = answers.get('serves');
  if (serves !== 'yes' && serves !== 'no') return;

  const fixes: (readonly [string, string])[] = [];
  const checks: (readonly [string, string])[] = [];
  for (const [channel, instructions] of Object.entries(advice)) {
    const observed = answers.get(channel);
    if (observed === 'unclear') checks.push(instructions.unclear);
    else if (observed !== serves) fixes.push(instructions[serves]);
  }

  actions.replaceChildren();
  // Put coverage mismatches ahead of follow-up checks, with the quote path first.
  for (const [title, detail] of [...fixes, ...checks]) {
    const item = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = title;
    item.append(label, ` ${detail}`);
    actions.append(item);
  }
  const hasActions = actions.childElementCount > 0;
  actions.hidden = !hasActions;
  matches.hidden = hasActions;
  retest.hidden = fixes.length === 0;
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
