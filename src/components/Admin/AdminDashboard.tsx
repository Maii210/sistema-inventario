import { LayoutDashboard, Package, DollarSign, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { LOW_STOCK_THRESHOLD } from '../../data/adminConfig';
import { AdminModuleHeader } from './AdminModuleHeader';
import { formatBOB } from '../../utils/format';

export function AdminDashboard() {
  const { state } = useApp();
  const { products, orders } = state;

  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter(p => p.stock < LOW_STOCK_THRESHOLD);
  const salesCount = orders.length;
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);

  const cards = [
    { label: 'Productos', value: products.length, icon: Package },
    { label: 'Valor de inventario', value: formatBOB(inventoryValue), icon: DollarSign },
    { label: 'Stock bajo', value: lowStock.length, icon: AlertTriangle },
    { label: 'Ventas registradas', value: salesCount, icon: ShoppingCart },
    { label: 'Ingresos por ventas', value: formatBOB(revenue), icon: TrendingUp }
  ];

  return (
    <div>
      <AdminModuleHeader
        title="Dashboard"
        subtitle="Resumen de la tienda: inventario y ventas de un vistazo"
        icon={LayoutDashboard}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-essence-coral/10 flex items-center justify-center">
              <c.icon className="h-6 w-6 text-essence-coral" />
            </div>
            <div>
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="text-2xl font-bold text-essence-navy">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Productos con stock bajo</h2>
        {lowStock.length === 0 ? (
          <p className="text-gray-500">Todo el inventario está por encima del umbral ({LOW_STOCK_THRESHOLD}).</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {lowStock.map(p => (
              <li key={p.id} className="flex justify-between py-3">
                <span className="text-essence-navy">{p.name}</span>
                <span className="text-red-600 font-medium">{p.stock} u.</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
