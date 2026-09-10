import React from 'react';
import { Product } from '../../types';
import { formatBOB } from '../../utils/format';

const empty: Product = {
  id: '',
  name: '',
  brand: '',
  category: '',
  price: 0,
  purchasePrice: undefined,
  stock: 0,
  image: '',
  description: '',
  barcode: ''
};

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

export function ProductForm({
  initial,
  suppliers,
  canPrices,
  onSave,
  onCancel
}: {
  initial?: Product;
  suppliers: { id: string; name: string }[];
  canPrices: boolean;
  onSave: (p: Product) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState<Product>(initial ?? empty);
  const set = (field: keyof Product, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

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
      stock: Number(form.stock)
    });
  };

  const priceInputCls = `${inputCls} ${!canPrices ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
      <h2 className="font-playfair text-2xl font-semibold text-essence-navy">
        {initial ? 'Editar producto' : 'Nuevo producto'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre del producto" hint="Cómo se identifica el producto">
          <input className={inputCls} placeholder="Ej: Cuaderno universitario 100 hojas" value={form.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <Field label="Marca" hint="Opcional">
          <input className={inputCls} placeholder="Ej: Norma" value={form.brand ?? ''} onChange={e => set('brand', e.target.value)} />
        </Field>

        <Field label="Categoría" hint="Opcional: ej. Abarrotes, Limpieza, Papelería">
          <input className={inputCls} placeholder="Ej: Papelería" value={form.category ?? ''} onChange={e => set('category', e.target.value)} />
        </Field>
        <Field label="Código de barras" hint="Opcional (podrá leerse con lector más adelante)">
          <input className={inputCls} placeholder="Ej: 7501234567890" value={form.barcode ?? ''} onChange={e => set('barcode', e.target.value)} />
        </Field>

        <Field label="Precio de compra (BOB)" hint={canPrices ? 'Cuánto te cuesta el producto' : 'Solo el administrador/a puede editar precios'}>
          <input className={priceInputCls} type="number" min="0" step="0.01" placeholder="Ej: 16" value={form.purchasePrice ?? ''} onChange={e => set('purchasePrice', e.target.value)} disabled={!canPrices} />
        </Field>
        <Field label="Precio de venta (BOB)" hint={canPrices ? 'Precio al que lo vendes al cliente' : 'Solo el administrador/a puede editar precios'}>
          <input className={priceInputCls} type="number" min="0" step="0.01" placeholder="Ej: 25" value={form.price} onChange={e => set('price', e.target.value)} disabled={!canPrices} required />
        </Field>

        <Field label="Unidades en stock" hint="Cantidad disponible para la venta">
          <input className={inputCls} type="number" min="0" placeholder="Ej: 120" value={form.stock} onChange={e => set('stock', e.target.value)} required />
        </Field>
        <Field label="Proveedor" hint="Opcional">
          <select className={inputCls} value={form.supplierId ?? ''} onChange={e => set('supplierId', e.target.value || undefined)}>
            <option value="">Sin proveedor</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {canPrices && (
        <div className="text-sm bg-essence-light/10 border border-essence-purple/10 rounded-lg px-4 py-3">
          Margen estimado por unidad:{' '}
          <span className={`font-semibold ${margin >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatBOB(margin)}</span>
        </div>
      )}

      <Field label="Imagen del producto (URL)" hint="Opcional: enlace de una imagen">
        <input className={inputCls} placeholder="https://..." value={form.image ?? ''} onChange={e => set('image', e.target.value)} />
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

      <Field label="Descripción" hint="Opcional">
        <textarea className={inputCls} placeholder="Detalle del producto" rows={3} value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
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
