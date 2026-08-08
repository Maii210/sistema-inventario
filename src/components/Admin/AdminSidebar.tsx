import React from 'react';
import { LayoutDashboard, Package, DollarSign, ShoppingCart, Star, Users, ArrowLeft } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export type AdminModule = 'dashboard' | 'perfumes' | 'pricing' | 'orders' | 'reviews' | 'customers';

const items: { id: AdminModule; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'perfumes', label: 'Perfumes', icon: Package },
  { id: 'pricing', label: 'Precios y stock', icon: DollarSign },
  { id: 'orders', label: 'Pedidos y pagos', icon: ShoppingCart },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'customers', label: 'Clientes', icon: Users }
];

export function AdminSidebar({ active, onSelect }: { active: AdminModule; onSelect: (m: AdminModule) => void }) {
  const { dispatch } = useApp();
  return (
    <aside className="w-64 bg-essence-navy text-white min-h-screen p-6 flex-shrink-0">
      <h2 className="font-playfair text-2xl font-bold mb-8">Essence Admin</h2>
      <nav className="space-y-2">
        {items.map(item => (
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
      <button
        onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' })}
        className="mt-8 flex items-center space-x-2 text-essence-light hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Volver a la tienda</span>
      </button>
    </aside>
  );
}
