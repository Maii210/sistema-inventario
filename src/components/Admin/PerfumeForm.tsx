import React from 'react';
import { Perfume } from '../../types';

const empty: Perfume = {
  id: '',
  name: '',
  brand: '',
  price: 0,
  image: '',
  description: '',
  notes: { top: [], middle: [], base: [] },
  category: 'floral',
  gender: 'unissex',
  duration: 'moderada',
  intensity: 'moderada',
  rating: 0,
  reviews: [],
  stock: 0
};

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple';

export function PerfumeForm({
  initial,
  suppliers,
  onSave,
  onCancel
}: {
  initial?: Perfume;
  suppliers: { id: string; name: string }[];
  onSave: (p: Perfume) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Perfume>(initial ?? empty);

  const set = (field: keyof Perfume, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));
  const setNotes = (key: 'top' | 'middle' | 'base', value: string) =>
    setForm(prev => ({
      ...prev,
      notes: { ...prev.notes, [key]: value.split(',').map(s => s.trim()).filter(Boolean) }
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      id: form.id || Date.now().toString(),
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      stock: Number(form.stock),
      rating: Number(form.rating)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">
        {initial ? 'Editar perfume' : 'Nuevo perfume'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className={inputCls} placeholder="Nombre" value={form.name} onChange={e => set('name', e.target.value)} required />
        <input className={inputCls} placeholder="Marca" value={form.brand} onChange={e => set('brand', e.target.value)} required />
        <input className={inputCls} type="number" placeholder="Precio (BOB)" value={form.price} onChange={e => set('price', e.target.value)} required />
        <input className={inputCls} type="number" placeholder="Precio original (opcional)" value={form.originalPrice ?? ''} onChange={e => set('originalPrice', e.target.value)} />
        <input className={inputCls} type="number" placeholder="Stock" value={form.stock} onChange={e => set('stock', e.target.value)} required />
        <input className={inputCls} placeholder="URL de imagen" value={form.image} onChange={e => set('image', e.target.value)} required />
      </div>

      <textarea className={inputCls} placeholder="Descripción" rows={3} value={form.description} onChange={e => set('description', e.target.value)} required />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className={inputCls} placeholder="Notas de salida (coma)" value={form.notes.top.join(', ')} onChange={e => setNotes('top', e.target.value)} />
        <input className={inputCls} placeholder="Notas de corazón (coma)" value={form.notes.middle.join(', ')} onChange={e => setNotes('middle', e.target.value)} />
        <input className={inputCls} placeholder="Notas de fondo (coma)" value={form.notes.base.join(', ')} onChange={e => setNotes('base', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
          <option value="floral">Floral</option>
          <option value="oriental">Oriental</option>
          <option value="fresco">Fresco</option>
          <option value="amadeirado">Amaderado</option>
        </select>
        <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
          <option value="masculino">Masculino</option>
          <option value="feminino">Femenino</option>
          <option value="unissex">Unisex</option>
        </select>
        <select className={inputCls} value={form.duration} onChange={e => set('duration', e.target.value)}>
          <option value="leve">Leve</option>
          <option value="moderada">Moderada</option>
          <option value="longa">Larga</option>
        </select>
        <select className={inputCls} value={form.intensity} onChange={e => set('intensity', e.target.value)}>
          <option value="suave">Suave</option>
          <option value="moderada">Moderada</option>
          <option value="intensa">Intensa</option>
        </select>
        <select className={inputCls} value={form.supplierId ?? ''} onChange={e => set('supplierId', e.target.value || undefined)}>
          <option value="">Sin proveedor</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex space-x-6">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={!!form.isNew} onChange={e => set('isNew', e.target.checked)} />
          <span>Nuevo</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={!!form.isPopular} onChange={e => set('isPopular', e.target.checked)} />
          <span>Popular</span>
        </label>
      </div>

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
