import './styles.css';
import './service.css';
import './navigation.css';
import './report.css';
import sansUrl from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';
import serifUrl from '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2?url';
import italicUrl from '@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2?url';
import faviconUrl from './assets/mark.svg';
import { initAnalytics } from './analytics';
import { initForm } from './form';
import { initIcons } from './icons';

const fontStyle = document.createElement('style');
fontStyle.textContent = `@font-face{font-family:Manrope;src:url("${sansUrl}") format("woff2");font-weight:200 800;font-style:normal;font-display:swap}@font-face{font-family:Newsreader;src:url("${serifUrl}") format("woff2");font-weight:200 800;font-style:normal;font-display:swap}@font-face{font-family:Newsreader;src:url("${italicUrl}") format("woff2");font-weight:200 800;font-style:italic;font-display:swap}`;
document.head.append(fontStyle);
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/svg+xml';
favicon.href = faviconUrl;
document.head.append(favicon);

const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const navigation = document.querySelector<HTMLElement>('#primary-nav');
const header = document.querySelector<HTMLElement>('.site-header');
if (menu && navigation && header) {
  const mobile = window.matchMedia('(max-width: 800px)');
  let expanded = false;
  const syncMenu = (): void => {
    menu.hidden = !mobile.matches;
    navigation.hidden = mobile.matches && !expanded;
    menu.setAttribute('aria-expanded', String(mobile.matches && expanded));
    menu.querySelector('span')!.textContent = expanded && mobile.matches ? 'Close' : 'Menu';
  };
  menu.addEventListener('click', () => { expanded = !expanded; syncMenu(); });
  navigation.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!expanded || !link ||
        event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    expanded = false;
    syncMenu();
    if (link.hash && link.pathname === window.location.pathname) {
      document.getElementById(decodeURIComponent(link.hash.slice(1)))?.focus({ preventScroll: true });
    }
  });
  document.addEventListener('pointerdown', event => {
    if (expanded && event.target instanceof Node && !header.contains(event.target)) {
      expanded = false;
      syncMenu();
    }
  });
  header.addEventListener('focusout', event => {
    if (expanded && event.relatedTarget instanceof Node && !header.contains(event.relatedTarget)) {
      expanded = false;
      syncMenu();
    }
  });
  mobile.addEventListener('change', () => { expanded = false; syncMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) { expanded = false; syncMenu(); menu.focus(); }
  });
  syncMenu();
  const setHeaderOffset = (): void => {
    document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
  };
  header.classList.add('site-header-ready');
  setHeaderOffset();
  new ResizeObserver(setHeaderOffset).observe(header);
}
const printButton = document.querySelector<HTMLButtonElement>('.print-guide');
if (printButton) { printButton.hidden = false; printButton.addEventListener('click', () => window.print()); }

initIcons();
initAnalytics();
initForm();
