import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, UserCog, Loader2, Shield, Phone, CheckCircle, XCircle, Eye, Search, X } from 'lucide-react';
import { supabase, Profile, Role } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/supabase';

const roleLabels: Record<Role, string> = {
  vendedor: 'Vendedor',
  admin: 'Administrador',
  superadmin: 'Super Admin',
};

const roleColors: Record<Role, string> = {
  vendedor: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  admin: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  superadmin: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
};

const emptyForm = { full_name: '', last_name: '', email: '', phone: '', password: '', role: 'vendedor' as Role, active: true };

export function Users() {
  const { user } = useAuth();
  const { show } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return users.filter((u) =>
      !search ||
      `${u.full_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    );
  }, [users, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setForm({
      full_name: profile.full_name,
      last_name: profile.last_name,
      email: '',
      phone: profile.phone ?? '',
      password: '',
      role: profile.role,
      active: profile.active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const duplicate = users.find(
      (u) => u.full_name.toLowerCase() === form.full_name.toLowerCase() &&
             u.last_name.toLowerCase() === form.last_name.toLowerCase() &&
             u.id !== editing?.id
    );
    if (duplicate) {
      show('Ya existe un usuario con ese nombre y apellido', 'error');
      setSaving(false);
      return;
    }

    if (editing) {
      const { error } = await supabase.from('profiles').update({ full_name: form.full_name, last_name: form.last_name, phone: form.phone, role: form.role, active: form.active }).eq('id', editing.id);
      if (error) show(error.message, 'error');
      else { show('Usuario actualizado'); setModalOpen(false); loadUsers(); }
    } else {
      if (form.phone.length < 8) {
        show('El teléfono debe tener al menos 8 dígitos', 'error');
        setSaving(false);
        return;
      }
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email || undefined,
        password: form.password || 'default123',
        options: { data: { full_name: form.full_name, last_name: form.last_name, phone: form.phone, role: form.role } },
      });
      if (signUpError) { show(signUpError.message, 'error'); setSaving(false); return; }
      show('Usuario creado correctamente');
      setModalOpen(false);
      loadUsers();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('profiles').update({ active: false }).eq('id', deleteId);
    if (error) show(error.message, 'error');
    else { show('Usuario desactivado'); loadUsers(); }
    setDeleting(false);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Usuarios</h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">{users.length} usuarios en el sistema</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Nuevo usuario</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono..." className="input pl-11" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"><X size={16} /></button>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-3">Usuario</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-3">Teléfono</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-3">Rol</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-3">Registro</th>
                  <th className="text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold text-sm">
                          {u.full_name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{u.full_name} {u.last_name}</p>
                          {u.id === user?.id && <span className="text-xs text-primary-500 dark:text-primary-400">Tú</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500 dark:text-neutral-400">{u.phone || '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${roleColors[u.role]}`}>
                        {u.role === 'superadmin' && <Shield size={12} />}
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.active ? (
                        <span className="badge bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"><CheckCircle size={12} /> Activo</span>
                      ) : (
                        <span className="badge bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300"><XCircle size={12} /> Inactivo</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500 dark:text-neutral-400">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setViewUser(u)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300" title="Ver"><Eye size={16} /></button>
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300" title="Editar"><Edit2 size={16} /></button>
                        {u.id !== user?.id && u.active && (
                          <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400" title="Eliminar"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Teléfono *</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input pl-11" required minLength={8} placeholder="70000000" />
            </div>
          </div>
          {!editing && (
            <>
              <div>
                <label className="label">Correo electrónico (opcional)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" minLength={6} placeholder="Si se deja vacío se usará 'default123'" />
              </div>
            </>
          )}
          <div>
            <label className="label">Rol *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['vendedor', 'admin', 'superadmin'] as Role[]).map((r) => (
                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                    form.role === r
                      ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600'
                  }`}>
                  {roleLabels[r]}
                </button>
              ))}
            </div>
          </div>
          {editing && (
            <div>
              <label className="label">Estado</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, active: true })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition flex items-center justify-center gap-2 ${
                    form.active
                      ? 'border-success-300 bg-success-50 text-success-700 dark:border-success-700 dark:bg-success-900/30 dark:text-success-300'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600'
                  }`}>
                  <CheckCircle size={16} /> Activo
                </button>
                <button type="button" onClick={() => setForm({ ...form, active: false })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition flex items-center justify-center gap-2 ${
                    !form.active
                      ? 'border-error-300 bg-error-50 text-error-700 dark:border-error-700 dark:bg-error-900/30 dark:text-error-300'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600'
                  }`}>
                  <XCircle size={16} /> Inactivo
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? 'Guardar' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="Detalle del usuario" size="sm">
        {viewUser && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xl font-semibold">
                {viewUser.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{viewUser.full_name} {viewUser.last_name}</p>
                <span className={`badge ${roleColors[viewUser.role]}`}>{roleLabels[viewUser.role]}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-400">Teléfono</span><span className="text-neutral-700 dark:text-neutral-200">{viewUser.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Estado</span><span className={viewUser.active ? 'text-success-600' : 'text-error-600'}>{viewUser.active ? 'Activo' : 'Inactivo'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Registro</span><span className="text-neutral-700 dark:text-neutral-200">{formatDate(viewUser.created_at)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Desactivar usuario" message="¿Seguro que deseas desactivar este usuario? No podrá iniciar sesión." confirmLabel="Desactivar" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
