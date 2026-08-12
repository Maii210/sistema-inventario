import React from 'react';
import { StaffUser } from '../../types';
import { ROLE_LABELS, Role } from '../../data/permissions';

const emptyForm = { id: '', name: '', email: '', password: '', role: 'vendedora' as Role, active: true, createdAt: '' };

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-essence-navy mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

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
        <Field label="Nombre del personal" hint="Nombre de la persona que usará el sistema">
          <input className={inputCls} placeholder="Ej: Ana Rojas" value={form.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <Field label="Correo de acceso" hint="Con este correo iniciará sesión">
          <input className={inputCls} type="email" placeholder="usuario@essence.com" value={form.email} onChange={e => set('email', e.target.value)} required />
        </Field>
        <Field label="Contraseña" hint="Clave para ingresar al sistema">
          <input className={inputCls} type="password" placeholder="Mínimo 4 caracteres" value={form.password} onChange={e => set('password', e.target.value)} required />
        </Field>
        <Field label="Rol / permisos" hint="Define qué módulos podrá ver y usar">
          <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
            {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>
      </div>
      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
        <span>Cuenta activa (puede iniciar sesión)</span>
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
