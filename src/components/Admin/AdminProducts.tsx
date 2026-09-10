import React from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Product } from '../../types';
import { ProductForm } from './ProductForm';
import { AdminModuleHeader } from './AdminModuleHeader';
import { Role, can } from '../../data/permissions';
import { formatBOB } from '../../utils/format';

export function AdminProducts() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const canPrices = can(state.user?.role as Role | undefined, 'managePrices');

  const list = state.products.filter(
    p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(query.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const handleSave = (p: Product) => {
    if (editing) dispatch({ type: 'UPDATE_PRODUCT', payload: p });
    else dispatch({ type: 'ADD_PRODUCT', payload: p });
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return (
      <ProductForm
        initial={editing ?? undefined}
        suppliers={state.suppliers}
        canPrices={canPrices}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <AdminModuleHeader
          title="Productos"
          subtitle="Agrega, edita y organiza tu inventario con precios y stock"
          icon={Package}
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo producto</span>
        </button>
      </div>

      <input
        className="w-full mb-6 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20"
        placeholder="Buscar por nombre, marca o categoría..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-essence-navy/5">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio de compra (BOB)</th>
              <th className="px-4 py-3">Precio de venta (BOB)</th>
              <th className="px-4 py-3">Margen por unidad (BOB)</th>
              <th className="px-4 py-3">Unidades en stock</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-essence-navy">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.category || '—'}</td>
                <td className="px-4 py-3">{p.purchasePrice != null ? formatBOB(p.purchasePrice) : '—'}</td>
                <td className="px-4 py-3">{formatBOB(p.price)}</td>
                <td className="px-4 py-3">
                  {p.purchasePrice != null ? (
                    <span className={p.price - p.purchasePrice >= 0 ? 'text-green-700' : 'text-red-600'}>
                      {formatBOB(p.price - p.purchasePrice)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 text-gray-600">
                  {state.suppliers.find(s => s.id === p.supplierId)?.name || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditing(p)} className="p-2 text-essence-purple hover:bg-essence-purple/5 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${p.name}"?`)) dispatch({ type: 'DELETE_PRODUCT', payload: p.id });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
