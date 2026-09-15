import { useLanguage } from '../contexts/useLanguage';
import type { CatalogCategory } from '../types/catalog';

interface CategoryRailProps {
  /** Only the categories actually present in the loaded data. */
  available: CatalogCategory[];
  selected: Set<CatalogCategory>;
  onToggle: (category: CatalogCategory) => void;
  onSelectAll: () => void;
}

function pillClass(active: boolean): string {
  return [
    'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-semibold transition',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]',
    active
      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
      : 'border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--border-strong)] hover:text-[var(--text-h)]',
  ].join(' ');
}

export function CategoryRail({
  available,
  selected,
  onToggle,
  onSelectAll,
}: CategoryRailProps) {
  const { t } = useLanguage();

  // A rail with a single real category carries no information: "Todos / Películas" is noise.
  if (available.length <= 1) return null;

  const allActive = selected.size === 0;

  return (
    <nav aria-label={t('categories.title')}>
      <ul className="custom-scrollbar flex gap-2 overflow-x-auto pb-2">
        <li>
          <button
            type="button"
            aria-pressed={allActive}
            onClick={onSelectAll}
            className={pillClass(allActive)}
          >
            {t('categories.all')}
          </button>
        </li>
        {available.map((category) => {
          const active = selected.has(category);
          return (
            <li key={category}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(category)}
                className={pillClass(active)}
              >
                {t(`categories.${category}`)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
