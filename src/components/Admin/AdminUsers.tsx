import React from 'react';
import { UserCog, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { StaffUser } from '../../types';
import { ROLE_LABELS, Role } from '../../data/permissions';
import { AdminModuleHeader } from './AdminModuleHeader';
import { StaffForm } from './StaffForm';

export function AdminUsers() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = React.useState<StaffUser | null>(null);
  const [creating, setCreating] = React.useState(false);

  const handleSave = (u: StaffUser) => {
    if (editing) dispatch({ type: 'UPDATE_STAFF', payload: u });
    else dispatch({ type: 'ADD_STAFF', payload: u });
    setEditing(null);
    setCreating(false);
  };

  if (creating || editing) {
    return (
      <StaffForm
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
          title="Usuarios"
          subtitle="Crea cuentas de personal y define qué puede hacer cada rol"
          icon={UserCog}
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo usuario</span>
        </button>
      </div>

      {state.staff.length === 0 ? (
        <p className="text-gray-500">Aún no hay usuarios de personal. El administrador principal ya tiene acceso.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-essence-navy/5">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.staff.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-essence-navy">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role as Role]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                      {u.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setEditing(u)} className="p-2 text-essence-purple hover:bg-essence-purple/5 rounded-lg">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`¿Eliminar a "${u.name}"?`)) dispatch({ type: 'DELETE_STAFF', payload: u.id }); }}
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
