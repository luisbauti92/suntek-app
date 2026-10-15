import { useLanguage } from '../contexts/useLanguage';
import type { Locale } from '../i18n/locales';
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  return <label className="language-select"><span className="sr-only">{t('language.label')}</span>
    <select value={locale} onChange={e => setLocale(e.target.value as Locale)}>
      <option value="es">ES</option><option value="en">EN</option>
    </select>
  </label>;
}
