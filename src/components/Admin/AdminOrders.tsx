import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { AdminModuleHeader } from './AdminModuleHeader';

const paymentStyles: Record<PaymentStatus, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  verificado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800'
};

const orderStatuses: OrderStatus[] = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

export function AdminOrders() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = React.useState<'todos' | PaymentStatus>('todos');

  const orders = state.orders.filter(o => filter === 'todos' || o.paymentStatus === filter);

  const setPayment = (order: Order, paymentStatus: PaymentStatus) =>
    dispatch({ type: 'UPDATE_ORDER', payload: { ...order, paymentStatus } });
  const setOrderStatus = (order: Order, orderStatus: OrderStatus) =>
    dispatch({ type: 'UPDATE_ORDER', payload: { ...order, orderStatus } });

  return (
    <div>
      <AdminModuleHeader
        title="Pedidos y pagos"
        subtitle="Revisa pedidos, verifica pagos y actualiza su estado"
        icon={ShoppingCart}
      />

      <div className="flex space-x-2 mb-6">
        {(['todos', 'pendiente', 'verificado', 'rechazado'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === f ? 'bg-essence-purple text-white' : 'bg-white text-essence-navy border border-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">No hay pedidos.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <div className="font-semibold text-essence-navy">Pedido #{o.id}</div>
                  <div className="text-sm text-gray-500">{new Date(o.date).toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {o.customer.name} · {o.customer.email} · {o.customer.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-essence-navy">{o.total} BOB</div>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${paymentStyles[o.paymentStatus]}`}>
                    Pago: {o.paymentStatus}
                  </span>
                </div>
              </div>

              <ul className="text-sm text-gray-700 mb-4 divide-y divide-gray-100">
                {o.items.map(it => (
                  <li key={it.perfumeId} className="flex justify-between py-1">
                    <span>{it.name} × {it.quantity}</span>
                    <span>{it.price * it.quantity} BOB</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-500">Método: {o.paymentMethod}</span>
                <button onClick={() => setPayment(o, 'verificado')} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                  Verificar pago
                </button>
                <button onClick={() => setPayment(o, 'rechazado')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                  Rechazar
                </button>
                <select
                  value={o.orderStatus}
                  onChange={e => setOrderStatus(o, e.target.value as OrderStatus)}
                  className="ml-auto border border-gray-200 rounded-lg px-3 py-2 text-sm capitalize"
                >
                  {orderStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
