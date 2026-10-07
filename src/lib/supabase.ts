const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────
export type Role = 'vendedor' | 'admin' | 'superadmin';

export interface Profile {
  id: string;
  full_name: string;
  last_name: string;
  phone: string;
  role: Role;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  last_name: string;
  document_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  category: ProductCategory;
  brand: string | null;
  description: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  supplier_id: string | null;
  image_url: string | null;
  use: string | null;
  expiry_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | null;
}

export type PaymentMethod = 'Efectivo' | 'QR';
export type SaleStatus = 'completada' | 'anulada';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_external?: boolean;
  external_cost?: number | null;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  client_id: string | null;
  seller_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  payment_image_url: string | null;
  status: SaleStatus;
  notes: string | null;
  created_at: string;
  client?: Client | null;
  seller?: Profile | null;
  sale_items?: SaleItem[];
}

export const CATEGORIES: ProductCategory[] = ['PERFUMERIA', 'CUIDADO_PERSONAL', 'COSMETICOS', 'OTRO'];
export const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'QR'];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(value || 0);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Field mapping helpers ─────────────────────────────────
const ROLE_MAP: Record<string, Role> = { admin: 'admin', vendedor: 'vendedor', inventarista: 'vendedor' };
const ROLE_MAP_REVERSE: Record<Role, string> = { vendedor: 'vendedor', admin: 'admin', superadmin: 'admin' };
const PAYMENT_MAP: Record<string, PaymentMethod> = { efectivo: 'Efectivo', qr: 'QR', transfer: 'Efectivo', card: 'Efectivo' };
const PAYMENT_MAP_REVERSE: Record<PaymentMethod, string> = { Efectivo: 'efectivo', QR: 'qr' };

function mapUser(u: any): Profile {
  return { id: u.id, full_name: u.name, last_name: u.lastName || '', phone: u.phone || '', role: ROLE_MAP[u.role] || 'vendedor', active: u.active ?? true, created_at: u.createdAt };
}
function mapUserReverse(p: Partial<Profile>) {
  const r: any = {};
  if (p.full_name !== undefined) r.name = p.full_name;
  if (p.last_name !== undefined) r.lastName = p.last_name;
  if (p.phone !== undefined) r.phone = p.phone;
  if (p.role !== undefined) r.role = ROLE_MAP_REVERSE[p.role] || 'vendedor';
  if (p.active !== undefined) r.active = p.active;
  return r;
}
function mapClient(c: any): Client {
  return { id: c.id, name: c.name, last_name: c.lastName || '', document_id: c.documentId || null, email: c.email || null, phone: c.phone || null, address: null, notes: null, created_at: c.createdAt };
}
function mapClientReverse(c: Partial<Client>) {
  const r: any = {};
  if (c.name !== undefined) r.name = c.name;
  if (c.last_name !== undefined) r.lastName = c.last_name;
  if (c.document_id !== undefined) r.documentId = c.document_id;
  if (c.email !== undefined) r.email = c.email;
  if (c.phone !== undefined) r.phone = c.phone;
  return r;
}
function mapSupplier(s: any): Supplier {
  return { id: s.id, name: s.name, contact_name: s.contactName || null, email: s.email || null, phone: s.phone || null, address: null, notes: s.notes || null, created_at: s.createdAt };
}
function mapSupplierReverse(s: Partial<Supplier>) {
  const r: any = {};
  if (s.name !== undefined) r.name = s.name;
  if (s.contact_name !== undefined) r.contactName = s.contact_name;
  if (s.email !== undefined) r.email = s.email;
  if (s.phone !== undefined) r.phone = s.phone;
  if (s.notes !== undefined) r.notes = s.notes;
  return r;
}
function mapProduct(p: any): Product {
  return { id: p.id, name: p.name, barcode: p.barcode || null, category: p.category || '', brand: p.brand || null, description: p.description || null, cost_price: p.purchasePrice ?? 0, sale_price: p.price ?? 0, stock: p.stock ?? 0, min_stock: p.minStock ?? 0, supplier_id: p.supplierId || null, image_url: p.image || null, use: p.use || null, expiry_date: p.expiryDate || null, active: true, created_at: p.createdAt, updated_at: p.updatedAt, supplier: p.supplier ? mapSupplier(p.supplier) : undefined };
}
function mapProductReverse(p: Partial<Product>) {
  const r: any = {};
  if (p.name !== undefined) r.name = p.name;
  if (p.brand !== undefined) r.brand = p.brand;
  if (p.category !== undefined) r.category = p.category;
  if (p.sale_price !== undefined) r.price = p.sale_price;
  if (p.cost_price !== undefined) r.purchasePrice = p.cost_price;
  if (p.stock !== undefined) r.stock = p.stock;
  if (p.min_stock !== undefined) r.minStock = p.min_stock;
  if (p.description !== undefined) r.description = p.description;
  if (p.barcode !== undefined) r.barcode = p.barcode;
  if (p.supplier_id !== undefined) r.supplierId = p.supplier_id;
  if (p.image_url !== undefined) r.image = p.image_url;
  if (p.use !== undefined) r.use = p.use;
  if (p.expiry_date !== undefined) r.expiryDate = p.expiry_date;
  return r;
}
function mapSale(s: any): Sale {
  return {
    id: s.id, invoice_number: s.id.slice(0, 8).toUpperCase(), client_id: s.customerId, seller_id: s.userId,
    subtotal: s.subtotal ?? 0, discount: s.discount ?? 0, tax: 0, total: s.total ?? 0,
    payment_method: PAYMENT_MAP[s.paymentMethod] || 'Efectivo', payment_reference: s.paymentReference || null, payment_image_url: null,
    status: 'completada', notes: null, created_at: s.createdAt,
    client: s.customer ? mapClient(s.customer) : undefined,
    seller: s.user ? mapUser(s.user) : undefined,
    sale_items: s.items?.map((i: any) => ({ id: i.id, sale_id: i.saleId, product_id: i.productId || '', product_name: i.name, quantity: i.quantity, unit_price: i.price, subtotal: i.price * i.quantity - (i.discount || 0), is_external: i.isExternal ?? false, external_cost: i.externalCost ?? null, created_at: '' })) || [],
  };
}
function mapSaleReverse(s: any) {
  const r: any = {};
  if (s.client_id !== undefined) r.customerId = s.client_id;
  if (s.seller_id !== undefined) r.userId = s.seller_id;
  if (s.customerName !== undefined) r.customerName = s.customerName;
  if (s.subtotal !== undefined) r.subtotal = s.subtotal;
  if (s.discount !== undefined) r.discount = s.discount;
  if (s.total !== undefined) r.total = s.total;
  if (s.payment_method !== undefined) r.paymentMethod = PAYMENT_MAP_REVERSE[s.payment_method] || 'efectivo';
  if (s.payment_reference !== undefined) r.paymentReference = s.payment_reference;
  if (s.notes !== undefined) r.notes = s.notes;
  return r;
}

// ─── Table to API endpoint mapping ─────────────────────────
const TABLE_ENDPOINTS: Record<string, string> = {
  profiles: 'users', users: 'users',
  clients: 'customers', customers: 'customers',
  suppliers: 'suppliers',
  products: 'products',
  sales: 'sales',
  sale_items: 'sales',
};

// ─── Chain query builder (Supabase-like API) ───────────────
function createQuery(table: string) {
  let op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let payload: any = null;
  let filters: Array<(row: any) => boolean> = [];
  let conditions: Array<{ col: string; op: string; val: any }> = [];
  let sortCol: string | null = null;
  let sortAsc = true;
  let limitN: number | null = null;
  let rangeFrom = 0;
  let rangeTo = 999;
  let singleMode = false;
  let selectStr = '*';
  let withRelated: string[] = [];

  const builder: any = {};
  builder.select = (s?: string) => { if (s) selectStr = s; op = 'select'; return builder; };
  builder.insert = (d: any) => { op = 'insert'; payload = d; return builder; };
  builder.update = (d: any) => { op = 'update'; payload = d; return builder; };
  builder.delete = () => { op = 'delete'; return builder; };
  builder.eq = (col: string, val: any) => { filters.push((r: any) => r[col] === val); conditions.push({ col, op: 'eq', val }); return builder; };
  builder.neq = (col: string, val: any) => { filters.push((r: any) => r[col] !== val); conditions.push({ col, op: 'neq', val }); return builder; };
  builder.gte = (col: string, val: any) => { filters.push((r: any) => r[col] >= val); conditions.push({ col, op: 'gte', val }); return builder; };
  builder.lte = (col: string, val: any) => { filters.push((r: any) => r[col] <= val); conditions.push({ col, op: 'lte', val }); return builder; };
  builder.gt = (col: string, val: any) => { filters.push((r: any) => r[col] > val); conditions.push({ col, op: 'gt', val }); return builder; };
  builder.lt = (col: string, val: any) => { filters.push((r: any) => r[col] < val); conditions.push({ col, op: 'lt', val }); return builder; };
  builder.is = (col: string, val: any) => { filters.push((r: any) => val === null ? r[col] === null : r[col] === val); conditions.push({ col, op: 'is', val }); return builder; };
  builder.not = (col: string, _op: string, val: any) => { filters.push((r: any) => r[col] !== val); conditions.push({ col, op: 'not', val }); return builder; };
  builder.in = (col: string, vals: any[]) => { filters.push((r: any) => vals.includes(r[col])); conditions.push({ col, op: 'in', val: vals }); return builder; };
  builder.order = (col: string, opts?: { ascending?: boolean }) => { sortCol = col; sortAsc = opts?.ascending !== false; return builder; };
  builder.limit = (n: number) => { limitN = n; return builder; };
  builder.range = (from: number, to: number) => { rangeFrom = from; rangeTo = to; return builder; };
  builder.single = () => { singleMode = true; return builder; };
  builder.maybeSingle = () => { singleMode = true; return builder; };

  builder.then = (resolve: any, reject: any) => execute().then(resolve, reject);

  async function execute(): Promise<{ data: any; error: null; count: number }> {
    try {
      const endpoint = TABLE_ENDPOINTS[table] || table;
      if (op === 'insert') {
        const rows = Array.isArray(payload) ? payload : [payload];
        const results = [];
        for (const row of rows) {
          let mapped = row;
          if (table === 'profiles' || table === 'users') mapped = mapUserReverse(row);
          else if (table === 'clients' || table === 'customers') mapped = mapClientReverse(row);
          else if (table === 'suppliers') mapped = mapSupplierReverse(row);
          else if (table === 'products') mapped = mapProductReverse(row);
          else if (table === 'sales') {
            // Map sale items to backend format
            const saleItems = (row.items || row.sale_items || []).map((i: any) => ({
              productId: i.productId || i.product_id || null,
              name: i.product_name || i.name,
              price: i.unit_price || i.price,
              quantity: i.quantity,
              discount: i.discount || 0,
              isExternal: i.is_external || i.isExternal || false,
              externalCost: i.external_cost ?? i.externalCost ?? null,
            }));
            // El backend calcula subtotal/total desde los items (no se envían).
            mapped = {
              customerId: row.client_id || row.customerId || null,
              userId: row.seller_id || row.userId || null,
              customerName: row.customer_name || row.customerName || null,
              discount: row.discount || 0,
              paymentMethod: PAYMENT_MAP_REVERSE[row.payment_method as PaymentMethod] || 'efectivo',
              paymentReference: row.payment_reference || row.paymentReference || null,
              items: saleItems,
            };
          }
          else if (table === 'sale_items') {
            mapped = { productId: row.product_id, name: row.product_name || row.name, price: row.unit_price || row.price, quantity: row.quantity, discount: row.discount || 0 };
          }
          const created = await api<any>(`/${endpoint}`, { method: 'POST', body: JSON.stringify(mapped) });
          results.push(created);
        }
        let mapped = results;
        if (table === 'profiles' || table === 'users') mapped = results.map(mapUser);
        else if (table === 'clients' || table === 'customers') mapped = results.map(mapClient);
        else if (table === 'products') mapped = results.map(mapProduct);
        else if (table === 'sales') mapped = results.map(mapSale);
        return { data: singleMode ? mapped[0] : mapped, error: null, count: mapped.length };
      }

      if (op === 'update') {
        let mapped = payload;
        if (table === 'profiles' || table === 'users') mapped = mapUserReverse(payload);
        else if (table === 'clients' || table === 'customers') mapped = mapClientReverse(payload);
        else if (table === 'suppliers') mapped = mapSupplierReverse(payload);
        else if (table === 'products') mapped = mapProductReverse(payload);
        else if (table === 'sales') mapped = mapSaleReverse(payload);
        const idCond = conditions.find((c) => c.col === 'id' && c.op === 'eq');
        if (!idCond) return { data: [], error: null, count: 0 };
        const id = String(idCond.val);
        const updated = await api<any>(`/${endpoint}/${id}`, { method: 'PATCH', body: JSON.stringify(mapped) });
        let result: any = updated;
        if (table === 'profiles' || table === 'users') result = mapUser(updated);
        else if (table === 'clients' || table === 'customers') result = mapClient(updated);
        else if (table === 'suppliers') result = mapSupplier(updated);
        else if (table === 'products') result = mapProduct(updated);
        else if (table === 'sales') result = mapSale(updated);
        return { data: result, error: null, count: 1 };
      }

      if (op === 'delete') {
        const idCond = conditions.find((c) => c.col === 'id' && c.op === 'eq');
        if (!idCond) return { data: [], error: null, count: 0 };
        const id = String(idCond.val);
        await api<any>(`/${endpoint}/${id}`, { method: 'DELETE' });
        return { data: [], error: null, count: 1 };
      }

      // SELECT
      let data: any[] = await api<any[]>(`/${endpoint}`);

      // Apply filters client-side (backend returns all)
      for (const f of filters) data = data.filter(f);

      // Map to frontend types
      if (table === 'profiles' || table === 'users') data = data.map(mapUser);
      else if (table === 'clients' || table === 'customers') data = data.map(mapClient);
      else if (table === 'suppliers') data = data.map(mapSupplier);
      else if (table === 'products') data = data.map(mapProduct);
      else if (table === 'sales') data = data.map(mapSale);

      // Sort
      if (sortCol) {
        data.sort((a, b) => {
          let va = a[sortCol!], vb = b[sortCol!];
          if (va == null) va = '';
          if (vb == null) vb = '';
          if (va < vb) return sortAsc ? -1 : 1;
          if (va > vb) return sortAsc ? 1 : -1;
          return 0;
        });
      }

      if (limitN !== null) data = data.slice(0, limitN);
      if (singleMode) return { data: data[0] ?? null, error: null, count: data.length };
      return { data, error: null, count: data.length };
    } catch (e: any) {
      return { data: null, error: null, count: 0 };
    }
  }

  return builder;
}

// ─── Public supabase-like object ───────────────────────────
let currentUser: any = null;
let currentProfile: Profile | null = null;

export const supabase = {
  from: (table: string) => createQuery(table),
  auth: {
    async getSession() {
      const sessStr = localStorage.getItem('camila_session');
      const stored = sessStr ? JSON.parse(sessStr) : null;
      return { data: { session: stored } };
    },
    onAuthStateChange(_cb: any) {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithPassword(creds: { email: string; password: string }) {
      try {
        const res = await api<any>('/auth/login', { method: 'POST', body: JSON.stringify(creds) });
        const rawUser = res.user || res;
        currentUser = JSON.stringify(rawUser);
        currentProfile = mapUser(rawUser);
        return { data: { user: currentProfile, session: { user: { id: rawUser.id }, access_token: 'mock-token' } }, error: null };
      } catch (e: any) {
        return { data: { user: null, session: null }, error: { message: e.message } };
      }
    },
    async signUp(creds: { email: string; password: string; options?: { data?: any } }) {
      try {
        const data = creds.options?.data || {};
        const role = (ROLE_MAP_REVERSE[data.role as Role] ?? 'vendedor');
        const user = await api<any>('/users', { method: 'POST', body: JSON.stringify({ email: creds.email, password: creds.password, name: data.full_name || 'Usuario', lastName: data.last_name || '', phone: data.phone || '', role }) });
        return { data: { user: { id: user.id } }, error: null };
      } catch (e: any) {
        return { data: { user: null }, error: { message: e.message } };
      }
    },
    async signOut() {
      currentUser = null;
      currentProfile = null;
      return { error: null };
    },
  },
};

export { currentProfile as _currentProfile, mapUser as _mapUser };
