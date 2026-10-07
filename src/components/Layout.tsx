import { useState, ReactNode } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  UserCog,
  FileBarChart,
  LogOut,
  Menu,
  Sparkles,
  ChevronLeft,
  Sun,
  Moon,
  Wallet,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Role } from '@/lib/supabase';

export type PageKey = 'dashboard' | 'products' | 'sales' | 'cash' | 'clients' | 'suppliers' | 'users' | 'reports' | 'settings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['vendedor', 'admin', 'superadmin'] },
  { key: 'users', label: 'Usuarios', icon: <UserCog size={20} />, roles: ['admin', 'superadmin'] },
  { key: 'clients', label: 'Clientes', icon: <Users size={20} />, roles: ['vendedor', 'admin', 'superadmin'] },
  { key: 'suppliers', label: 'Proveedores', icon: <Truck size={20} />, roles: ['admin', 'superadmin'] },
  { key: 'products', label: 'Productos', icon: <Package size={20} />, roles: ['vendedor', 'admin', 'superadmin'] },
  { key: 'sales', label: 'Ventas', icon: <ShoppingCart size={20} />, roles: ['vendedor', 'admin', 'superadmin'] },
  { key: 'cash', label: 'Caja', icon: <Wallet size={20} />, roles: ['vendedor', 'admin', 'superadmin'] },
  { key: 'reports', label: 'Reportes', icon: <FileBarChart size={20} />, roles: ['vendedor', 'admin', 'superadmin'] },
  { key: 'settings', label: 'Ajustes', icon: <SettingsIcon size={20} />, roles: ['admin', 'superadmin'] },
];

interface LayoutProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function Layout({ current, onNavigate, children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter((item) => profile && item.roles.includes(profile.role));

  const roleLabels: Record<Role, string> = {
    vendedor: 'Vendedor',
    admin: 'Administrador',
    superadmin: 'Super Admin',
  };

  const roleColors: Record<Role, string> = {
    vendedor: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
    admin: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
    superadmin: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  };

  const handleNav = (key: PageKey) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  const ThemeToggle = () => (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition"
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-neutral-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-100 dark:border-neutral-800 h-16">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <Sparkles size={22} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-xl font-display font-bold text-neutral-800 dark:text-neutral-100 leading-tight">Camila</h1>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Belleza & Cuidado</p>
            </div>
          )}
          {!collapsed && <ThemeToggle />}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:block px-3 py-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 text-sm"
          >
            <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Contraer</span>}
          </button>
        </div>

        {/* User */}
        <div className="px-3 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">{profile?.full_name}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColors[profile?.role ?? 'vendedor']}`}>
                  {roleLabels[profile?.role ?? 'vendedor']}
                </span>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={signOut}
                className="p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400 transition"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary-600" />
            <span className="font-display font-bold text-neutral-800 dark:text-neutral-100">Camila</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={signOut} className="p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
