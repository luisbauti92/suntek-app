import { useLanguage } from '../contexts/useLanguage';
import { LOCALES, type Locale } from '../i18n/locales';

const LABELS: Record<Locale, string> = { es: 'ES', en: 'EN' };

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-white p-0.5"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
              active
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text)] hover:bg-[var(--surface-muted)]'
            }`}
          >
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
