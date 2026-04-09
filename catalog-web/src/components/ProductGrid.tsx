import type { CatalogProduct } from '../types/catalog';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: CatalogProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-[var(--secondary)]/40 bg-[var(--secondary-soft)] px-6 py-20 text-center"
        role="status"
      >
        <p className="text-lg font-semibold text-[var(--text-h)]">Sin resultados</p>
        <p className="mt-2 text-sm text-[var(--text)]">
          Ajusta los filtros o busca por otro nombre o SKU.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
