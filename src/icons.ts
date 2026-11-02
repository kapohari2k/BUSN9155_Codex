const paths: Record<string, string> = {
  '↗': '<path d="M5 19 19 5M5 5h14v14"/>',
  '→': '<path d="M3 12h17m-6-6 6 6-6 6"/>',
  '↓': '<path d="M12 3v17m-6-6 6 6 6-6"/>',
  '↔': '<path d="M3 12h18M8 7l-5 5 5 5m8-10 5 5-5 5"/>',
  '↳': '<path d="M5 3v14h15m-6-6 6 6-6 6"/>',
  '✓': '<path d="m5 12 4 4L19 6"/>',
  '✳': '<path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5"/>',
};
export function iconMarkup(symbol: string): string {
  return `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[symbol] || ''}</svg>`;
}
export function initIcons(): void {
  document.querySelectorAll<HTMLElement>('[aria-hidden="true"]').forEach(element => {
    const text = element.textContent?.trim() || '';
    if (paths[text]) element.innerHTML = iconMarkup(text);
  });
}
