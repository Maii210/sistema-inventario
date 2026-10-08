import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Layout, PageKey, PATH_TO_PAGE } from '@/components/Layout';
import { Role } from '@/lib/supabase';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Sales } from '@/pages/Sales';
import { Clients } from '@/pages/Clients';
import { Suppliers } from '@/pages/Suppliers';
import { Users } from '@/pages/Users';
import { Reports } from '@/pages/Reports';
import { Cash } from '@/pages/Cash';
import { Settings } from '@/pages/Settings';

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

export function AppRoutes() {
  return (
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
  );
}
