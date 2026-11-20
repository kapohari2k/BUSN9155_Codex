import './quote-form-fixer.css';

const pricingNotes = {
  rooms: 'Your draft asks for bedroom and bathroom counts. Customers can skip a floor-area estimate if you include that field.',
  area: 'Your draft asks for approximate floor area and lets customers say they’re unsure.',
  hourly: 'Your draft asks what needs cleaning. Customers can describe the work without guessing how long it will take.',
  custom: 'Your draft gathers enough to start a conversation. Confirm what you need to price each job before making more fields required.',
};

type Pricing = keyof typeof pricingNotes;
type Advice = [label: string, instruction: string];

const optionalFields = {
  name: ['Name', 'Collect it if it helps you address the customer.'],
  property: ['Property type', 'Include choices that affect the work, such as house or apartment.'],
  frequency: ['How often would you like cleaning?', 'Offer one-off, weekly, fortnightly and “Not sure yet” if you provide those options.'],
  date: ['Preferred day or date', 'Let customers skip it or choose “Flexible”.'],
  hours: ['Approximate hours (if you know)', 'Let customers describe the job if they don’t know how long it will take.'],
  details: ['Anything else we should know?', 'Give customers room to mention priorities or relevant details.'],
  area: ['Approximate floor area (if you know it)', 'Let customers leave it blank.'],
  rooms: ['Bedrooms and bathrooms (if relevant)', 'Ask for both counts when they help you understand the job.'],
  phone: ['Phone number', 'Offer it as another way to reply.'],
} satisfies Record<string, Advice>;

type OptionalField = keyof typeof optionalFields;
type Field = OptionalField | 'location' | 'service' | 'email' | 'choice' | 'street' | 'access' | 'media' | 'payment' | 'scope';

const fieldPatterns: Array<[Field, RegExp]> = [
  ['payment', /\b(?:payment|credit card|card number|bank details|deposit|billing)\b/],
  ['access', /\b(?:access (?:instructions|details|code)|gate code|key (?:code|location|collection)|lockbox|alarm|door code|where to (?:park|leave the key))\b/],
  ['media', /\b(?:photos?|pictures?|images?|attachments?|uploads?)\b/],
  ['choice', /\b(?:e ?mail.*(?:phone|mobile)|(?:phone|mobile).*e ?mail|preferred contact (?:method|details)|best way to (?:contact|reach))\b/],
  ['email', /\be ?mail\b/],
  ['phone', /\b(?:phone|telephone|mobile|contact number)\b/],
  ['street', /\b(?:full address|street address|property address|street name|unit number)\b|^(?:your )?address$/],
  ['location', /\b(?:suburb|postcode|post code|postal code|service location)\b/],
  ['area', /\b(?:floor (?:area|space)|square (?:metres?|meters?)|sqm|m2|(?:home|property) size|size of (?:your |the )?(?:home|property))\b/],
  ['scope', /\b(?:which (?:rooms|areas|tasks)|(?:rooms|areas|tasks) (?:to clean|need cleaning)|what (?:needs? cleaning|would you like cleaned))\b/],
  ['rooms', /\b(?:bedrooms?|bathrooms?|room count|number of rooms|how many rooms)\b/],
  ['frequency', /\b(?:frequency|how often|regularity|weekly|fortnightly)\b/],
  ['date', /\b(?:date|when|preferred day|availability)\b/],
  ['hours', /\b(?:hours?|duration|how long)\b/],
  ['property', /\b(?:property|home|dwelling) type\b|\bhouse or apartment\b/],
  ['service', /\b(?:service(?: type| required| needed)?|(?:clean|cleaning) type|type of (?:clean|cleaning)|which clean|what (?:type of )?clean(?:ing)? (?:do|would|is))\b/],
  ['name', /^(?:(?:your|full|first|last|given) )?name$|^surname$|^first and last name$/],
  ['details', /\b(?:message|comments?|notes?|additional (?:details|information)|anything else|special (?:requirements|instructions)|cleaned|tasks)\b/],
];

const laterFields: Partial<Record<Field, string>> = {
  street: 'Use suburb or postcode to check coverage. Ask for the street address when you need to confirm the job or arrange a visit.',
  access: 'Collect access details directly from the customer when you arrange the job.',
  media: 'Ask for photos in a follow-up when you need them to quote.',
  payment: 'Ask for payment details through your payment process once the customer agrees to proceed.',
};

const buttonCopy = 'Request a cleaning quote';
const confirmation = 'Thanks for your request. We’ll check the details and contact you about the next step.';
const publishCheck = 'Check each required answer helps you quote or decide whether you can take the job. Test the form on a phone with a typical enquiry.';

function normalise(label: string): string {
  return label.normalize('NFKC').toLowerCase().replace(/[’']/g, '')
    .replace(/\b(?:required|optional)\b/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function readLabels(input: string): string[] {
  const labels = new Map<string, string>();
  for (const line of input.split(/\r?\n/)) {
    const label = line.trim().replace(/^(?:[•●*–—-]\s+|\d+[.)]\s+)/, '').trim();
    const key = normalise(label);
    if (key && !/^(?:submit|send|request a (?:cleaning )?quote|get a quote|fields)$/.test(key) && !labels.has(key)) {
      labels.set(key, label);
    }
  }
  return [...labels.values()];
}

function buildDraft(labels: string[], pricing: Pricing) {
  const found = new Set<Field>();
  const later: Advice[] = [];
  const review: Advice[] = [];
  for (const label of labels) {
    const key = normalise(label);
    const field = fieldPatterns.find(([, pattern]) => pattern.test(key))?.[0];
    if (!field) {
      review.push([label, 'Keep it upfront if you need it to quote or confirm you can take the job. Otherwise make it optional or ask later.']);
      continue;
    }
    if (found.has(field)) continue;
    found.add(field);
    const followUp = laterFields[field];
    if (followUp) later.push([label, followUp]);
  }

  const required: Advice[] = [
    ['Suburb or postcode', 'One short answer to check that the property is in your service area.'],
    ['What type of clean do you need?', 'List the services you provide, such as regular home cleaning or a one-off deep clean. Add “Not sure yet”.'],
  ];
  if (pricing === 'rooms') {
    required.push(
      ['Number of bedrooms', 'Include a studio or zero-bedroom option.'],
      ['Number of bathrooms', 'Use a number field or a short list of counts.'],
    );
  }
  if (pricing === 'area') {
    required.push(['Approximate floor area (m²)', 'Accept an estimate or offer “I’m not sure” so you can follow up.']);
  }
  if (pricing === 'hourly') {
    required.push(['Which rooms or tasks need cleaning?', 'Use a short answer. For example, “Kitchen, bathrooms and floors”.']);
  }
  const emailPrimary = found.has('email') || found.has('choice') || !found.has('phone');
  required.push(emailPrimary
    ? ['Email address', 'Use an email field so you can reply about the quote.']
    : ['Phone number', 'Use a phone field so you can reply about the quote.']);

  const optional: Advice[] = [];
  if (found.has('scope') && pricing !== 'hourly') {
    optional.push(['Which rooms or tasks need cleaning?', 'Use a short answer for details that affect the work.']);
  }
  for (const key of Object.keys(optionalFields) as OptionalField[]) {
    if (!found.has(key)) continue;
    if ((key === 'area' && pricing === 'area') || (key === 'rooms' && pricing === 'rooms') || (key === 'phone' && !emailPrimary)) continue;
    optional.push(optionalFields[key]);
  }
  if (found.has('choice') && !found.has('phone')) optional.push(optionalFields.phone);
  return { required, optional, later, review };
}

const form = document.querySelector<HTMLFormElement>('#quote-fixer')!;
const labels = document.querySelector<HTMLTextAreaElement>('#quote-labels')!;
const pricing = document.querySelector<HTMLSelectElement>('#quote-pricing')!;
const result = document.querySelector<HTMLElement>('#quote-result')!;
const plainDetails = document.querySelector<HTMLDetailsElement>('#quote-copy-details')!;
const plainText = document.querySelector<HTMLTextAreaElement>('#quote-copy-text')!;
const copyStatus = document.querySelector<HTMLElement>('#quote-copy-status')!;

function showError(input: HTMLElement, message: string): void {
  const error = document.getElementById(`${input.id}-error`)!;
  error.textContent = message;
  error.hidden = !message;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function fillList(name: string, advice: Advice[]): void {
  const list = document.getElementById(`quote-${name}`)!;
  list.replaceChildren(...advice.map(([label, instruction]) => {
    const item = document.createElement('li');
    const heading = document.createElement('strong');
    heading.textContent = label;
    const detail = document.createElement('span');
    detail.textContent = instruction;
    item.append(heading, detail);
    return item;
  }));
  const group = document.getElementById(`quote-${name}-group`);
  if (group) group.hidden = advice.length === 0;
}

for (const input of [labels, pricing]) {
  input.addEventListener('input', () => {
    showError(input, '');
    result.hidden = true;
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const entered = readLabels(labels.value);
  const validPricing = Object.hasOwn(pricingNotes, pricing.value);
  let labelError = '';
  if (!entered.length) labelError = 'Enter at least one field label from your form.';
  else if (entered.length > 30 || entered.some(label => label.length > 100)) {
    labelError = 'Enter up to 30 short field labels, with one label per line.';
  }
  showError(labels, labelError);
  showError(pricing, validPricing ? '' : 'Choose the pricing method closest to how you work.');
  if (labelError || !validPricing) {
    (labelError ? labels : pricing).focus();
    return;
  }

  const method = pricing.value as Pricing;
  const draft = buildDraft(entered, method);
  document.getElementById('quote-result-note')!.textContent = pricingNotes[method];
  for (const [group, advice] of Object.entries(draft)) fillList(group, advice);
  const sections: Array<[string, Advice[]]> = [
    ['Ask upfront (required)', draft.required], ['Make optional', draft.optional],
    ['Ask after the enquiry', draft.later], ['Check before publishing', draft.review],
  ];
  const fieldText = sections.filter(([, list]) => list.length > 0).map(([title, list]) =>
    `${title}\n${list.map(([label, instruction]) => `- ${label}\n  ${instruction}`).join('\n')}`,
  );
  plainText.value = ['Cleaning quote form draft', ...fieldText, `Button: ${buttonCopy}\nConfirmation: ${confirmation}`, publishCheck].join('\n\n');
  plainDetails.open = false;
  copyStatus.textContent = '';
  result.hidden = false;
  document.getElementById('quote-result-heading')!.focus();
});

document.getElementById('quote-example')!.addEventListener('click', () => {
  labels.value = 'Suburb\nType of cleaning\nBedrooms\nBathrooms\nFloor area (m²) *\nEmail address\nFull address\nAccess instructions';
  pricing.value = 'rooms';
  form.requestSubmit();
});

document.getElementById('quote-copy')!.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(plainText.value);
    copyStatus.textContent = 'Form draft copied.';
  } catch {
    plainDetails.open = true;
    plainText.focus();
    plainText.select();
    copyStatus.textContent = 'Select and copy the draft from the plain-text box.';
  }
});

form.hidden = false;
