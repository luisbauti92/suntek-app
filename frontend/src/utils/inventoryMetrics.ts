import type { InventoryItemDto } from '../api/client';

const LOW_STOCK_THRESHOLD = 10;

export function totalWarehouseRolls(item: InventoryItemDto): number {
  return item.wholesaleQuantity * item.rollsPerBox;
}

export function isMetersUnit(item: InventoryItemDto): boolean {
  return item.unitType === 'Meters' || item.unitType === 0;
}

/** Approximate retail stock value in Bs (Bolívares). */
export function estimateInventoryValueBs(items: InventoryItemDto[]): number {
  let sum = 0;
  for (const i of items) {
    if (isMetersUnit(i)) {
      sum += Number(i.retailQuantity) * Number(i.pricePerMeter);
    } else {
      sum += Number(i.retailQuantity) * Number(i.pricePerRoll);
    }
  }
  return sum;
}

/** Share of SKUs with warehouse rolls at or above threshold (0–100). */
export function stockHealthPercent(items: InventoryItemDto[]): number {
  if (items.length === 0) return 100;
  const ok = items.filter((i) => totalWarehouseRolls(i) >= LOW_STOCK_THRESHOLD).length;
  return Math.round((ok / items.length) * 100);
}

/** SKUs with warehouse stock below threshold (includes out of stock). */
export function lowStockAlertCount(items: InventoryItemDto[]): number {
  return items.filter((i) => totalWarehouseRolls(i) < LOW_STOCK_THRESHOLD).length;
}

export type WarehouseStockLevel = 'full' | 'low' | 'out';

export function warehouseStockLevel(item: InventoryItemDto): WarehouseStockLevel {
  const rolls = totalWarehouseRolls(item);
  if (rolls <= 0) return 'out';
  if (rolls < LOW_STOCK_THRESHOLD) return 'low';
  return 'full';
}

export type StorefrontStockLevel = 'full' | 'low' | 'out';

export function storefrontStockLevel(item: InventoryItemDto): StorefrontStockLevel {
  const q = Number(item.retailQuantity);
  if (q <= 0) return 'out';
  if (q < LOW_STOCK_THRESHOLD) return 'low';
  return 'full';
}

export { LOW_STOCK_THRESHOLD };
