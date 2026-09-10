import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminSidebar, AdminModule } from './AdminSidebar';
import { Role, isStaffRole } from '../../data/permissions';
import { AdminDashboard } from './AdminDashboard';
import { AdminPos } from './AdminPos';
import { AdminProducts } from './AdminProducts';
import { AdminSuppliers } from './AdminSuppliers';
import { AdminCustomers } from './AdminCustomers';
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
      case 'pos': return <AdminPos />;
      case 'products': return <AdminProducts />;
      case 'suppliers': return <AdminSuppliers />;
      case 'customers': return <AdminCustomers />;
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
