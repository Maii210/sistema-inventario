export interface Perfume {
  id: string;
  name: string;
  brand: string;
  price: number;
  purchasePrice?: number;
  originalPrice?: number;
  image: string;
  description: string;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  category: 'floral' | 'oriental' | 'fresco' | 'amadeirado';
  gender: 'masculino' | 'feminino' | 'unissex';
  duration: 'leve' | 'moderada' | 'longa';
  intensity: 'suave' | 'moderada' | 'intensa';
  rating: number;
  reviews: Review[];
  isNew?: boolean;
  isPopular?: boolean;
  supplierId?: string;
  stock: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpful?: number;
}

export interface CartItem {
  perfume: Perfume;
  quantity: number;
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  role?: 'admin' | 'vendedora' | 'inventarista' | 'customer';
  createdAt?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface FilterOptions {
  category?: string[];
  gender?: string[];
  priceRange?: [number, number];
  duration?: string[];
  intensity?: string[];
  brand?: string[];
  sortBy?: 'name' | 'price-asc' | 'price-desc' | 'rating' | 'popular';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  value: string;
}

export interface QuizResult {
  perfumeId: string;
  confidence: number;
  reasons: string[];
}

export interface OrderItem {
  perfumeId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentStatus = 'pendiente' | 'verificado' | 'rechazado';
export type OrderStatus = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';

export interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'card' | 'qr' | 'transfer';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
}

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
