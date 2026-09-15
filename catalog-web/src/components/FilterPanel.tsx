import { useLanguage } from '../contexts/useLanguage';

interface FilterPanelProps {
  priceMin: number | null;
  priceMax: number | null;
  onPriceMinChange: (value: number | null) => void;
  onPriceMaxChange: (value: number | null) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const inputClass =
  'min-h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--secondary)] focus-visible:ring-2 focus-visible:ring-[var(--secondary)]/40';

export function FilterPanel({
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onClear,
  hasActiveFilters,
}: FilterPanelProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-h)]">
          {t('filters.title')}
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-[var(--secondary)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            {t('filters.clear')}
          </button>
        )}
      </div>

      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-xs font-semibold text-[var(--text)]">
          {t('filters.price')}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text)]">{t('filters.priceMin')}</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
              value={priceMin ?? ''}
              onChange={(event) => {
                const raw = event.target.value;
                onPriceMinChange(raw === '' ? null : Number(raw));
              }}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text)]">{t('filters.priceMax')}</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="—"
              value={priceMax ?? ''}
              onChange={(event) => {
                const raw = event.target.value;
                onPriceMaxChange(raw === '' ? null : Number(raw));
              }}
              className={inputClass}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-[var(--text)] opacity-80">{t('filters.priceHint')}</p>
      </fieldset>
    </div>
  );
}
