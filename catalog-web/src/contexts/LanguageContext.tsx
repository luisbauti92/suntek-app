import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { htmlLang, readStoredLocale, storeLocale, type Locale } from '../i18n/locales';
import { translate } from '../i18n/messages';
import { LanguageContext, type LanguageContextValue } from './useLanguage';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
    storeLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
