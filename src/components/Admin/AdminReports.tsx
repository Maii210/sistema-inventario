import React from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Role, can } from '../../data/permissions';
import { AdminModuleHeader } from './AdminModuleHeader';
import { toCsv, downloadCsv } from '../../utils/csv';
import { exportTablePdf } from '../../utils/pdf';
import { formatBOB, formatNumber } from '../../utils/format';

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

  // Inventario (con margen: precio de venta - precio de compra)
  const inventoryValue = state.perfumes.reduce((sum, p) => sum + p.price * p.stock, 0);
  const inventoryRows = state.perfumes.map(p => {
    const hasCost = p.purchasePrice != null;
    const marginUnit = hasCost ? p.price - (p.purchasePrice as number) : null;
    const value = p.price * p.stock;
    const marginTotal = marginUnit != null ? marginUnit * p.stock : null;
    return { name: p.name, stock: p.stock, purchase: p.purchasePrice ?? null, price: p.price, marginUnit, value, marginTotal };
  });
  const totalMargin = inventoryRows.reduce((sum, r) => sum + (r.marginTotal ?? 0), 0);
  const byCategory: Record<string, number> = {};
  state.perfumes.forEach(p => { byCategory[p.category] = (byCategory[p.category] ?? 0) + p.price * p.stock; });

  // Clientes
  const spentByEmail = (email: string) =>
    email ? state.orders.filter(o => o.customer.email === email).reduce((sum, o) => sum + o.total, 0) : 0;
  const customerRows = state.users
    .map(u => ({
      name: u.name,
      email: u.email,
      orders: u.email ? state.orders.filter(o => o.customer.email === u.email).length : 0,
      spent: spentByEmail(u.email)
    }))
    .sort((a, b) => b.spent - a.spent);

  const exportCsv = () => {
    if (tab === 'ventas') {
      downloadCsv('reporte-ventas.csv', toCsv(['Perfume', 'Unidades vendidas'], topSelling.map(t => [t.name, t.units])));
    } else if (tab === 'inventario') {
      downloadCsv('reporte-inventario.csv', toCsv(
        ['Perfume', 'Stock', 'Precio compra (BOB)', 'Precio venta (BOB)', 'Margen unit (BOB)', 'Valor inventario (BOB)', 'Margen total (BOB)'],
        inventoryRows.map(r => [r.name, r.stock, r.purchase ?? '', r.price, r.marginUnit ?? '', r.value, r.marginTotal ?? ''])));
    } else {
      downloadCsv('reporte-clientes.csv', toCsv(['Cliente', 'Correo', 'Pedidos', 'Gasto (BOB)'],
        customerRows.map(c => [c.name, c.email, c.orders, c.spent])));
    }
  };

  const exportPdf = () => {
    if (tab === 'ventas') {
      exportTablePdf({
        filename: 'reporte-ventas.pdf',
        title: 'Reporte de ventas',
        summary: [
          { label: 'Ingresos verificados', value: formatBOB(revenue) },
          { label: 'Pedidos verificados', value: formatNumber(orderCount) },
          { label: 'Ticket promedio', value: formatBOB(avgTicket) }
        ],
        headers: ['Perfume', 'Unidades vendidas'],
        rows: topSelling.map(t => [t.name, formatNumber(t.units)])
      });
    } else if (tab === 'inventario') {
      exportTablePdf({
        filename: 'reporte-inventario.pdf',
        title: 'Reporte de inventario y margen',
        summary: [
          { label: 'Valor total de inventario', value: formatBOB(inventoryValue) },
          { label: 'Margen total potencial', value: formatBOB(totalMargin) }
        ],
        headers: ['Perfume', 'Stock', 'P. compra', 'P. venta', 'Margen unit', 'Valor', 'Margen total'],
        rows: inventoryRows.map(r => [
          r.name,
          formatNumber(r.stock),
          r.purchase != null ? formatBOB(r.purchase) : '—',
          formatBOB(r.price),
          r.marginUnit != null ? formatBOB(r.marginUnit) : '—',
          formatBOB(r.value),
          r.marginTotal != null ? formatBOB(r.marginTotal) : '—'
        ])
      });
    } else {
      exportTablePdf({
        filename: 'reporte-clientes.pdf',
        title: 'Reporte de clientes',
        headers: ['Cliente', 'Correo', 'Pedidos', 'Gasto'],
        rows: customerRows.map(c => [c.name, c.email || 'Sin correo', formatNumber(c.orders), formatBOB(c.spent)])
      });
    }
  };

  const card = 'bg-white rounded-2xl shadow-lg p-6';
  const th = 'px-4 py-3 text-left';

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <AdminModuleHeader
          title="Reportes"
          subtitle="Analiza ventas, inventario, margen y clientes, y exporta a PDF o CSV"
          icon={BarChart3}
        />
        {tabs.length > 0 && (
          <div className="flex space-x-2">
            <button onClick={exportPdf} className="flex items-center space-x-2 bg-essence-coral text-white px-4 py-2 rounded-lg font-medium hover:opacity-90">
              <FileText className="h-4 w-4" />
              <span>Exportar PDF</span>
            </button>
            <button onClick={exportCsv} className="flex items-center space-x-2 bg-essence-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-essence-plum">
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
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
                <div className={card}><div className="text-sm text-gray-500">Ingresos verificados</div><div className="text-2xl font-bold text-essence-navy">{formatBOB(revenue)}</div></div>
                <div className={card}><div className="text-sm text-gray-500">Pedidos verificados</div><div className="text-2xl font-bold text-essence-navy">{formatNumber(orderCount)}</div></div>
                <div className={card}><div className="text-sm text-gray-500">Ticket promedio</div><div className="text-2xl font-bold text-essence-navy">{formatBOB(avgTicket)}</div></div>
              </div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Más vendidos</h3>
                {topSelling.length === 0 ? <p className="text-gray-500">Sin ventas verificadas todavía.</p> : (
                  <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Perfume</th><th className={th}>Unidades</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{topSelling.map(t => (<tr key={t.name}><td className="px-4 py-2">{t.name}</td><td className="px-4 py-2">{formatNumber(t.units)}</td></tr>))}</tbody></table>
                )}
              </div>
            </div>
          )}

          {tab === 'inventario' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className={card}><div className="text-sm text-gray-500">Valor total de inventario</div><div className="text-2xl font-bold text-essence-navy">{formatBOB(inventoryValue)}</div></div>
                <div className={card}><div className="text-sm text-gray-500">Margen total potencial</div><div className="text-2xl font-bold text-green-700">{formatBOB(totalMargin)}</div></div>
              </div>
              <div className={`${card} overflow-x-auto`}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Existencias y margen por perfume</h3>
                <table className="w-full whitespace-nowrap">
                  <thead className="bg-essence-navy/5"><tr>
                    <th className={th}>Perfume</th><th className={th}>Stock</th><th className={th}>P. compra</th><th className={th}>P. venta</th><th className={th}>Margen unit.</th><th className={th}>Valor inventario</th><th className={th}>Margen total</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">{inventoryRows.map(r => (
                    <tr key={r.name}>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2">{formatNumber(r.stock)}</td>
                      <td className="px-4 py-2">{r.purchase != null ? formatBOB(r.purchase) : '—'}</td>
                      <td className="px-4 py-2">{formatBOB(r.price)}</td>
                      <td className={`px-4 py-2 ${r.marginUnit != null && r.marginUnit < 0 ? 'text-red-600' : 'text-green-700'}`}>{r.marginUnit != null ? formatBOB(r.marginUnit) : '—'}</td>
                      <td className="px-4 py-2">{formatBOB(r.value)}</td>
                      <td className={`px-4 py-2 ${r.marginTotal != null && r.marginTotal < 0 ? 'text-red-600' : 'text-green-700'}`}>{r.marginTotal != null ? formatBOB(r.marginTotal) : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className={card}>
                <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Valor por categoría</h3>
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Categoría</th><th className={th}>Valor (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{Object.entries(byCategory).map(([c, v]) => (<tr key={c}><td className="px-4 py-2 capitalize">{c}</td><td className="px-4 py-2">{formatBOB(v)}</td></tr>))}</tbody></table>
              </div>
            </div>
          )}

          {tab === 'clientes' && (
            <div className={card}>
              <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Clientes por gasto</h3>
              {customerRows.length === 0 ? <p className="text-gray-500">Aún no hay clientes registrados.</p> : (
                <table className="w-full"><thead className="bg-essence-navy/5"><tr><th className={th}>Cliente</th><th className={th}>Correo</th><th className={th}>Pedidos</th><th className={th}>Gasto (BOB)</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{customerRows.map(c => (<tr key={c.email || c.name}><td className="px-4 py-2">{c.name}</td><td className="px-4 py-2">{c.email || 'Sin correo'}</td><td className="px-4 py-2">{formatNumber(c.orders)}</td><td className="px-4 py-2">{formatBOB(c.spent)}</td></tr>))}</tbody></table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
