import React from 'react';
import { Truck, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Supplier } from '../../types';
import { AdminModuleHeader } from './AdminModuleHeader';
import { SupplierForm } from './SupplierForm';

export function AdminSuppliers() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [creating, setCreating] = React.useState(false);

  const handleSave = (s: Supplier) => {
    if (editing) dispatch({ type: 'UPDATE_SUPPLIER', payload: s });
    else dispatch({ type: 'ADD_SUPPLIER', payload: s });
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return (
      <SupplierForm
        initial={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <AdminModuleHeader
          title="Proveedores"
          subtitle="Administra tus proveedores y vincúlalos a cada producto"
          icon={Truck}
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo proveedor</span>
        </button>
      </div>

      {state.suppliers.length === 0 ? (
        <p className="text-gray-500">Aún no hay proveedores.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-essence-navy/5">
              <tr>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.suppliers.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-essence-navy">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contactName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setEditing(s)} className="p-2 text-essence-purple hover:bg-essence-purple/5 rounded-lg">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`¿Eliminar "${s.name}"?`)) dispatch({ type: 'DELETE_SUPPLIER', payload: s.id }); }}
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
      )}
    </div>
  );
}
