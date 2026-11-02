import './styles.css';
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
if (menu && navigation) {
  const mobile = window.matchMedia('(max-width: 800px)');
  let expanded = false;
  const syncMenu = (): void => {
    menu.hidden = !mobile.matches;
    navigation.hidden = mobile.matches && !expanded;
    menu.setAttribute('aria-expanded', String(mobile.matches && expanded));
    menu.querySelector('span')!.textContent = expanded && mobile.matches ? 'Close' : 'Menu';
  };
  menu.addEventListener('click', () => { expanded = !expanded; syncMenu(); });
  mobile.addEventListener('change', () => { expanded = false; syncMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) { expanded = false; syncMenu(); menu.focus(); }
  });
  syncMenu();
}
const printButton = document.querySelector<HTMLButtonElement>('.print-guide');
if (printButton) { printButton.hidden = false; printButton.addEventListener('click', () => window.print()); }

initIcons();
initAnalytics();
initForm();
