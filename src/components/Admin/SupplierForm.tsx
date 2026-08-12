import React from 'react';
import { Supplier } from '../../types';

const empty: Supplier = { id: '', name: '', contactName: '', phone: '', email: '', notes: '' };

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

export function SupplierForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: Supplier;
  onSave: (s: Supplier) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Supplier>(initial ?? empty);
  const set = (field: keyof Supplier, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: form.id || Date.now().toString() });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">
        {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre del proveedor" hint="Empresa o distribuidor">
          <input className={inputCls} placeholder="Ej: Aromas del Sur S.R.L." value={form.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <Field label="Persona de contacto" hint="Opcional: con quién tratas">
          <input className={inputCls} placeholder="Ej: Juan Pérez" value={form.contactName ?? ''} onChange={e => set('contactName', e.target.value)} />
        </Field>
        <Field label="Teléfono / celular" hint="Opcional">
          <input className={inputCls} placeholder="Ej: 70000000" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Correo electrónico" hint="Opcional">
          <input className={inputCls} type="email" placeholder="proveedor@correo.com" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
        </Field>
      </div>
      <Field label="Notas" hint="Opcional: condiciones, tiempos de entrega, observaciones">
        <textarea className={inputCls} placeholder="Escribe cualquier detalle importante del proveedor" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
      </Field>
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
