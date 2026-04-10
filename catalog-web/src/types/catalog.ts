/**
 * Public catalog aligned with backend `Product` / `InventoryItems`:
 * Name, Sku, PricePerRoll, PricePerMeter, Quantity, Width, Length, UnitType (+ rolls/box, stock splits for UI).
 */
export type CatalogCategory = 'films' | 'tools' | 'accessories';

export type UnitType = 'Meters' | 'Units' | 0 | 1;

export interface CatalogProduct {
  id: number;
  sku: string;
  name: string;
  pricePerRoll: number;
  pricePerMeter: number;
  /** Backend `Quantity` (e.g. cajas / unidades según dominio). */
  quantity: number;
  width: number;
  length: number;
  unitType: UnitType;
  rollsPerBox: number;
  wholesaleQuantity: number;
  retailQuantity: number;
  category: CatalogCategory;
  /** Sidebar filter + badge grouping. */
  brand: string;
  /** Optional marketing / spec chips (simulated until API provides them). */
  milThickness?: string;
  uvProtection?: string;
  imageUrl?: string | null;
}

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  films: 'Window films',
  tools: 'Tools',
  accessories: 'Accessories',
};
