import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, ScanLine, Edit2, Trash2, Package, AlertTriangle, Loader2, Filter, X, LayoutGrid, List, Percent, Layers, Truck } from 'lucide-react';
import { supabase, Product, Supplier, formatCurrency, formatExpiry, toExpiryISO } from '@/lib/supabase';
import { batchesApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { ScanCounter } from '@/components/ScanCounter';
import { ExpiryInput } from '@/components/ExpiryInput';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Pager } from '@/components/ui/Pager';
import { useToast } from '@/components/ui/Toast';
import { soloEnteros, soloDecimales, titleCase, soloLetras, normalizePhone, isValidPhone, PHONE_PREFIX } from '@/lib/validation';

const emptyForm = {
  name: '', barcode: '', category: '', brand: '', description: '',
  cost_price: '', sale_price: '', margin: '', stock: '', min_stock: '5',
  supplier_id: '', active: true,
  use: '', expiry_date: '',
};

// Margen a partir de costo y venta, en la unidad elegida (Bs o %).
function calcMargin(costStr: string, saleStr: string, unit: 'bs' | '%'): string {
  if (costStr === '' || saleStr === '') return '';
  const cost = parseFloat(costStr) || 0;
  const sale = parseFloat(saleStr) || 0;
  if (unit === '%') return cost > 0 ? ((sale - cost) / cost * 100).toFixed(1) : '';
  return (sale - cost).toFixed(2);
}

// Precio de venta a partir de costo y margen, en la unidad elegida.
function calcSale(costStr: string, marginStr: string, unit: 'bs' | '%'): string {
  if (costStr === '' || marginStr === '') return '';
  const cost = parseFloat(costStr) || 0;
  const m = parseFloat(marginStr) || 0;
  return unit === '%' ? (cost * (1 + m / 100)).toFixed(2) : (cost + m).toFixed(2);
}

// Lista fija de "Uso" para subcategorizar los productos.
const USES = ['Facial', 'Corporal', 'Capilar', 'Manos/Uñas', 'Maquillaje', 'Otro'];

const PAGE_SIZE = 12;

// Estado de caducidad de un producto (null si no tiene fecha).
function expiryStatus(date: string | null): { label: string; cls: string } | null {
  if (!date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(date); exp.setHours(0, 0, 0, 0);
  const days = Math.round((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: 'Vencido', cls: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' };
  if (days <= 30) return { label: `Vence en ${days}d`, cls: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' };
  return null;
}

export function Products() {
  const { profile } = useAuth();
  const { show } = useToast();
  const canEdit = profile?.role === 'admin' || profile?.role === 'superadmin';

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [useFilter, setUseFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try { return (localStorage.getItem('camila_products_view') as 'cards' | 'table') || 'cards'; } catch { return 'cards'; }
  });
  useEffect(() => { try { localStorage.setItem('camila_products_view', viewMode); } catch { /* ignore */ } }, [viewMode]);
  const [marginUnit, setMarginUnit] = useState<'bs' | '%'>(() => {
    try { return (localStorage.getItem('camila_margin_unit') as 'bs' | '%') || 'bs'; } catch { return 'bs'; }
  });
  useEffect(() => { try { localStorage.setItem('camila_margin_unit', marginUnit); } catch { /* ignore */ } }, [marginUnit]);
  const toggleMarginUnit = () => {
    const next = marginUnit === 'bs' ? '%' : 'bs';
    setMarginUnit(next);
    setForm((f) => ({ ...f, margin: calcMargin(f.cost_price, f.sale_price, next) }));
  };

  // Margen bidireccional: según dónde se escribe, se calcula lo demás.
  const handleCostChange = (raw: string) => {
    const cost = soloDecimales(raw);
    setForm((f) => ({ ...f, cost_price: cost, margin: calcMargin(cost, f.sale_price, marginUnit) }));
  };
  const handleSaleChange = (raw: string) => {
    const sale = soloDecimales(raw);
    setForm((f) => ({ ...f, sale_price: sale, margin: calcMargin(f.cost_price, sale, marginUnit) }));
  };
  const handleMarginChange = (raw: string) => {
    const margin = soloDecimales(raw);
    setForm((f) => ({ ...f, margin, sale_price: f.cost_price !== '' && margin !== '' ? calcSale(f.cost_price, margin, marginUnit) : f.sale_price }));
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'filter' | 'form' | 'batch'>('filter');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [page, setPage] = useState(1);

  // ─── Creación rápida de proveedor ────────────────────────
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', contact_name: '' });
  const [savingSupplier, setSavingSupplier] = useState(false);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) { show('El nombre del proveedor es obligatorio', 'error'); return; }
    if (supplierForm.phone && !isValidPhone(supplierForm.phone)) { show('El teléfono debe tener 8 dígitos', 'error'); return; }
    const duplicate = suppliers.find((s) => s.name.toLowerCase() === supplierForm.name.toLowerCase());
    if (duplicate) { show('Ya existe un proveedor con ese nombre', 'error'); return; }
    setSavingSupplier(true);
    const payload = {
      name: titleCase(supplierForm.name),
      contact_name: supplierForm.contact_name ? titleCase(supplierForm.contact_name) : null,
      nit: null, email: null,
      phone: supplierForm.phone ? normalizePhone(supplierForm.phone) : null,
      address: null, notes: null,
    };
    const { data, error } = await supabase.from('suppliers').insert(payload).select().single();
    if (error) { show(error.message, 'error'); setSavingSupplier(false); return; }
    const newSupplier = data as Supplier;
    setSuppliers((prev) => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f) => ({ ...f, supplier_id: newSupplier.id }));
    setSupplierForm({ name: '', phone: '', contact_name: '' });
    setSupplierModalOpen(false);
    setSavingSupplier(false);
    show('Proveedor creado y seleccionado');
  };

  // ─── Creación rápida de categoría ────────────────────────
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catInput, setCatInput] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('camila_custom_categories') || '[]'); } catch { return []; }
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = titleCase(catInput.trim());
    if (!cat) { show('Escribe un nombre para la categoría', 'error'); return; }
    const updated = [...new Set([...customCategories, cat])];
    setCustomCategories(updated);
    try { localStorage.setItem('camila_custom_categories', JSON.stringify(updated)); } catch { /* ignore */ }
    setForm((f) => ({ ...f, category: cat }));
    setNewCategory('');
    setCatInput('');
    setCatModalOpen(false);
    show('Categoría creada y seleccionada');
  };

  // ─── Creación rápida de marca ─────────────────────────────
  const [brandInput, setBrandInput] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandModalInput, setBrandModalInput] = useState('');
  const [customBrands, setCustomBrands] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('camila_custom_brands') || '[]'); } catch { return []; }
  });

  const allBrands = useMemo(() => {
    return [...new Set([
      ...products.map((p) => p.brand).filter(Boolean) as string[],
      ...customBrands,
    ])].sort();
  }, [products, customBrands]);

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const b = titleCase(brandModalInput.trim());
    if (!b) { show('Escribe un nombre para la marca', 'error'); return; }
    const updated = [...new Set([...customBrands, b])];
    setCustomBrands(updated);
    try { localStorage.setItem('camila_custom_brands', JSON.stringify(updated)); } catch { /* ignore */ }
    setForm((f) => ({ ...f, brand: b }));
    setBrandInput('');
    setBrandModalInput('');
    setBrandModalOpen(false);
    show('Marca creada y seleccionada');
  };

  // ─── Creación rápida de uso ───────────────────────────────
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [customUses, setCustomUses] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('camila_custom_uses') || '[]'); } catch { return []; }
  });
  const [useInput, setUseInput] = useState('');
  const allUses = useMemo(() => [...new Set([...USES, ...customUses])].sort(), [customUses]);

  const handleCreateUse = (e: React.FormEvent) => {
    e.preventDefault();
    const u = titleCase(useInput.trim());
    if (!u) { show('Escribe un nombre para el uso', 'error'); return; }
    const updated = [...new Set([...customUses, u])];
    setCustomUses(updated);
    try { localStorage.setItem('camila_custom_uses', JSON.stringify(updated)); } catch { /* ignore */ }
    setForm((f) => ({ ...f, use: u }));
    setUseInput('');
    setUseModalOpen(false);
    show('Uso creado y seleccionado');
  };

  useEffect(() => { loadProducts(); loadSuppliers(); }, []);
  useEffect(() => { setPage(1); }, [search, categoryFilter, brandFilter, useFilter, stockFilter, viewMode]);

  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase.from('products').select('*, supplier:suppliers(*)').order('created_at', { ascending: false });
    setProducts((data as Product[]) ?? []);
    if (!silent) setLoading(false);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    setSuppliers((data as Supplier[]) ?? []);
  };

  const allCategories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    const merged = [...new Set([...fromProducts, ...customCategories])].sort();
    return merged;
  }, [products, customCategories]);

  // Marcas disponibles según la categoría elegida (filtro en cascada).
  const availableBrands = useMemo(() => {
    const inCategory = categoryFilter === 'all' ? products : products.filter((p) => p.category === categoryFilter);
    return [...new Set(inCategory.map((p) => p.brand).filter(Boolean) as string[])].sort();
  }, [products, categoryFilter]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.brand?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchBrand = brandFilter === 'all' || p.brand === brandFilter;
      const matchUse = useFilter === 'all' || p.use === useFilter;
      const matchStock = stockFilter === 'all' || (stockFilter === 'low' && p.stock <= p.min_stock && p.stock > 0) || (stockFilter === 'out' && p.stock === 0) || (stockFilter === 'ok' && p.stock > p.min_stock);
      return matchSearch && matchCategory && matchBrand && matchUse && matchStock;
    });
  }, [products, search, categoryFilter, brandFilter, useFilter, stockFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setNewCategory(''); setCountingNew(false); setCountingBatch(false); setShowReponer(false); setBatchBarcode(''); setModalOpen(true); };

  const openEdit = (product: Product) => {
    setEditing(product);
    setShowReponer(false);
    setCountingNew(false); setCountingBatch(false);
    setBatchQty(''); setBatchExpiry(''); setBatchBarcode('');
    setNewCategory('');
    setForm({
      name: product.name, barcode: product.barcode ?? '', category: product.category,
      brand: product.brand ?? '', description: product.description ?? '',
      cost_price: String(product.cost_price), sale_price: String(product.sale_price),
      margin: calcMargin(String(product.cost_price), String(product.sale_price), marginUnit),
      stock: String(product.stock), min_stock: String(product.min_stock),
      supplier_id: product.supplier_id ?? '', active: product.active,
      use: product.use ?? '', expiry_date: product.expiry_date ? product.expiry_date.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  // ─── Lotes ───────────────────────────────────────────────
  const [batchQty, setBatchQty] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchBarcode, setBatchBarcode] = useState(''); // código de la caja/lote que llega (puede diferir del principal)
  const [batchBusy, setBatchBusy] = useState(false);
  const [showReponer, setShowReponer] = useState(false);
  const [countingNew, setCountingNew] = useState(false);   // contar stock inicial escaneando
  const [countingBatch, setCountingBatch] = useState(false); // contar reposición escaneando

  // Vuelve a cargar el producto en edición (y la lista) tras cambiar lotes.
  const reloadEditing = async () => {
    await loadProducts(true);
    if (editing) {
      const { data } = await supabase.from('products').select('*').eq('id', editing.id).single();
      const p = data as Product | null;
      if (p) {
        setEditing(p);
        setForm((f) => ({ ...f, stock: String(p.stock), expiry_date: p.expiry_date ? p.expiry_date.slice(0, 10) : '' }));
      }
    }
  };

  const handleAddBatch = async () => {
    if (!editing) return;
    const qty = parseInt(batchQty);
    if (!qty || qty < 1) { show('Ingresa una cantidad válida', 'error'); return; }
    setBatchBusy(true);
    try {
      await batchesApi.add(editing.id, { quantity: qty, barcode: batchBarcode.trim() || null, expiryDate: batchExpiry ? toExpiryISO(batchExpiry) : null });
      setBatchQty(''); setBatchExpiry(''); setBatchBarcode(''); setShowReponer(false);
      await reloadEditing();
      show('Stock repuesto (lote agregado)');
    } catch (e: any) { show(e.message || 'Error al agregar lote', 'error'); }
    setBatchBusy(false);
  };

  const handleRemoveBatch = async (batchId: string) => {
    if (!editing) return;
    setBatchBusy(true);
    try {
      await batchesApi.remove(editing.id, batchId);
      await reloadEditing();
      show('Lote eliminado');
    } catch (e: any) { show(e.message || 'Error al eliminar lote', 'error'); }
    setBatchBusy(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cat = titleCase(newCategory.trim() || form.category);
    if (!cat) { show('Selecciona o crea una categoría', 'error'); setSaving(false); return; }

    const payload = {
      name: titleCase(form.name), barcode: form.barcode || null, category: cat,
      brand: form.brand ? titleCase(form.brand) : null, description: form.description || null,
      cost_price: parseFloat(form.cost_price) || 0, sale_price: parseFloat(form.sale_price) || 0,
      stock: parseInt(form.stock) || 0, min_stock: parseInt(form.min_stock) || 0,
      supplier_id: form.supplier_id || null, active: form.active,
      use: form.use ? titleCase(form.use) : null,
      expiry_date: form.expiry_date ? toExpiryISO(form.expiry_date) : null,
    };

    let hasError = false;
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { show(error.message, 'error'); hasError = true; } else show('Producto actualizado');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { show(error.message, 'error'); hasError = true; } else show('Producto creado');
    }
    if (!hasError) { setModalOpen(false); loadProducts(true); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) show(error.message, 'error');
    else { show('Producto eliminado'); loadProducts(true); }
    setDeleting(false);
    setDeleteId(null);
  };

  // Busca un producto por cualquiera de sus códigos: el principal o el de algún lote.
  const findByCode = (code: string) =>
    products.find((x) => x.barcode === code || x.batches?.some((b) => b.barcode === code));

  const handleScan = (code: string) => {
    if (scannerTarget === 'filter') setSearch(code);
    else if (scannerTarget === 'batch') setBatchBarcode(code);
    else setForm((f) => ({ ...f, barcode: code }));
    setScannerOpen(false);
  };

  // Con el modal abierto, el lector físico llena el campo Código sin necesidad
  // de hacer clic en él. En "Reponer stock" llena el código del lote nuevo.
  useBarcodeScanner((code) => {
    if (showReponer) { setBatchBarcode(code); show(`Código del lote: ${code}`); }
    else { setForm((f) => ({ ...f, barcode: code })); show(`Código capturado: ${code}`); }
  }, { enabled: modalOpen && !countingNew && !countingBatch });

  // En la lista (modal cerrado): escanear el código de un producto que llega
  // abre su ficha directamente en "Reponer stock". Si no existe, lo busca.
  useBarcodeScanner((code) => {
    const p = findByCode(code);
    if (p) { openEdit(p); setShowReponer(true); show(`Reponer stock: ${p.name}`); }
    else { setSearch(code); show(`Código no registrado: ${code}`, 'error'); }
  }, { enabled: !modalOpen });

  const activeFilters = categoryFilter !== 'all' || brandFilter !== 'all' || useFilter !== 'all' || stockFilter !== 'all';
  const lowStockCount = products.filter((p) => p.stock <= p.min_stock && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // Margen de ganancia calculado a partir del precio de costo y de venta.
  const costNum = parseFloat(form.cost_price) || 0;
  const saleNum = parseFloat(form.sale_price) || 0;
  const marginNum = saleNum - costNum;
  const marginPctNum = costNum > 0 ? (marginNum / costNum) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Productos</h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">
            {filtered.length} de {products.length} productos
            {lowStockCount > 0 && <span className="text-error-600 dark:text-error-400 ml-2">· {lowStockCount} stock bajo</span>}
            {outOfStockCount > 0 && <span className="text-error-600 dark:text-error-400 ml-2">· {outOfStockCount} agotados</span>}
          </p>
        </div>
        {canEdit && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Nuevo producto</button>}
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, marca o código..." className="input pl-11" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"><X size={16} /></button>}
          </div>
          <button onClick={() => { setScannerTarget('filter'); setScannerOpen(true); }} className="btn-secondary"><ScanLine size={18} /> Escanear</button>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary ${activeFilters ? 'border-primary-300 text-primary-600 dark:border-primary-700 dark:text-primary-400' : ''}`}><Filter size={18} /> Filtros</button>
          <button onClick={toggleMarginUnit} className="btn-secondary" title="Cambiar cómo se muestra el margen"><Percent size={18} /> Margen {marginUnit === 'bs' ? 'Bs' : '%'}</button>
          <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shrink-0">
            <button type="button" onClick={() => setViewMode('cards')} title="Tarjetas" className={`px-3 ${viewMode === 'cards' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'text-neutral-400 hover:text-neutral-600'}`}><LayoutGrid size={18} /></button>
            <button type="button" onClick={() => setViewMode('table')} title="Tabla" className={`px-3 ${viewMode === 'table' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'text-neutral-400 hover:text-neutral-600'}`}><List size={18} /></button>
          </div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 animate-fade-in">
            <div>
              <label className="label">Categoría</label>
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setBrandFilter('all'); }} className="select">
                <option value="all">Todas</option>
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Marca</label>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="select">
                <option value="all">Todas</option>
                {availableBrands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Uso</label>
              <select value={useFilter} onChange={(e) => setUseFilter(e.target.value)} className="select">
                <option value="all">Todos</option>
                {USES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Stock</label>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="select">
                <option value="all">Todos</option>
                <option value="ok">En stock</option>
                <option value="low">Stock bajo</option>
                <option value="out">Agotado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center"><Package size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" /><p className="text-neutral-400 dark:text-neutral-500">No se encontraron productos</p></div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((product) => {
            const stockLevel = product.stock === 0 ? 'out' : product.stock <= product.min_stock ? 'low' : 'ok';
            const margin = product.cost_price > 0 ? (product.sale_price - product.cost_price) : 0;
            const exp = expiryStatus(product.expiry_date);
            return (
              <div key={product.id} className="card p-5 hover:shadow-glow transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/40 dark:to-secondary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400"><Package size={24} /></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {canEdit && (
                      <>
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteId(product.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">{[product.brand, product.category, product.use].filter(Boolean).join(' · ')}</p>
                {exp && <span className={`badge mb-2 ${exp.cls}`}><AlertTriangle size={12} /> {exp.label}</span>}
                {product.barcode && <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono mb-2 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded">{product.barcode}</p>}
                {product.description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2 line-clamp-2 italic">{product.description}</p>}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.sale_price)}</p>
                    {canEdit && product.cost_price > 0 && <p className="text-xs text-neutral-400">Costo: {formatCurrency(product.cost_price)} · Margen: {marginUnit === 'bs' ? formatCurrency(margin) : `${((margin / product.cost_price) * 100).toFixed(1)}%`}</p>}
                  </div>
                  <span className={`badge ${stockLevel === 'out' ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' : stockLevel === 'low' ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' : 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'}`}>
                    {stockLevel === 'out' && <AlertTriangle size={12} />}
                    {product.stock} en stock
                  </span>
                </div>
                {product.min_stock > 0 && stockLevel !== 'ok' && (
                  <p className="text-xs text-error-600 dark:text-error-400 mb-2">Mínimo: {product.min_stock} unidades</p>
                )}
                {product.supplier && <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">Prov: {product.supplier.name}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-left text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Uso</th>
                <th className="px-4 py-3">P. venta</th>
                {canEdit && <th className="px-4 py-3">Costo</th>}
                {canEdit && <th className="px-4 py-3">Margen {marginUnit === 'bs' ? '(Bs)' : '(%)'}</th>}
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Caducidad</th>
                {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {paged.map((product) => {
                const stockLevel = product.stock === 0 ? 'out' : product.stock <= product.min_stock ? 'low' : 'ok';
                const exp = expiryStatus(product.expiry_date);
                return (
                  <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800 dark:text-neutral-100">{product.name}</p>
                      <p className="text-xs text-neutral-400">{product.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{product.category || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{product.use || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(product.sale_price)}</td>
                    {canEdit && <td className="px-4 py-3 text-neutral-500">{product.cost_price > 0 ? formatCurrency(product.cost_price) : '—'}</td>}
                    {canEdit && <td className="px-4 py-3 text-neutral-500">{product.cost_price > 0 ? (marginUnit === 'bs' ? formatCurrency(product.sale_price - product.cost_price) : `${(((product.sale_price - product.cost_price) / product.cost_price) * 100).toFixed(1)}%`) : '—'}</td>}
                    <td className="px-4 py-3">
                      <span className={`badge ${stockLevel === 'out' ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' : stockLevel === 'low' ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' : 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'}`}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">{exp ? <span className={`badge ${exp.cls}`}>{exp.label}</span> : (product.expiry_date ? formatExpiry(product.expiry_date) : '—')}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"><Edit2 size={16} /></button>
                          <button onClick={() => setDeleteId(product.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="product-form" className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{editing ? 'Guardar' : 'Crear'}</button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Ej: Crema Hidratante Nivea 200ml" required />
            </div>

            <div>
              <label className="label">Código de barras</label>
              <div className="flex gap-2">
                <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="input" placeholder="Escanear o digitar" />
                <button type="button" onClick={() => { setScannerTarget('form'); setScannerOpen(true); }} className="btn-secondary px-3"><ScanLine size={18} /></button>
              </div>
            </div>

            <div className="relative">
              <label className="label">Categoría *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={newCategory || form.category}
                    onChange={(e) => { setNewCategory(e.target.value); setForm({ ...form, category: '' }); }}
                    onFocus={() => setShowCatDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
                    className="input"
                    placeholder="Escribe o selecciona una categoría"
                  />
                  {showCatDropdown && allCategories.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                      {allCategories.filter((c) => !newCategory || c.toLowerCase().includes(newCategory.toLowerCase())).map((c) => (
                        <button key={c} type="button" onMouseDown={() => { setForm({ ...form, category: c }); setNewCategory(''); setShowCatDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200">{c}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setCatInput(newCategory); setCatModalOpen(true); }} className="btn-secondary px-3 shrink-0" title="Crear nueva categoría">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="label">Marca</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={brandInput || form.brand}
                    onChange={(e) => { setBrandInput(e.target.value); setForm({ ...form, brand: '' }); }}
                    onFocus={() => setShowBrandDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                    className="input"
                    placeholder="Ej: Nivea, L'Oreal, Avon"
                  />
                  {showBrandDropdown && allBrands.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                      {allBrands.filter((b) => !brandInput || b.toLowerCase().includes(brandInput.toLowerCase())).map((b) => (
                        <button key={b} type="button" onMouseDown={() => { setForm({ ...form, brand: b }); setBrandInput(''); setShowBrandDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200">{b}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setBrandModalInput(brandInput || form.brand); setBrandModalOpen(true); }} className="btn-secondary px-3 shrink-0" title="Crear nueva marca">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="label">Uso</label>
              <div className="flex gap-2">
                <select value={form.use} onChange={(e) => setForm({ ...form, use: e.target.value })} className="select flex-1">
                  <option value="">Sin especificar</option>
                  {allUses.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <button type="button" onClick={() => setUseModalOpen(true)} className="btn-secondary px-3 shrink-0" title="Crear nuevo uso">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="label">Fecha de caducidad {editing ? '(lote más próximo)' : ''}</label>
              <ExpiryInput value={form.expiry_date} onChange={(v) => setForm({ ...form, expiry_date: v })} disabled={!!editing} />
              {editing && <p className="text-xs text-neutral-400 mt-1">Se gestiona por lotes (abajo).</p>}
            </div>

            <div>
              <label className="label">Proveedor</label>
              <div className="flex gap-2">
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="select flex-1">
                  <option value="">Sin proveedor</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="button" onClick={() => setSupplierModalOpen(true)} className="btn-secondary px-3 shrink-0" title="Crear proveedor nuevo">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="label">Precio costo *</label>
              <input type="number" step="0.01" min="0" value={form.cost_price} onChange={(e) => handleCostChange(e.target.value)} className="input" placeholder="0.00" required />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label">Margen {marginUnit === 'bs' ? '(Bs)' : '(%)'}</label>
                <button type="button" onClick={toggleMarginUnit} className="text-xs font-medium px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition" title="Cambiar entre Bs y %">{marginUnit === 'bs' ? 'Ver %' : 'Ver Bs'}</button>
              </div>
              <input type="number" step="0.01" min="0" value={form.margin} onChange={(e) => handleMarginChange(e.target.value)} className="input" placeholder={marginUnit === 'bs' ? 'Ej: 15.00 Bs de ganancia' : 'Ej: 30%'} />
              {marginUnit === 'bs' && costNum > 0 && saleNum > 0 && (
                <p className={`text-xs mt-1 ${marginNum < 0 ? 'text-error-600 dark:text-error-400' : 'text-neutral-400'}`}>{marginPctNum.toFixed(1)}% de ganancia</p>
              )}
              {marginUnit === '%' && form.cost_price !== '' && form.sale_price !== '' && (
                <p className={`text-xs mt-1 ${marginNum < 0 ? 'text-error-600 dark:text-error-400' : 'text-neutral-400'}`}>Margen: {marginNum.toFixed(2)} Bs</p>
              )}
            </div>

            <div>
              <label className="label">Precio venta *</label>
              <input type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => handleSaleChange(e.target.value)} className="input" placeholder="0.00" required />
            </div>

            <div>
              <label className="label">Stock {editing ? '(suma de lotes)' : '*'}</label>
              {editing ? (
                <>
                  <input type="number" min="0" value={form.stock} className="input bg-neutral-100 dark:bg-neutral-800 cursor-default" readOnly placeholder="0" />
                  <p className="text-xs text-neutral-400 mt-1">Se gestiona por lotes (abajo).</p>
                </>
              ) : countingNew ? (
                <ScanCounter
                  expectedCode={form.barcode || null}
                  onFinish={(n, code) => { setForm((f) => ({ ...f, stock: String(n), barcode: f.barcode || code })); setCountingNew(false); }}
                  onCancel={() => setCountingNew(false)}
                />
              ) : (
                <div className="flex gap-2">
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: soloEnteros(e.target.value) })} className="input" placeholder="0" required />
                  <button type="button" onClick={() => setCountingNew(true)} className="btn-secondary px-3 shrink-0" title="Contar escaneando cada unidad"><ScanLine size={18} /></button>
                </div>
              )}
            </div>

            <div>
              <label className="label">Stock mínimo</label>
              <input type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: soloEnteros(e.target.value) })} className="input" placeholder="Ej: 5" />
              {parseInt(form.min_stock) > 0 && parseInt(form.stock) <= parseInt(form.min_stock) && (
                <p className="text-xs text-error-600 dark:text-error-400 mt-1">⚠ Stock en o bajo el mínimo</p>
              )}
            </div>

            {editing && (
              <div className="sm:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-primary-500" />
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Lotes (cantidad y fecha de caducidad)</p>
                </div>
                {(editing.batches?.length ?? 0) === 0 ? (
                  <p className="text-xs text-neutral-400 mb-3">Este producto no tiene lotes. Agrega uno para controlar su caducidad.</p>
                ) : (
                  <div className="space-y-1.5 mb-3">
                    {editing.batches!.map((b) => (
                      <div key={b.id} className="flex items-center justify-between gap-3 text-sm py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <span className="text-neutral-700 dark:text-neutral-200 font-medium">{b.quantity} u.</span>
                        {b.barcode && <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{b.barcode}</span>}
                        <span className="text-neutral-500 dark:text-neutral-400 flex-1 text-right">{b.expiry_date ? `Vence: ${formatExpiry(b.expiry_date)}` : 'Sin fecha'}</span>
                        <button type="button" onClick={() => handleRemoveBatch(b.id)} disabled={batchBusy} className="p-1 rounded text-neutral-400 hover:text-error-600 disabled:opacity-40"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {!showReponer ? (
                  <button type="button" onClick={() => setShowReponer(true)} className="btn-secondary w-full sm:w-auto"><Plus size={16} /> Reponer stock</button>
                ) : (
                  <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/40 p-3 space-y-2">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Nuevo lote (reposición)</p>
                    {countingBatch ? (
                      <ScanCounter
                        expectedCode={batchBarcode.trim() || editing.barcode}
                        onFinish={(n, code) => { setBatchQty(String(n)); if (!batchBarcode.trim() && code) setBatchBarcode(code); setCountingBatch(false); }}
                        onCancel={() => setCountingBatch(false)}
                      />
                    ) : (
                      <>
                        <div>
                          <label className="label">Código de barras de esta caja (opcional)</label>
                          <div className="flex gap-2">
                            <input value={batchBarcode} onChange={(e) => setBatchBarcode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="input" placeholder={editing.barcode ? `Si es distinto al principal (${editing.barcode})` : 'Escanear o digitar'} />
                            <button type="button" onClick={() => { setScannerTarget('batch'); setScannerOpen(true); }} className="btn-secondary px-3 shrink-0"><ScanLine size={18} /></button>
                          </div>
                          <p className="text-xs text-neutral-400 mt-1">Déjalo vacío si la caja trae el mismo código del producto.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="sm:w-40">
                            <label className="label">Cantidad</label>
                            <div className="flex gap-2">
                              <input type="number" min="1" value={batchQty} onChange={(e) => setBatchQty(soloEnteros(e.target.value))} className="input" placeholder="0" />
                              <button type="button" onClick={() => setCountingBatch(true)} className="btn-secondary px-3 shrink-0" title="Contar escaneando cada unidad"><ScanLine size={18} /></button>
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="label">Fecha de caducidad</label>
                            <ExpiryInput value={batchExpiry} onChange={setBatchExpiry} />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowReponer(false); setCountingBatch(false); setBatchQty(''); setBatchExpiry(''); setBatchBarcode(''); }} className="btn-secondary flex-1">Cancelar</button>
                      <button type="button" onClick={handleAddBatch} disabled={batchBusy} className="btn-primary flex-1">{batchBusy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Agregar lote</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="label">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px] resize-none" placeholder="Detalle del producto: composición, notas, ml, uso, etc." />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded text-primary-600" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Producto activo</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleScan} />
      <ConfirmDialog open={!!deleteId} title="Eliminar producto" message="¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />

      {/* ── Modal: nueva categoría rápida ── */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Nueva categoría"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setCatModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="quick-cat-form" className="btn-primary">Crear y seleccionar</button>
          </>
        }
      >
        <form id="quick-cat-form" onSubmit={handleCreateCategory} className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Se creará la categoría y quedará seleccionada para este producto.</p>
          <div>
            <label className="label">Nombre de la categoría *</label>
            <input
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              className="input"
              placeholder="Ej: Perfumería, Skincare, Maquillaje"
              autoFocus
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: nueva marca rápida ── */}
      <Modal
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        title="Nueva marca"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setBrandModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="quick-brand-form" className="btn-primary">Crear y seleccionar</button>
          </>
        }
      >
        <form id="quick-brand-form" onSubmit={handleCreateBrand} className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Se creará la marca y quedará seleccionada para este producto.</p>
          <div>
            <label className="label">Nombre de la marca *</label>
            <input
              value={brandModalInput}
              onChange={(e) => setBrandModalInput(e.target.value)}
              className="input"
              placeholder="Ej: Nivea, L'Oreal, Yanbal"
              autoFocus
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: nuevo uso rápido ── */}
      <Modal
        open={useModalOpen}
        onClose={() => setUseModalOpen(false)}
        title="Nuevo uso"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setUseModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="quick-use-form" className="btn-primary">Crear y seleccionar</button>
          </>
        }
      >
        <form id="quick-use-form" onSubmit={handleCreateUse} className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Se creará el tipo de uso y quedará seleccionado para este producto. Se guardará en este dispositivo.</p>
          <div>
            <label className="label">Tipo de uso *</label>
            <input
              value={useInput}
              onChange={(e) => setUseInput(e.target.value)}
              className="input"
              placeholder="Ej: Íntimo, Bebé, Dental"
              autoFocus
              required
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: nuevo proveedor rápido ── */}
      <Modal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title="Nuevo proveedor"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setSupplierModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="quick-supplier-form" className="btn-primary" disabled={savingSupplier}>
              {savingSupplier && <Loader2 size={16} className="animate-spin" />}Crear proveedor
            </button>
          </>
        }
      >
        <form id="quick-supplier-form" onSubmit={handleCreateSupplier} className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Se creará el proveedor y quedará seleccionado para este producto.</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center text-white shrink-0">
              <Truck size={18} />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Solo el nombre es obligatorio para creación rápida.</p>
          </div>
          <div>
            <label className="label">Nombre / Empresa *</label>
            <input
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: soloLetras(e.target.value) })}
              className="input"
              placeholder="Ej: Distribuidora ABC"
              required
            />
          </div>
          <div>
            <label className="label">Persona de contacto (opcional)</label>
            <input
              value={supplierForm.contact_name}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: soloLetras(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Teléfono (opcional)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">{PHONE_PREFIX}</span>
              <input
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: normalizePhone(e.target.value) })}
                className="input pl-14"
                placeholder="70000000"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
