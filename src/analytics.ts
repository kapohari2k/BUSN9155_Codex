import './consent.css';
import { analyticsConfig, analyticsStorageKey as storageKey } from './analytics-config';

type EventName = 'enquiry_cta_click' | 'sample_select' | 'guide_select' | 'form_start' | 'form_error' | 'generate_lead'
  | 'coverage_check_start' | 'coverage_check_complete';
const allowedLabels = ['header', 'footer', 'home-hero', 'home-guide', 'home-close', 'home-video', 'about-sample', 'about-guide', 'about-enquiry', 'audit-intro', 'audit-report', 'audit-contents', 'audit-close', 'guide-close', 'guide-sample', 'enquire-aside', 'enquire-success', 'report-coverage', 'report-close'] as const;
type SafeLabel = typeof allowedLabels[number];
export type ErrorCategory = 'validation' | 'unavailable' | 'network' | 'service' | 'unconfirmed' | 'timeout';
type EventParameters = { placement?: SafeLabel; error_category?: ErrorCategory };
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; }
}
const { id, containerId, useGtm, validMeasurementId, configured } = analyticsConfig(
  import.meta.env.VITE_GTM_CONTAINER_ID, import.meta.env.VITE_GA4_MEASUREMENT_ID,
);
let enabled = false;
let started = false;
let tagReady = false;
let pageViewSent = false;
let pendingConsent: Record<string, string> | undefined;
const pendingEvents: { name: EventName; parameters: EventParameters }[] = [];
const knownPages = new Set(['index.html','about.html','audit.html','sample-audit.html','coverage-checklist.html','enquire.html']);

function safePageLocation(): string {
  const file = location.pathname.split('/').pop() || 'index.html';
  const knownFile = knownPages.has(file) ? file : 'index.html';
  const site = import.meta.env.VITE_SITE_URL || 'https://kapohari2k.github.io/BUSN9155_Codex/';
  return new URL(knownFile === 'index.html' ? '' : knownFile, site).href;
}

function pageContext(): Record<string, string> {
  return { page_location: safePageLocation(), page_referrer: '', page_title: document.title };
}

function consent(allow: boolean): Record<string, string> {
  return {
    analytics_storage: allow ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  };
}

function startAnalytics(): void {
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer!.push(arguments); };
  // Set safe context before loading Google's library. Never read form contents here.
  const context = pageContext();
  pendingConsent = consent(true);
  window.gtag('consent', 'default', pendingConsent);
  if (useGtm) {
    // The Google tag can read safe page context on startup, before the manual page_view.
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js', ...context });
  } else {
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...context,
    });
  }
  const script = document.createElement('script');
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.src = useGtm
    ? `https://www.googletagmanager.com/gtm.js?id=${containerId}`
    : `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.addEventListener('load', () => {
    tagReady = true;
    pendingConsent = undefined;
    sendPageView();
    for (const { name, parameters } of pendingEvents.splice(0)) track(name, parameters);
  }, { once: true });
  script.addEventListener('error', () => {
    pendingConsent = undefined;
    pendingEvents.length = 0;
  }, { once: true });
  document.head.append(script);
}

function sendEvent(name: string, parameters: Record<string, string>): void {
  if (useGtm) {
    window.dataLayer!.push({
      event: name, ...pageContext(),
      // Clear event-specific fields so GTM cannot reuse values from a previous event.
      placement: undefined, error_category: undefined, ...parameters,
    });
  } else window.gtag?.('event', name, parameters);
}

function sendPageView(): void {
  if (!enabled || !tagReady || pageViewSent) return;
  pageViewSent = true;
  sendEvent('page_view', pageContext());
}

export function track(name: EventName, parameters: EventParameters = {}): void {
  if (!enabled || !configured) return;
  if (tagReady) sendEvent(name, parameters);
  else if (pendingConsent) pendingEvents.push({ name, parameters });
}

function applyChoice(allow: boolean): void {
  if (allow === enabled) return;
  enabled = allow;
  // A GA measurement ID can also be supplied alongside GTM to disable its Google tag.
  if (validMeasurementId) Object.assign(window, { [`ga-disable-${id}`]: !allow });
  if (allow && !started) {
    startAnalytics();
    return;
  }
  if (!started) return;
  // The published GTM tags must require analytics_storage consent. Removing the script
  // element would leave its already-executed code running and could not withdraw consent.
  // While the script is still loading, start with the latest choice instead of a stale grant.
  if (pendingConsent) pendingConsent.analytics_storage = allow ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', consent(allow));
  if (allow) {
    sendPageView();
    return;
  }
  pendingEvents.length = 0;
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (!/^_ga(?:_|$)/.test(name)) continue;
    for (const path of new Set(['/', import.meta.env.BASE_URL])) {
      document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${location.hostname}; SameSite=Lax`;
    }
  }
}

export function initAnalytics(): void {
  const panel = document.querySelector<HTMLElement>('#analytics-choices');
  if (!configured || !panel) return;
  const preferences = document.querySelector<HTMLButtonElement>('.analytics-preferences');
  const main = document.querySelector<HTMLElement>('main');
  const heading = panel.querySelector<HTMLElement>('#analytics-title')!;
  const close = panel.querySelector<HTMLButtonElement>('.analytics-close')!;
  let choice: string | null = null;
  let openedFromFooter = false;
  try { choice = localStorage.getItem(storageKey); } catch { /* A blocked storage API must not break the site. */ }
  const hasChoice = (): boolean => choice === 'allow' || choice === 'decline';
  applyChoice(choice === 'allow');
  panel.hidden = hasChoice();

  const closePanel = (): void => {
    if (openedFromFooter) {
      openedFromFooter = false;
      preferences?.setAttribute('aria-expanded', 'false');
      preferences?.focus();
      close.hidden = true;
      panel.hidden = hasChoice();
      if (main) main.before(panel);
    } else {
      if (panel.contains(document.activeElement)) main?.focus({ preventScroll: true });
      panel.hidden = hasChoice();
    }
  };

  panel.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(button => {
    button.addEventListener('click', () => {
      choice = button.dataset.choice === 'allow' ? 'allow' : 'decline';
      try { localStorage.setItem(storageKey, choice); } catch { /* Choice remains valid for this page. */ }
      applyChoice(choice === 'allow');
      closePanel();
    });
  });
  if (preferences) {
    preferences.hidden = false;
    preferences.setAttribute('aria-controls', panel.id);
    preferences.setAttribute('aria-expanded', 'false');
    preferences.addEventListener('click', () => {
      if (openedFromFooter) {
        closePanel();
        return;
      }
      openedFromFooter = true;
      preferences.setAttribute('aria-expanded', 'true');
      preferences.closest('footer')?.after(panel);
      close.hidden = false;
      panel.hidden = false;
      heading.focus();
    });
  }
  close.addEventListener('click', closePanel);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openedFromFooter) closePanel();
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    if (event.storageArea !== localStorage) return;
    choice = event.newValue;
    applyChoice(choice === 'allow');
    if (!openedFromFooter) closePanel();
  });
  document.addEventListener('click', event => {
    const target = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[data-event]');
    if (!target) return;
    const placement = target.dataset.placement as SafeLabel;
    if (!allowedLabels.includes(placement)) return;
    const names: Record<string, EventName> = { enquiry: 'enquiry_cta_click', sample: 'sample_select', guide: 'guide_select' };
    const name = names[target.dataset.event || ''];
    if (name) track(name, { placement });
  });
}
