import { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { supabase, Sale, Product, formatCurrency, formatDateTime, CATEGORIES } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Period = 'today' | 'week' | 'month' | 'year';

const PIE_COLORS = ['#ec4899', '#d2684f', '#8b5cf6', '#22c55e', '#f59e0b'];

export function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCount: 0,
    monthTotal: 0,
    totalProducts: 0,
    totalClients: 0,
    lowStockCount: 0,
  });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; count: number }[]>([]);
  const [barData, setBarData] = useState<{ name: string; ventas: number }[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    setLoading(true);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [allSalesRes, productsRes, clientsRes] = await Promise.all([
      supabase.from('sales').select('*'),
      supabase.from('products').select('*'),
      supabase.from('clients').select('*'),
    ]);

    const allSales: any[] = allSalesRes.data ?? [];
    const productsData: any[] = productsRes.data ?? [];

    const todaySalesData = allSales.filter((s: any) => new Date(s.created_at) >= todayStart);
    const periodData = allSales.filter((s: any) => new Date(s.created_at) >= startDate);
    const recentData = allSales.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    setTodaySales(todaySalesData);
    setRecentSales(recentData);
    setLowStockProducts(productsData.filter((p: any) => p.stock <= p.min_stock));

    setStats({
      todayTotal: todaySalesData.reduce((sum: number, s: any) => sum + Number(s.total), 0),
      todayCount: todaySalesData.length,
      monthTotal: periodData.reduce((sum: number, s: any) => sum + Number(s.total), 0),
      totalProducts: productsData.length,
      totalClients: (clientsRes.data ?? []).length,
      lowStockCount: productsData.filter((p: any) => p.stock <= p.min_stock).length,
    });

    const pie = CATEGORIES.map((category) => {
      const items = productsData.filter((p: any) => p.category === category);
      return {
        name: category,
        value: items.reduce((sum: number, p: any) => sum + Number(p.sale_price) * p.stock, 0),
        count: items.length,
      };
    }).filter((c) => c.count > 0);
    setCategoryData(pie);

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const barItems = period === 'year'
      ? monthNames.map((name, i) => ({
          name,
          ventas: periodData
            .filter((s: any) => new Date(s.created_at).getMonth() === i)
            .reduce((sum: number, s: any) => sum + Number(s.total), 0),
        }))
      : Array.from({ length: period === 'month' ? 30 : period === 'week' ? 7 : 1 }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          return {
            name: d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }),
            ventas: periodData
              .filter((s: any) => {
                const sd = new Date(s.created_at);
                return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth();
              })
              .reduce((sum: number, s: any) => sum + Number(s.total), 0),
          };
        }).reverse();
    setBarData(barItems);

    setLoading(false);
  };

  const statCards = useMemo(() => [
    {
      label: 'Ventas de hoy',
      value: formatCurrency(stats.todayTotal),
      icon: <DollarSign size={22} />,
      color: 'from-primary-500 to-primary-600',
      sub: `${stats.todayCount} transacciones`,
    },
    {
      label: 'Ventas del período',
      value: formatCurrency(stats.monthTotal),
      icon: <TrendingUp size={22} />,
      color: 'from-success-500 to-success-600',
      sub: 'Total acumulado',
    },
    {
      label: 'Productos activos',
      value: stats.totalProducts.toString(),
      icon: <Package size={22} />,
      color: 'from-accent-500 to-accent-600',
      sub: `${stats.lowStockCount} con stock bajo`,
    },
    {
      label: 'Clientes registrados',
      value: stats.totalClients.toString(),
      icon: <Users size={22} />,
      color: 'from-secondary-500 to-secondary-600',
      sub: 'Total de clientes',
    },
  ], [stats]);

  const periodLabels: Record<Period, string> = {
    today: 'Hoy',
    week: 'Última semana',
    month: 'Este mes',
    year: 'Este año',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Dashboard</h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">
            Bienvenida, {profile?.full_name}. Resumen de inventario y ventas.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1">
          {(['today', 'week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                period === p ? 'bg-primary-600 text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-5 hover:shadow-glow transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{card.value}</p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{card.label}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Ventas por período</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
              <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7' }}
              />
              <Bar dataKey="ventas" fill="#ec4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Inventario por categoría</h2>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-neutral-400 dark:text-neutral-500 text-sm">
              Sin datos de inventario
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((_entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Ventas recientes</h2>
            <Receipt size={20} className="text-neutral-300 dark:text-neutral-600" />
          </div>
          {recentSales.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 dark:text-neutral-500 text-sm">
              No hay ventas registradas todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <ShoppingCart size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                        {sale.client?.name ?? 'Cliente general'}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatDateTime(sale.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(Number(sale.total))}</p>
                    <span className="badge bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300 mt-0.5">{sale.payment_method}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Stock bajo</h2>
            <AlertTriangle size={20} className={lowStockProducts.length > 0 ? 'text-error-500' : 'text-neutral-300 dark:text-neutral-600'} />
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 dark:text-neutral-500 text-sm">
              Todos los productos tienen stock suficiente.
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">{product.name}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{product.category}</p>
                  </div>
                  <span className={`badge ${product.stock === 0 ? 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300' : 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300'}`}>
                    {product.stock} und.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
