import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminSidebar, AdminModule } from './AdminSidebar';
import { Role, isStaffRole } from '../../data/permissions';
import { AdminDashboard } from './AdminDashboard';
import { AdminPerfumes } from './AdminPerfumes';
import { AdminSuppliers } from './AdminSuppliers';
import { AdminOrders } from './AdminOrders';
import { AdminCustomers } from './AdminCustomers';
import { AdminReviews } from './AdminReviews';
import { AdminReports } from './AdminReports';
import { AdminUsers } from './AdminUsers';

export function AdminPanel() {
  const { state } = useApp();
  const role = state.user?.role;
  const [module, setModule] = React.useState<AdminModule>('dashboard');

  if (!isStaffRole(role)) {
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
      case 'suppliers': return <AdminSuppliers />;
      case 'orders': return <AdminOrders />;
      case 'customers': return <AdminCustomers />;
      case 'reviews': return <AdminReviews />;
      case 'reports': return <AdminReports />;
      case 'users': return <AdminUsers />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-essence-light/5">
      <AdminSidebar role={role as Role} active={module} onSelect={setModule} />
      <main className="flex-1 p-8 overflow-x-auto">{render()}</main>
    </div>
  );
}
