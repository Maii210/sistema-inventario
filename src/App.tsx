import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Login } from '@/pages/Login';
import { Layout, PageKey } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Sales } from '@/pages/Sales';
import { Clients } from '@/pages/Clients';
import { Suppliers } from '@/pages/Suppliers';
import { Users } from '@/pages/Users';
import { Reports } from '@/pages/Reports';
import { Role } from '@/lib/supabase';

const pageAccess: Record<PageKey, Role[]> = {
  dashboard: ['vendedor', 'admin', 'superadmin'],
  products: ['vendedor', 'admin', 'superadmin'],
  sales: ['vendedor', 'admin', 'superadmin'],
  clients: ['vendedor', 'admin', 'superadmin'],
  suppliers: ['admin', 'superadmin'],
  users: ['admin', 'superadmin'],
  reports: ['admin', 'superadmin'],
};

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  // Guard: if current page isn't allowed for user role, fall back to dashboard
  useEffect(() => {
    if (profile && !pageAccess[page].includes(profile.role)) {
      setPage('dashboard');
    }
  }, [profile, page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard />,
    products: <Products />,
    sales: <Sales />,
    clients: <Clients />,
    suppliers: <Suppliers />,
    users: <Users />,
    reports: <Reports />,
  };

  return (
    <Layout current={page} onNavigate={setPage}>
      {pages[page]}
    </Layout>
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
