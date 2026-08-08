import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminSidebar, AdminModule } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminPerfumes } from './AdminPerfumes';
import { AdminPricing } from './AdminPricing';
import { AdminOrders } from './AdminOrders';
import { AdminReviews } from './AdminReviews';
import { AdminCustomers } from './AdminCustomers';

export function AdminPanel() {
  const { state } = useApp();
  const [module, setModule] = React.useState<AdminModule>('dashboard');

  if (state.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-essence-light/10">
        <p className="font-playfair text-2xl text-essence-navy">Acceso denegado</p>
      </div>
    );
  }

  const render = () => {
    switch (module) {
      case 'dashboard': return <AdminDashboard />;
      case 'perfumes': return <AdminPerfumes />;
      case 'pricing': return <AdminPricing />;
      case 'orders': return <AdminOrders />;
      case 'reviews': return <AdminReviews />;
      case 'customers': return <AdminCustomers />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-essence-light/5">
      <AdminSidebar active={module} onSelect={setModule} />
      <main className="flex-1 p-8 overflow-x-auto">{render()}</main>
    </div>
  );
}
