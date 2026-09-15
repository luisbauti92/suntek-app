import { CATEGORIES, type CatalogCategory, type CatalogProduct } from '../types/catalog';

export interface CatalogFilterState {
  search: string;
  /** Empty = all categories */
  categories: Set<CatalogCategory>;
  priceMin: number | null;
  priceMax: number | null;
}

function norm(value: string): string {
  return value.trim().toLowerCase();
}

/** Reference price for the range filter: roll price if > 0, else meter, else 0 */
function catalogListPrice(product: CatalogProduct): number {
  if (product.pricePerRoll > 0) return product.pricePerRoll;
  if (product.pricePerMeter > 0) return product.pricePerMeter;
  return 0;
}

export function filterCatalogProducts(
  products: CatalogProduct[],
  filter: CatalogFilterState
): CatalogProduct[] {
  const query = norm(filter.search);

  return products.filter((product) => {
    if (
      query &&
      !product.name.toLowerCase().includes(query) &&
      !product.sku.toLowerCase().includes(query)
    ) {
      return false;
    }
    if (filter.categories.size > 0 && !filter.categories.has(product.category)) return false;

    const listPrice = catalogListPrice(product);
    if (filter.priceMin != null && listPrice < filter.priceMin) return false;
    if (filter.priceMax != null && listPrice > filter.priceMax) return false;

    return true;
  });
}

/** Only the categories that actually have products in the loaded data. */
export function availableCategories(products: CatalogProduct[]): CatalogCategory[] {
  const present = new Set(products.map((product) => product.category));
  return CATEGORIES.filter((category) => present.has(category));
}

export function countActiveFilters(filter: CatalogFilterState): number {
  let count = filter.categories.size;
  if (filter.priceMin != null) count += 1;
  if (filter.priceMax != null) count += 1;
  return count;
}
