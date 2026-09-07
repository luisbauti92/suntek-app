import axios from 'axios';
import type {
  ProductDto,
  RecordBatchSalePayload,
  BatchSaleResponse,
  DailyCashClosureResponse,
  AuthUser
} from '../types';

export const API_BASE = '';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('suntek_pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('suntek_pos_token');
      localStorage.removeItem('suntek_pos_user');
      window.dispatchEvent(new Event('suntek_pos_auth_change'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await api.post('/api/auth/login', { email, password });
    const data = res.data;
    const authUser: AuthUser = {
      email: data.email,
      token: data.token,
      roles: data.roles || [],
    };
    localStorage.setItem('suntek_pos_token', authUser.token);
    localStorage.setItem('suntek_pos_user', JSON.stringify(authUser));
    window.dispatchEvent(new Event('suntek_pos_auth_change'));
    return authUser;
  },

  logout() {
    localStorage.removeItem('suntek_pos_token');
    localStorage.removeItem('suntek_pos_user');
    window.dispatchEvent(new Event('suntek_pos_auth_change'));
  },

  getCurrentUser(): AuthUser | null {
    try {
      const u = localStorage.getItem('suntek_pos_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }
};

export const inventoryApi = {
  async list(): Promise<ProductDto[]> {
    const res = await api.get<ProductDto[]>('/api/inventory?status=active');
    return res.data;
  },
};

export const salesApi = {
  async recordBatch(payload: RecordBatchSalePayload): Promise<BatchSaleResponse> {
    const res = await api.post<BatchSaleResponse>('/api/sales/batch', payload);
    return res.data;
  },

  async getDailyClosure(date?: string): Promise<DailyCashClosureResponse> {
    const res = await api.get<DailyCashClosureResponse>('/api/sales/daily-closure', {
      params: date ? { date } : {},
    });
    return res.data;
  },
};
