export type UnitType = 'Meters' | 'Units' | number;

export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  length: number;
  width: number;
  pricePerRoll: number;
  pricePerMeter: number;
  rollsPerBox: number;
  unitType: UnitType;
  wholesaleQuantity: number;
  retailQuantity: number;
  status: number;
  createdAt: string;
}

export type SaleType = 'Wholesale' | 'Retail';

/** Presentation buckets the POS filters by today. Derived from the product name, not an API field. */
export type CategoryFilter = 'all' | 'Polarizados' | 'Vinilos' | 'Accesorios';

/** The unit a line is sold in. Drives price and deducted stock without changing the API contract. */
export type SaleMode = 'meter' | 'roll' | 'box' | 'unit';

export type PaymentMethod = 'Cash' | 'QrBcp' | 'Mixed';

export interface CartItem {
  cartId: string;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  saleType: SaleType;
  unitLabel: string; // 'mt', 'rollo', 'caja', 'un'
  unitPrice: number;
  subtotal: number;
  /** Unit the operator chose, kept so the line can be edited in place. */
  mode: SaleMode;
  /** Quantity the operator typed, before any meter conversion the API deducts. */
  enteredQuantity: number;
}

export interface BatchSaleItemRequest {
  productId: number;
  quantity: number;
  saleType: number; // 0 = Wholesale, 1 = Retail
  unitPrice: number;
  /** Unit sold, matching the backend SoldUnit enum names. */
  unit: 'Meters' | 'Rolls' | 'Boxes' | 'Units';
  /** Quantity as the operator entered it, before the deduction conversion. */
  enteredQuantity: number;
}

export interface RecordBatchSalePayload {
  items: BatchSaleItemRequest[];
  clientName?: string;
  paymentMethod: number; // 0 = Cash, 1 = QrBcp, 2 = Mixed
  cashAmount?: number;
  qrAmount?: number;
}

export interface BatchSaleResponse {
  success: boolean;
  errorMessage?: string;
  ticketCode?: string;
  totalAmount: number;
  updatedProducts?: ProductDto[];
}

export interface DailySaleItem {
  id: number;
  createdAt: string;
  ticketCode?: string;
  clientName?: string;
  productName: string;
  productSku: string;
  quantity: number;
  /** La API serializa los enums por su nombre, no como número (JsonStringEnumConverter). */
  saleType: SaleType;
  unitPrice: number;
  totalPrice: number;
  /** La API serializa los enums por su nombre, no como número (JsonStringEnumConverter). */
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  qrAmount?: number;
}

export interface DailyCashClosureResponse {
  date: string;
  totalAmountBs: number;
  totalCashBs: number;
  totalQrBs: number;
  salesCount: number;
  sales: DailySaleItem[];
}

export interface AuthUser {
  email: string;
  token: string;
  roles: string[];
}
