# Roles, Reportes, Proveedores y mejoras de UI — Essence Perfumería

**Fecha:** 2026-08-11
**Estado:** Diseño aprobado, pendiente de plan de implementación
**Rama base:** `feat/panel-admin` (continúa el panel administrativo existente)

## Objetivo

Ampliar el panel administrativo con: control de acceso por roles (capacidades),
gestión de usuarios de personal, módulo de proveedores (vinculados a perfumes),
módulo de reportes con exportación CSV, y mejoras de UI (subtítulos descriptivos
por módulo y encabezados de tabla claros).

## Contexto

- Panel admin ya existente (React + TS + Vite + Tailwind, `localStorage`).
- `AppContext` guarda `perfumes`, `orders`, `users` (clientes), `user` (sesión).
- Panel con 6 módulos y sidebar (`src/components/Admin/`).
- Login: credencial fija admin → clientes. Solo rol admin abre el panel.
- Paleta `essence-*`, Playfair/Inter, `lucide-react`, tarjetas `rounded-2xl shadow-lg`.

## Decisiones tomadas

- **Roles:** Administradora (todo), Vendedora, Inventarista.
- **Permisos:** por capacidades discretas; gateo a nivel de módulo y de campo.
- **Acceso:** admin bootstrap fija; el resto del personal se crea desde un módulo
  de Usuarios (solo admin), guardado en `localStorage`.
- **Proveedores:** CRUD + vínculo `supplierId` en cada perfume.
- **Reportes:** Ventas, Inventario, Clientes, con exportación CSV.
- **UI:** subtítulos por módulo + encabezados de tabla descriptivos.

## Modelo de permisos

Nuevo archivo `src/data/permissions.ts`:

```ts
export type Role = 'admin' | 'vendedora' | 'inventarista';

export type Capability =
  | 'viewDashboard'
  | 'manageCatalog'   // crear/editar/eliminar datos del perfume (no precio)
  | 'managePrices'    // editar price / originalPrice
  | 'manageStock'     // editar stock
  | 'manageSuppliers'
  | 'viewOrders'      // ver pedidos y verificar pagos
  | 'viewCustomers'
  | 'manageReviews'
  | 'viewReportsSales'
  | 'viewReportsInventory'
  | 'viewReportsCustomers'
  | 'manageUsers';

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: [/* todas */],
  vendedora: ['viewDashboard', 'viewOrders', 'viewCustomers', 'manageReviews',
              'viewReportsSales', 'viewReportsCustomers'],
  inventarista: ['viewDashboard', 'manageCatalog', 'manageStock', 'manageSuppliers',
                 'viewReportsInventory']
};

export function can(role: Role | undefined, cap: Capability): boolean;
```

`admin` recibe explícitamente el arreglo completo de capacidades (enumeradas, no
un comodín, para que TypeScript verifique cobertura).

### Matriz resultante

| Capacidad | admin | vendedora | inventarista |
|---|:--:|:--:|:--:|
| viewDashboard | ✅ | ✅ | ✅ |
| manageCatalog | ✅ | — | ✅ |
| managePrices | ✅ | — | — |
| manageStock | ✅ | — | ✅ |
| manageSuppliers | ✅ | — | ✅ |
| viewOrders (pagos) | ✅ | ✅ | — |
| viewCustomers | ✅ | ✅ | — |
| manageReviews | ✅ | ✅ | — |
| viewReportsSales | ✅ | ✅ | — |
| viewReportsInventory | ✅ | — | ✅ |
| viewReportsCustomers | ✅ | ✅ | — |
| manageUsers | ✅ | — | — |

**Gateo de campo:** en "Precios y stock" y en el formulario de perfume, los inputs
de `price`/`originalPrice` se deshabilitan cuando `!can(role, 'managePrices')`.
La inventarista edita stock y datos, pero no precios.

## Tipos nuevos / modificados (`src/types/index.ts`)

```ts
export interface User {
  // ...campos actuales...
  role?: 'admin' | 'vendedora' | 'inventarista' | 'customer';
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

export interface Perfume {
  // ...campos actuales...
  supplierId?: string;
}
```

Nota: el union de `User.role` pasa de `'admin' | 'customer'` a incluir los nuevos
roles de personal. Revisar usos existentes de `role === 'admin'`.

## Estado y persistencia (`AppContext`)

Se añaden a `AppState`:

- `suppliers: Supplier[]` (clave `essence_suppliers`, default `[]`)
- `staff: StaffUser[]` (clave `essence_staff`, default `[]`)

Acciones nuevas:

- Proveedores: `ADD_SUPPLIER`, `UPDATE_SUPPLIER`, `DELETE_SUPPLIER`
- Personal: `ADD_STAFF`, `UPDATE_STAFF`, `DELETE_STAFF`

Persistencia con `useEffect` por slice (patrón existente). `load()` mantiene el
guard `Array.isArray` ya presente.

## Acceso (Login)

En `Login.tsx`, orden de verificación al iniciar sesión:

1. Credencial admin fija → sesión `role: 'admin'`, vista `admin`.
2. `state.staff` activo con email+password coincidentes → sesión con su rol,
   vista `admin`.
3. Cliente existente por email, o nuevo `role: 'customer'` → vista `home`.

El panel abre para cualquier rol de personal; el contenido lo limita el guard por
capacidades.

## Panel — cambios de layout

- `AdminSidebar`: cada ítem declara la capacidad que requiere; se filtran los que
  el rol no tiene. Ítems nuevos: **Proveedores**, **Reportes**, **Usuarios**.
- `AdminPanel`: el guard deja de exigir `role === 'admin'`; exige que el rol sea de
  personal (admin/vendedora/inventarista). Cada módulo verifica su capacidad y, si
  falta, muestra "Acceso denegado".
- El módulo activo por defecto es el primero que el rol puede ver.

## Módulos nuevos

### Proveedores (`AdminSuppliers.tsx` + `SupplierForm.tsx`)
CRUD de `Supplier`. Tabla con nombre/contacto/teléfono/email y acciones. El
`PerfumeForm` gana un `<select>` de proveedor (opcional); la tabla de perfumes
muestra el nombre del proveedor.

### Reportes (`AdminReports.tsx`)
Pestañas internas, cada una visible según capacidad de reporte del rol:

- **Ventas** (`viewReportsSales`): ingresos de pedidos `paymentStatus === 'verificado'`,
  nº de pedidos, ticket promedio, ranking de perfumes por unidades vendidas
  (sumando `items` de pedidos verificados).
- **Inventario** (`viewReportsInventory`): valor total (Σ price×stock), tabla por
  perfume (unidades, valor), stock bajo/agotado, valor por categoría.
- **Clientes** (`viewReportsCustomers`): ranking por gasto (Σ total de sus pedidos),
  nº de pedidos, nuevos registros (por `createdAt`).

Cada pestaña tiene botón **Exportar CSV** que genera y descarga el archivo desde
el navegador (Blob + enlace). Helper compartido `src/utils/csv.ts` con
`toCsv(rows, headers)` y `downloadCsv(filename, content)`.

### Usuarios (`AdminUsers.tsx` + `StaffForm.tsx`, capacidad `manageUsers`)
CRUD de `StaffUser`: crear personal con nombre/correo/clave/rol, activar/desactivar,
eliminar. La administradora bootstrap fija no aparece en la lista (no es editable).

## Mejoras de UI

- **Subtítulo por módulo:** cada cabecera de módulo muestra el título (Playfair) y
  debajo una línea descriptiva en `text-gray-500`. Se centraliza el patrón en un
  pequeño componente `AdminModuleHeader.tsx` con props `{ title, subtitle, icon }`
  y se usa en todos los módulos (incluidos los existentes).
- **Encabezados de tabla descriptivos:**
  - Perfumes: `Precio` → "Precio de venta (BOB)".
  - Precios y stock: `Precio` → "Precio de venta (BOB)", `Precio original` →
    "Precio antes de oferta (BOB)", `Stock` → "Unidades en stock".
- Textos de subtítulo (ejemplos): Perfumes → "Agrega, edita y organiza tu catálogo
  con precios y stock"; Precios y stock → "Ajusta precios de venta, ofertas y
  existencias"; Proveedores → "Administra tus proveedores y vincúlalos a cada
  perfume"; Reportes → "Analiza ventas, inventario y clientes, y expórtalos a CSV";
  Usuarios → "Crea cuentas de personal y define qué puede hacer cada rol".

## Fuera de alcance (YAGNI)

- Backend / API / base de datos real; hashing de contraseñas (se guardan en claro,
  es demo).
- Recuperación de contraseña para personal.
- Reportes con gráficos (solo tablas + resumen numérico); se puede añadir después.
- Rangos de fecha personalizados en reportes (se usa "todo el histórico" disponible).

## Criterios de éxito

- Iniciar sesión como vendedora e inventarista (creadas por la admin) abre el panel
  con solo los módulos permitidos; los no permitidos no aparecen y su acceso directo
  muestra "Acceso denegado".
- La inventarista puede editar stock y datos de perfume/proveedores, pero los campos
  de precio están deshabilitados; la vendedora no ve precios/perfumes/proveedores.
- Proveedores se crean y se pueden asignar a perfumes; el perfume muestra su proveedor.
- Los tres reportes muestran cifras correctas y se exportan a CSV descargable.
- Cada módulo muestra su subtítulo y las tablas tienen encabezados descriptivos.
- `npm run build` y `npm run lint` sin errores nuevos.
