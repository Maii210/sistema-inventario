import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Truck, Mail, Phone, MapPin, Loader2, X, Package, Eye } from 'lucide-react';
import { supabase, Supplier, Product, formatDate } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', contact_name: '', email: '', phone: '', address: '', notes: '' };

export function Suppliers() {
  const { show } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [supRes, prodRes] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('products').select('id, supplier_id, name, stock, sale_price'),
    ]);
    setSuppliers((supRes.data as Supplier[]) ?? []);
    setProducts((prodRes.data as Product[]) ?? []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return suppliers.filter(
      (s) => !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({ name: supplier.name, contact_name: supplier.contact_name ?? '', email: supplier.email ?? '', phone: supplier.phone ?? '', address: supplier.address ?? '', notes: supplier.notes ?? '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const duplicate = suppliers.find(
      (s) => s.name.toLowerCase() === form.name.toLowerCase() && s.id !== editing?.id
    );
    if (duplicate) {
      show('Ya existe un proveedor con ese nombre', 'error');
      setSaving(false);
      return;
    }

    const payload = { name: form.name, contact_name: form.contact_name || null, email: form.email || null, phone: form.phone || null, address: form.address || null, notes: form.notes || null };
    let hasError = false;
    if (editing) {
      const { error } = await supabase.from('suppliers').update(payload).eq('id', editing.id);
      if (error) { show(error.message, 'error'); hasError = true; } else show('Proveedor actualizado');
    } else {
      const { error } = await supabase.from('suppliers').insert(payload);
      if (error) { show(error.message, 'error'); hasError = true; } else show('Proveedor creado');
    }
    if (!hasError) { setModalOpen(false); loadData(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('suppliers').delete().eq('id', deleteId);
    if (error) show(error.message, 'error');
    else { show('Proveedor eliminado'); loadData(); }
    setDeleting(false);
    setDeleteId(null);
  };

  const getLinkedProducts = (supplierId: string) => products.filter((p) => p.supplier_id === supplierId);
  const getTotalValue = (supplierId: string) => getLinkedProducts(supplierId).reduce((sum, p) => sum + Number(p.sale_price) * p.stock, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-800 dark:text-neutral-100">Proveedores</h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">{filtered.length} proveedores registrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Nuevo proveedor</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor..." className="input pl-11" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"><X size={16} /></button>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Truck size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-400 dark:text-neutral-500">{search ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((supplier) => {
            const linked = getLinkedProducts(supplier.id);
            const totalValue = getTotalValue(supplier.id);
            return (
              <div key={supplier.id} className="card p-5 hover:shadow-glow transition group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center text-white"><Truck size={24} /></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setViewSupplier(supplier)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"><Eye size={16} /></button>
                    <button onClick={() => openEdit(supplier)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteId(supplier.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{supplier.name}</h3>
                {supplier.contact_name && <p className="text-sm text-neutral-400 dark:text-neutral-500">Contacto: {supplier.contact_name}</p>}
                <div className="space-y-1.5 mt-3">
                  {supplier.email && <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"><Mail size={14} /> <span className="truncate">{supplier.email}</span></div>}
                  {supplier.phone && <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"><Phone size={14} /> {supplier.phone}</div>}
                  {supplier.address && <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"><MapPin size={14} /> <span className="truncate">{supplier.address}</span></div>}
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-neutral-400 dark:text-neutral-500" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{linked.length} productos asociados</span>
                  </div>
                  {linked.length > 0 && (
                    <div className="text-xs text-neutral-400 dark:text-neutral-500">
                      {linked.slice(0, 3).map((p) => p.name).join(', ')}{linked.length > 3 && ` +${linked.length - 3} más`}
                    </div>
                  )}
                </div>
                <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-2">Desde {formatDate(supplier.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Nombre / Empresa *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required /></div>
          <div><label className="label">Persona de contacto</label><input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></div>
            <div><label className="label">Teléfono</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Dirección</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" /></div>
          <div><label className="label">Notas</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[60px] resize-none" /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewSupplier} onClose={() => setViewSupplier(null)} title="Detalle del proveedor" size="md">
        {viewSupplier && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center text-white"><Truck size={24} /></div>
              <div>
                <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{viewSupplier.name}</p>
                {viewSupplier.contact_name && <p className="text-sm text-neutral-400">Contacto: {viewSupplier.contact_name}</p>}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {viewSupplier.email && <div className="flex justify-between"><span className="text-neutral-400">Email</span><span className="text-neutral-700 dark:text-neutral-200">{viewSupplier.email}</span></div>}
              {viewSupplier.phone && <div className="flex justify-between"><span className="text-neutral-400">Teléfono</span><span className="text-neutral-700 dark:text-neutral-200">{viewSupplier.phone}</span></div>}
              {viewSupplier.address && <div className="flex justify-between"><span className="text-neutral-400">Dirección</span><span className="text-neutral-700 dark:text-neutral-200">{viewSupplier.address}</span></div>}
              <div className="flex justify-between"><span className="text-neutral-400">Registro</span><span className="text-neutral-700 dark:text-neutral-200">{formatDate(viewSupplier.created_at)}</span></div>
            </div>
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">Productos asociados ({getLinkedProducts(viewSupplier.id).length})</p>
              {getLinkedProducts(viewSupplier.id).length === 0 ? (
                <p className="text-sm text-neutral-400">No tiene productos asociados</p>
              ) : (
                <div className="space-y-1">
                  {getLinkedProducts(viewSupplier.id).map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300">{p.name}</span>
                      <span className="text-neutral-400">Stock: {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Eliminar proveedor" message="¿Seguro que deseas eliminar este proveedor? Los productos asociados quedarán sin proveedor." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
