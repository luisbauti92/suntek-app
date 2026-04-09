import { useCallback, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FilterSidebar } from '../components/FilterSidebar';
import { Navbar } from '../components/Navbar';
import { ProductGrid } from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import type { CatalogCategory } from '../types/catalog';
import {
  type CatalogFilterState,
  filterCatalogProducts,
} from '../utils/catalogFilters';

function initialFilterState(): CatalogFilterState {
  return {
    search: '',
    categories: new Set(),
    brands: new Set(),
    priceMin: null,
    priceMax: null,
  };
}

export function CatalogPage() {
  const { products, loading, error } = useCatalogProducts();
  const [filter, setFilter] = useState<CatalogFilterState>(initialFilterState);

  const setSearch = useCallback((search: string) => {
    setFilter((f) => ({ ...f, search }));
  }, []);

  const toggleCategory = useCallback((c: CatalogCategory) => {
    setFilter((f) => {
      const next = new Set(f.categories);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { ...f, categories: next };
    });
  }, []);

  const toggleBrand = useCallback((b: string) => {
    setFilter((f) => {
      const next = new Set(f.brands);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return { ...f, brands: next };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilter((f) => ({
      ...initialFilterState(),
      search: f.search,
    }));
  }, []);

  const filtered = useMemo(
    () => filterCatalogProducts(products, filter),
    [products, filter]
  );

  const sidebar = (
    <FilterSidebar
      allProducts={products}
      selectedCategories={filter.categories}
      onToggleCategory={toggleCategory}
      selectedBrands={filter.brands}
      onToggleBrand={toggleBrand}
      priceMin={filter.priceMin}
      priceMax={filter.priceMax}
      onPriceMinChange={(v) => setFilter((f) => ({ ...f, priceMin: v }))}
      onPriceMaxChange={(v) => setFilter((f) => ({ ...f, priceMax: v }))}
      onClearFilters={clearFilters}
    />
  );

  return (
    <div className="catalog-bg min-h-svh text-[var(--text)]">
      <Navbar searchQuery={filter.search} onSearchChange={setSearch} />

      <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 md:pt-10">
        <div className="mb-8 flex flex-col gap-2 md:mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-h)] md:text-4xl">
            Catálogo de productos
          </h1>
          <p className="max-w-2xl text-sm text-[var(--text)] md:text-base">
            Películas y herramientas para instalación profesional. Precios referenciales en bolivianos
            (BOB). Consulta stock y precio final por WhatsApp.
          </p>
        </div>

        {loading && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-28"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" aria-hidden />
            <span className="text-[var(--text)]">Cargando catálogo…</span>
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <div className="lg:hidden">{sidebar}</div>
            <div className="hidden w-72 shrink-0 lg:block">{sidebar}</div>
            <div className="min-w-0 flex-1">
              <p className="mb-4 text-sm text-[var(--text)]">
                <span className="font-semibold text-[var(--text-h)]">{filtered.length}</span>
                {filtered.length === 1 ? ' producto' : ' productos'}
                {filtered.length !== products.length && (
                  <span className="opacity-75"> · filtrado de {products.length}</span>
                )}
              </p>
              <ProductGrid products={filtered} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10 text-center text-xs text-[var(--text)]">
        © {new Date().getFullYear()} Importadora SUNTEK · Películas y herramientas
      </footer>
    </div>
  );
}
