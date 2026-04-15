import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'suntek_token';

/** Dispatched once per “wave” of 401s so the UI can show a session-expired dialog. */
export const SESSION_EXPIRED_EVENT = 'suntek:session-expired';

let sessionExpiredNotified = false;

export function resetSessionExpiredNotification(): void {
  sessionExpiredNotified = false;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/');
      if (!isAuthRequest) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('suntek_user');
        if (!sessionExpiredNotified) {
          sessionExpiredNotified = true;
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        }
      }
    }
    return Promise.reject(error);
  }
);

// Health Check
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
}

export const healthApi = {
  check: () => apiClient.get<HealthCheckResponse>('/health'),
};

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  roles: string[];
  expiresAt: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  /** Admin or Operator; omit for Operator. */
  role?: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  fullName: string;
  message: string;
}

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => apiClient.post<RegisterResponse>('/auth/register', data),
};

// Users (admin)
export type UserAccountStatus = 'Active' | 'Inactive' | 'Locked';

export interface UserListItemDto {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  status: UserAccountStatus;
  lastLoginAt: string | null;
}

export const usersApi = {
  list: () => apiClient.get<UserListItemDto[]>('/users'),
};

// Inventory
export type UnitType = 'Meters' | 'Units';
/** API may return 0/1 until JsonStringEnumConverter is enabled */
export type UnitTypeResponse = UnitType | 0 | 1;
export type ProductStatus = 'Active' | 'Discontinued' | 'Archived';
export type InventoryStatusFilter = 'active' | 'discontinued' | 'archived';

export interface InventoryItemDto {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  length: number;
  width: number;
  pricePerRoll: number;
  pricePerMeter: number;
  rollsPerBox: number;
  unitType: UnitTypeResponse;
  wholesaleQuantity: number;
  retailQuantity: number;
  status: ProductStatus;
  createdAt: string;
}

export interface RegisterStockRequest {
  sku: string;
  name: string;
  quantity: number;
  length: number;
  width: number;
  pricePerRoll: number;
  pricePerMeter: number;
  rollsPerBox: number;
  unitType: UnitType;
}

export interface UpdateProductRequest {
  sku: string;
  name: string;
  length: number;
  width: number;
  rollsPerBox: number;
  pricePerRoll: number;
  pricePerMeter: number;
}

export interface AdjustStockRequest {
  productId: number;
  quantity: number;
  reason?: string;
}

export interface AdjustStockResponse {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  wholesaleQuantity: number;
  retailQuantity: number;
}

export const inventoryApi = {
  list: (status: InventoryStatusFilter = 'active') =>
    apiClient.get<InventoryItemDto[]>('/inventory', { params: { status } }),
  register: (data: RegisterStockRequest) =>
    apiClient.post<InventoryItemDto>('/inventory', data),
  update: (id: number, data: UpdateProductRequest) =>
    apiClient.put<InventoryItemDto>(`/inventory/${id}`, data),
  updateStatus: (id: number, status: ProductStatus) =>
    apiClient.patch<void>(`/products/${id}/status`, { status }),
  openBox: (productId: number) =>
    apiClient.post<InventoryItemDto>(`/inventory/${productId}/open-box`, {}),
  adjustStock: (data: AdjustStockRequest) =>
    apiClient.post<AdjustStockResponse>('/inventory/adjust-stock', data),
};

// Sales
export type SaleType = 'Wholesale' | 'Retail';

export interface RecordSaleRequest {
  productId: number;
  quantity: number;
  saleType: SaleType;
  unitPrice: number;
}

export interface RecordSaleResponse {
  success: boolean;
  errorMessage?: string;
  id?: number;
  wholesaleQuantity?: number;
  retailQuantity?: number;
}

export interface MovementDto {
  id: number;
  movementType: string;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  quantityUnit: string;
  description: string;
  wholesaleQuantityAfter: number | null;
  retailQuantityAfter: number | null;
  createdAt: string;
  saleId: number | null;
  saleUnitPriceBs?: number | null;
  saleTotalBs?: number | null;
}

export interface MovementHistoryPaged {
  items: MovementDto[];
  totalCount: number;
  totalSalesBsInRange: number;
  page: number;
  pageSize: number;
}

const SALES_REPORT_FILENAME = 'Suntek_Sales_Report.xlsx';

export const salesApi = {
  recordSale: (data: RecordSaleRequest) =>
    apiClient.post<RecordSaleResponse>('/sales', data),
  listMovements: (startDate?: string, endDate?: string, page = 1, pageSize = 25) =>
    apiClient.get<MovementHistoryPaged>('/sales/movements', {
      params: {
        startDate,
        endDate,
        page,
        pageSize,
      },
    }),
  /** Exports sales report as Excel; returns blob and triggers browser download. */
  exportSalesReport: (startDate?: string, endDate?: string) =>
    apiClient
      .get<Blob>('/sales/export', {
        params: { startDate, endDate },
        responseType: 'blob',
      })
      .then((res) => {
        const blob = res.data;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = SALES_REPORT_FILENAME;
        a.click();
        URL.revokeObjectURL(url);
        return res;
      }),
};
