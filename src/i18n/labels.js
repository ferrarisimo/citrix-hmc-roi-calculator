import it from './labels.it';
import en from './labels.en';
import es from './labels.es';
import de from './labels.de';

export const LABELS = { it, en, es, de };

export function detectBrowserLanguage() {
  if (typeof window === 'undefined') return 'en';
  const language = window.navigator?.language?.toLowerCase?.() ?? '';
  if (language.startsWith('it')) return 'it';
  if (language.startsWith('es')) return 'es';
  if (language.startsWith('de')) return 'de';
  return 'en';
}
