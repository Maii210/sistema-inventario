import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Login } from '@/pages/Login';
import { Layout, PageKey, PATH_TO_PAGE } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Sales } from '@/pages/Sales';
import { Clients } from '@/pages/Clients';
import { Suppliers } from '@/pages/Suppliers';
import { Users } from '@/pages/Users';
import { Reports } from '@/pages/Reports';
import { Cash } from '@/pages/Cash';
import { Settings } from '@/pages/Settings';
import { Role } from '@/lib/supabase';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';

const pageAccess: Record<PageKey, Role[]> = {
  dashboard: ['vendedor', 'admin', 'superadmin'],
  products: ['vendedor', 'admin', 'superadmin'],
  sales: ['vendedor', 'admin', 'superadmin'],
  cash: ['vendedor', 'admin', 'superadmin'],
  clients: ['vendedor', 'admin', 'superadmin'],
  suppliers: ['admin', 'superadmin'],
  users: ['admin', 'superadmin'],
  reports: ['admin', 'superadmin'],
  settings: ['admin', 'superadmin'],
};

// Shell con sidebar: protege cada ruta según el rol del usuario.
function ProtectedShell() {
  const { profile } = useAuth();
  const location = useLocation();
  const page = PATH_TO_PAGE[location.pathname];

  if (profile && page && !pageAccess[page].includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!session ? (
        <Login />
      ) : (
        <Routes>
          <Route element={<ProtectedShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/ventas" element={<Sales />} />
            <Route path="/caja" element={<Cash />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/proveedores" element={<Suppliers />} />
            <Route path="/usuarios" element={<Users />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
