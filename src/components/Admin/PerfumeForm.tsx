import React from 'react';
import { Perfume } from '../../types';
import { formatBOB } from '../../utils/format';
import { NoteSelector } from './NoteSelector';

// Notas más conocidas, sugeridas por capa de la pirámide olfativa.
const NOTE_SUGGESTIONS = {
  top: ['Bergamota', 'Limón', 'Naranja', 'Mandarina', 'Pomelo', 'Pimienta rosa', 'Cardamomo', 'Menta', 'Lavanda', 'Manzana', 'Jengibre'],
  middle: ['Rosa', 'Jazmín', 'Violeta', 'Ylang-ylang', 'Peonía', 'Geranio', 'Lirio', 'Canela', 'Clavo', 'Nuez moscada', 'Durazno', 'Frutos rojos'],
  base: ['Vainilla', 'Sándalo', 'Cedro', 'Vetiver', 'Pachulí', 'Ámbar', 'Almizcle', 'Oud', 'Haba tonka', 'Incienso', 'Cuero', 'Caramelo']
};

const empty: Perfume = {
  id: '',
  name: '',
  brand: '',
  price: 0,
  purchasePrice: undefined,
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

// Campo con etiqueta descriptiva y texto de ayuda opcional.
function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-essence-navy mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

export function PerfumeForm({
  initial,
  suppliers,
  canPrices,
  onSave,
  onCancel
}: {
  initial?: Perfume;
  suppliers: { id: string; name: string }[];
  canPrices: boolean;
  onSave: (p: Perfume) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Perfume>(initial ?? empty);

  const set = (field: keyof Perfume, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));
  const setNotes = (key: 'top' | 'middle' | 'base', next: string[]) =>
    setForm(prev => ({
      ...prev,
      notes: { ...prev.notes, [key]: next }
    }));

  // Margen estimado = precio de venta - precio de compra.
  const margin = (Number(form.price) || 0) - (Number(form.purchasePrice) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      id: form.id || Date.now().toString(),
      price: canPrices ? Number(form.price) : (initial?.price ?? 0),
      purchasePrice: canPrices
        ? (form.purchasePrice !== undefined && String(form.purchasePrice) !== '' ? Number(form.purchasePrice) : undefined)
        : initial?.purchasePrice,
      originalPrice: canPrices ? (form.originalPrice ? Number(form.originalPrice) : undefined) : initial?.originalPrice,
      stock: Number(form.stock),
      rating: Number(form.rating)
    });
  };

  const priceInputCls = `${inputCls} ${!canPrices ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">
        {initial ? 'Editar perfume' : 'Nuevo perfume'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre del perfume" hint="Nombre comercial del producto">
          <input className={inputCls} placeholder="Ej: Mystique Noir" value={form.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <Field label="Marca" hint="Casa o colección a la que pertenece">
          <input className={inputCls} placeholder="Ej: Essence Collection" value={form.brand} onChange={e => set('brand', e.target.value)} required />
        </Field>

        <Field label="Precio de compra (BOB)" hint={canPrices ? 'Cuánto te cuesta a ti el producto' : 'Solo el administrador/a puede editar precios'}>
          <input
            className={priceInputCls}
            type="number"
            min="0"
            step="0.01"
            placeholder="Ej: 250"
            value={form.purchasePrice ?? ''}
            onChange={e => set('purchasePrice', e.target.value)}
            disabled={!canPrices}
          />
        </Field>
        <Field label="Precio de venta (BOB)" hint={canPrices ? 'Precio al que lo vendes al cliente' : 'Solo el administrador/a puede editar precios'}>
          <input
            className={priceInputCls}
            type="number"
            min="0"
            step="0.01"
            placeholder="Ej: 450"
            value={form.price}
            onChange={e => set('price', e.target.value)}
            disabled={!canPrices}
            required
          />
        </Field>

        <Field label="Precio antes de oferta (BOB)" hint="Opcional: precio tachado para mostrar descuento">
          <input
            className={priceInputCls}
            type="number"
            min="0"
            step="0.01"
            placeholder="Opcional"
            value={form.originalPrice ?? ''}
            onChange={e => set('originalPrice', e.target.value)}
            disabled={!canPrices}
          />
        </Field>
        <Field label="Unidades en stock" hint="Cantidad disponible para la venta">
          <input className={inputCls} type="number" min="0" placeholder="Ej: 25" value={form.stock} onChange={e => set('stock', e.target.value)} required />
        </Field>
      </div>

      {canPrices && (
        <div className="text-sm bg-essence-light/10 border border-essence-purple/10 rounded-lg px-4 py-3">
          Margen estimado por unidad:{' '}
          <span className={`font-semibold ${margin >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatBOB(margin)}</span>
        </div>
      )}

      <Field label="Imagen del perfume (URL)" hint="Pega el enlace de una imagen; se mostrará como fondo/foto del producto">
        <input className={inputCls} placeholder="https://..." value={form.image} onChange={e => set('image', e.target.value)} required />
      </Field>
      {form.image && (
        <div className="flex items-center space-x-4">
          <div
            className="w-28 h-28 rounded-xl border border-gray-200 bg-gray-50 bg-center bg-cover"
            style={{ backgroundImage: `url("${form.image}")` }}
            aria-label="Vista previa de la imagen"
          />
          <span className="text-xs text-gray-400">Vista previa de la imagen ingresada</span>
        </div>
      )}

      <Field label="Descripción" hint="Texto que verá el cliente en la ficha del producto">
        <textarea className={inputCls} placeholder="Describe el aroma, ocasión de uso, etc." rows={3} value={form.description} onChange={e => set('description', e.target.value)} required />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NoteSelector
          label="Notas de salida"
          hint="Primer aroma que se percibe (cítricos y frescos)"
          values={form.notes.top}
          suggestions={NOTE_SUGGESTIONS.top}
          onChange={next => setNotes('top', next)}
        />
        <NoteSelector
          label="Notas de corazón"
          hint="El cuerpo de la fragancia (florales y especiados)"
          values={form.notes.middle}
          suggestions={NOTE_SUGGESTIONS.middle}
          onChange={next => setNotes('middle', next)}
        />
        <NoteSelector
          label="Notas de fondo"
          hint="Lo que perdura al final (amaderados y dulces)"
          values={form.notes.base}
          suggestions={NOTE_SUGGESTIONS.base}
          onChange={next => setNotes('base', next)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Field label="Categoría">
          <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="floral">Floral</option>
            <option value="oriental">Oriental</option>
            <option value="fresco">Fresco</option>
            <option value="amadeirado">Amaderado</option>
          </select>
        </Field>
        <Field label="Género">
          <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="masculino">Masculino</option>
            <option value="feminino">Femenino</option>
            <option value="unissex">Unisex</option>
          </select>
        </Field>
        <Field label="Duración">
          <select className={inputCls} value={form.duration} onChange={e => set('duration', e.target.value)}>
            <option value="leve">Leve</option>
            <option value="moderada">Moderada</option>
            <option value="longa">Larga</option>
          </select>
        </Field>
        <Field label="Intensidad">
          <select className={inputCls} value={form.intensity} onChange={e => set('intensity', e.target.value)}>
            <option value="suave">Suave</option>
            <option value="moderada">Moderada</option>
            <option value="intensa">Intensa</option>
          </select>
        </Field>
        <Field label="Proveedor">
          <select className={inputCls} value={form.supplierId ?? ''} onChange={e => set('supplierId', e.target.value || undefined)}>
            <option value="">Sin proveedor</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex space-x-6">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={!!form.isNew} onChange={e => set('isNew', e.target.checked)} />
          <span>Marcar como nuevo</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={!!form.isPopular} onChange={e => set('isPopular', e.target.checked)} />
          <span>Marcar como popular</span>
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
