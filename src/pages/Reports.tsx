import { useEffect, useState, useMemo, useRef } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Package, Calendar, FileDown, ChevronLeft, ChevronRight, ArrowUpDown, Users, Truck, Wallet } from 'lucide-react';
import { supabase, Sale, Product, Client, Supplier, PaymentMethod, formatCurrency, formatDateTime, formatDate } from '@/lib/supabase';
import { cashApi, CashSession } from '@/lib/api';
import { PHONE_PREFIX } from '@/lib/validation';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';

type Tab = 'ventas' | 'inventario' | 'clientes' | 'proveedores' | 'cajas';
type SortDir = 'asc' | 'desc';

export function Reports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ventas');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [saleSort, setSaleSort] = useState<{ col: string; dir: SortDir }>({ col: 'created_at', dir: 'desc' });
  const [prodSort, setProdSort] = useState<{ col: string; dir: SortDir }>({ col: 'name', dir: 'asc' });
  const [clientSort, setClientSort] = useState<{ col: string; dir: SortDir }>({ col: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const didLoadRef = useRef(false);
  useEffect(() => { loadData(didLoadRef.current); didLoadRef.current = true; }, [startDate, endDate]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    const start = new Date(startDate + 'T00:00:00').toISOString();
    const end = new Date(endDate + 'T23:59:59').toISOString();
    const [salesRes, productsRes, clientsRes, suppliersRes, cashRes] = await Promise.all([
      supabase.from('sales').select('*, client:clients(*), seller:profiles(*), sale_items(*)').eq('status', 'completada').gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false }),
      supabase.from('products').select('*, supplier:suppliers(*)'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('suppliers').select('*').order('name'),
      cashApi.history().catch(() => []),
    ]);
    setSales((salesRes.data as Sale[]) ?? []);
    setProducts((productsRes.data as Product[]) ?? []);
    setClients((clientsRes.data as Client[]) ?? []);
    setSuppliers((suppliersRes.data as Supplier[]) ?? []);
    setCashSessions((cashRes as CashSession[]) ?? []);
    setPage(1);
    if (!silent) setLoading(false);
  };

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount), 0);
    const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
    const inventoryValue = products.reduce((sum, p) => sum + Number(p.sale_price) * p.stock, 0);
    const inventoryCost = products.reduce((sum, p) => sum + Number(p.cost_price) * p.stock, 0);
    const lowStock = products.filter((p) => p.stock <= p.min_stock && p.stock > 0).length;
    const outStock = products.filter((p) => p.stock === 0).length;
    return { totalRevenue, totalDiscount, avgTicket, inventoryValue, inventoryCost, lowStock, outStock, saleCount: sales.length, productCount: products.length, clientCount: clients.length };
  }, [sales, products, clients]);

  const paymentBreakdown = useMemo(() => {
    const methods: PaymentMethod[] = ['Efectivo', 'QR'];
    return methods.map((method) => {
      const methodSales = sales.filter((s) => s.payment_method === method);
      return { method, count: methodSales.length, total: methodSales.reduce((sum, s) => sum + Number(s.total), 0) };
    });
  }, [sales]);

  const sortedSales = useMemo(() => {
    const arr = [...sales];
    arr.sort((a, b) => {
      let va: any, vb: any;
      switch (saleSort.col) {
        case 'total': va = Number(a.total); vb = Number(b.total); break;
        case 'client': va = a.client?.name ?? ''; vb = b.client?.name ?? ''; break;
        case 'payment': va = a.payment_method; vb = b.payment_method; break;
        default: va = a.created_at; vb = b.created_at;
      }
      if (va < vb) return saleSort.dir === 'asc' ? -1 : 1;
      if (va > vb) return saleSort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [sales, saleSort]);

  const sortedProducts = useMemo(() => {
    const arr = [...products];
    arr.sort((a, b) => {
      let va: any, vb: any;
      switch (prodSort.col) {
        case 'stock': va = a.stock; vb = b.stock; break;
        case 'sale_price': va = a.sale_price; vb = b.sale_price; break;
        case 'category': va = a.category; vb = b.category; break;
        default: va = a.name; vb = b.name;
      }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return prodSort.dir === 'asc' ? -1 : 1;
      if (va > vb) return prodSort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [products, prodSort]);

  const sortedClients = useMemo(() => {
    const arr = [...clients];
    arr.sort((a, b) => {
      let va: any, vb: any;
      switch (clientSort.col) {
        case 'email': va = a.email ?? ''; vb = b.email ?? ''; break;
        case 'phone': va = a.phone ?? ''; vb = b.phone ?? ''; break;
        default: va = a.name; vb = b.name;
      }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return clientSort.dir === 'asc' ? -1 : 1;
      if (va > vb) return clientSort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [clients, clientSort]);

  const supplierStats = useMemo(() => {
    return suppliers.map((s) => {
      const prods = products.filter((p) => p.supplier_id === s.id);
      const totalValue = prods.reduce((sum, p) => sum + Number(p.sale_price) * p.stock, 0);
      return { ...s, productCount: prods.length, totalValue, stock: prods.reduce((sum, p) => sum + p.stock, 0) };
    });
  }, [suppliers, products]);

  // Productos prestados (ítems externos): se prestan sin descontar stock.
  const borrowed = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; cost: number; price: number }>();
    for (const s of sales) {
      for (const it of s.sale_items ?? []) {
        if (!it.is_external) continue;
        const cur = map.get(it.product_name) ?? { name: it.product_name, quantity: 0, cost: 0, price: 0 };
        cur.quantity += it.quantity;
        cur.cost += Number(it.external_cost ?? 0) * it.quantity;
        cur.price += Number(it.unit_price) * it.quantity;
        map.set(it.product_name, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [sales]);
  const totalBorrowedCost = borrowed.reduce((sum, b) => sum + b.cost, 0);

  // Descuentos agrupados por vendedora (para admin).
  const discountsBySeller = useMemo(() => {
    const map = new Map<string, { sellerName: string; count: number; discount: number; total: number }>();
    for (const s of sales) {
      const key = s.seller_id || 'sin-asignar';
      const name = s.seller ? `${s.seller.full_name} ${s.seller.last_name}`.trim() : 'Sin asignar';
      const cur = map.get(key) ?? { sellerName: name, count: 0, discount: 0, total: 0 };
      cur.count += 1;
      cur.discount += Number(s.discount);
      cur.total += Number(s.total);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.discount - a.discount);
  }, [sales]);

  // Descuentos propios de la vendedora logueada.
  const myDiscount = useMemo(
    () => sales.filter((s) => s.seller_id === profile?.id).reduce((sum, s) => sum + Number(s.discount), 0),
    [sales, profile]
  );

  // Ventas agrupadas por día (cada página del detalle = un día).
  const salesDays = useMemo(() => {
    const map = new Map<string, Sale[]>();
    for (const s of sortedSales) {
      const day = s.created_at.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [sortedSales]);

  // Historial de cajas cerradas (para el apartado "Cajas").
  const closedCashSessions = useMemo(
    () => cashSessions.filter((c) => c.status === 'closed'),
    [cashSessions]
  );

  const saleProductsText = (s: Sale) =>
    (s.sale_items ?? []).map((i) => `${i.product_name} x${i.quantity}${i.is_external ? ' (Prestado)' : ''}`).join(', ');

  const toggleSort = (col: string, current: { col: string; dir: SortDir }, setFn: (s: { col: string; dir: SortDir }) => void) => {
    if (current.col === col) setFn({ col, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    else setFn({ col, dir: 'asc' });
  };

  const SortIcon = ({ col, current }: { col: string; current: { col: string; dir: SortDir } }) => (
    <ArrowUpDown size={12} className={`ml-1 inline ${current.col === col ? 'text-primary-600' : 'text-neutral-300 dark:text-neutral-600'}`} />
  );

  const paginate = <T,>(arr: T[]): T[] => arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = (arr: any[]) => Math.ceil(arr.length / PAGE_SIZE);

  const exportCSV = (headers: string[], rows: any[][], filename: string) => {
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportPDF = (title: string, headers: string[], rows: any[][]) => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 15);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${startDate} al ${endDate} · Generado: ${new Date().toLocaleDateString('es-BO')}`, 14, 22);
    let y = 30;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    headers.forEach((h, i) => { doc.text(h, 14 + i * 50, y); });
    y += 5; doc.line(14, y, 280, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
    rows.slice(0, 40).forEach((row) => {
      row.forEach((cell, i) => { doc.text(String(cell), 14 + i * 50, y); });
      y += 4;
    });
    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const isVendor = profile?.role === 'vendedor';
  const allTabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'ventas', label: 'Ventas', icon: ShoppingCart },
    { key: 'inventario', label: 'Inventario', icon: Package },
    { key: 'clientes', label: 'Clientes', icon: Users },
    { key: 'proveedores', label: 'Proveedores', icon: Truck },
    { key: 'cajas', label: 'Cajas', icon: Wallet },
  ];
  const tabs = isVendor ? allTabs.filter((t) => ['ventas', 'inventario'].includes(t.key)) : allTabs;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Reportes</h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Análisis y estadísticas del negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-neutral-400" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input py-1.5 text-sm" />
            <span className="text-neutral-400">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input py-1.5 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === t.key ? 'bg-primary-600 text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {!isVendor && (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center"><DollarSign size={20} /></div><span className="text-sm text-neutral-400">Ingresos</span></div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-neutral-400 mt-1">{stats.saleCount} ventas</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/40 text-accent-600 flex items-center justify-center"><ShoppingCart size={20} /></div><span className="text-sm text-neutral-400">Ticket promedio</span></div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(stats.avgTicket)}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/40 text-warning-600 flex items-center justify-center"><TrendingUp size={20} /></div><span className="text-sm text-neutral-400">Descuentos</span></div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(stats.totalDiscount)}</p>
            </div>
          </>
        )}
        {isVendor && (
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/40 text-warning-600 flex items-center justify-center"><TrendingUp size={20} /></div><span className="text-sm text-neutral-400">Tus descuentos</span></div>
            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(myDiscount)}</p>
            <p className="text-xs text-neutral-400 mt-1">Aplicados en tus ventas</p>
          </div>
        )}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/40 text-success-600 flex items-center justify-center"><Package size={20} /></div><span className="text-sm text-neutral-400">Inventario</span></div>
          <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{stats.productCount} productos</p>
          <p className="text-xs text-neutral-400 mt-1">Valor: {formatCurrency(stats.inventoryValue)}</p>
        </div>
      </div>

      {activeTab === 'ventas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Métodos de pago</h2>
              <div className="space-y-3">
                {paymentBreakdown.map((pm) => (
                  <div key={pm.method}>
                    <div className="flex justify-between mb-1"><span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{pm.method}</span><span className="text-sm text-neutral-500">{formatCurrency(pm.total)} · {pm.count}</span></div>
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full" style={{ width: `${pm.total > 0 ? Math.max((pm.total / Math.max(...paymentBreakdown.map((p) => p.total), 1)) * 100, 2) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Resumen</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-400">Total ingresos</span><span className="font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(stats.totalRevenue)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Total descuentos</span><span className="text-success-600">-{formatCurrency(stats.totalDiscount)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Ventas realizadas</span><span className="text-neutral-700 dark:text-neutral-200">{stats.saleCount}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Ticket promedio</span><span className="text-neutral-700 dark:text-neutral-200">{formatCurrency(stats.avgTicket)}</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Productos prestados ({borrowed.length})</h2>
                <span className="text-xs text-neutral-400">Costo total: {formatCurrency(totalBorrowedCost)}</span>
              </div>
              {borrowed.length === 0 ? (
                <p className="px-6 py-4 text-sm text-neutral-400">No hay productos prestados en el período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Producto</th>
                      <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Cantidad</th>
                      <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Costo</th>
                    </tr></thead>
                    <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                      {borrowed.map((b) => (
                        <tr key={b.name}>
                          <td className="px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">{b.name}</td>
                          <td className="px-5 py-3 text-sm text-right text-neutral-500">{b.quantity}</td>
                          <td className="px-5 py-3 text-sm text-right text-neutral-500">{formatCurrency(b.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!isVendor && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Descuentos por vendedora</h2>
                </div>
                {discountsBySeller.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-neutral-400">No hay descuentos en el período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                        <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Vendedora</th>
                        <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Ventas</th>
                        <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Descuentos</th>
                      </tr></thead>
                      <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                        {discountsBySeller.map((d) => (
                          <tr key={d.sellerName}>
                            <td className="px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">{d.sellerName}</td>
                            <td className="px-5 py-3 text-sm text-right text-neutral-500">{d.count}</td>
                            <td className="px-5 py-3 text-sm text-right text-success-600 font-medium">{formatCurrency(d.discount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Detalle de ventas ({sortedSales.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(['Fecha', 'Cliente', 'Productos', 'Pago', 'Descuento', 'Total'], sortedSales.map((s) => [formatDateTime(s.created_at), s.client?.name ?? 'General', saleProductsText(s), s.payment_method, Number(s.discount), Number(s.total)]), 'ventas')} className="btn-secondary text-xs"><FileDown size={14} /> CSV</button>
                <button onClick={() => exportPDF('Reporte de Ventas', ['Fecha', 'Cliente', 'Productos', 'Pago', 'Descuento', 'Total'], sortedSales.map((s) => [formatDateTime(s.created_at), s.client?.name ?? 'General', saleProductsText(s), s.payment_method, formatCurrency(Number(s.discount)), formatCurrency(Number(s.total))]))} className="btn-secondary text-xs"><FileDown size={14} /> PDF</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <th onClick={() => toggleSort('created_at', saleSort, setSaleSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Fecha <SortIcon col="created_at" current={saleSort} /></th>
                  <th onClick={() => toggleSort('client', saleSort, setSaleSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Cliente <SortIcon col="client" current={saleSort} /></th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Productos</th>
                  <th onClick={() => toggleSort('payment', saleSort, setSaleSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Pago <SortIcon col="payment" current={saleSort} /></th>
                  <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Descuento</th>
                  <th onClick={() => toggleSort('total', saleSort, setSaleSort)} className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Total <SortIcon col="total" current={saleSort} /></th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                  {(salesDays[page - 1]?.items ?? []).map((sale) => (
                    <tr key={sale.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                      <td className="px-5 py-3 text-sm text-neutral-500 whitespace-nowrap">{formatDateTime(sale.created_at)}</td>
                      <td className="px-5 py-3 text-sm text-neutral-700 dark:text-neutral-200">{sale.client?.name ?? 'General'}</td>
                      <td className="px-5 py-3 text-sm text-neutral-500 max-w-[280px]">
                        <div className="flex flex-wrap gap-1">
                          {(sale.sale_items ?? []).map((it, idx) => (
                            <span key={idx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${it.is_external ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                              {it.product_name} <span className="opacity-70">x{it.quantity}</span> {it.is_external && <span className="font-semibold">· Prestado</span>}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm">{sale.payment_method}</td>
                      <td className="px-5 py-3 text-sm text-right text-neutral-500">{formatCurrency(Number(sale.discount))}</td>
                      <td className="px-5 py-3 text-sm text-right font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(Number(sale.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {salesDays.length > 1 && (
              <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Día {formatDate(salesDays[page - 1]?.date ?? '')} · {salesDays[page - 1]?.items.length ?? 0} ventas · del {formatDate(salesDays[0]?.date ?? '')} al {formatDate(salesDays[salesDays.length - 1]?.date ?? '')}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <span className="text-xs text-neutral-400 px-1">{page}/{salesDays.length}</span>
                  <button onClick={() => setPage(Math.min(salesDays.length, page + 1))} disabled={page === salesDays.length} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'inventario' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5"><p className="text-sm text-neutral-400">Valor inventario (venta)</p><p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(stats.inventoryValue)}</p></div>
            <div className="card p-5"><p className="text-sm text-neutral-400">Valor inventario (costo)</p><p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(stats.inventoryCost)}</p></div>
            <div className="card p-5"><p className="text-sm text-neutral-400">Stock bajo / Agotados</p><p className="text-2xl font-bold"><span className="text-error-600">{stats.lowStock}</span> / <span className="text-error-600">{stats.outStock}</span></p></div>
          </div>
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Productos ({sortedProducts.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(['Nombre', 'Categoría', 'Stock', 'Mín', 'Precio Venta', 'Proveedor'], sortedProducts.map((p) => [p.name, p.category, p.stock, p.min_stock, p.sale_price, p.supplier?.name ?? '']), 'inventario')} className="btn-secondary text-xs"><FileDown size={14} /> CSV</button>
                <button onClick={() => exportPDF('Reporte de Inventario', ['Nombre', 'Categoría', 'Stock', 'Mín', 'Precio Venta', 'Proveedor'], sortedProducts.map((p) => [p.name, p.category, String(p.stock), String(p.min_stock), formatCurrency(p.sale_price), p.supplier?.name ?? '']))} className="btn-secondary text-xs"><FileDown size={14} /> PDF</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <th onClick={() => toggleSort('name', prodSort, setProdSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Nombre <SortIcon col="name" current={prodSort} /></th>
                  <th onClick={() => toggleSort('category', prodSort, setProdSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Categoría <SortIcon col="category" current={prodSort} /></th>
                  <th onClick={() => toggleSort('stock', prodSort, setProdSort)} className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Stock <SortIcon col="stock" current={prodSort} /></th>
                  <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Mínimo</th>
                  <th onClick={() => toggleSort('sale_price', prodSort, setProdSort)} className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">P. Venta <SortIcon col="sale_price" current={prodSort} /></th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Proveedor</th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                  {paginate(sortedProducts).map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                      <td className="px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">{p.name}</td>
                      <td className="px-5 py-3 text-sm text-neutral-500">{p.category}</td>
                      <td className={`px-5 py-3 text-sm text-right font-semibold ${p.stock === 0 || p.stock <= p.min_stock ? 'text-error-600' : 'text-success-600'}`}>{p.stock}</td>
                      <td className="px-5 py-3 text-sm text-right text-neutral-400">{p.min_stock}</td>
                      <td className="px-5 py-3 text-sm text-right text-neutral-700 dark:text-neutral-200">{formatCurrency(p.sale_price)}</td>
                      <td className="px-5 py-3 text-sm text-neutral-500">{p.supplier?.name ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages(sortedProducts) > 1 && (
              <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, sortedProducts.length)} de {sortedProducts.length}</span>
                <div className="flex gap-1"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft size={16} /></button><button onClick={() => setPage(Math.min(totalPages(sortedProducts), page + 1))} disabled={page === totalPages(sortedProducts)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronRight size={16} /></button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Clientes ({sortedClients.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => exportCSV(['Nombre', 'Apellido', 'Email', 'Teléfono', 'Documento'], sortedClients.map((c) => [c.name, c.last_name, c.email ?? '', c.phone ?? '', c.document_id ?? '']), 'clientes')} className="btn-secondary text-xs"><FileDown size={14} /> CSV</button>
              <button onClick={() => exportPDF('Reporte de Clientes', ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Documento'], sortedClients.map((c) => [c.name, c.last_name ?? '', c.email ?? '', c.phone ? `${PHONE_PREFIX} ${c.phone}` : '', c.document_id ?? '']))} className="btn-secondary text-xs"><FileDown size={14} /> PDF</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                <th onClick={() => toggleSort('name', clientSort, setClientSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Nombre <SortIcon col="name" current={clientSort} /></th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Apellido</th>
                <th onClick={() => toggleSort('email', clientSort, setClientSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Email <SortIcon col="email" current={clientSort} /></th>
                <th onClick={() => toggleSort('phone', clientSort, setClientSort)} className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3 cursor-pointer">Teléfono <SortIcon col="phone" current={clientSort} /></th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Documento</th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {paginate(sortedClients).map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">{c.name}</td>
                    <td className="px-5 py-3 text-sm text-neutral-500">{c.last_name}</td>
                    <td className="px-5 py-3 text-sm text-neutral-500">{c.email ?? '-'}</td>
                    <td className="px-5 py-3 text-sm text-neutral-500">{c.phone ? `${PHONE_PREFIX} ${c.phone}` : '-'}</td>
                    <td className="px-5 py-3 text-sm text-neutral-500">{c.document_id ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages(sortedClients) > 1 && (
            <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, sortedClients.length)} de {sortedClients.length}</span>
              <div className="flex gap-1"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft size={16} /></button><button onClick={() => setPage(Math.min(totalPages(sortedClients), page + 1))} disabled={page === totalPages(sortedClients)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronRight size={16} /></button></div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'proveedores' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Proveedores ({supplierStats.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(['Proveedor', 'Productos', 'Stock Total', 'Valor Total'], supplierStats.map((s) => [s.name, s.productCount, s.stock, s.totalValue]), 'proveedores')} className="btn-secondary text-xs"><FileDown size={14} /> CSV</button>
                <button onClick={() => exportPDF('Reporte de Proveedores', ['Proveedor', 'Productos', 'Stock Total', 'Valor Total'], supplierStats.map((s) => [s.name, String(s.productCount), String(s.stock), formatCurrency(s.totalValue)]))} className="btn-secondary text-xs"><FileDown size={14} /> PDF</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Proveedor</th>
                  <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Productos</th>
                  <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Stock</th>
                  <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Valor Total</th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                  {supplierStats.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                      <td className="px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">{s.name}</td>
                      <td className="px-5 py-3 text-sm text-right text-neutral-500">{s.productCount}</td>
                      <td className="px-5 py-3 text-sm text-right text-neutral-500">{s.stock}</td>
                      <td className="px-5 py-3 text-sm text-right font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(s.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'cajas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5"><p className="text-sm text-neutral-400">Cierres registrados</p><p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{closedCashSessions.length}</p></div>
            <div className="card p-5"><p className="text-sm text-neutral-400">Total descuentos</p><p className="text-2xl font-bold text-success-600">{formatCurrency(closedCashSessions.reduce((sum, c) => sum + (c.totals?.discount ?? 0), 0))}</p></div>
            <div className="card p-5"><p className="text-sm text-neutral-400">Diferencia acumulada</p><p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(closedCashSessions.reduce((sum, c) => sum + (c.difference ?? 0), 0))}</p></div>
          </div>
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Historial de cajas ({closedCashSessions.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(['Apertura', 'Cierre', 'Inicial', 'Efectivo', 'QR', 'Descuentos', 'Esperado', 'Contado', 'Diferencia', 'Cerró'], closedCashSessions.map((c) => [formatDateTime(c.openedAt), c.closedAt ? formatDateTime(c.closedAt) : '', c.openingAmount, c.totals?.byMethod?.['efectivo'] ?? 0, c.totals?.byMethod?.['qr'] ?? 0, c.totals?.discount ?? 0, c.expectedCash ?? 0, c.countedAmount ?? '', c.difference ?? '', c.closedByName ?? '']), 'cajas')} className="btn-secondary text-xs"><FileDown size={14} /> CSV</button>
                <button onClick={() => exportPDF('Reporte de Cajas', ['Apertura', 'Cierre', 'Inicial', 'Efectivo', 'QR', 'Desc.', 'Esperado', 'Contado', 'Dif.', 'Cerró'], closedCashSessions.map((c) => [formatDateTime(c.openedAt), c.closedAt ? formatDateTime(c.closedAt) : '', formatCurrency(c.openingAmount), formatCurrency(c.totals?.byMethod?.['efectivo'] ?? 0), formatCurrency(c.totals?.byMethod?.['qr'] ?? 0), formatCurrency(c.totals?.discount ?? 0), formatCurrency(c.expectedCash ?? 0), c.countedAmount != null ? formatCurrency(c.countedAmount) : '', c.difference != null ? formatCurrency(c.difference) : '', c.closedByName ?? '']))} className="btn-secondary text-xs"><FileDown size={14} /> PDF</button>
              </div>
            </div>
            {closedCashSessions.length === 0 ? (
              <p className="px-6 py-4 text-sm text-neutral-400">Aún no hay cierres registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead><tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Apertura</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Cierre</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Inicial</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Efectivo</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">QR</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Descuentos</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Esperado</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Contado</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Diferencia</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3">Cerró</th>
                  </tr></thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                    {closedCashSessions.map((c) => {
                      const dif = c.difference ?? 0;
                      return (
                        <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                          <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-300">{formatDateTime(c.openedAt)}</td>
                          <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-300">{c.closedAt ? formatDateTime(c.closedAt) : '—'}</td>
                          <td className="px-5 py-3 text-sm text-right text-neutral-500">{formatCurrency(c.openingAmount)}</td>
                          <td className="px-5 py-3 text-sm text-right text-neutral-500">{formatCurrency(c.totals?.byMethod?.['efectivo'] ?? 0)}</td>
                          <td className="px-5 py-3 text-sm text-right text-neutral-500">{formatCurrency(c.totals?.byMethod?.['qr'] ?? 0)}</td>
                          <td className="px-5 py-3 text-sm text-right text-success-600">{formatCurrency(c.totals?.discount ?? 0)}</td>
                          <td className="px-5 py-3 text-sm text-right font-medium text-primary-600 dark:text-primary-400">{formatCurrency(c.expectedCash ?? 0)}</td>
                          <td className="px-5 py-3 text-sm text-right text-neutral-700 dark:text-neutral-200">{c.countedAmount != null ? formatCurrency(c.countedAmount) : '—'}</td>
                          <td className={`px-5 py-3 text-sm text-right font-medium ${Math.abs(dif) < 0.01 ? 'text-success-600' : dif > 0 ? 'text-warning-600' : 'text-error-600'}`}>{c.countedAmount != null ? formatCurrency(dif) : '—'}</td>
                          <td className="px-5 py-3 text-sm text-neutral-500">{c.closedByName || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
