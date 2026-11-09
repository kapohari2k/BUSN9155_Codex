type EventName = 'enquiry_cta_click' | 'sample_select' | 'guide_select' | 'form_start' | 'form_error' | 'generate_lead';
type SafeLabel = 'header' | 'footer' | 'home-hero' | 'home-guide' | 'home-close' | 'about-sample' | 'about-guide' | 'audit-intro' | 'audit-contents' | 'audit-close' | 'guide-close' | 'enquire-aside' | 'enquire-success';
export type ErrorCategory = 'validation' | 'unavailable' | 'network' | 'service' | 'unconfirmed' | 'timeout';
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; }
}
const id = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || '';
const containerId = (import.meta.env.VITE_GTM_CONTAINER_ID ?? 'GTM-PG38VX8P').trim();
const useGtm = /^GTM-[A-Z0-9]+$/.test(containerId);
const configured = useGtm || /^G-[A-Z0-9]{6,15}$/.test(id);
const storageKey = 'local-lift-analytics';
let enabled = false;
let started = false;
const allowedLabels = new Set<SafeLabel>(['header','footer','home-hero','home-guide','home-close','about-sample','about-guide','audit-intro','audit-contents','audit-close','guide-close','enquire-aside','enquire-success']);
const knownPages = new Set(['index.html','about.html','audit.html','coverage-checklist.html','enquire.html']);

function safePageLocation(): string {
  const file = location.pathname.split('/').pop() || 'index.html';
  const knownFile = knownPages.has(file) ? file : 'index.html';
  const site = import.meta.env.VITE_SITE_URL || 'https://kapohari2k.github.io/BUSN9155_Codex/';
  return new URL(knownFile === 'index.html' ? '' : knownFile, site).href;
}

function startAnalytics(): void {
  if (!configured || started) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer!.push(arguments); };
  const locationWithoutFormData = safePageLocation();
  // Set safe context before loading Google's library. Never read form contents here.
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  if (useGtm) {
    // Standard GTM startup event. Consent is queued before loading the container.
    window.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  } else {
  window.gtag('js', new Date());
  window.gtag('config', id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: locationWithoutFormData,
    page_referrer: '',
  });
  }
  const script = document.createElement('script');
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.src = useGtm
    ? `https://www.googletagmanager.com/gtm.js?id=${containerId}`
    : `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.append(script);
  sendEvent('page_view', { page_location: locationWithoutFormData, page_referrer: '', page_title: document.title });
}

function sendEvent(name: string, parameters: Record<string, string>): void {
  if (useGtm) {
    window.dataLayer!.push({
      event: name, page_location: safePageLocation(), page_referrer: '', page_title: document.title,
      // Clear event-specific fields so GTM cannot reuse values from a previous event.
      placement: undefined, error_category: undefined, ...parameters,
    });
  } else window.gtag?.('event', name, parameters);
}

export function track(name: EventName, parameters: { placement?: SafeLabel; error_category?: ErrorCategory } = {}): void {
  if (!enabled || !configured) return;
  sendEvent(name, parameters);
}

export function initAnalytics(): void {
  if (!configured) return;
  const preferences = document.querySelector<HTMLButtonElement>('.analytics-preferences');
  if (preferences) preferences.hidden = false;
  const panel = document.createElement('section');
  panel.className = 'analytics-banner';
  panel.setAttribute('aria-labelledby', 'analytics-title');
  panel.innerHTML = '<h2 id="analytics-title">Allow optional analytics?</h2><p>Help understand which pages and next steps are useful. Google Analytics measures general site actions, never your enquiry answers. You can change your choice in the footer.</p><div class="button-group"><button type="button" class="button" data-choice="allow">Allow analytics</button><button type="button" class="text-button" data-choice="decline">Continue without analytics</button></div>';
  let choice: string | null = null;
  try { choice = localStorage.getItem(storageKey); } catch { /* A blocked storage API must not break the site. */ }
  enabled = choice === 'allow';
  panel.hidden = choice === 'allow' || choice === 'decline';
  if (enabled) startAnalytics();
  document.body.append(panel);
  panel.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const allow = button.dataset.choice === 'allow';
      try { localStorage.setItem(storageKey, allow ? 'allow' : 'decline'); } catch { /* Choice remains valid for this page. */ }
      // Keep unsent form answers in memory when changing an analytics preference.
      enabled = allow;
      if (allow) {
        if (started) {
          (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = false;
          window.gtag?.('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
        } else startAnalytics();
      }
      else if (started) {
        (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = true;
        window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
        document.querySelector<HTMLScriptElement>('script[src^="https://www.googletagmanager.com/"]')?.remove();
        // Delete first-party GA cookies available to this origin. Future pages do not load GA.
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim();
          if (/^_ga(?:_|$)/.test(name)) {
            for (const path of ['/', import.meta.env.BASE_URL]) {
              document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
              document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${location.hostname}; SameSite=Lax`;
            }
          }
        });
      }
      panel.hidden = true;
      preferences?.focus({ preventScroll: true });
    });
  });
  preferences?.addEventListener('click', () => {
    panel.hidden = false;
    panel.querySelector<HTMLButtonElement>('[data-choice="decline"]')?.focus();
  });
  document.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLAnchorElement>('a[data-event]');
    if (!target) return;
    const placement = target.dataset.placement as SafeLabel;
    if (!allowedLabels.has(placement)) return;
    const names: Record<string, EventName> = { enquiry: 'enquiry_cta_click', sample: 'sample_select', guide: 'guide_select' };
    const name = names[target.dataset.event || ''];
    if (name) track(name, { placement });
  });
}
