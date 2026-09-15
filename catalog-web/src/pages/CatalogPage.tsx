import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { CategoryRail } from '../components/CategoryRail';
import { FilterPanel } from '../components/FilterPanel';
import { Navbar } from '../components/Navbar';
import { ProductGrid } from '../components/ProductGrid';
import { useLanguage } from '../contexts/useLanguage';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import type { CatalogCategory } from '../types/catalog';
import {
  availableCategories,
  countActiveFilters,
  filterCatalogProducts,
  type CatalogFilterState,
} from '../utils/catalogFilters';
import { buildWhatsAppUrl } from '../utils/whatsapp';

function initialFilterState(): CatalogFilterState {
  return { search: '', categories: new Set(), priceMin: null, priceMax: null };
}

export function CatalogPage() {
  const { t } = useLanguage();
  const { products, loading, error } = useCatalogProducts();

  const [filter, setFilter] = useState<CatalogFilterState>(initialFilterState);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const setSearch = useCallback((search: string) => {
    setFilter((current) => ({ ...current, search }));
  }, []);

  const toggleCategory = useCallback((category: CatalogCategory) => {
    setFilter((current) => {
      const next = new Set(current.categories);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return { ...current, categories: next };
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setFilter((current) => ({ ...current, categories: new Set() }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter((current) => ({ ...initialFilterState(), search: current.search }));
  }, []);

  /** Used by the empty state: resets search and filters together. */
  const resetAll = useCallback(() => {
    setFilter(initialFilterState());
  }, []);

  const filtered = useMemo(() => filterCatalogProducts(products, filter), [products, filter]);
  const categories = useMemo(() => availableCategories(products), [products]);
  const activeFilters = countActiveFilters(filter);
  const hasSearch = filter.search.trim().length > 0;

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    filtersRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen]);

  const footerWhatsAppUrl = buildWhatsAppUrl(t('whatsapp.generalMessage'));
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-svh flex-col bg-[var(--bg)]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-14 pt-6 md:pt-10">
        <div className="max-w-2xl">
          <h1 className="text-title font-bold text-[var(--text-h)] md:text-display">
            {t('intro.title')}
          </h1>
          <p className="mt-2 text-base text-[var(--text)]">{t('intro.subtitle')}</p>
          <p className="mt-1 text-sm text-[var(--text)] opacity-75">{t('intro.note')}</p>
        </div>

        <div className="mt-5 max-w-2xl">
          <label
            htmlFor="catalog-search"
            className="mb-1.5 block text-xs font-semibold text-[var(--text)]"
          >
            {t('nav.searchLabel')}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text)] opacity-60"
              aria-hidden
            />
            <input
              id="catalog-search"
              type="search"
              value={filter.search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              autoComplete="off"
              className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-12 text-base text-[var(--text)] outline-none focus:border-[var(--secondary)] focus-visible:ring-2 focus-visible:ring-[var(--secondary)]/40"
            />
            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t('search.clear')}
                className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text)] hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {!loading && !error && categories.length > 0 && (
          <div className="mt-4">
            <CategoryRail
              available={categories}
              selected={filter.categories}
              onToggle={toggleCategory}
              onSelectAll={selectAllCategories}
            />
          </div>
        )}

        {!loading && !error && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 className="sr-only">{t('listing.title')}</h2>
            <p aria-live="polite" className="text-sm text-[var(--text)]">
              <span className="font-semibold text-[var(--text-strong)]">
                {t(filtered.length === 1 ? 'search.resultsOne' : 'search.resultsOther', {
                  count: filtered.length,
                })}
              </span>
              {filtered.length !== products.length && (
                <span className="opacity-75">
                  {' · '}
                  {t('search.resultsFiltered', { total: products.length })}
                </span>
              )}
            </p>

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--primary)] underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
              {activeFilters > 0
                ? `${t('filters.open')} (${activeFilters})`
                : t('filters.open')}
            </button>
          </div>
        )}

        {filtersOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setFiltersOpen(false)}
              aria-hidden
            />
            <div
              id="catalog-filters"
              ref={filtersRef}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-2xl border-t border-[var(--border)] bg-white p-4 pb-6 lg:static lg:z-auto lg:mt-4 lg:max-h-none lg:overflow-visible lg:rounded-lg lg:border lg:pb-4"
            >
              <FilterPanel
                priceMin={filter.priceMin}
                priceMax={filter.priceMax}
                onPriceMinChange={(value) =>
                  setFilter((current) => ({ ...current, priceMin: value }))
                }
                onPriceMaxChange={(value) =>
                  setFilter((current) => ({ ...current, priceMax: value }))
                }
                onClear={clearFilters}
                hasActiveFilters={activeFilters > 0}
              />
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--text-h)] lg:hidden"
              >
                {t('filters.close')}
              </button>
            </div>
          </>
        )}

        <div className="mt-4">
          {loading && (
            <div
              className="flex flex-col items-center justify-center gap-3 py-24"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" aria-hidden />
              <span className="text-[var(--text)]">{t('state.loading')}</span>
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center text-red-800"
              role="alert"
            >
              {t('state.error')}
            </div>
          )}

          {!loading && !error && (
            <ProductGrid products={filtered} onReset={resetAll} />
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-3 px-4 text-center">
          <p className="text-sm font-semibold text-[var(--text-h)]">{t('footer.tagline')}</p>
          <a
            href={footerWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--secondary)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            {t('footer.contact')}
          </a>
          <p className="text-xs text-[var(--text)] opacity-75">
            {t('footer.rights', { year: currentYear })}
          </p>
        </div>
      </footer>
    </div>
  );
}
