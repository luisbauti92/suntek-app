/**
 * Public catalog aligned with backend `Product` / `InventoryItems`:
 * Name, Sku, PricePerRoll, PricePerMeter, Quantity, Width, Length, UnitType (+ rolls/box,
 * stock splits for UI).
 */
export type CatalogCategory = 'films' | 'tools' | 'accessories';

export const CATEGORIES: CatalogCategory[] = ['films', 'tools', 'accessories'];

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
  /** Kept for data compatibility; not used in the public UI. */
  brand: string;
  /** Optional spec fields, populated once the API provides them. */
  milThickness?: string;
  uvProtection?: string;
  imageUrl?: string | null;
}
