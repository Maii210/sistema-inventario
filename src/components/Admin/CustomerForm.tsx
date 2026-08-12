import React from 'react';
import { User } from '../../types';

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

export function CustomerForm({
  onSave,
  onCancel
}: {
  onSave: (u: User) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });
  const set = (field: 'name' | 'email' | 'phone', value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: Date.now().toString(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      role: 'customer',
      createdAt: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5 max-w-2xl">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">Nuevo cliente</h2>

      <Field label="Nombre completo del cliente" hint="Cómo identificarás al cliente">
        <input className={inputCls} placeholder="Ej: María González" value={form.name} onChange={e => set('name', e.target.value)} required />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Teléfono / celular" hint="Opcional">
          <input className={inputCls} type="tel" placeholder="Ej: 70000000" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Correo electrónico (opcional)" hint="No es obligatorio; déjalo vacío si el cliente no tiene o no lo desea dar">
          <input className={inputCls} type="email" placeholder="cliente@correo.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>
      </div>

      <div className="flex space-x-4 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-essence-purple text-essence-purple py-3 rounded-lg font-semibold hover:bg-essence-purple/5">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-gradient-to-r from-essence-coral to-essence-rose text-white py-3 rounded-lg font-semibold hover:shadow-lg">
          Guardar cliente
        </button>
      </div>
    </form>
  );
}
