import it from './labels.it';
import en from './labels.en';

export const LABELS = { it, en };

export function detectBrowserLanguage() {
  if (typeof window === 'undefined') return 'en';
  const language = window.navigator?.language?.toLowerCase?.() ?? '';
  return language.startsWith('it') ? 'it' : 'en';
}
