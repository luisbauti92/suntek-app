import { useLanguage } from '../contexts/LanguageContext';
import type { Locale } from '../i18n/locales';

const options: { code: Locale; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

interface LanguageSwitcherProps {
  /** Más discreto en cabeceras densas */
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      className={compact ? 'inline-flex items-center gap-1' : 'inline-flex flex-col gap-1'}
      role="group"
      aria-label={t('common.language')}
    >
      {!compact && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t('common.language')}
        </span>
      )}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {options.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              locale === code
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
