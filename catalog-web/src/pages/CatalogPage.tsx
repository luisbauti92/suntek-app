import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { CatalogHero } from '../components/CatalogHero';
import { CategoryRail } from '../components/CategoryRail';
import { FilterPanel } from '../components/FilterPanel';
import { Navbar } from '../components/Navbar';
import { Pagination } from '../components/Pagination';
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
import { PAGE_SIZE, pageCount } from '../utils/pagination';
import { buildWhatsAppUrl } from '../utils/whatsapp';

function initialFilterState(): CatalogFilterState {
  return { search: '', categories: new Set(), priceMin: null, priceMax: null };
}

export function CatalogPage() {
  const { t } = useLanguage();
  const { products, loading, error } = useCatalogProducts();

  const [filter, setFilter] = useState<CatalogFilterState>(initialFilterState);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const shouldScrollRef = useRef(false);

  /**
   * Every filter/search mutation goes through here, so "any filter change resets to page 1" is
   * guaranteed in one place instead of being repeated (and forgotten) in each handler.
   */
  const updateFilter = useCallback(
    (updater: (current: CatalogFilterState) => CatalogFilterState) => {
      setFilter(updater);
      setPage(1);
    },
    []
  );

  const setSearch = useCallback(
    (search: string) => updateFilter((current) => ({ ...current, search })),
    [updateFilter]
  );

  const toggleCategory = useCallback(
    (category: CatalogCategory) =>
      updateFilter((current) => {
        const next = new Set(current.categories);
        if (next.has(category)) next.delete(category);
        else next.add(category);
        return { ...current, categories: next };
      }),
    [updateFilter]
  );

  const selectAllCategories = useCallback(
    () => updateFilter((current) => ({ ...current, categories: new Set() })),
    [updateFilter]
  );

  const clearFilters = useCallback(
    () => updateFilter((current) => ({ ...initialFilterState(), search: current.search })),
    [updateFilter]
  );

  /** Used by the empty state: resets search and filters together. */
  const resetAll = useCallback(() => updateFilter(initialFilterState), [updateFilter]);

  const filtered = useMemo(() => filterCatalogProducts(products, filter), [products, filter]);
  const categories = useMemo(() => availableCategories(products), [products]);
  const activeFilters = countActiveFilters(filter);
  const hasSearch = filter.search.trim().length > 0;

  const totalPages = pageCount(filtered.length);
  /** Clamp defensively: a shrinking result set can never leave the user on an empty page. */
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  /** Page changes only happen through the pager, so this is the only path that moves the view. */
  const goToPage = useCallback(
    (next: number) => {
      if (next === currentPage || next < 1 || next > totalPages) return;
      shouldScrollRef.current = true;
      setPage(next);
    },
    [currentPage, totalPages]
  );

  useEffect(() => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    const results = resultsRef.current;
    if (!results) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    results.focus({ preventScroll: true });
  }, [currentPage]);

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

  const categoryProps = { available: categories, selected: filter.categories, onToggle: toggleCategory, onSelectAll: selectAllCategories };
  const filterFields = <div className="filter-content">
    <CategoryRail {...categoryProps} variant="filters" />
    <FilterPanel priceMin={filter.priceMin} priceMax={filter.priceMax}
      onPriceMinChange={value => updateFilter(current => ({ ...current, priceMin:value }))}
      onPriceMaxChange={value => updateFilter(current => ({ ...current, priceMax:value }))}
      onClear={clearFilters} hasActiveFilters={activeFilters > 0} />
  </div>;
  const searchField = <div className="catalog-search">
    <label className="sr-only" htmlFor="catalog-search">{t('nav.searchLabel')}</label><Search aria-hidden />
    <input id="catalog-search" ref={searchInputRef} type="search" value={filter.search}
      onChange={event => setSearch(event.target.value)} placeholder={t('nav.searchPlaceholder')} autoComplete="off" />
    {hasSearch && <button type="button" onClick={() => setSearch('')} aria-label={t('search.clear')}><X aria-hidden /></button>}
  </div>;
  return <div className="catalog-shell">
    <a href="#catalog" className="skip-link">{t('nav.skip')}</a>
    <Navbar search={searchField} />
    <CatalogHero />
    <CategoryRail {...categoryProps} />
    <main id="catalog" className="catalog-layout">
      <aside className="desktop-filters" aria-label={t('filters.title')}><h2>{t('filters.title')}</h2>{filterFields}</aside>
      <section ref={resultsRef} tabIndex={-1} aria-labelledby="listing-heading" className="catalog-results">
        <h2 id="listing-heading" className="sr-only">{t('listing.title')}</h2>
        {!loading && !error && <div className="catalog-toolbar">
          <p aria-live="polite"><strong>{t(filtered.length === 1 ? 'search.resultsOne' : 'search.resultsOther',{ count:filtered.length })}</strong>
            {filtered.length !== products.length && <span> · {t('search.resultsFiltered',{ total:products.length })}</span>}
          </p>
          <button type="button" className="filter-toggle" onClick={() => setFiltersOpen(open => !open)}
            aria-expanded={filtersOpen} aria-controls="catalog-filters"><SlidersHorizontal size={17} aria-hidden />
            {t('filters.open')}{activeFilters > 0 && ` (${activeFilters})`}
          </button>
        </div>}
        {filtersOpen && <div id="catalog-filters" ref={filtersRef} className="mobile-filters">
          {filterFields}<button type="button" className="close-filters" onClick={() => setFiltersOpen(false)}>{t('filters.close')}</button>
        </div>}
        {loading && <div className="catalog-loading" role="status" aria-live="polite"><Loader2 className="animate-spin" aria-hidden /><span>{t('state.loading')}</span></div>}
        {error && !loading && <div className="catalog-error" role="alert">{t('state.error')}</div>}
        {!loading && !error && <><ProductGrid products={visibleProducts} onReset={resetAll} />
          {filtered.length > PAGE_SIZE && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />}
        </>}
      </section>
    </main>
    <footer className="catalog-footer"><p>{t('footer.tagline')}</p>
      <a href={footerWhatsAppUrl} target="_blank" rel="noopener noreferrer">{t('footer.contact')}</a>
      <p>{t('footer.rights', { year:currentYear })}</p>
    </footer>
  </div>;
}
