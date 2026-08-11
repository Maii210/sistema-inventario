import React from 'react';
import { Mail, Phone, ShoppingBag, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AdminModuleHeader } from './AdminModuleHeader';

export function AdminCustomers() {
  const { state } = useApp();
  const { users, orders } = state;

  const ordersByEmail = (email: string) => orders.filter(o => o.customer.email === email);

  return (
    <div>
      <AdminModuleHeader
        title="Clientes"
        subtitle="Consulta tus clientes registrados y su historial de compras"
        icon={Users}
      />

      {users.length === 0 ? (
        <p className="text-gray-500">Aún no hay clientes registrados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.map(u => {
            const userOrders = ordersByEmail(u.email);
            const spent = userOrders.reduce((sum, o) => sum + o.total, 0);
            return (
              <div key={u.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="font-semibold text-essence-navy text-lg">{u.name}</div>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>{u.email}</span></div>
                  {u.phone && <div className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>{u.phone}</span></div>}
                  <div className="flex items-center space-x-2"><ShoppingBag className="h-4 w-4" /><span>{userOrders.length} pedido(s) · {spent} BOB</span></div>
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
