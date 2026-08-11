import React from 'react';
import { ShoppingBag, User, Heart, Menu, Sparkles, LogOut } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SmartSearch } from './SmartSearch';
import { isStaffRole } from '../../data/permissions';

export function Header() {
  const { state, dispatch } = useApp();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const cartItemCount = state.cart.reduce((total, item) => total + item.quantity, 0);

  const handleViewChange = (view: typeof state.currentView) => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    dispatch({ type: 'SET_USER', payload: null });
    setShowUserMenu(false);
  };

  return (
    <header className="bg-essence-navy/95 backdrop-blur-sm text-white shadow-2xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleViewChange('home')}
          >
            <div className="relative">
              <Sparkles className="h-8 w-8 text-essence-coral group-hover:animate-bounce-subtle" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-essence-coral rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="font-playfair text-2xl font-bold text-white">
                Essence
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleViewChange('home')}
              className="hover:text-essence-coral transition-colors font-medium"
            >
              Página principal
            </button>
            <button 
              onClick={() => handleViewChange('catalog')}
              className="hover:text-essence-coral transition-colors font-medium"
            >
              Encuentra tu fragancia
            </button>
            <button 
              onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'comparator' })}
              className="hover:text-essence-coral transition-colors font-medium"
            >
              Compara
            </button>
            <button 
              onClick={() => handleViewChange('gift')}
              className="hover:text-essence-coral transition-colors font-medium"
            >
              Regalos
            </button>
            <button 
              onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'guide' })}
              className="hover:text-essence-coral transition-colors font-medium"
            >
              Guía de fragancias
            </button>
            <button 
              onClick={() => handleViewChange('reviews')}
              className="hover:text-essence-coral transition-colors font-medium"
            >
              Reseñas
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Smart Search */}
            <div className="hidden lg:block">
              <SmartSearch />
            </div>

            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <User className="h-5 w-5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 w-64 z-50">
                  {state.user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="font-medium text-essence-navy">{state.user.name}</div>
                        <div className="text-sm text-gray-500">{state.user.email}</div>
                      </div>
                      <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                        Mi Perfil
                      </button>
                      <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                        Mis Pedidos
                      </button>
                      <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                        Favoritos
                      </button>
                      {isStaffRole(state.user.role) && (
                        <button
                          onClick={() => handleViewChange('admin')}
                          className="w-full text-left px-4 py-2 text-essence-purple hover:bg-essence-purple/5 transition-colors font-medium"
                        >
                          Panel Admin
                        </button>
                      )}
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleViewChange('login')}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Iniciar Sesión
                      </button>
                      <button 
                        onClick={() => handleViewChange('login')}
                        className="w-full text-left px-4 py-2 text-essence-purple hover:bg-essence-purple/5 transition-colors font-medium"
                      >
                        Crear Cuenta
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button 
              onClick={() => handleViewChange('cart')}
              className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-essence-coral text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu */}
            <button className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <SmartSearch />
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
}