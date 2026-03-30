export type Locale = 'es' | 'en';

export const LOCALE_STORAGE_KEY = 'suntek-locale';

export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(v: string | null): v is Locale {
  return v === 'es' || v === 'en';
}

export function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}
