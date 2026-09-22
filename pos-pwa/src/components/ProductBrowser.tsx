import { Search, X } from 'lucide-react';
import type { CategoryFilter, ProductDto } from '../types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductBrowserProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  products: ProductDto[];
  loading: boolean;
  onSelectProduct: (product: ProductDto) => void;
}

const CATEGORIES: CategoryFilter[] = ['all', 'Polarizados', 'Vinilos', 'Accesorios'];

export function ProductBrowser({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  products,
  loading,
  onSelectProduct,
}: ProductBrowserProps) {
  const hasQuery = searchQuery.trim().length > 0;
  const hasFilter = hasQuery || selectedCategory !== 'all';

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950">
      <div className="shrink-0 space-y-2.5 border-b border-zinc-800 bg-zinc-900/60 p-3">
        <div className="relative">
          <label htmlFor="pos-product-search" className="sr-only">
            Buscar producto por nombre o SKU
          </label>
          <input
            id="pos-product-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar vinil, polarizado, SKU"
            autoComplete="off"
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/90 py-2.5 pl-9 pr-12 text-base text-white placeholder:text-zinc-400 transition focus:border-[#0038a8] focus:outline-none focus:ring-2 focus:ring-[#0038a8] sm:text-xs md:pr-9"
          />
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-300 transition hover:text-white md:right-1 md:h-8 md:w-8"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <div role="group" aria-label="Categoría" className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoryChange(cat)}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-bold transition active:scale-95 md:min-h-9 ${
                  active
                    ? 'bg-white text-zinc-950'
                    : 'border border-zinc-700/50 bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="@container min-h-0 flex-1 overflow-y-auto p-3">
        <p aria-live="polite" className="sr-only">
          {loading ? 'Cargando productos' : `${products.length} productos`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 gap-2 @md:grid-cols-2 @5xl:grid-cols-3">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : products.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-zinc-200">
              {hasFilter ? 'Sin resultados' : 'Sin productos activos'}
            </p>
            <p className="mt-1.5 text-xs text-zinc-400">
              {hasQuery
                ? 'Ningún producto coincide con esa búsqueda.'
                : hasFilter
                  ? 'Ningún producto de esta categoría está activo.'
                  : 'No hay productos activos en el inventario todavía.'}
            </p>
            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onCategoryChange('all');
                }}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 @md:grid-cols-2 @5xl:grid-cols-3">
            {products.map((product) => (
              <li key={product.id} className="min-w-0">
                <ProductCard product={product} onSelect={onSelectProduct} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
