export type Locale = 'es' | 'en';

export const LOCALES: Locale[] = ['es', 'en'];

export const DEFAULT_LOCALE: Locale = 'es';

const STORAGE_KEY = 'suntek-catalog-locale';

export function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'es' || raw === 'en') return raw;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LOCALE;
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable */
  }
}

/** Value for `document.documentElement.lang`. */
export function htmlLang(locale: Locale): string {
  return locale === 'es' ? 'es-BO' : 'en';
}
