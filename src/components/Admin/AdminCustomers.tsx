import React from 'react';
import { Mail, Phone, ShoppingBag, Users, Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { User } from '../../types';
import { AdminModuleHeader } from './AdminModuleHeader';
import { CustomerForm } from './CustomerForm';
import { formatBOB } from '../../utils/format';

export function AdminCustomers() {
  const { state, dispatch } = useApp();
  const { users, orders } = state;
  const [creating, setCreating] = React.useState(false);

  const ordersByEmail = (email: string) =>
    email ? orders.filter(o => o.customer.email === email) : [];

  const handleSave = (u: User) => {
    dispatch({ type: 'ADD_USER', payload: u });
    setCreating(false);
  };

  if (creating) {
    return <CustomerForm onSave={handleSave} onCancel={() => setCreating(false)} />;
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <AdminModuleHeader
          title="Clientes"
          subtitle="Registra clientes y consulta su historial de compras"
          icon={Users}
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-500">Aún no hay clientes registrados. Usa "Nuevo cliente" para agregar el primero.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.map(u => {
            const userOrders = ordersByEmail(u.email);
            const spent = userOrders.reduce((sum, o) => sum + o.total, 0);
            return (
              <div key={u.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="font-semibold text-essence-navy text-lg">{u.name}</div>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>{u.email || 'Sin correo'}</span></div>
                  {u.phone && <div className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>{u.phone}</span></div>}
                  <div className="flex items-center space-x-2"><ShoppingBag className="h-4 w-4" /><span>{userOrders.length} pedido(s) · {formatBOB(spent)}</span></div>
                </div>
                {u.createdAt && (
                  <div className="text-xs text-gray-400 mt-3">Registrado: {new Date(u.createdAt).toLocaleDateString()}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
