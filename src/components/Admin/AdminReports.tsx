import React from 'react';
import { BarChart3, Download } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Role, can } from '../../data/permissions';
import { AdminModuleHeader } from './AdminModuleHeader';
import { toCsv, downloadCsv } from '../../utils/csv';

type Tab = 'ventas' | 'inventario' | 'clientes';

export function AdminReports() {
  const { state } = useApp();
  const role = state.user?.role as Role | undefined;

  const tabs: { id: Tab; label: string; enabled: boolean }[] = [
    { id: 'ventas', label: 'Ventas', enabled: can(role, 'viewReportsSales') },
    { id: 'inventario', label: 'Inventario', enabled: can(role, 'viewReportsInventory') },
    { id: 'clientes', label: 'Clientes', enabled: can(role, 'viewReportsCustomers') }
  ].filter(t => t.enabled);

  const [tab, setTab] = React.useState<Tab>(tabs[0]?.id ?? 'ventas');

  const verified = state.orders.filter(o => o.paymentStatus === 'verificado');

  // Ventas
  const revenue = verified.reduce((sum, o) => sum + o.total, 0);
  const orderCount = verified.length;
  const avgTicket = orderCount ? Math.round(revenue / orderCount) : 0;
  const unitsByPerfume: Record<string, { name: string; units: number }> = {};
  verified.forEach(o => o.items.forEach(it => {
    unitsByPerfume[it.perfumeId] = {
      name: it.name,
      units: (unitsByPerfume[it.perfumeId]?.units ?? 0) + it.quantity
    };
  }));
  const topSelling = Object.values(unitsByPerfume).sort((a, b) => b.units - a.units);

  // Inventario
  const inventoryValue = state.perfumes.reduce((sum, p) => sum + p.price * p.stock, 0);
  const byCategory: Record<string, number> = {};
  state.perfumes.forEach(p => { byCategory[p.category] = (byCategory[p.category] ?? 0) + p.price * p.stock; });

  // Clientes
  const spentByEmail = (email: string) =>
    state.orders.filter(o => o.customer.email === email).reduce((sum, o) => sum + o.total, 0);
  const customerRows = state.users
    .map(u => ({
      name: u.name,
      email: u.email,
      orders: state.orders.filter(o => o.customer.email === u.email).length,
      spent: spentByEmail(u.email)
    }))
    .sort((a, b) => b.spent - a.spent);

  const exportCurrent = () => {
    if (tab === 'ventas') {
      downloadCsv('reporte-ventas.csv', toCsv(['Perfume', 'Unidades vendidas'], topSelling.map(t => [t.name, t.units])));
    } else if (tab === 'inventario') {
      downloadCsv('reporte-inventario.csv', toCsv(['Perfume', 'Unidades', 'Valor (BOB)'],
        state.perfumes.map(p => [p.name, p.stock, p.price * p.stock])));
    } else {
      downloadCsv('reporte-clientes.csv', toCsv(['Cliente', 'Email', 'Pedidos', 'Gasto (BOB)'],
        customerRows.map(c => [c.name, c.email, c.orders, c.spent])));
    }
  };

  const card = 'bg-white rounded-2xl shadow-lg p-6';
  const th = 'px-4 py-3 text-left';

  return (
    <div>
      <div className="flex items-start justify-between">
        <AdminModuleHeader
          title="Reportes"
          subtitle="Analiza ventas, inventario y clientes, y expórtalos a CSV"
          icon={BarChart3}
        />
        {tabs.length > 0 && (
          <button onClick={exportCurrent} className="flex items-center space-x-2 bg-essence-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-essence-plum">
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        )}
      </div>

      {tabs.length === 0 ? (
        <p className="text-gray-500">No tienes reportes disponibles.</p>
      ) : (
        <>
          <div className="flex space-x-2 mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg font-medium ${tab === t.id ? 'bg-essence-purple text-white' : 'bg-white text-essence-navy border border-gray-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'ventas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className={card}><div className="text-sm text-gray-500">Ingresos verificados</div><div className="text-2xl font-bold text-essence-navy">{revenue} BOB</div></div>
                <div className={card}><div className="text-sm text-gray-500">Pedidos verificados</div><div className="text-2xl font-bold text-essence-navy">{orderCount}</div></div>
                <div className={card}><div className="text-sm text-gray-500">Ticket promedio</div><div className="text-2xl font-bold text-essence-navy">{avgTicket} BOB</div></div>
              </div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Más vendidos</h3>
                {topSelling.length === 0 ? <p className="text-gray-500">Sin ventas verificadas todavía.</p> : (
                  <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Perfume</th><th className={th}>Unidades</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{topSelling.map(t => (<tr key={t.name}><td className="px-4 py-2">{t.name}</td><td className="px-4 py-2">{t.units}</td></tr>))}</tbody></table>
                )}
              </div>
            </div>
          )}

          {tab === 'inventario' && (
            <div className="space-y-6">
              <div className={card}><div className="text-sm text-gray-500">Valor total de inventario</div><div className="text-2xl font-bold text-essence-navy">{inventoryValue} BOB</div></div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Existencias por perfume</h3>
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Perfume</th><th className={th}>Unidades en stock</th><th className={th}>Valor (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{state.perfumes.map(p => (<tr key={p.id}><td className="px-4 py-2">{p.name}</td><td className="px-4 py-2">{p.stock}</td><td className="px-4 py-2">{p.price * p.stock}</td></tr>))}</tbody></table>
              </div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Valor por categoría</h3>
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Categoría</th><th className={th}>Valor (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{Object.entries(byCategory).map(([c, v]) => (<tr key={c}><td className="px-4 py-2 capitalize">{c}</td><td className="px-4 py-2">{v}</td></tr>))}</tbody></table>
              </div>
            </div>
          )}

          {tab === 'clientes' && (
            <div className={card}>
              <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Clientes por gasto</h3>
              {customerRows.length === 0 ? <p className="text-gray-500">Aún no hay clientes registrados.</p> : (
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Cliente</th><th className={th}>Email</th><th className={th}>Pedidos</th><th className={th}>Gasto (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{customerRows.map(c => (<tr key={c.email}><td className="px-4 py-2">{c.name}</td><td className="px-4 py-2">{c.email}</td><td className="px-4 py-2">{c.orders}</td><td className="px-4 py-2">{c.spent}</td></tr>))}</tbody></table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
