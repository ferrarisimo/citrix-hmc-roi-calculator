import it from './labels.it';
import en from './labels.en';
import es from './labels.es';

export const LABELS = { it, en, es };

export function detectBrowserLanguage() {
  if (typeof window === 'undefined') return 'en';
  const language = window.navigator?.language?.toLowerCase?.() ?? '';
  if (language.startsWith('it')) return 'it';
  if (language.startsWith('es')) return 'es';
  return 'en';
}
