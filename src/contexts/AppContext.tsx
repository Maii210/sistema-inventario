import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, User, Order, Supplier, StaffUser } from '../types';
import { products as seedProducts } from '../data/products';
import { ADMIN_CREDENTIALS } from '../data/adminConfig';

interface AppState {
  user: User | null;
  users: User[];
  products: Product[];
  orders: Order[];
  suppliers: Supplier[];
  staff: StaffUser[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'REGISTER_SALE'; payload: { order: Order } }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'ADD_STAFF'; payload: StaffUser }
  | { type: 'UPDATE_STAFF'; payload: StaffUser }
  | { type: 'DELETE_STAFF'; payload: string };

const STORAGE_KEYS = {
  products: 'camila_products',
  orders: 'camila_orders',
  users: 'camila_users',
  suppliers: 'camila_suppliers',
  staff: 'camila_staff'
};

// Versión del catálogo de ejemplo. Súbela cada vez que cambies el seed de
// productos: al cargar, si la versión guardada no coincide, se reemplaza el
// catálogo del navegador por el nuevo (útil durante la fase de pruebas/deploy).
const SEED_VERSION = '3';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? parsed : fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

// Carga los productos, refrescándolos con el seed nuevo cuando cambia SEED_VERSION.
function loadProducts(): Product[] {
  try {
    if (localStorage.getItem('camila_seed_version') !== SEED_VERSION) {
      localStorage.setItem('camila_seed_version', SEED_VERSION);
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(seedProducts));
      return seedProducts;
    }
  } catch {
    /* ignorar: sin localStorage se usa el seed */
  }
  return load<Product[]>(STORAGE_KEYS.products, seedProducts);
}

const initialState: AppState = {
  // Sistema exclusivamente administrativo: arranca con sesión de administrador.
  user: { id: 'admin', name: 'Administrador/a', email: ADMIN_CREDENTIALS.email, role: 'admin' },
  users: load<User[]>(STORAGE_KEYS.users, []),
  products: loadProducts(),
  orders: load<Order[]>(STORAGE_KEYS.orders, []),
  suppliers: load<Supplier[]>(STORAGE_KEYS.suppliers, []),
  staff: load<StaffUser[]>(STORAGE_KEYS.staff, []),
  isLoading: false
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map(p => (p.id === action.payload.id ? action.payload : p)) };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'REGISTER_SALE': {
      // Venta en tienda: registra la venta y descuenta el stock vendido.
      const { order } = action.payload;
      const soldQty: Record<string, number> = {};
      order.items.forEach(it => { soldQty[it.productId] = (soldQty[it.productId] ?? 0) + it.quantity; });
      return {
        ...state,
        orders: [order, ...state.orders],
        products: state.products.map(p =>
          soldQty[p.id] ? { ...p, stock: Math.max(0, p.stock - soldQty[p.id]) } : p
        )
      };
    }
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
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

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(state.products)); }, [state.products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders)); }, [state.orders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users)); }, [state.users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(state.suppliers)); }, [state.suppliers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(state.staff)); }, [state.staff]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
