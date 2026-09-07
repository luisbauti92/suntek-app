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
}

export interface BatchSaleItemRequest {
  productId: number;
  quantity: number;
  saleType: number; // 0 = Wholesale, 1 = Retail
  unitPrice: number;
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
  saleType: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: number;
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
