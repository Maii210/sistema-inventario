import React from 'react';
import { Supplier } from '../../types';

const empty: Supplier = { id: '', name: '', contactName: '', phone: '', email: '', notes: '' };

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple';

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
        <input className={inputCls} placeholder="Nombre del proveedor" value={form.name} onChange={e => set('name', e.target.value)} required />
        <input className={inputCls} placeholder="Persona de contacto" value={form.contactName ?? ''} onChange={e => set('contactName', e.target.value)} />
        <input className={inputCls} placeholder="Teléfono" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
        <input className={inputCls} type="email" placeholder="Email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
      </div>
      <textarea className={inputCls} placeholder="Notas" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
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
