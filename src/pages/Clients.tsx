import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Mail, Phone, MapPin, Loader2, X, Eye, FileText } from 'lucide-react';
import { supabase, Client, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', last_name: '', document_id: '', email: '', phone: '', address: '', notes: '' };

export function Clients() {
  const { profile } = useAuth();
  const { show } = useToast();
  const canEdit = profile?.role === 'admin' || profile?.role === 'superadmin';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [clientStats, setClientStats] = useState<Record<string, { total: number; count: number }>>({});

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('name');
    const clientsData = (data as Client[]) ?? [];
    setClients(clientsData);

    const { data: salesData } = await supabase.from('sales').select('client_id, total').not('client_id', 'is', null);
    if (salesData) {
      const stats: Record<string, { total: number; count: number }> = {};
      (salesData as any[]).forEach((s: any) => {
        const cid = s.client_id;
        if (!stats[cid]) stats[cid] = { total: 0, count: 0 };
        stats[cid].total += Number(s.total);
        stats[cid].count += 1;
      });
      setClientStats(stats);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return clients.filter(
      (c) => !search ||
        `${c.name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.document_id?.includes(search)
    );
  }, [clients, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name,
      last_name: client.last_name ?? '',
      document_id: client.document_id ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const duplicate = clients.find(
      (c) => c.name.toLowerCase() === form.name.toLowerCase() &&
             c.last_name?.toLowerCase() === form.last_name.toLowerCase() &&
             c.id !== editing?.id
    );
    if (duplicate) {
      show('Ya existe un cliente con ese nombre y apellido', 'error');
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      last_name: form.last_name,
      document_id: form.document_id || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      notes: form.notes || null,
    };

    let hasError = false;
    if (editing) {
      const { error } = await supabase.from('clients').update(payload).eq('id', editing.id);
      if (error) { show(error.message, 'error'); hasError = true; }
      else show('Cliente actualizado');
    } else {
      const { error } = await supabase.from('clients').insert(payload);
      if (error) { show(error.message, 'error'); hasError = true; }
      else show('Cliente creado');
    }
    if (!hasError) { setModalOpen(false); loadClients(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('clients').delete().eq('id', deleteId);
    if (error) show(error.message, 'error');
    else { show('Cliente eliminado'); loadClients(); }
    setDeleting(false);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Clientes</h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">{filtered.length} clientes registrados</p>
        </div>
        {canEdit && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Nuevo cliente</button>}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, email, teléfono o documento..." className="input pl-11" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"><X size={16} /></button>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-400 dark:text-neutral-500">{search ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const stats = clientStats[client.id];
            return (
              <div key={client.id} className="card p-5 hover:shadow-glow transition group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white font-semibold">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setViewClient(client)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"><Eye size={16} /></button>
                    {canEdit && (
                      <>
                        <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{client.name} {client.last_name}</h3>
                {client.document_id && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 flex items-center gap-1"><FileText size={12} /> {client.document_id}</p>}
                <div className="space-y-1.5 mt-3">
                  {client.email && <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"><Mail size={14} /> <span className="truncate">{client.email}</span></div>}
                  {client.phone && <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"><Phone size={14} /> {client.phone}</div>}
                  {client.address && <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"><MapPin size={14} /> <span className="truncate">{client.address}</span></div>}
                </div>
                {stats && (
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">Compras</p>
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{stats.count} productos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">Total</p>
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(stats.total)}</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-3">Desde {formatDate(client.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nombre *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required /></div>
            <div><label className="label">Apellido *</label><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" required /></div>
          </div>
          <div><label className="label">Documento de identidad</label><input value={form.document_id} onChange={(e) => setForm({ ...form, document_id: e.target.value })} className="input" placeholder="CI, NIT, etc." /></div>
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

      <Modal open={!!viewClient} onClose={() => setViewClient(null)} title="Detalle del cliente" size="sm">
        {viewClient && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white text-xl font-semibold">{viewClient.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{viewClient.name} {viewClient.last_name}</p>
                {viewClient.document_id && <p className="text-sm text-neutral-400">{viewClient.document_id}</p>}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {viewClient.email && <div className="flex justify-between"><span className="text-neutral-400">Email</span><span className="text-neutral-700 dark:text-neutral-200">{viewClient.email}</span></div>}
              {viewClient.phone && <div className="flex justify-between"><span className="text-neutral-400">Teléfono</span><span className="text-neutral-700 dark:text-neutral-200">{viewClient.phone}</span></div>}
              {viewClient.address && <div className="flex justify-between"><span className="text-neutral-400">Dirección</span><span className="text-neutral-700 dark:text-neutral-200">{viewClient.address}</span></div>}
              <div className="flex justify-between"><span className="text-neutral-400">Registro</span><span className="text-neutral-700 dark:text-neutral-200">{formatDate(viewClient.created_at)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Eliminar cliente" message="¿Seguro que deseas eliminar este cliente?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
