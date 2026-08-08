# Panel Administrativo — Essence Perfumería

**Fecha:** 2026-08-08
**Estado:** Diseño aprobado, pendiente de plan de implementación

## Objetivo

Añadir un panel de administración completo y modular a la tienda de perfumería
Essence, que permita a un administrador gestionar el catálogo, precios, stock,
pedidos/pagos, reseñas y clientes. Los cambios deben reflejarse en la tienda
pública y persistir entre recargas.

## Contexto del proyecto

- SPA en **React 18 + TypeScript + Vite + Tailwind**, iconos `lucide-react`.
- Navegación por vistas mediante `currentView` en `AppContext` (reducer), sin router.
- Perfumes definidos estáticos en `src/data/perfumes.ts`, importados directo en 7
  componentes.
- Sin backend ni persistencia. Fuentes Playfair (títulos) + Inter (cuerpo).
- Paleta `essence-*`: navy `#1D1A39`, purple `#451952`, plum `#662949`,
  rose `#AE343A`, coral `#F30F5A`, light `#E8BCB9`.

## Decisiones tomadas

- **Persistencia:** `localStorage` (sin backend).
- **Acceso admin:** login con rol; credenciales fijas.
- **Módulos:** Dashboard, Perfumes (CRUD), Precios/Stock, Pedidos/Pagos,
  Reseñas, Clientes.

## Arquitectura

### Estado global (AppContext)

Se amplía `AppState` con:

- `perfumes: Perfume[]`
- `orders: Order[]`
- `users: User[]` (clientes registrados)

Nuevas acciones del reducer:

- Perfumes: `SET_PERFUMES`, `ADD_PERFUME`, `UPDATE_PERFUME`, `DELETE_PERFUME`
- Pedidos: `ADD_ORDER`, `UPDATE_ORDER` (estado de pago y de pedido)
- Reseñas: `DELETE_REVIEW`, `UPDATE_REVIEW` (verificar)
- Usuarios: `ADD_USER` (registro)

### Persistencia

- Claves: `essence_perfumes`, `essence_orders`, `essence_users`.
- **Hidratación al iniciar:** si existe la clave en `localStorage`, se usa; si no,
  se siembra `perfumes` desde `src/data/perfumes.ts` (orders y users vacíos).
- **Guardado:** un `useEffect` en `AppProvider` persiste cada slice cuando cambia.
- `src/data/perfumes.ts` se conserva como semilla inicial.

### Refactor de lectura

Los 7 componentes que hacen `import { perfumes } from '../../data/perfumes'`
pasan a leer `state.perfumes` del contexto (sin cambiar su diseño):
`FeaturedProducts`, `GiftMode`, `FragranceQuiz`, `ReviewsSection`,
`SmartSearch`, `ProductComparator`, `ProductGrid`.

## Tipos nuevos / modificados (`src/types/index.ts`)

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  role?: 'admin' | 'customer';   // nuevo
  createdAt?: string;            // nuevo
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

## Acceso admin

- Credenciales fijas (constante en el código): `admin@essence.com` / `Essence#2026`
  (definidas en un archivo de config, p.ej. `src/data/adminConfig.ts`).
- En `Login.tsx`: si email+clave coinciden con las de admin, se crea un `User` con
  `role: 'admin'` y se navega a la vista `'admin'`. Registro/login normal crea
  `role: 'customer'` y lo persiste en `essence_users`.
- Nueva vista `'admin'` en el union `currentView` y en el `switch` de `App.tsx`.
- El Header muestra el enlace "Panel Admin" solo si `state.user?.role === 'admin'`.
- La vista admin verifica el rol; si no es admin, muestra "Acceso denegado".

## Panel — layout y módulos

Componentes bajo `src/components/Admin/`:

- `AdminPanel.tsx` — layout: sidebar (`essence-navy`) + área de contenido; maneja
  el módulo activo con `useState` local.
- `AdminSidebar.tsx` — navegación entre módulos con iconos `lucide-react`.

Módulos:

1. **Dashboard** (`AdminDashboard.tsx`): tarjetas con nº de perfumes, valor de
   inventario (Σ precio×stock), productos con stock bajo (< umbral), pedidos por
   estado, ingresos (pedidos verificados), total de reseñas.
2. **Perfumes** (`AdminPerfumes.tsx` + `PerfumeForm.tsx`): tabla con búsqueda;
   crear/editar (modal o panel con todos los campos: nombre, marca, precio,
   precio original, imagen URL, descripción, notas top/middle/base, categoría,
   género, duración, intensidad, stock, flags Nuevo/Popular) y eliminar (con
   confirmación).
3. **Precios y stock** (`AdminPricing.tsx`): tabla editable inline de precio,
   precio original y stock; guardado por fila.
4. **Pedidos y pagos** (`AdminOrders.tsx`): lista de pedidos con filtro por estado;
   detalle del pedido; acciones para verificar/rechazar pago y cambiar estado del
   pedido.
5. **Reseñas** (`AdminReviews.tsx`): todas las reseñas agrupadas por perfume;
   eliminar y marcar como verificada.
6. **Clientes** (`AdminCustomers.tsx`): lista de usuarios registrados
   (`essence_users`) con su historial de pedidos (cruzando por email).

## Registro de pedidos (Checkout)

- `Checkout.handlePlaceOrder` construye un `Order` a partir de `formData` + carrito
  con `paymentStatus: 'pendiente'` y `orderStatus: 'pendiente'`, despacha `ADD_ORDER`,
  luego limpia el carrito. Así el módulo de pagos tiene datos reales.

## Estilo

Tailwind + paleta `essence-*`, Playfair/Inter, `lucide-react`, tarjetas
`rounded-2xl shadow-lg`, botones con gradientes `essence`, coherente con el resto
de la app.

## Fuera de alcance (YAGNI)

- Backend / API / base de datos real.
- Autenticación segura real (las credenciales son fijas y visibles en el cliente;
  es un panel de demostración, no producción).
- Subida de imágenes a un servidor (las imágenes se referencian por URL).
- Roles múltiples más allá de admin/customer.

## Criterios de éxito

- El admin inicia sesión con las credenciales fijas y ve el panel; un cliente no.
- Crear/editar/eliminar un perfume se refleja de inmediato en el catálogo público
  y persiste tras recargar.
- Editar precio/stock se refleja en la tienda y persiste.
- Un pedido hecho en el checkout aparece en el módulo de pedidos y su pago puede
  verificarse/rechazarse.
- Las reseñas pueden verse y eliminarse desde el panel.
- Los clientes registrados aparecen en el módulo de clientes con sus pedidos.
- `npm run build` y `npm run lint` pasan sin errores.
