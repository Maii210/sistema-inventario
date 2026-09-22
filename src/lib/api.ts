const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────
export const authApi = {
  async login(email: string, password: string) {
    const data = await request<{ success: boolean; user?: any; message?: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    if (!data.success) throw new Error(data.message || 'Credenciales incorrectas');
    return data.user;
  },
};

// ─── Users (StaffUser) ─────────────────────────────────────
export interface ApiUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: 'admin' | 'vendedora' | 'inventarista';
  active: boolean;
  phone: string | null;
  createdAt: string;
}

export const usersApi = {
  list: () => request<ApiUser[]>('/users'),
  get: (id: string) => request<ApiUser>(`/users/${id}`),
  create: (data: { name: string; lastName: string; email: string; password: string; role?: string; phone?: string }) =>
    request<ApiUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; lastName: string; email: string; phone: string; role: string; active: boolean }>) =>
    request<ApiUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
};

// ─── Customers ─────────────────────────────────────────────
export interface ApiCustomer {
  id: string;
  name: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  createdAt: string;
}

export const customersApi = {
  list: () => request<ApiCustomer[]>('/customers'),
  get: (id: string) => request<ApiCustomer>(`/customers/${id}`),
  create: (data: { name: string; lastName: string; email?: string; phone?: string; documentId?: string }) =>
    request<ApiCustomer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; lastName: string; email: string; phone: string; documentId: string }>) =>
    request<ApiCustomer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/customers/${id}`, { method: 'DELETE' }),
};

// ─── Suppliers ─────────────────────────────────────────────
export interface ApiSupplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── Products ──────────────────────────────────────────────
export interface ApiProduct {
  id: string;
  name: string;
  brand: string | null;
  minStock: number;
  category: string;
  price: number;
  purchasePrice: number | null;
  stock: number;
  image: string | null;
  description: string | null;
  barcode: string | null;
  supplierId: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: ApiSupplier | null;
}

export const productsApi = {
  list: () => request<ApiProduct[]>('/products'),
  get: (id: string) => request<ApiProduct>(`/products/${id}`),
  create: (data: { name: string; brand?: string; category?: string; price: number; purchasePrice?: number; stock: number; image?: string; description?: string; barcode?: string; supplierId?: string }) =>
    request<ApiProduct>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; brand: string; category: string; price: number; purchasePrice: number; stock: number; minStock: number; image: string; description: string; barcode: string; supplierId: string }>) =>
    request<ApiProduct>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
};

// ─── Sales ─────────────────────────────────────────────────
export interface ApiSaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  product?: ApiProduct | null;
}

export interface ApiSale {
  id: string;
  date: string;
  createdAt: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerId: string | null;
  userId: string | null;
  discount: number;
  paymentReference: string | null;
  subtotal: number;
  total: number;
  paymentMethod: string;
  items?: ApiSaleItem[];
  customer?: ApiCustomer | null;
  user?: ApiUser | null;
}

export const salesApi = {
  list: () => request<ApiSale[]>('/sales'),
  get: (id: string) => request<ApiSale>(`/sales/${id}`),
  create: (data: {
    customerId?: string; userId?: string; customerName?: string;
    customerEmail?: string; customerPhone?: string; paymentMethod?: string;
    discount?: number; paymentReference?: string; subtotal: number; total: number;
    items: { productId: string; name: string; price: number; quantity: number; discount?: number }[];
  }) => request<ApiSale>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ApiSale>) =>
    request<ApiSale>(`/sales/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/sales/${id}`, { method: 'DELETE' }),
};

// ─── Reports ───────────────────────────────────────────────
export const reportsApi = {
  inventory: (period?: string) => request<any>(`/reports/inventory${period ? `?period=${period}` : ''}`),
  sales: (period?: string) => request<any>(`/reports/sales${period ? `?period=${period}` : ''}`),
  customers: () => request<any[]>('/reports/customers'),
  suppliers: () => request<any[]>('/reports/suppliers'),
};
