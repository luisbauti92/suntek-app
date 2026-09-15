import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales';
import { translate, type TranslateFn } from '../i18n/messages';

export interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;

  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => undefined,
    t: (key, params) => translate(DEFAULT_LOCALE, key, params),
  };
}
