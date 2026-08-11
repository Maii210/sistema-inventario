# Roles, Reportes, Proveedores y mejoras de UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir control de acceso por roles (capacidades), gestión de usuarios de personal, módulo de proveedores (vinculados a perfumes), módulo de reportes con exportación CSV, y mejoras de UI (subtítulos por módulo + encabezados de tabla descriptivos) al panel administrativo de Essence.

**Architecture:** Se define un modelo de capacidades (`permissions.ts`) que mapea cada rol a un conjunto de capacidades; el sidebar filtra módulos y los formularios deshabilitan campos según `can(role, cap)`. Se amplía `AppContext` con `suppliers` y `staff` persistidos en `localStorage`. Todo sigue el patrón de vistas por `currentView` y el estilo `essence-*`.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, lucide-react.

## Global Constraints

- Persistencia solo en `localStorage`. Claves nuevas: `essence_suppliers`, `essence_staff`.
- Estilo: paleta `essence-*` (navy `#1D1A39`, purple `#451952`, plum `#662949`, rose `#AE343A`, coral `#F30F5A`, light `#E8BCB9`), `font-playfair` (títulos) / `font-inter`, iconos `lucide-react`, tarjetas `rounded-2xl shadow-lg`. Moneda: `BOB`.
- Sin backend, sin router, sin librerías nuevas. Contraseñas en claro (demo).
- Roles: `'admin' | 'vendedora' | 'inventarista'` (personal) y `'customer'`.
- Admin bootstrap fija: `admin@essence.com` / `Essence#2026` (ya en `src/data/adminConfig.ts`).
- Verificación de cada tarea (no hay test runner): `npm run lint` sin errores nuevos (baseline ~6 errores preexistentes en Checkout/Header/ProductDetail/FragranceQuiz/ReviewsSection y warning fast-refresh de AppContext), `npm run build` exitoso, y verificación en la preview del navegador.
- Commits sin `Co-Authored-By` ni menciones de IA.

---

### Task 1: Modelo de permisos y tipos

**Files:**
- Create: `src/data/permissions.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `Role`, `Capability`, `ROLE_CAPABILITIES`, `can(role, cap)`; tipos `StaffUser`, `Supplier`; `User.role` ampliado; `Perfume.supplierId?`.

- [ ] **Step 1: Crear `src/data/permissions.ts`**

```ts
export type Role = 'admin' | 'vendedora' | 'inventarista';

export type Capability =
  | 'viewDashboard'
  | 'manageCatalog'
  | 'managePrices'
  | 'manageStock'
  | 'manageSuppliers'
  | 'viewOrders'
  | 'viewCustomers'
  | 'manageReviews'
  | 'viewReportsSales'
  | 'viewReportsInventory'
  | 'viewReportsCustomers'
  | 'manageUsers';

const ALL: Capability[] = [
  'viewDashboard', 'manageCatalog', 'managePrices', 'manageStock', 'manageSuppliers',
  'viewOrders', 'viewCustomers', 'manageReviews',
  'viewReportsSales', 'viewReportsInventory', 'viewReportsCustomers', 'manageUsers'
];

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: ALL,
  vendedora: ['viewDashboard', 'viewOrders', 'viewCustomers', 'manageReviews', 'viewReportsSales', 'viewReportsCustomers'],
  inventarista: ['viewDashboard', 'manageCatalog', 'manageStock', 'manageSuppliers', 'viewReportsInventory']
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administradora',
  vendedora: 'Vendedora',
  inventarista: 'Inventarista'
};

export function can(role: Role | undefined, cap: Capability): boolean {
  if (!role) return false;
  return ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
}

export function isStaffRole(role: string | undefined): role is Role {
  return role === 'admin' || role === 'vendedora' || role === 'inventarista';
}
```

- [ ] **Step 2: Ampliar tipos en `src/types/index.ts`**

Cambiar la propiedad `role` de `User` y añadir al final del archivo los nuevos tipos. En `User`:

```ts
  role?: 'admin' | 'vendedora' | 'inventarista' | 'customer';
```

Añadir `supplierId?: string;` como campo opcional dentro de la interfaz `Perfume` (junto a los otros opcionales como `isNew`/`isPopular`).

Añadir al final del archivo:

```ts
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
```

- [ ] **Step 3: Verificar compilación**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add src/data/permissions.ts src/types/index.ts
git commit -m "feat: modelo de permisos por capacidades y tipos de personal/proveedor"
```

---

### Task 2: Estado y persistencia de proveedores y personal

**Files:**
- Modify: `src/contexts/AppContext.tsx`

**Interfaces:**
- Consumes: tipos `Supplier`, `StaffUser` (Task 1).
- Produces: `state.suppliers`, `state.staff`; acciones `ADD_SUPPLIER`, `UPDATE_SUPPLIER`, `DELETE_SUPPLIER`, `ADD_STAFF`, `UPDATE_STAFF`, `DELETE_STAFF`.

- [ ] **Step 1: Importar los tipos**

En el import de tipos al inicio de `src/contexts/AppContext.tsx`, añadir `Supplier` y `StaffUser`:

```tsx
import { CartItem, Perfume, FilterOptions, User, Order, Review, Supplier, StaffUser } from '../types';
```

- [ ] **Step 2: Añadir slices al estado**

En la interfaz `AppState`, añadir dos campos:

```tsx
  suppliers: Supplier[];
  staff: StaffUser[];
```

En `STORAGE_KEYS` añadir:

```tsx
  suppliers: 'essence_suppliers',
  staff: 'essence_staff'
```

En `initialState` añadir:

```tsx
  suppliers: load<Supplier[]>(STORAGE_KEYS.suppliers, []),
  staff: load<StaffUser[]>(STORAGE_KEYS.staff, []),
```

- [ ] **Step 3: Añadir las acciones al union `AppAction`**

```tsx
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'ADD_STAFF'; payload: StaffUser }
  | { type: 'UPDATE_STAFF'; payload: StaffUser }
  | { type: 'DELETE_STAFF'; payload: string }
```

- [ ] **Step 4: Añadir los casos al reducer**

Antes de `default:` en `appReducer`:

```tsx
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
```

- [ ] **Step 5: Persistir los nuevos slices**

En `AppProvider`, junto a los `useEffect` existentes, añadir:

```tsx
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(state.suppliers));
  }, [state.suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(state.staff));
  }, [state.staff]);
```

- [ ] **Step 6: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos; en el navegador aparecen `essence_suppliers` y `essence_staff` (`[]`) en Local Storage.

- [ ] **Step 7: Commit**

```bash
git add src/contexts/AppContext.tsx
git commit -m "feat: estado y persistencia de proveedores y personal"
```

---

### Task 3: Autenticación de personal en el Login

**Files:**
- Modify: `src/components/Auth/Login.tsx`

**Interfaces:**
- Consumes: `state.staff` (Task 2), `ADMIN_CREDENTIALS`.

- [ ] **Step 1: Insertar la verificación de personal en `handleSubmit`**

En `src/components/Auth/Login.tsx`, dentro de la rama `if (isLogin) { ... }`, DESPUÉS del bloque que compara con `ADMIN_CREDENTIALS` (que redirige al admin) y ANTES del bloque que busca/crea un cliente, insertar:

```tsx
    const staffMember = state.staff.find(
      u => u.email === formData.email && u.password === formData.password && u.active
    );
    if (staffMember) {
      dispatch({
        type: 'SET_USER',
        payload: { id: staffMember.id, name: staffMember.name, email: staffMember.email, role: staffMember.role }
      });
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'admin' });
      return;
    }
```

(`state` ya está disponible vía `useApp()` en este componente.)

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos.

- [ ] **Step 3: Verificar en navegador**

Run: `npm run dev`. Crear manualmente un staff en `localStorage` (`essence_staff`) o esperar al módulo Usuarios; iniciar sesión con esas credenciales → abre el panel con el rol correspondiente. Un staff con `active: false` no entra.

- [ ] **Step 4: Commit**

```bash
git add src/components/Auth/Login.tsx
git commit -m "feat: login de personal por rol"
```

---

### Task 4: Cabecera de módulo compartida + subtítulos y encabezados descriptivos

**Files:**
- Create: `src/components/Admin/AdminModuleHeader.tsx`
- Modify: `src/components/Admin/AdminDashboard.tsx`
- Modify: `src/components/Admin/AdminPerfumes.tsx`
- Modify: `src/components/Admin/AdminPricing.tsx`
- Modify: `src/components/Admin/AdminOrders.tsx`
- Modify: `src/components/Admin/AdminReviews.tsx`
- Modify: `src/components/Admin/AdminCustomers.tsx`

**Interfaces:**
- Produces: `AdminModuleHeader` con props `{ title: string; subtitle: string; icon?: React.ElementType }`.

- [ ] **Step 1: Crear `src/components/Admin/AdminModuleHeader.tsx`**

```tsx
import React from 'react';

export function AdminModuleHeader({
  title,
  subtitle,
  icon: Icon
}: {
  title: string;
  subtitle: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-essence-coral/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-essence-coral" />
          </div>
        )}
        <h1 className="font-playfair text-3xl font-bold text-essence-navy">{title}</h1>
      </div>
      <p className="text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}
```

- [ ] **Step 2: Reemplazar el `<h1>` de cada módulo por `AdminModuleHeader`**

En cada uno de los 6 módulos, importar `AdminModuleHeader` (`import { AdminModuleHeader } from './AdminModuleHeader';`) y sustituir la línea del título `<h1 className="font-playfair text-3xl font-bold text-essence-navy ...">Título</h1>` por el componente con estos textos (conservar el icono que ya importa cada módulo cuando aplique):

- Dashboard: `title="Dashboard"`, `subtitle="Resumen de tu perfumería: inventario, ventas y reseñas de un vistazo"`, `icon={LayoutDashboard}` (añadir el import del icono desde `lucide-react`).
- Perfumes (`AdminPerfumes.tsx`): `title="Perfumes"`, `subtitle="Agrega, edita y organiza tu catálogo con precios y stock"`, `icon={Package}` (importar `Package`). Mantener el botón "Nuevo perfume" tras la cabecera.
- Precios y stock (`AdminPricing.tsx`): `title="Precios y stock"`, `subtitle="Ajusta precios de venta, ofertas y existencias"`, `icon={DollarSign}`.
- Pedidos y pagos (`AdminOrders.tsx`): `title="Pedidos y pagos"`, `subtitle="Revisa pedidos, verifica pagos y actualiza su estado"`, `icon={ShoppingCart}`.
- Reseñas (`AdminReviews.tsx`): `title="Reseñas"`, `subtitle="Modera las opiniones de tus clientes: verifica o elimina"`, `icon={Star}`.
- Clientes (`AdminCustomers.tsx`): `title="Clientes"`, `subtitle="Consulta tus clientes registrados y su historial de compras"`, `icon={Users}`.

> Nota: donde el módulo tenía el `<h1>` con `mb-8`, `AdminModuleHeader` ya aporta el `mb-8`; eliminar el `mb-8` duplicado si quedara un contenedor vacío.

- [ ] **Step 3: Encabezados de tabla descriptivos**

En `AdminPerfumes.tsx`, en el `<thead>`, cambiar la celda `Precio` por `Precio de venta (BOB)`.

En `AdminPricing.tsx`, en el `<thead>`, cambiar: `Precio` → `Precio de venta (BOB)`, `Precio original` → `Precio antes de oferta (BOB)`, `Stock` → `Unidades en stock`.

- [ ] **Step 4: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos.

- [ ] **Step 5: Verificar en navegador**

Run: `npm run dev`. Cada módulo muestra título + subtítulo; las tablas de Perfumes y Precios muestran los encabezados nuevos.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin
git commit -m "feat: cabecera de módulo con subtítulos y encabezados de tabla descriptivos"
```

---

### Task 5: Sidebar por capacidades + guard del panel + módulos nuevos (stubs)

**Files:**
- Modify: `src/components/Admin/AdminSidebar.tsx`
- Modify: `src/components/Admin/AdminPanel.tsx`
- Create: `src/components/Admin/AdminSuppliers.tsx` (stub)
- Create: `src/components/Admin/AdminReports.tsx` (stub)
- Create: `src/components/Admin/AdminUsers.tsx` (stub)

**Interfaces:**
- Consumes: `can`, `Role`, `isStaffRole` (Task 1); `state.user.role`.
- Produces: `AdminModule` ampliado a `'dashboard' | 'perfumes' | 'pricing' | 'orders' | 'reviews' | 'customers' | 'suppliers' | 'reports' | 'users'`.

- [ ] **Step 1: Reescribir `src/components/Admin/AdminSidebar.tsx`**

```tsx
import React from 'react';
import {
  LayoutDashboard, Package, DollarSign, ShoppingCart, Star, Users,
  Truck, BarChart3, UserCog, ArrowLeft
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Capability, Role, can } from '../../data/permissions';

export type AdminModule =
  | 'dashboard' | 'perfumes' | 'pricing' | 'orders' | 'reviews' | 'customers'
  | 'suppliers' | 'reports' | 'users';

// Cada ítem requiere al menos una de estas capacidades para mostrarse.
const items: { id: AdminModule; label: string; icon: React.ElementType; caps: Capability[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, caps: ['viewDashboard'] },
  { id: 'perfumes', label: 'Perfumes', icon: Package, caps: ['manageCatalog'] },
  { id: 'pricing', label: 'Precios y stock', icon: DollarSign, caps: ['managePrices', 'manageStock'] },
  { id: 'suppliers', label: 'Proveedores', icon: Truck, caps: ['manageSuppliers'] },
  { id: 'orders', label: 'Pedidos y pagos', icon: ShoppingCart, caps: ['viewOrders'] },
  { id: 'customers', label: 'Clientes', icon: Users, caps: ['viewCustomers'] },
  { id: 'reviews', label: 'Reseñas', icon: Star, caps: ['manageReviews'] },
  { id: 'reports', label: 'Reportes', icon: BarChart3, caps: ['viewReportsSales', 'viewReportsInventory', 'viewReportsCustomers'] },
  { id: 'users', label: 'Usuarios', icon: UserCog, caps: ['manageUsers'] }
];

export function AdminSidebar({
  role,
  active,
  onSelect
}: {
  role: Role;
  active: AdminModule;
  onSelect: (m: AdminModule) => void;
}) {
  const { dispatch } = useApp();
  const visible = items.filter(item => item.caps.some(c => can(role, c)));
  return (
    <aside className="w-64 bg-essence-navy text-white min-h-screen p-6 flex-shrink-0">
      <h2 className="font-playfair text-2xl font-bold mb-8">Essence Admin</h2>
      <nav className="space-y-2">
        {visible.map(item => (
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

- [ ] **Step 2: Crear los tres stubs**

`src/components/Admin/AdminSuppliers.tsx`, `src/components/Admin/AdminReports.tsx`, `src/components/Admin/AdminUsers.tsx`, cada uno:

```tsx
import React from 'react';
export function AdminSuppliers() {
  return <div className="font-playfair text-2xl text-essence-navy">En construcción</div>;
}
```

(ajustar el nombre de la función por archivo: `AdminSuppliers`, `AdminReports`, `AdminUsers`).

- [ ] **Step 3: Reescribir `src/components/Admin/AdminPanel.tsx`**

```tsx
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminSidebar, AdminModule } from './AdminSidebar';
import { Role, isStaffRole } from '../../data/permissions';
import { AdminDashboard } from './AdminDashboard';
import { AdminPerfumes } from './AdminPerfumes';
import { AdminPricing } from './AdminPricing';
import { AdminSuppliers } from './AdminSuppliers';
import { AdminOrders } from './AdminOrders';
import { AdminCustomers } from './AdminCustomers';
import { AdminReviews } from './AdminReviews';
import { AdminReports } from './AdminReports';
import { AdminUsers } from './AdminUsers';

export function AdminPanel() {
  const { state } = useApp();
  const role = state.user?.role;
  const [module, setModule] = React.useState<AdminModule>('dashboard');

  if (!isStaffRole(role)) {
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
      case 'suppliers': return <AdminSuppliers />;
      case 'orders': return <AdminOrders />;
      case 'customers': return <AdminCustomers />;
      case 'reviews': return <AdminReviews />;
      case 'reports': return <AdminReports />;
      case 'users': return <AdminUsers />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-essence-light/5">
      <AdminSidebar role={role as Role} active={module} onSelect={setModule} />
      <main className="flex-1 p-8 overflow-x-auto">{render()}</main>
    </div>
  );
}
```

> Todos los roles tienen `viewDashboard`, por lo que el módulo inicial `'dashboard'` es válido para cualquier rol de personal.

- [ ] **Step 4: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos.

- [ ] **Step 5: Verificar en navegador**

Run: `npm run dev`. Como admin se ven los 9 módulos. (Con staff de otros roles se probará en tareas siguientes: vendedora sin Perfumes/Precios/Proveedores/Usuarios; inventarista sin Pedidos/Clientes/Reseñas/Usuarios.)

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin
git commit -m "feat: sidebar y panel por capacidades con módulos nuevos (stubs)"
```

---

### Task 6: Módulo Proveedores + vínculo en perfumes

**Files:**
- Create: `src/components/Admin/SupplierForm.tsx`
- Modify: `src/components/Admin/AdminSuppliers.tsx`
- Modify: `src/components/Admin/PerfumeForm.tsx`
- Modify: `src/components/Admin/AdminPerfumes.tsx`

**Interfaces:**
- Consumes: `state.suppliers`, `ADD_SUPPLIER`/`UPDATE_SUPPLIER`/`DELETE_SUPPLIER`, tipo `Supplier`.
- Produces: `SupplierForm` con props `{ initial?: Supplier; onSave: (s: Supplier) => void; onCancel: () => void }`.

- [ ] **Step 1: Crear `src/components/Admin/SupplierForm.tsx`**

```tsx
import React from 'react';
import { Supplier } from '../../types';

const empty: Supplier = { id: '', name: '', contactName: '', phone: '', email: '', notes: '' };

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple';

export function SupplierForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: Supplier;
  onSave: (s: Supplier) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Supplier>(initial ?? empty);
  const set = (field: keyof Supplier, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: form.id || Date.now().toString() });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">
        {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className={inputCls} placeholder="Nombre del proveedor" value={form.name} onChange={e => set('name', e.target.value)} required />
        <input className={inputCls} placeholder="Persona de contacto" value={form.contactName ?? ''} onChange={e => set('contactName', e.target.value)} />
        <input className={inputCls} placeholder="Teléfono" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
        <input className={inputCls} type="email" placeholder="Email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
      </div>
      <textarea className={inputCls} placeholder="Notas" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
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

- [ ] **Step 2: Implementar `src/components/Admin/AdminSuppliers.tsx`**

```tsx
import React from 'react';
import { Truck, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Supplier } from '../../types';
import { AdminModuleHeader } from './AdminModuleHeader';
import { SupplierForm } from './SupplierForm';

export function AdminSuppliers() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [creating, setCreating] = React.useState(false);

  const handleSave = (s: Supplier) => {
    if (editing) dispatch({ type: 'UPDATE_SUPPLIER', payload: s });
    else dispatch({ type: 'ADD_SUPPLIER', payload: s });
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return (
      <SupplierForm
        initial={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <AdminModuleHeader
          title="Proveedores"
          subtitle="Administra tus proveedores y vincúlalos a cada perfume"
          icon={Truck}
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo proveedor</span>
        </button>
      </div>

      {state.suppliers.length === 0 ? (
        <p className="text-gray-500">Aún no hay proveedores.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-essence-navy/5">
              <tr>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.suppliers.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-essence-navy">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contactName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setEditing(s)} className="p-2 text-essence-purple hover:bg-essence-purple/5 rounded-lg">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`¿Eliminar "${s.name}"?`)) dispatch({ type: 'DELETE_SUPPLIER', payload: s.id }); }}
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
      )}
    </div>
  );
}
```

- [ ] **Step 3: Añadir selector de proveedor en `PerfumeForm.tsx`**

En `src/components/Admin/PerfumeForm.tsx`: cambiar la firma para recibir la lista de proveedores y renderizar un `<select>`.

Cambiar las props del componente a:

```tsx
export function PerfumeForm({
  initial,
  suppliers,
  onSave,
  onCancel
}: {
  initial?: Perfume;
  suppliers: { id: string; name: string }[];
  onSave: (p: Perfume) => void;
  onCancel: () => void;
}) {
```

Dentro del grid de selects (el `<div className="grid grid-cols-2 md:grid-cols-4 gap-4">`), añadir un select más para el proveedor (queda en 5 columnas; cambiar ese contenedor a `md:grid-cols-5` para que entre bien) usando `form.supplierId`:

```tsx
        <select className={inputCls} value={form.supplierId ?? ''} onChange={e => set('supplierId', e.target.value || undefined)}>
          <option value="">Sin proveedor</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
```

(`set` ya acepta `unknown`, así que `undefined` es válido para limpiar el campo.)

- [ ] **Step 4: Pasar proveedores y mostrar la columna en `AdminPerfumes.tsx`**

En `src/components/Admin/AdminPerfumes.tsx`:

- Al renderizar `<PerfumeForm ... />`, pasar `suppliers={state.suppliers}`.
- En el `<thead>`, añadir una columna `Proveedor` antes de "Acciones".
- En cada fila, añadir la celda correspondiente resolviendo el nombre:

```tsx
                <td className="px-4 py-3 text-gray-600">
                  {state.suppliers.find(s => s.id === p.supplierId)?.name || '—'}
                </td>
```

- [ ] **Step 5: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos.

- [ ] **Step 6: Verificar en navegador**

Run: `npm run dev`. Crear un proveedor; en Perfumes, editar un perfume y asignarle el proveedor; la tabla de perfumes muestra el nombre del proveedor; persiste tras recargar.

- [ ] **Step 7: Commit**

```bash
git add src/components/Admin
git commit -m "feat: módulo de proveedores y vínculo con perfumes"
```

---

### Task 7: Utilidad CSV + Módulo Reportes

**Files:**
- Create: `src/utils/csv.ts`
- Modify: `src/components/Admin/AdminReports.tsx`

**Interfaces:**
- Consumes: `state.perfumes`, `state.orders`, `state.users`, `can`, `Role` (Task 1).
- Produces: `toCsv(headers, rows)`, `downloadCsv(filename, content)`.

- [ ] **Step 1: Crear `src/utils/csv.ts`**

```ts
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  return lines.join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Implementar `src/components/Admin/AdminReports.tsx`**

```tsx
import React from 'react';
import { BarChart3, Download } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Role, can } from '../../data/permissions';
import { AdminModuleHeader } from './AdminModuleHeader';
import { toCsv, downloadCsv } from '../../utils/csv';

type Tab = 'ventas' | 'inventario' | 'clientes';

export function AdminReports() {
  const { state } = useApp();
  const role = state.user?.role as Role | undefined;

  const tabs: { id: Tab; label: string; enabled: boolean }[] = [
    { id: 'ventas', label: 'Ventas', enabled: can(role, 'viewReportsSales') },
    { id: 'inventario', label: 'Inventario', enabled: can(role, 'viewReportsInventory') },
    { id: 'clientes', label: 'Clientes', enabled: can(role, 'viewReportsCustomers') }
  ].filter(t => t.enabled);

  const [tab, setTab] = React.useState<Tab>(tabs[0]?.id ?? 'ventas');

  const verified = state.orders.filter(o => o.paymentStatus === 'verificado');

  // Ventas
  const revenue = verified.reduce((sum, o) => sum + o.total, 0);
  const orderCount = verified.length;
  const avgTicket = orderCount ? Math.round(revenue / orderCount) : 0;
  const unitsByPerfume: Record<string, { name: string; units: number }> = {};
  verified.forEach(o => o.items.forEach(it => {
    unitsByPerfume[it.perfumeId] = {
      name: it.name,
      units: (unitsByPerfume[it.perfumeId]?.units ?? 0) + it.quantity
    };
  }));
  const topSelling = Object.values(unitsByPerfume).sort((a, b) => b.units - a.units);

  // Inventario
  const inventoryValue = state.perfumes.reduce((sum, p) => sum + p.price * p.stock, 0);
  const byCategory: Record<string, number> = {};
  state.perfumes.forEach(p => { byCategory[p.category] = (byCategory[p.category] ?? 0) + p.price * p.stock; });

  // Clientes
  const spentByEmail = (email: string) =>
    state.orders.filter(o => o.customer.email === email).reduce((sum, o) => sum + o.total, 0);
  const customerRows = state.users
    .map(u => ({
      name: u.name,
      email: u.email,
      orders: state.orders.filter(o => o.customer.email === u.email).length,
      spent: spentByEmail(u.email)
    }))
    .sort((a, b) => b.spent - a.spent);

  const exportCurrent = () => {
    if (tab === 'ventas') {
      downloadCsv('reporte-ventas.csv', toCsv(['Perfume', 'Unidades vendidas'], topSelling.map(t => [t.name, t.units])));
    } else if (tab === 'inventario') {
      downloadCsv('reporte-inventario.csv', toCsv(['Perfume', 'Unidades', 'Valor (BOB)'],
        state.perfumes.map(p => [p.name, p.stock, p.price * p.stock])));
    } else {
      downloadCsv('reporte-clientes.csv', toCsv(['Cliente', 'Email', 'Pedidos', 'Gasto (BOB)'],
        customerRows.map(c => [c.name, c.email, c.orders, c.spent])));
    }
  };

  const card = 'bg-white rounded-2xl shadow-lg p-6';
  const th = 'px-4 py-3 text-left';

  return (
    <div>
      <div className="flex items-start justify-between">
        <AdminModuleHeader
          title="Reportes"
          subtitle="Analiza ventas, inventario y clientes, y expórtalos a CSV"
          icon={BarChart3}
        />
        {tabs.length > 0 && (
          <button onClick={exportCurrent} className="flex items-center space-x-2 bg-essence-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-essence-plum">
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        )}
      </div>

      {tabs.length === 0 ? (
        <p className="text-gray-500">No tienes reportes disponibles.</p>
      ) : (
        <>
          <div className="flex space-x-2 mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg font-medium ${tab === t.id ? 'bg-essence-purple text-white' : 'bg-white text-essence-navy border border-gray-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'ventas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className={card}><div className="text-sm text-gray-500">Ingresos verificados</div><div className="text-2xl font-bold text-essence-navy">{revenue} BOB</div></div>
                <div className={card}><div className="text-sm text-gray-500">Pedidos verificados</div><div className="text-2xl font-bold text-essence-navy">{orderCount}</div></div>
                <div className={card}><div className="text-sm text-gray-500">Ticket promedio</div><div className="text-2xl font-bold text-essence-navy">{avgTicket} BOB</div></div>
              </div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Más vendidos</h3>
                {topSelling.length === 0 ? <p className="text-gray-500">Sin ventas verificadas todavía.</p> : (
                  <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Perfume</th><th className={th}>Unidades</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{topSelling.map(t => (<tr key={t.name}><td className="px-4 py-2">{t.name}</td><td className="px-4 py-2">{t.units}</td></tr>))}</tbody></table>
                )}
              </div>
            </div>
          )}

          {tab === 'inventario' && (
            <div className="space-y-6">
              <div className={card}><div className="text-sm text-gray-500">Valor total de inventario</div><div className="text-2xl font-bold text-essence-navy">{inventoryValue} BOB</div></div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Existencias por perfume</h3>
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Perfume</th><th className={th}>Unidades en stock</th><th className={th}>Valor (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{state.perfumes.map(p => (<tr key={p.id}><td className="px-4 py-2">{p.name}</td><td className="px-4 py-2">{p.stock}</td><td className="px-4 py-2">{p.price * p.stock}</td></tr>))}</tbody></table>
              </div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Valor por categoría</h3>
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Categoría</th><th className={th}>Valor (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{Object.entries(byCategory).map(([c, v]) => (<tr key={c}><td className="px-4 py-2 capitalize">{c}</td><td className="px-4 py-2">{v}</td></tr>))}</tbody></table>
              </div>
            </div>
          )}

          {tab === 'clientes' && (
            <div className={card}>
              <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Clientes por gasto</h3>
              {customerRows.length === 0 ? <p className="text-gray-500">Aún no hay clientes registrados.</p> : (
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Cliente</th><th className={th}>Email</th><th className={th}>Pedidos</th><th className={th}>Gasto (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{customerRows.map(c => (<tr key={c.email}><td className="px-4 py-2">{c.name}</td><td className="px-4 py-2">{c.email}</td><td className="px-4 py-2">{c.orders}</td><td className="px-4 py-2">{c.spent}</td></tr>))}</tbody></table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos.

- [ ] **Step 4: Verificar en navegador**

Run: `npm run dev`. Como admin, las tres pestañas muestran datos; "Exportar CSV" descarga el archivo de la pestaña activa. (El gateo por rol se prueba en la Task 9.)

- [ ] **Step 5: Commit**

```bash
git add src/utils/csv.ts src/components/Admin/AdminReports.tsx
git commit -m "feat: módulo de reportes con exportación CSV"
```

---

### Task 8: Módulo Usuarios (personal)

**Files:**
- Create: `src/components/Admin/StaffForm.tsx`
- Modify: `src/components/Admin/AdminUsers.tsx`

**Interfaces:**
- Consumes: `state.staff`, `ADD_STAFF`/`UPDATE_STAFF`/`DELETE_STAFF`, tipo `StaffUser`, `ROLE_LABELS`.
- Produces: `StaffForm` con props `{ initial?: StaffUser; onSave: (u: StaffUser) => void; onCancel: () => void }`.

- [ ] **Step 1: Crear `src/components/Admin/StaffForm.tsx`**

```tsx
import React from 'react';
import { StaffUser } from '../../types';
import { ROLE_LABELS, Role } from '../../data/permissions';

const emptyForm = { id: '', name: '', email: '', password: '', role: 'vendedora' as Role, active: true, createdAt: '' };

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple';

export function StaffForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: StaffUser;
  onSave: (u: StaffUser) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<StaffUser>(initial ?? emptyForm);
  const set = (field: keyof StaffUser, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      id: form.id || Date.now().toString(),
      createdAt: form.createdAt || new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">
        {initial ? 'Editar usuario' : 'Nuevo usuario'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className={inputCls} placeholder="Nombre" value={form.name} onChange={e => set('name', e.target.value)} required />
        <input className={inputCls} type="email" placeholder="Correo" value={form.email} onChange={e => set('email', e.target.value)} required />
        <input className={inputCls} placeholder="Contraseña" value={form.password} onChange={e => set('password', e.target.value)} required />
        <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
          {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
        <span>Cuenta activa</span>
      </label>
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

- [ ] **Step 2: Implementar `src/components/Admin/AdminUsers.tsx`**

```tsx
import React from 'react';
import { UserCog, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { StaffUser } from '../../types';
import { ROLE_LABELS, Role } from '../../data/permissions';
import { AdminModuleHeader } from './AdminModuleHeader';
import { StaffForm } from './StaffForm';

export function AdminUsers() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = React.useState<StaffUser | null>(null);
  const [creating, setCreating] = React.useState(false);

  const handleSave = (u: StaffUser) => {
    if (editing) dispatch({ type: 'UPDATE_STAFF', payload: u });
    else dispatch({ type: 'ADD_STAFF', payload: u });
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return (
      <StaffForm
        initial={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <AdminModuleHeader
          title="Usuarios"
          subtitle="Crea cuentas de personal y define qué puede hacer cada rol"
          icon={UserCog}
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo usuario</span>
        </button>
      </div>

      {state.staff.length === 0 ? (
        <p className="text-gray-500">Aún no hay usuarios de personal. La administradora principal ya tiene acceso.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-essence-navy/5">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.staff.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-essence-navy">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role as Role]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                      {u.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setEditing(u)} className="p-2 text-essence-purple hover:bg-essence-purple/5 rounded-lg">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`¿Eliminar a "${u.name}"?`)) dispatch({ type: 'DELETE_STAFF', payload: u.id }); }}
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
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos.

- [ ] **Step 4: Verificar en navegador**

Run: `npm run dev`. Como admin, crear una vendedora y una inventarista; cerrar sesión e iniciar con esas credenciales → cada una ve solo sus módulos.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/StaffForm.tsx src/components/Admin/AdminUsers.tsx
git commit -m "feat: módulo de gestión de usuarios de personal"
```

---

### Task 9: Gateo de precios por capacidad

**Files:**
- Modify: `src/components/Admin/AdminPricing.tsx`
- Modify: `src/components/Admin/PerfumeForm.tsx`

**Interfaces:**
- Consumes: `can`, `Role` (Task 1); `state.user.role`.

- [ ] **Step 1: Deshabilitar precios en `AdminPricing.tsx`**

En `src/components/Admin/AdminPricing.tsx`:

- Importar: `import { Role, can } from '../../data/permissions';`
- Dentro del componente, tras `const { state, dispatch } = useApp();`, añadir:

```tsx
  const role = state.user?.role as Role | undefined;
  const canPrices = can(role, 'managePrices');
```

- En los dos inputs de precio (el de `price` y el de `originalPrice`), añadir `disabled={!canPrices}` y una clase condicional de estilo deshabilitado, por ejemplo concatenando `${!canPrices ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}` a su `className`.
- En la función `save`, cuando `!canPrices`, no tomar los valores de precio del draft: al construir el payload, usar `price: canPrices && d?.price ? Number(d.price) : perfume.price` y `originalPrice: canPrices && d?.originalPrice ? Number(d.originalPrice) : perfume.originalPrice` (el stock se mantiene como está).

- [ ] **Step 2: Deshabilitar precios en `PerfumeForm.tsx`**

En `src/components/Admin/PerfumeForm.tsx`:

- Cambiar la firma para recibir `canPrices: boolean` (además de `suppliers` de la Task 6):

```tsx
export function PerfumeForm({
  initial,
  suppliers,
  canPrices,
  onSave,
  onCancel
}: {
  initial?: Perfume;
  suppliers: { id: string; name: string }[];
  canPrices: boolean;
  onSave: (p: Perfume) => void;
  onCancel: () => void;
}) {
```

- En los inputs de `price` y `originalPrice`, añadir `disabled={!canPrices}` y la misma clase condicional deshabilitada.
- En `handleSubmit`, si `!canPrices`, preservar los valores originales en vez de leer del form: usar `price: canPrices ? Number(form.price) : (initial?.price ?? 0)` y `originalPrice: canPrices ? (form.originalPrice ? Number(form.originalPrice) : undefined) : initial?.originalPrice`.

- [ ] **Step 3: Pasar `canPrices` desde `AdminPerfumes.tsx`**

En `src/components/Admin/AdminPerfumes.tsx`:

- Importar `import { Role, can } from '../../data/permissions';`
- Calcular `const canPrices = can(state.user?.role as Role | undefined, 'managePrices');`
- Pasar `canPrices={canPrices}` al `<PerfumeForm ... />` (que ya recibe `suppliers`).

- [ ] **Step 4: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores nuevos.

- [ ] **Step 5: Verificar en navegador**

Run: `npm run dev`. Iniciar como **inventarista**: en "Precios y stock" los campos de precio están deshabilitados pero el stock es editable y se guarda; en el formulario de perfume, precio deshabilitado, resto editable. Como **admin**, todos los campos editables.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin
git commit -m "feat: gateo de edición de precios por capacidad"
```

---

## Notas de ejecución

- Orden recomendado: Tasks 1 → 9 en secuencia. Task 5 crea stubs (suppliers/reports/users) que Tasks 6/7/8 reemplazan.
- Rama: continuar en `feat/panel-admin` (donde vive el panel actual).
- `window.confirm`/`window.alert` ya se usan en el proyecto; aceptables.
- Baseline de lint: ~6 errores preexistentes en Checkout/Header/ProductDetail/FragranceQuiz/ReviewsSection y un warning fast-refresh en AppContext; no introducir nuevos.
