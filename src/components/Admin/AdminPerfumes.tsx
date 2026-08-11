import React from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Perfume } from '../../types';
import { PerfumeForm } from './PerfumeForm';
import { AdminModuleHeader } from './AdminModuleHeader';

export function AdminPerfumes() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = React.useState<Perfume | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const list = state.perfumes.filter(
    p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase())
  );

  const handleSave = (p: Perfume) => {
    if (editing) dispatch({ type: 'UPDATE_PERFUME', payload: p });
    else dispatch({ type: 'ADD_PERFUME', payload: p });
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return (
      <PerfumeForm
        initial={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <AdminModuleHeader
          title="Perfumes"
          subtitle="Agrega, edita y organiza tu catálogo con precios y stock"
          icon={Package}
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo perfume</span>
        </button>
      </div>

      <input
        className="w-full mb-6 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20"
        placeholder="Buscar por nombre o marca..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-essence-navy/5">
            <tr>
              <th className="px-4 py-3">Perfume</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Precio de venta (BOB)</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 flex items-center space-x-3">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <span className="font-medium text-essence-navy">{p.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.brand}</td>
                <td className="px-4 py-3">{p.price} BOB</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditing(p)} className="p-2 text-essence-purple hover:bg-essence-purple/5 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${p.name}"?`)) dispatch({ type: 'DELETE_PERFUME', payload: p.id });
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
