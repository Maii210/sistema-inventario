import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Perfume, FilterOptions, User, Order, Review, Supplier, StaffUser } from '../types';
import { perfumes as seedPerfumes } from '../data/perfumes';
import { DIRECT_ADMIN } from '../data/appConfig';
import { ADMIN_CREDENTIALS } from '../data/adminConfig';

interface AppState {
  cart: CartItem[];
  user: User | null;
  users: User[];
  perfumes: Perfume[];
  orders: Order[];
  filters: FilterOptions;
  searchQuery: string;
  currentView: 'home' | 'catalog' | 'product' | 'cart' | 'checkout' | 'quiz' | 'comparator' | 'guide' | 'login' | 'gift' | 'reviews' | 'admin';
  selectedPerfume: Perfume | null;
  isLoading: boolean;
  suppliers: Supplier[];
  staff: StaffUser[];
}

type AppAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_FILTERS'; payload: FilterOptions }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_CURRENT_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_SELECTED_PERFUME'; payload: Perfume | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_PERFUME'; payload: Perfume }
  | { type: 'UPDATE_PERFUME'; payload: Perfume }
  | { type: 'DELETE_PERFUME'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'REGISTER_SALE'; payload: { order: Order } }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'DELETE_REVIEW'; payload: { perfumeId: string; reviewId: string } }
  | { type: 'UPDATE_REVIEW'; payload: { perfumeId: string; review: Review } }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'ADD_STAFF'; payload: StaffUser }
  | { type: 'UPDATE_STAFF'; payload: StaffUser }
  | { type: 'DELETE_STAFF'; payload: string };

const STORAGE_KEYS = {
  perfumes: 'essence_perfumes',
  orders: 'essence_orders',
  users: 'essence_users',
  suppliers: 'essence_suppliers',
  staff: 'essence_staff'
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as T;
    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? parsed : fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

const initialState: AppState = {
  cart: [],
  // En modo directo (deploy), arranca con sesión de administrador ya iniciada.
  user: DIRECT_ADMIN
    ? { id: 'admin', name: 'Administrador/a', email: ADMIN_CREDENTIALS.email, role: 'admin' }
    : null,
  users: load<User[]>(STORAGE_KEYS.users, []),
  perfumes: load<Perfume[]>(STORAGE_KEYS.perfumes, seedPerfumes),
  orders: load<Order[]>(STORAGE_KEYS.orders, []),
  filters: {},
  searchQuery: '',
  currentView: DIRECT_ADMIN ? 'admin' : 'home',
  selectedPerfume: null,
  isLoading: false,
  suppliers: load<Supplier[]>(STORAGE_KEYS.suppliers, []),
  staff: load<StaffUser[]>(STORAGE_KEYS.staff, [])
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.perfume.id === action.payload.perfume.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.perfume.id === action.payload.perfume.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.perfume.id !== action.payload) };
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.perfume.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        )
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_SELECTED_PERFUME':
      return { ...state, selectedPerfume: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_PERFUME':
      return { ...state, perfumes: [action.payload, ...state.perfumes] };
    case 'UPDATE_PERFUME':
      return {
        ...state,
        perfumes: state.perfumes.map(p => (p.id === action.payload.id ? action.payload : p))
      };
    case 'DELETE_PERFUME':
      return { ...state, perfumes: state.perfumes.filter(p => p.id !== action.payload) };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'REGISTER_SALE': {
      // Venta en tienda: registra el pedido y descuenta el stock vendido.
      const { order } = action.payload;
      const soldQty: Record<string, number> = {};
      order.items.forEach(it => { soldQty[it.perfumeId] = (soldQty[it.perfumeId] ?? 0) + it.quantity; });
      return {
        ...state,
        orders: [order, ...state.orders],
        perfumes: state.perfumes.map(p =>
          soldQty[p.id] ? { ...p, stock: Math.max(0, p.stock - soldQty[p.id]) } : p
        )
      };
    }
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => (o.id === action.payload.id ? action.payload : o))
      };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'DELETE_REVIEW':
      return {
        ...state,
        perfumes: state.perfumes.map(p =>
          p.id === action.payload.perfumeId
            ? { ...p, reviews: p.reviews.filter(r => r.id !== action.payload.reviewId) }
            : p
        )
      };
    case 'UPDATE_REVIEW':
      return {
        ...state,
        perfumes: state.perfumes.map(p =>
          p.id === action.payload.perfumeId
            ? {
                ...p,
                reviews: p.reviews.map(r =>
                  r.id === action.payload.review.id ? action.payload.review : r
                )
              }
            : p
        )
      };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [action.payload, ...state.suppliers] };
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map(s => (s.id === action.payload.id ? action.payload : s)) };
    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] };
    case 'UPDATE_STAFF':
      return { ...state, staff: state.staff.map(u => (u.id === action.payload.id ? action.payload : u)) };
    case 'DELETE_STAFF':
      return { ...state, staff: state.staff.filter(u => u.id !== action.payload) };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.perfumes, JSON.stringify(state.perfumes));
  }, [state.perfumes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders));
  }, [state.orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
  }, [state.users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(state.suppliers));
  }, [state.suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(state.staff));
  }, [state.staff]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
