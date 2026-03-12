import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'suntek_token';

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
        window.location.href = '/login';
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

// Inventory
export type UnitType = 'Meters' | 'Units';
/** API may return 0/1 until JsonStringEnumConverter is enabled */
export type UnitTypeResponse = UnitType | 0 | 1;

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

export const inventoryApi = {
  list: () => apiClient.get<InventoryItemDto[]>('/inventory'),
  register: (data: RegisterStockRequest) =>
    apiClient.post<InventoryItemDto>('/inventory', data),
  openBox: (productId: number) =>
    apiClient.post<InventoryItemDto>(`/inventory/${productId}/open-box`, {}),
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
}

export const salesApi = {
  recordSale: (data: RecordSaleRequest) =>
    apiClient.post<RecordSaleResponse>('/sales', data),
  listMovements: () => apiClient.get<MovementDto[]>('/sales/movements'),
};
