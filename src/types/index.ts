// Producto genérico de la tienda (Comercial Camila).
export interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;          // precio de venta
  purchasePrice?: number; // precio de compra (costo)
  stock: number;
  image?: string;
  description?: string;
  supplierId?: string;
  barcode?: string;       // código de barras (para lectura posterior)
}

// Cliente registrado en la tienda.
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'vendedora' | 'inventarista' | 'customer';
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = 'efectivo' | 'qr' | 'transfer' | 'card';

// Venta realizada en tienda (punto de venta).
export interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
}

// Usuario del personal (accede al panel).
export interface StaffUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'vendedora' | 'inventarista';
  active: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}
