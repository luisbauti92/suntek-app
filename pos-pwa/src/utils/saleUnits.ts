import type { ProductDto, SaleMode, SaleType } from '../types';
import { formatNumber } from './formatBs';

/**
 * Single source of truth for how a sale line is priced and how much stock it deducts.
 *
 * Extracted verbatim from the unit-selection flow so the mobile sheet and the desktop
 * ticket rail cannot drift apart. The formulas here are the existing business rules and
 * must not change as part of a UI redesign.
 */

export function isMetersProduct(product: Pick<ProductDto, 'unitType'>): boolean {
  return product.unitType === 'Meters' || product.unitType === 0;
}

/** A product sold by the unit: not measured, and not packed more than one to a box. */
export function isAccessoryProduct(
  product: Pick<ProductDto, 'unitType' | 'rollsPerBox'>
): boolean {
  return !isMetersProduct(product) && product.rollsPerBox <= 1;
}

/** Units an operator may sell this product in. */
export function availableModes(product: ProductDto): SaleMode[] {
  return isAccessoryProduct(product) ? ['unit'] : ['meter', 'roll', 'box'];
}

/** The unit a product is added in when the operator just clicks it. */
export function defaultMode(product: ProductDto): SaleMode {
  return isAccessoryProduct(product) ? 'unit' : 'meter';
}

/** Long label for unit switchers and buttons. */
export function modeLabel(mode: SaleMode): string {
  switch (mode) {
    case 'meter':
      return 'Metro';
    case 'roll':
      return 'Rollo';
    case 'box':
      return 'Caja';
    case 'unit':
      return 'Unidad';
  }
}

/** Short suffix shown next to a quantity. */
export function modeUnitShort(mode: SaleMode): string {
  switch (mode) {
    case 'meter':
      return 'mt';
    case 'roll':
      return 'rollo';
    case 'box':
      return 'caja';
    case 'unit':
      return 'un';
  }
}

/**
 * Canonical unit token the API persists for a mode. These names must match the backend
 * `SoldUnit` enum, which is how the sale records what it was actually sold in.
 */
export function soldUnitToken(mode: SaleMode): 'Meters' | 'Rolls' | 'Boxes' | 'Units' {
  switch (mode) {
    case 'meter':
      return 'Meters';
    case 'roll':
      return 'Rolls';
    case 'box':
      return 'Boxes';
    case 'unit':
      return 'Units';
  }
}

/** Display suffix for a line, e.g. "3 mt" or "0,50 mt". */
export function describeQuantity(quantity: number, unitShort: string): string {
  const decimals = Number.isInteger(quantity) ? 0 : 2;
  return `${formatNumber(quantity, decimals)} ${unitShort}`;
}

export interface ResolvedSaleLine {
  unitPrice: number;
  saleType: SaleType;
  deductedQuantity: number;
  unitLabel: string;
  subtotal: number;
}

export function resolveSaleLine(
  product: ProductDto,
  mode: SaleMode,
  quantity: number
): ResolvedSaleLine {
  let unitPrice = 0;
  let saleType: SaleType = 'Retail';
  let deductedQuantity = quantity;
  let unitLabel = 'mt';

  if (mode === 'meter') {
    unitPrice = product.pricePerMeter;
    saleType = 'Retail';
    deductedQuantity = quantity;
    unitLabel = 'mt';
  } else if (mode === 'roll') {
    unitPrice = product.pricePerRoll;
    if (product.rollsPerBox === 1) {
      saleType = 'Wholesale';
      deductedQuantity = quantity;
      unitLabel = 'rollo';
    } else {
      saleType = 'Retail';
      deductedQuantity = quantity * (product.length > 0 ? product.length : 1);
      unitLabel = 'rollo';
    }
  } else if (mode === 'box') {
    unitPrice = product.pricePerRoll * (product.rollsPerBox > 0 ? product.rollsPerBox : 1);
    saleType = 'Wholesale';
    deductedQuantity = quantity;
    unitLabel = 'caja';
  } else if (mode === 'unit') {
    unitPrice = product.pricePerRoll > 0 ? product.pricePerRoll : product.pricePerMeter;
    saleType = 'Retail';
    deductedQuantity = quantity;
    unitLabel = 'un';
  }

  const subtotal = quantity * unitPrice;

  return {
    unitPrice,
    saleType,
    deductedQuantity,
    unitLabel,
    subtotal: Number(subtotal.toFixed(2)),
  };
}
