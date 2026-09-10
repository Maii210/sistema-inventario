import React from 'react';
import {
  LayoutDashboard, Package, Users, Truck, BarChart3, UserCog, Zap
} from 'lucide-react';
import { Capability, Role, can } from '../../data/permissions';

export type AdminModule =
  | 'dashboard' | 'pos' | 'products' | 'customers'
  | 'suppliers' | 'reports' | 'users';

// Cada ítem requiere al menos una de estas capacidades para mostrarse.
const items: { id: AdminModule; label: string; icon: React.ElementType; caps: Capability[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, caps: ['viewDashboard'] },
  { id: 'pos', label: 'Venta rápida', icon: Zap, caps: ['registerSales'] },
  { id: 'products', label: 'Productos', icon: Package, caps: ['manageCatalog'] },
  { id: 'suppliers', label: 'Proveedores', icon: Truck, caps: ['manageSuppliers'] },
  { id: 'customers', label: 'Clientes', icon: Users, caps: ['viewCustomers'] },
  { id: 'reports', label: 'Reportes', icon: BarChart3, caps: ['viewReportsSales', 'viewReportsInventory', 'viewReportsCustomers'] },
  { id: 'users', label: 'Usuarios', icon: UserCog, caps: ['manageUsers'] }
];

export function AdminSidebar({
  role,
  active,
  onSelect
}: {
  role: Role;
  active: AdminModule;
  onSelect: (m: AdminModule) => void;
}) {
  const visible = items.filter(item => item.caps.some(c => can(role, c)));
  return (
    <aside className="w-64 bg-essence-navy text-white h-screen p-6 flex-shrink-0 sticky top-0 self-start overflow-y-auto">
      <h2 className="font-playfair text-2xl font-bold mb-8">Comercial Camila</h2>
      <nav className="space-y-2">
        {visible.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
              active === item.id ? 'bg-essence-coral text-white' : 'text-essence-light hover:bg-white/10'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
