import { useLanguage } from '../contexts/useLanguage';
import type { CatalogProduct } from '../types/catalog';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: CatalogProduct[];
  onReset: () => void;
}

export function ProductGrid({ products, onReset }: ProductGridProps) {
  const { t } = useLanguage();

  if (products.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] px-6 py-20 text-center"
        role="status"
      >
        <p className="text-lg font-semibold text-[var(--text-h)]">{t('state.emptyTitle')}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text)]">{t('state.emptyBody')}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          {t('state.emptyAction')}
        </button>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
