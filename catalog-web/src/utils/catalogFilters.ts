import type { CatalogCategory, CatalogProduct } from '../types/catalog';

export interface CatalogFilterState {
  search: string;
  /** Empty = all categories */
  categories: Set<CatalogCategory>;
  /** Empty = all brands */
  brands: Set<string>;
  priceMin: number | null;
  priceMax: number | null;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Reference price for range filter: roll price if &gt; 0, else meter, else 0 */
export function catalogListPrice(p: CatalogProduct): number {
  if (p.pricePerRoll > 0) return p.pricePerRoll;
  if (p.pricePerMeter > 0) return p.pricePerMeter;
  return 0;
}

export function filterCatalogProducts(
  products: CatalogProduct[],
  f: CatalogFilterState
): CatalogProduct[] {
  const q = norm(f.search);
  return products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) {
      return false;
    }
    if (f.categories.size > 0 && !f.categories.has(p.category)) return false;
    if (f.brands.size > 0 && !f.brands.has(p.brand)) return false;
    const list = catalogListPrice(p);
    if (f.priceMin != null && list < f.priceMin) return false;
    if (f.priceMax != null && list > f.priceMax) return false;
    return true;
  });
}

export function uniqueBrands(products: CatalogProduct[]): string[] {
  return [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
}
