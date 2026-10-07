import { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Search, ScanLine, Edit2, Trash2, Package, AlertTriangle, Loader2, Filter, X, Camera, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { supabase, Product, Supplier, ProductCategory, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useToast } from '@/components/ui/Toast';

const emptyForm = {
  name: '', barcode: '', category: '', brand: '', description: '',
  cost_price: '', sale_price: '', stock: '', min_stock: '5',
  supplier_id: '', active: true, image_url: '', margin_pct: '',
  use: '', expiry_date: '',
};

// Lista fija de "Uso" para subcategorizar los productos.
const USES = ['Facial', 'Corporal', 'Capilar', 'Manos/Uñas', 'Maquillaje', 'Otro'];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'filter' | 'form'>('filter');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  useEffect(() => { loadProducts(); loadSuppliers(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*, supplier:suppliers(*)').order('created_at', { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    setSuppliers((data as Supplier[]) ?? []);
  };

  const allCategories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    const merged = [...new Set([...fromProducts])].sort();
    return merged;
  }, [products]);

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

  const openCreate = () => { setEditing(null); setForm(emptyForm); setNewCategory(''); setModalOpen(true); };

  const openEdit = (product: Product) => {
    setEditing(product);
    setNewCategory('');
    setForm({
      name: product.name, barcode: product.barcode ?? '', category: product.category,
      brand: product.brand ?? '', description: product.description ?? '',
      cost_price: String(product.cost_price), sale_price: String(product.sale_price),
      stock: String(product.stock), min_stock: String(product.min_stock),
      supplier_id: product.supplier_id ?? '', active: product.active,
      image_url: product.image_url ?? '', margin_pct: '',
      use: product.use ?? '', expiry_date: product.expiry_date ? product.expiry_date.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleMarginChange = (val: string) => {
    const cost = parseFloat(form.cost_price) || 0;
    const margin = parseFloat(val) || 0;
    const sale = cost > 0 ? cost + margin : 0;
    setForm({ ...form, margin_pct: val, sale_price: sale > 0 ? sale.toFixed(2) : '' });
  };

  const handleCostChange = (val: string) => {
    const cost = parseFloat(val) || 0;
    const margin = parseFloat(form.margin_pct) || 0;
    const sale = cost > 0 && margin > 0 ? cost + margin : form.sale_price;
    setForm({ ...form, cost_price: val, sale_price: sale || form.sale_price });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { show('La imagen no debe superar 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, image_url: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cat = newCategory.trim() || form.category;
    if (!cat) { show('Selecciona o crea una categoría', 'error'); setSaving(false); return; }

    const payload = {
      name: form.name, barcode: form.barcode || null, category: cat,
      brand: form.brand || null, description: form.description || null,
      cost_price: parseFloat(form.cost_price) || 0, sale_price: parseFloat(form.sale_price) || 0,
      stock: parseInt(form.stock) || 0, min_stock: parseInt(form.min_stock) || 0,
      supplier_id: form.supplier_id || null, active: form.active,
      image_url: form.image_url || null,
      use: form.use || null,
      expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
    };

    let hasError = false;
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { show(error.message, 'error'); hasError = true; } else show('Producto actualizado');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { show(error.message, 'error'); hasError = true; } else show('Producto creado');
    }
    if (!hasError) { setModalOpen(false); loadProducts(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) show(error.message, 'error');
    else { show('Producto eliminado'); loadProducts(); }
    setDeleting(false);
    setDeleteId(null);
  };

  const handleScan = (code: string) => {
    if (scannerTarget === 'filter') setSearch(code);
    else setForm((f) => ({ ...f, barcode: code }));
    setScannerOpen(false);
  };

  const activeFilters = categoryFilter !== 'all' || brandFilter !== 'all' || useFilter !== 'all' || stockFilter !== 'all';
  const lowStockCount = products.filter((p) => p.stock <= p.min_stock && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

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
          {filtered.map((product) => {
            const stockLevel = product.stock === 0 ? 'out' : product.stock <= product.min_stock ? 'low' : 'ok';
            const margin = product.cost_price > 0 ? (product.sale_price - product.cost_price) : 0;
            const exp = expiryStatus(product.expiry_date);
            return (
              <div key={product.id} className="card p-5 hover:shadow-glow transition-all group">
                <div className="flex items-start justify-between mb-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/40 dark:to-secondary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400"><Package size={24} /></div>
                  )}
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
                    {canEdit && product.cost_price > 0 && <p className="text-xs text-neutral-400">Costo: {formatCurrency(product.cost_price)} · Margen: {formatCurrency(margin)}</p>}
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
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Caducidad</th>
                {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((product) => {
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
                    <td className="px-4 py-3">
                      <span className={`badge ${stockLevel === 'out' ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' : stockLevel === 'low' ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' : 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'}`}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">{exp ? <span className={`badge ${exp.cls}`}>{exp.label}</span> : (product.expiry_date ? formatDate(product.expiry_date) : '—')}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Imagen del producto</label>
              <div className="flex items-center gap-4">
                {form.image_url && <img src={form.image_url} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700" />}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-sm"><Camera size={16} /> Subir imagen</button>
                {form.image_url && <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="text-xs text-error-500 hover:text-error-600">Quitar</button>}
              </div>
            </div>

            <div>
              <label className="label">Código de barras</label>
              <div className="flex gap-2">
                <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input" placeholder="Escanear o digitar" />
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
              </div>
            </div>

            <div><label className="label">Marca</label><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input" /></div>

            <div>
              <label className="label">Uso</label>
              <select value={form.use} onChange={(e) => setForm({ ...form, use: e.target.value })} className="select">
                <option value="">Sin especificar</option>
                {USES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Fecha de caducidad</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input" />
            </div>

            <div>
              <label className="label">Proveedor</label>
              <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="select">
                <option value="">Sin proveedor</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Precio costo *</label>
              <input type="number" step="0.01" min="0" value={form.cost_price} onChange={(e) => handleCostChange(e.target.value)} className="input" required />
            </div>

            <div>
              <label className="label">Margen (Bs)</label>
              <input type="number" step="0.01" min="0" value={form.margin_pct} onChange={(e) => handleMarginChange(e.target.value)} className="input" placeholder="Ej: 10" />
            </div>

            <div>
              <label className="label">Precio venta *</label>
              <input type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value, margin_pct: '' })} className="input" required />
            </div>

            <div>
              <label className="label">Stock *</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input" required />
            </div>

            <div>
              <label className="label">Stock mínimo</label>
              <input type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="input" />
              {parseInt(form.min_stock) > 0 && parseInt(form.stock) <= parseInt(form.min_stock) && (
                <p className="text-xs text-error-600 dark:text-error-400 mt-1">⚠ Stock en o bajo el mínimo</p>
              )}
            </div>

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

          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleScan} />
      <ConfirmDialog open={!!deleteId} title="Eliminar producto" message="¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
