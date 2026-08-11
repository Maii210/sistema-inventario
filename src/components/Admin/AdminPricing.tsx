import React from 'react';
import { Save, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AdminModuleHeader } from './AdminModuleHeader';

export function AdminPricing() {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = React.useState<Record<string, { price: string; originalPrice: string; stock: string }>>({});

  const getVal = (id: string, field: 'price' | 'originalPrice' | 'stock', fallback: number | undefined) =>
    draft[id]?.[field] ?? (fallback ?? '').toString();

  const setVal = (id: string, field: 'price' | 'originalPrice' | 'stock', value: string) =>
    setDraft(prev => ({
      ...prev,
      [id]: {
        price: prev[id]?.price ?? '',
        originalPrice: prev[id]?.originalPrice ?? '',
        stock: prev[id]?.stock ?? '',
        [field]: value
      }
    }));

  const save = (id: string) => {
    const perfume = state.perfumes.find(p => p.id === id);
    if (!perfume) return;
    const d = draft[id];
    dispatch({
      type: 'UPDATE_PERFUME',
      payload: {
        ...perfume,
        price: d?.price ? Number(d.price) : perfume.price,
        originalPrice: d?.originalPrice ? Number(d.originalPrice) : perfume.originalPrice,
        stock: d?.stock ? Number(d.stock) : perfume.stock
      }
    });
    setDraft(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const cell = 'w-24 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20';

  return (
    <div>
      <AdminModuleHeader
        title="Precios y stock"
        subtitle="Ajusta precios de venta, ofertas y existencias"
        icon={DollarSign}
      />
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-essence-navy/5">
            <tr>
              <th className="px-4 py-3">Perfume</th>
              <th className="px-4 py-3">Precio de venta (BOB)</th>
              <th className="px-4 py-3">Precio antes de oferta (BOB)</th>
              <th className="px-4 py-3">Unidades en stock</th>
              <th className="px-4 py-3 text-right">Guardar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.perfumes.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-essence-navy">{p.name}</td>
                <td className="px-4 py-3">
                  <input className={cell} type="number" value={getVal(p.id, 'price', p.price)} onChange={e => setVal(p.id, 'price', e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <input className={cell} type="number" value={getVal(p.id, 'originalPrice', p.originalPrice)} onChange={e => setVal(p.id, 'originalPrice', e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <input className={cell} type="number" value={getVal(p.id, 'stock', p.stock)} onChange={e => setVal(p.id, 'stock', e.target.value)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => save(p.id)}
                    disabled={!draft[p.id]}
                    className="inline-flex items-center space-x-2 bg-essence-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-essence-plum disabled:opacity-40"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
