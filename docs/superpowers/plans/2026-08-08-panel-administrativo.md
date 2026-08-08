# Panel Administrativo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un panel de administración modular (dashboard, perfumes, precios/stock, pedidos/pagos, reseñas, clientes) a la tienda Essence, con datos en `localStorage` reflejados en la tienda pública.

**Architecture:** Se mueven los datos (perfumes, pedidos, usuarios) de imports estáticos al estado global `AppContext`, hidratado y persistido en `localStorage`. La tienda pública lee del contexto; un panel de admin protegido por rol edita esos datos. Todo con las vistas basadas en `currentView` ya existentes (sin router).

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, lucide-react.

## Global Constraints

- Persistencia solo en `localStorage`. Claves: `essence_perfumes`, `essence_orders`, `essence_users`.
- Estilo: paleta Tailwind `essence-*` (navy `#1D1A39`, purple `#451952`, plum `#662949`, rose `#AE343A`, coral `#F30F5A`, light `#E8BCB9`), fuentes `font-playfair` (títulos) y `font-inter` (cuerpo), iconos `lucide-react`, tarjetas `rounded-2xl shadow-lg`.
- Moneda mostrada: `BOB` (como en el resto de la app).
- Sin backend, sin router, sin librerías nuevas.
- **Verificación de cada tarea** (no hay test runner en el proyecto): `npm run lint` sin errores nuevos, `npm run build` exitoso, y verificación visual en la preview del navegador (`npm run dev`).
- No se añaden `Co-Authored-By` ni menciones de IA en los commits.

---

### Task 1: Tipos y configuración de admin

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/data/adminConfig.ts`

**Interfaces:**
- Produces: `Order`, `OrderItem`, `PaymentStatus`, `OrderStatus` types; `User` con `role?: 'admin' | 'customer'` y `createdAt?: string`; `ADMIN_CREDENTIALS`, `LOW_STOCK_THRESHOLD`.

- [ ] **Step 1: Añadir campos a `User` y tipos de pedido en `src/types/index.ts`**

Modificar la interfaz `User` existente y añadir al final del archivo:

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  role?: 'admin' | 'customer';
  createdAt?: string;
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
```

- [ ] **Step 2: Crear `src/data/adminConfig.ts`**

```ts
export const ADMIN_CREDENTIALS = {
  email: 'admin@essence.com',
  password: 'Essence#2026'
};

export const LOW_STOCK_THRESHOLD = 10;
```

- [ ] **Step 3: Verificar compilación**

Run: `npm run build`
Expected: build exitoso (los tipos nuevos no rompen nada existente).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/data/adminConfig.ts
git commit -m "feat: tipos de pedido/rol y config de admin"
```

---

### Task 2: Estado global y persistencia en AppContext

**Files:**
- Modify: `src/contexts/AppContext.tsx`

**Interfaces:**
- Consumes: tipos de Task 1 (`Order`, `User`).
- Produces: `state.perfumes: Perfume[]`, `state.orders: Order[]`, `state.users: User[]`; acciones `ADD_PERFUME`, `UPDATE_PERFUME`, `DELETE_PERFUME`, `ADD_ORDER`, `UPDATE_ORDER`, `DELETE_REVIEW`, `UPDATE_REVIEW`, `ADD_USER`. `currentView` incluye `'admin'`.

- [ ] **Step 1: Reescribir `src/contexts/AppContext.tsx`**

Reemplazar el contenido por (conserva las acciones de carrito existentes y añade las nuevas):

```tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Perfume, FilterOptions, User, Order, Review } from '../types';
import { perfumes as seedPerfumes } from '../data/perfumes';

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
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'DELETE_REVIEW'; payload: { perfumeId: string; reviewId: string } }
  | { type: 'UPDATE_REVIEW'; payload: { perfumeId: string; review: Review } };

const STORAGE_KEYS = {
  perfumes: 'essence_perfumes',
  orders: 'essence_orders',
  users: 'essence_users'
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const initialState: AppState = {
  cart: [],
  user: null,
  users: load<User[]>(STORAGE_KEYS.users, []),
  perfumes: load<Perfume[]>(STORAGE_KEYS.perfumes, seedPerfumes),
  orders: load<Order[]>(STORAGE_KEYS.orders, []),
  filters: {},
  searchQuery: '',
  currentView: 'home',
  selectedPerfume: null,
  isLoading: false
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

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
```

- [ ] **Step 2: Verificar compilación**

Run: `npm run build`
Expected: build exitoso. (Los componentes que aún importan `perfumes` de `data/` siguen compilando; se refactorizan en Task 3.)

- [ ] **Step 3: Verificar persistencia en navegador**

Run: `npm run dev`, abrir la app, en DevTools → Application → Local Storage confirmar que existen `essence_perfumes` (con los perfumes semilla), `essence_orders` (`[]`) y `essence_users` (`[]`).

- [ ] **Step 4: Commit**

```bash
git add src/contexts/AppContext.tsx
git commit -m "feat: perfumes/pedidos/usuarios en estado global con persistencia"
```

---

### Task 3: Refactor de lectura a state.perfumes

**Files:**
- Modify: `src/components/Home/FeaturedProducts.tsx`
- Modify: `src/components/Gift/GiftMode.tsx`
- Modify: `src/components/Quiz/FragranceQuiz.tsx`
- Modify: `src/components/Reviews/ReviewsSection.tsx`
- Modify: `src/components/Layout/SmartSearch.tsx`
- Modify: `src/components/Comparator/ProductComparator.tsx`
- Modify: `src/components/Catalog/ProductGrid.tsx`

**Interfaces:**
- Consumes: `state.perfumes` de Task 2.

- [ ] **Step 1: En cada uno de los 7 archivos, eliminar el import estático y leer del contexto**

En cada archivo, borrar la línea:

```tsx
import { perfumes } from '../../data/perfumes';
```

Y asegurar que exista `const { state, dispatch } = useApp();` (si ya usa `useApp`, reutilizarlo; si solo desestructura `dispatch`, cambiar a incluir `state`). Justo después, añadir:

```tsx
const { perfumes } = state;
```

De este modo el resto del código que referencia `perfumes` no cambia. Para componentes que hoy no usan `state` (revisar cada uno), añadir `state` a la desestructuración de `useApp()`.

- [ ] **Step 2: Verificar que no queden imports del data estático en componentes**

Run: `grep -rn "from '../../data/perfumes'" src/components` (o `grep -rn "data/perfumes" src/components`)
Expected: sin resultados.

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores. Revisar que no queden variables `state` sin usar ni imports colgando.

- [ ] **Step 4: Verificar en navegador**

Run: `npm run dev`. Home muestra destacados, catálogo lista perfumes, buscador funciona, comparador y guía cargan — igual que antes.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "refactor: componentes leen perfumes del estado global"
```

---

### Task 4: Acceso admin (login por rol, vista y enlace en Header)

**Files:**
- Modify: `src/components/Auth/Login.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout/Header.tsx`

**Interfaces:**
- Consumes: `ADMIN_CREDENTIALS` (Task 1), acciones `ADD_USER`, `SET_USER`, `SET_CURRENT_VIEW`.
- Produces: vista `'admin'` navegable; usuarios registrados persistidos.

- [ ] **Step 1: Login detecta admin y persiste clientes**

En `src/components/Auth/Login.tsx`, importar la config y el estado:

```tsx
import { ADMIN_CREDENTIALS } from '../../data/adminConfig';
```

Cambiar a `const { state, dispatch } = useApp();` y reemplazar `handleSubmit`:

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (isLogin) {
    if (formData.email === ADMIN_CREDENTIALS.email && formData.password === ADMIN_CREDENTIALS.password) {
      dispatch({
        type: 'SET_USER',
        payload: { id: 'admin', name: 'Administrador', email: formData.email, role: 'admin' }
      });
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'admin' });
      return;
    }
    const existing = state.users.find(u => u.email === formData.email);
    dispatch({
      type: 'SET_USER',
      payload: existing ?? { id: Date.now().toString(), name: 'Usuario', email: formData.email, role: 'customer' }
    });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
    return;
  }

  const newUser = {
    id: Date.now().toString(),
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    role: 'customer' as const,
    createdAt: new Date().toISOString()
  };
  dispatch({ type: 'ADD_USER', payload: newUser });
  dispatch({ type: 'SET_USER', payload: newUser });
  dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
};
```

- [ ] **Step 2: Registrar la vista admin en `App.tsx`**

En `src/App.tsx` importar el panel (se crea en Task 6) y añadir el caso. Para permitir compilar antes de Task 6, este step se completa junto con Task 6; aquí solo añadir el import y el `case`:

```tsx
import { AdminPanel } from './components/Admin/AdminPanel';
// ...
case 'admin':
  return <AdminPanel />;
```

Y añadir `'admin'` a la lista de vistas sin Footer:

```tsx
{!['quiz', 'comparator', 'guide', 'login', 'gift', 'reviews', 'admin'].includes(state.currentView) && <Footer />}
```

> Nota de ejecución: si se ejecuta Task 4 antes que Task 6, crear primero un stub mínimo de `AdminPanel` (`export function AdminPanel() { return null; }`) para que compile, y completarlo en Task 6. Con subagent-driven se recomienda ejecutar Task 6 inmediatamente después.

- [ ] **Step 3: Enlace "Panel Admin" en el Header solo para admin**

En `src/components/Layout/Header.tsx`, dentro del menú de usuario (`state.user ?` rama verdadera), añadir antes de "Cerrar Sesión":

```tsx
{state.user.role === 'admin' && (
  <button
    onClick={() => handleViewChange('admin')}
    className="w-full text-left px-4 py-2 text-essence-purple hover:bg-essence-purple/5 transition-colors font-medium"
  >
    Panel Admin
  </button>
)}
```

- [ ] **Step 4: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores (con el stub o con el panel de Task 6).

- [ ] **Step 5: Verificar en navegador**

Run: `npm run dev`. Iniciar sesión con `admin@essence.com` / `Essence#2026` → entra a la vista admin y el menú muestra "Panel Admin". Registrar un cliente → aparece en `essence_users` (Local Storage) y NO ve "Panel Admin".

- [ ] **Step 6: Commit**

```bash
git add src/components/Auth/Login.tsx src/App.tsx src/components/Layout/Header.tsx
git commit -m "feat: acceso admin por rol y registro de clientes"
```

---

### Task 5: Registrar pedidos desde el Checkout

**Files:**
- Modify: `src/components/Cart/Checkout.tsx`

**Interfaces:**
- Consumes: `ADD_ORDER` (Task 2), tipos `Order`/`OrderItem` (Task 1).

- [ ] **Step 1: Construir y despachar el pedido en `handlePlaceOrder`**

En `src/components/Cart/Checkout.tsx`, reemplazar `handlePlaceOrder`:

```tsx
const handlePlaceOrder = () => {
  const order = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    customer: {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state
    },
    items: state.cart.map(item => ({
      perfumeId: item.perfume.id,
      name: item.perfume.name,
      price: item.perfume.price,
      quantity: item.quantity
    })),
    subtotal,
    shipping,
    total,
    paymentMethod: formData.paymentMethod as 'card' | 'qr' | 'transfer',
    paymentStatus: 'pendiente' as const,
    orderStatus: 'pendiente' as const
  };

  dispatch({ type: 'ADD_ORDER', payload: order });
  dispatch({ type: 'CLEAR_CART' });
  dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  alert('¡Pedido realizado con éxito! Recibirás un email de confirmación.');
};
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 3: Verificar en navegador**

Run: `npm run dev`. Agregar productos al carrito, completar checkout → confirmar que `essence_orders` en Local Storage tiene el pedido con `paymentStatus: 'pendiente'`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Cart/Checkout.tsx
git commit -m "feat: el checkout registra pedidos"
```

---

### Task 6: Layout del panel (AdminPanel + Sidebar)

**Files:**
- Create: `src/components/Admin/AdminPanel.tsx`
- Create: `src/components/Admin/AdminSidebar.tsx`

**Interfaces:**
- Consumes: `state.user` (rol), `SET_CURRENT_VIEW`.
- Produces: `AdminPanel` (default export nombrado `AdminPanel`), tipo de módulo `AdminModule = 'dashboard' | 'perfumes' | 'pricing' | 'orders' | 'reviews' | 'customers'`.

- [ ] **Step 1: Crear `src/components/Admin/AdminSidebar.tsx`**

```tsx
import React from 'react';
import { LayoutDashboard, Package, DollarSign, ShoppingCart, Star, Users, ArrowLeft } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export type AdminModule = 'dashboard' | 'perfumes' | 'pricing' | 'orders' | 'reviews' | 'customers';

const items: { id: AdminModule; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'perfumes', label: 'Perfumes', icon: Package },
  { id: 'pricing', label: 'Precios y stock', icon: DollarSign },
  { id: 'orders', label: 'Pedidos y pagos', icon: ShoppingCart },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'customers', label: 'Clientes', icon: Users }
];

export function AdminSidebar({ active, onSelect }: { active: AdminModule; onSelect: (m: AdminModule) => void }) {
  const { dispatch } = useApp();
  return (
    <aside className="w-64 bg-essence-navy text-white min-h-screen p-6 flex-shrink-0">
      <h2 className="font-playfair text-2xl font-bold mb-8">Essence Admin</h2>
      <nav className="space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
              active === item.id ? 'bg-essence-coral text-white' : 'text-essence-light hover:bg-white/10'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <button
        onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' })}
        className="mt-8 flex items-center space-x-2 text-essence-light hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Volver a la tienda</span>
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Crear `src/components/Admin/AdminPanel.tsx`**

(Los imports de los módulos se van descomentando conforme se crean en Tasks 7–12. Para compilar en esta tarea, incluir solo Dashboard como placeholder inline y el resto como texto "En construcción".)

```tsx
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminSidebar, AdminModule } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminPerfumes } from './AdminPerfumes';
import { AdminPricing } from './AdminPricing';
import { AdminOrders } from './AdminOrders';
import { AdminReviews } from './AdminReviews';
import { AdminCustomers } from './AdminCustomers';

export function AdminPanel() {
  const { state } = useApp();
  const [module, setModule] = React.useState<AdminModule>('dashboard');

  if (state.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-essence-light/10">
        <p className="font-playfair text-2xl text-essence-navy">Acceso denegado</p>
      </div>
    );
  }

  const render = () => {
    switch (module) {
      case 'dashboard': return <AdminDashboard />;
      case 'perfumes': return <AdminPerfumes />;
      case 'pricing': return <AdminPricing />;
      case 'orders': return <AdminOrders />;
      case 'reviews': return <AdminReviews />;
      case 'customers': return <AdminCustomers />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-essence-light/5">
      <AdminSidebar active={module} onSelect={setModule} />
      <main className="flex-1 p-8 overflow-x-auto">{render()}</main>
    </div>
  );
}
```

> Nota de ejecución: como `AdminPanel` importa los seis módulos, crear en esta tarea stubs mínimos para los que aún no existen: `export function AdminX() { return <div className="font-playfair text-2xl text-essence-navy">En construcción</div>; }` en sus archivos. Cada Task 7–12 reemplaza su stub.

- [ ] **Step 3: Crear stubs de módulos**

Crear `AdminDashboard.tsx`, `AdminPerfumes.tsx`, `AdminPricing.tsx`, `AdminOrders.tsx`, `AdminReviews.tsx`, `AdminCustomers.tsx` en `src/components/Admin/`, cada uno con:

```tsx
import React from 'react';
export function AdminDashboard() {
  return <div className="font-playfair text-2xl text-essence-navy">En construcción</div>;
}
```

(ajustando el nombre de la función por archivo).

- [ ] **Step 4: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores. Retirar el stub de `AdminPanel` de Task 4 (si se creó) ya no es necesario.

- [ ] **Step 5: Verificar en navegador**

Run: `npm run dev`. Entrar como admin → se ve el sidebar con 6 módulos, el contenido cambia al hacer clic, y "Volver a la tienda" regresa a home.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin src/App.tsx
git commit -m "feat: layout del panel admin con sidebar y módulos"
```

---

### Task 7: Módulo Dashboard

**Files:**
- Modify: `src/components/Admin/AdminDashboard.tsx`

**Interfaces:**
- Consumes: `state.perfumes`, `state.orders`, `LOW_STOCK_THRESHOLD` (Task 1).

- [ ] **Step 1: Implementar `AdminDashboard.tsx`**

```tsx
import React from 'react';
import { Package, DollarSign, AlertTriangle, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { LOW_STOCK_THRESHOLD } from '../../data/adminConfig';

export function AdminDashboard() {
  const { state } = useApp();
  const { perfumes, orders } = state;

  const inventoryValue = perfumes.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = perfumes.filter(p => p.stock < LOW_STOCK_THRESHOLD);
  const pendingPayments = orders.filter(o => o.paymentStatus === 'pendiente').length;
  const revenue = orders
    .filter(o => o.paymentStatus === 'verificado')
    .reduce((sum, o) => sum + o.total, 0);
  const totalReviews = perfumes.reduce((sum, p) => sum + p.reviews.length, 0);

  const cards = [
    { label: 'Perfumes', value: perfumes.length, icon: Package },
    { label: 'Valor de inventario', value: `${inventoryValue} BOB`, icon: DollarSign },
    { label: 'Stock bajo', value: lowStock.length, icon: AlertTriangle },
    { label: 'Pagos pendientes', value: pendingPayments, icon: ShoppingCart },
    { label: 'Ingresos verificados', value: `${revenue} BOB`, icon: TrendingUp },
    { label: 'Reseñas', value: totalReviews, icon: Star }
  ];

  return (
    <div>
      <h1 className="font-playfair text-3xl font-bold text-essence-navy mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-essence-coral/10 flex items-center justify-center">
              <c.icon className="h-6 w-6 text-essence-coral" />
            </div>
            <div>
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="text-2xl font-bold text-essence-navy">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Productos con stock bajo</h2>
        {lowStock.length === 0 ? (
          <p className="text-gray-500">Todo el inventario está por encima del umbral ({LOW_STOCK_THRESHOLD}).</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {lowStock.map(p => (
              <li key={p.id} className="flex justify-between py-3">
                <span className="text-essence-navy">{p.name}</span>
                <span className="text-red-600 font-medium">{p.stock} u.</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 3: Verificar en navegador**

Run: `npm run dev`. En el dashboard, las tarjetas muestran cifras coherentes con los perfumes semilla; tras crear un pedido, "Pagos pendientes" aumenta.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminDashboard.tsx
git commit -m "feat: módulo dashboard del admin"
```

---

### Task 8: Módulo Perfumes (CRUD)

**Files:**
- Modify: `src/components/Admin/AdminPerfumes.tsx`
- Create: `src/components/Admin/PerfumeForm.tsx`

**Interfaces:**
- Consumes: `state.perfumes`, `ADD_PERFUME`, `UPDATE_PERFUME`, `DELETE_PERFUME`.
- Produces: `PerfumeForm` con props `{ initial?: Perfume; onSave: (p: Perfume) => void; onCancel: () => void }`.

- [ ] **Step 1: Crear `src/components/Admin/PerfumeForm.tsx`**

```tsx
import React from 'react';
import { Perfume } from '../../types';

const empty: Perfume = {
  id: '',
  name: '',
  brand: '',
  price: 0,
  image: '',
  description: '',
  notes: { top: [], middle: [], base: [] },
  category: 'floral',
  gender: 'unissex',
  duration: 'moderada',
  intensity: 'moderada',
  rating: 0,
  reviews: [],
  stock: 0
};

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple';

export function PerfumeForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: Perfume;
  onSave: (p: Perfume) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Perfume>(initial ?? empty);

  const set = (field: keyof Perfume, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));
  const setNotes = (key: 'top' | 'middle' | 'base', value: string) =>
    setForm(prev => ({
      ...prev,
      notes: { ...prev.notes, [key]: value.split(',').map(s => s.trim()).filter(Boolean) }
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      id: form.id || Date.now().toString(),
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      stock: Number(form.stock),
      rating: Number(form.rating)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">
        {initial ? 'Editar perfume' : 'Nuevo perfume'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className={inputCls} placeholder="Nombre" value={form.name} onChange={e => set('name', e.target.value)} required />
        <input className={inputCls} placeholder="Marca" value={form.brand} onChange={e => set('brand', e.target.value)} required />
        <input className={inputCls} type="number" placeholder="Precio (BOB)" value={form.price} onChange={e => set('price', e.target.value)} required />
        <input className={inputCls} type="number" placeholder="Precio original (opcional)" value={form.originalPrice ?? ''} onChange={e => set('originalPrice', e.target.value)} />
        <input className={inputCls} type="number" placeholder="Stock" value={form.stock} onChange={e => set('stock', e.target.value)} required />
        <input className={inputCls} placeholder="URL de imagen" value={form.image} onChange={e => set('image', e.target.value)} required />
      </div>

      <textarea className={inputCls} placeholder="Descripción" rows={3} value={form.description} onChange={e => set('description', e.target.value)} required />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className={inputCls} placeholder="Notas de salida (coma)" value={form.notes.top.join(', ')} onChange={e => setNotes('top', e.target.value)} />
        <input className={inputCls} placeholder="Notas de corazón (coma)" value={form.notes.middle.join(', ')} onChange={e => setNotes('middle', e.target.value)} />
        <input className={inputCls} placeholder="Notas de fondo (coma)" value={form.notes.base.join(', ')} onChange={e => setNotes('base', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
          <option value="floral">Floral</option>
          <option value="oriental">Oriental</option>
          <option value="fresco">Fresco</option>
          <option value="amadeirado">Amaderado</option>
        </select>
        <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
          <option value="masculino">Masculino</option>
          <option value="feminino">Femenino</option>
          <option value="unissex">Unisex</option>
        </select>
        <select className={inputCls} value={form.duration} onChange={e => set('duration', e.target.value)}>
          <option value="leve">Leve</option>
          <option value="moderada">Moderada</option>
          <option value="longa">Larga</option>
        </select>
        <select className={inputCls} value={form.intensity} onChange={e => set('intensity', e.target.value)}>
          <option value="suave">Suave</option>
          <option value="moderada">Moderada</option>
          <option value="intensa">Intensa</option>
        </select>
      </div>

      <div className="flex space-x-6">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={!!form.isNew} onChange={e => set('isNew', e.target.checked)} />
          <span>Nuevo</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={!!form.isPopular} onChange={e => set('isPopular', e.target.checked)} />
          <span>Popular</span>
        </label>
      </div>

      <div className="flex space-x-4 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-essence-purple text-essence-purple py-3 rounded-lg font-semibold hover:bg-essence-purple/5">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-gradient-to-r from-essence-coral to-essence-rose text-white py-3 rounded-lg font-semibold hover:shadow-lg">
          Guardar
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Implementar `AdminPerfumes.tsx`**

```tsx
import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Perfume } from '../../types';
import { PerfumeForm } from './PerfumeForm';

export function AdminPerfumes() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = React.useState<Perfume | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const list = state.perfumes.filter(
    p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase())
  );

  const handleSave = (p: Perfume) => {
    if (editing) dispatch({ type: 'UPDATE_PERFUME', payload: p });
    else dispatch({ type: 'ADD_PERFUME', payload: p });
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return (
      <PerfumeForm
        initial={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-playfair text-3xl font-bold text-essence-navy">Perfumes</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo perfume</span>
        </button>
      </div>

      <input
        className="w-full mb-6 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20"
        placeholder="Buscar por nombre o marca..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-essence-navy/5">
            <tr>
              <th className="px-4 py-3">Perfume</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 flex items-center space-x-3">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <span className="font-medium text-essence-navy">{p.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.brand}</td>
                <td className="px-4 py-3">{p.price} BOB</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditing(p)} className="p-2 text-essence-purple hover:bg-essence-purple/5 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${p.name}"?`)) dispatch({ type: 'DELETE_PERFUME', payload: p.id });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 4: Verificar en navegador**

Run: `npm run dev`. Crear un perfume nuevo → aparece en la tabla y en el catálogo público. Editar precio/nombre → se refleja. Eliminar → desaparece de ambos y persiste tras recargar.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/AdminPerfumes.tsx src/components/Admin/PerfumeForm.tsx
git commit -m "feat: módulo CRUD de perfumes"
```

---

### Task 9: Módulo Precios y stock

**Files:**
- Modify: `src/components/Admin/AdminPricing.tsx`

**Interfaces:**
- Consumes: `state.perfumes`, `UPDATE_PERFUME`.

- [ ] **Step 1: Implementar `AdminPricing.tsx`**

```tsx
import React from 'react';
import { Save } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function AdminPricing() {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = React.useState<Record<string, { price: string; originalPrice: string; stock: string }>>({});

  const getVal = (id: string, field: 'price' | 'originalPrice' | 'stock', fallback: number | undefined) =>
    draft[id]?.[field] ?? (fallback ?? '').toString();

  const setVal = (id: string, field: 'price' | 'originalPrice' | 'stock', value: string) =>
    setDraft(prev => ({
      ...prev,
      [id]: {
        price: prev[id]?.price ?? '',
        originalPrice: prev[id]?.originalPrice ?? '',
        stock: prev[id]?.stock ?? '',
        [field]: value
      }
    }));

  const save = (id: string) => {
    const perfume = state.perfumes.find(p => p.id === id);
    if (!perfume) return;
    const d = draft[id];
    dispatch({
      type: 'UPDATE_PERFUME',
      payload: {
        ...perfume,
        price: d?.price ? Number(d.price) : perfume.price,
        originalPrice: d?.originalPrice ? Number(d.originalPrice) : perfume.originalPrice,
        stock: d?.stock ? Number(d.stock) : perfume.stock
      }
    });
    setDraft(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const cell = 'w-24 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20';

  return (
    <div>
      <h1 className="font-playfair text-3xl font-bold text-essence-navy mb-8">Precios y stock</h1>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-essence-navy/5">
            <tr>
              <th className="px-4 py-3">Perfume</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Precio original</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Guardar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.perfumes.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-essence-navy">{p.name}</td>
                <td className="px-4 py-3">
                  <input className={cell} type="number" value={getVal(p.id, 'price', p.price)} onChange={e => setVal(p.id, 'price', e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <input className={cell} type="number" value={getVal(p.id, 'originalPrice', p.originalPrice)} onChange={e => setVal(p.id, 'originalPrice', e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <input className={cell} type="number" value={getVal(p.id, 'stock', p.stock)} onChange={e => setVal(p.id, 'stock', e.target.value)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => save(p.id)}
                    disabled={!draft[p.id]}
                    className="inline-flex items-center space-x-2 bg-essence-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-essence-plum disabled:opacity-40"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 3: Verificar en navegador**

Run: `npm run dev`. Cambiar precio y stock de una fila, "Guardar" → se refleja en catálogo público y persiste tras recargar.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminPricing.tsx
git commit -m "feat: módulo de precios y stock"
```

---

### Task 10: Módulo Pedidos y pagos

**Files:**
- Modify: `src/components/Admin/AdminOrders.tsx`

**Interfaces:**
- Consumes: `state.orders`, `UPDATE_ORDER`, tipos `Order`, `PaymentStatus`, `OrderStatus`.

- [ ] **Step 1: Implementar `AdminOrders.tsx`**

```tsx
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';

const paymentStyles: Record<PaymentStatus, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  verificado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800'
};

const orderStatuses: OrderStatus[] = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

export function AdminOrders() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = React.useState<'todos' | PaymentStatus>('todos');

  const orders = state.orders.filter(o => filter === 'todos' || o.paymentStatus === filter);

  const setPayment = (order: Order, paymentStatus: PaymentStatus) =>
    dispatch({ type: 'UPDATE_ORDER', payload: { ...order, paymentStatus } });
  const setOrderStatus = (order: Order, orderStatus: OrderStatus) =>
    dispatch({ type: 'UPDATE_ORDER', payload: { ...order, orderStatus } });

  return (
    <div>
      <h1 className="font-playfair text-3xl font-bold text-essence-navy mb-8">Pedidos y pagos</h1>

      <div className="flex space-x-2 mb-6">
        {(['todos', 'pendiente', 'verificado', 'rechazado'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === f ? 'bg-essence-purple text-white' : 'bg-white text-essence-navy border border-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">No hay pedidos.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <div className="font-semibold text-essence-navy">Pedido #{o.id}</div>
                  <div className="text-sm text-gray-500">{new Date(o.date).toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {o.customer.name} · {o.customer.email} · {o.customer.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-essence-navy">{o.total} BOB</div>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${paymentStyles[o.paymentStatus]}`}>
                    Pago: {o.paymentStatus}
                  </span>
                </div>
              </div>

              <ul className="text-sm text-gray-700 mb-4 divide-y divide-gray-100">
                {o.items.map(it => (
                  <li key={it.perfumeId} className="flex justify-between py-1">
                    <span>{it.name} × {it.quantity}</span>
                    <span>{it.price * it.quantity} BOB</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-500">Método: {o.paymentMethod}</span>
                <button onClick={() => setPayment(o, 'verificado')} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                  Verificar pago
                </button>
                <button onClick={() => setPayment(o, 'rechazado')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                  Rechazar
                </button>
                <select
                  value={o.orderStatus}
                  onChange={e => setOrderStatus(o, e.target.value as OrderStatus)}
                  className="ml-auto border border-gray-200 rounded-lg px-3 py-2 text-sm capitalize"
                >
                  {orderStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 3: Verificar en navegador**

Run: `npm run dev`. Con un pedido creado en el checkout: filtrar por estado, "Verificar pago" cambia el badge a verde y aumenta "Ingresos verificados" en el dashboard; cambiar estado del pedido persiste tras recargar.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminOrders.tsx
git commit -m "feat: módulo de pedidos y verificación de pagos"
```

---

### Task 11: Módulo Reseñas

**Files:**
- Modify: `src/components/Admin/AdminReviews.tsx`

**Interfaces:**
- Consumes: `state.perfumes`, `DELETE_REVIEW`, `UPDATE_REVIEW`.

- [ ] **Step 1: Implementar `AdminReviews.tsx`**

```tsx
import React from 'react';
import { Star, Trash2, BadgeCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function AdminReviews() {
  const { state, dispatch } = useApp();
  const withReviews = state.perfumes.filter(p => p.reviews.length > 0);

  return (
    <div>
      <h1 className="font-playfair text-3xl font-bold text-essence-navy mb-8">Reseñas</h1>

      {withReviews.length === 0 ? (
        <p className="text-gray-500">Aún no hay reseñas.</p>
      ) : (
        <div className="space-y-8">
          {withReviews.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-playfair text-xl font-semibold text-essence-navy mb-4">{p.name}</h2>
              <ul className="space-y-4">
                {p.reviews.map(r => (
                  <li key={r.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-essence-navy">{r.userName}</span>
                          {r.verified && (
                            <span className="inline-flex items-center text-xs text-green-700">
                              <BadgeCheck className="h-4 w-4 mr-1" /> Verificada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-essence-coral mt-1">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-600 mt-2">{r.comment}</p>
                        <div className="text-xs text-gray-400 mt-1">{r.date}</div>
                      </div>
                      <div className="flex space-x-2">
                        {!r.verified && (
                          <button
                            onClick={() =>
                              dispatch({ type: 'UPDATE_REVIEW', payload: { perfumeId: p.id, review: { ...r, verified: true } } })
                            }
                            className="p-2 text-green-700 hover:bg-green-50 rounded-lg"
                            title="Marcar como verificada"
                          >
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar esta reseña?'))
                              dispatch({ type: 'DELETE_REVIEW', payload: { perfumeId: p.id, reviewId: r.id } });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 3: Verificar en navegador**

Run: `npm run dev`. Se ven las reseñas de los perfumes semilla; marcar como verificada y eliminar funcionan y persisten tras recargar.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminReviews.tsx
git commit -m "feat: módulo de gestión de reseñas"
```

---

### Task 12: Módulo Clientes

**Files:**
- Modify: `src/components/Admin/AdminCustomers.tsx`

**Interfaces:**
- Consumes: `state.users`, `state.orders`.

- [ ] **Step 1: Implementar `AdminCustomers.tsx`**

```tsx
import React from 'react';
import { Mail, Phone, ShoppingBag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function AdminCustomers() {
  const { state } = useApp();
  const { users, orders } = state;

  const ordersByEmail = (email: string) => orders.filter(o => o.customer.email === email);

  return (
    <div>
      <h1 className="font-playfair text-3xl font-bold text-essence-navy mb-8">Clientes</h1>

      {users.length === 0 ? (
        <p className="text-gray-500">Aún no hay clientes registrados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.map(u => {
            const userOrders = ordersByEmail(u.email);
            const spent = userOrders.reduce((sum, o) => sum + o.total, 0);
            return (
              <div key={u.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="font-semibold text-essence-navy text-lg">{u.name}</div>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>{u.email}</span></div>
                  {u.phone && <div className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>{u.phone}</span></div>}
                  <div className="flex items-center space-x-2"><ShoppingBag className="h-4 w-4" /><span>{userOrders.length} pedido(s) · {spent} BOB</span></div>
                </div>
                {u.createdAt && (
                  <div className="text-xs text-gray-400 mt-3">Registrado: {new Date(u.createdAt).toLocaleDateString()}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 3: Verificar en navegador**

Run: `npm run dev`. Registrar un cliente y hacer un pedido con su email → aparece en Clientes con su conteo de pedidos y total gastado.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminCustomers.tsx
git commit -m "feat: módulo de clientes"
```

---

## Notas de ejecución

- Orden recomendado: Tasks 1 → 12 en secuencia (Task 6 crea stubs de módulos que Tasks 7–12 reemplazan).
- El proyecto no es un repo git. Antes de la Task 1, inicializar git (`git init && git add -A && git commit -m "estado inicial"`) para poder commitear cada tarea. Confirmar con el usuario si se desea.
- Si `confirm`/`alert` disparan warnings de lint, ya se usan en el código existente (Checkout), así que son aceptables en este proyecto.
```
