import React from 'react';
import { ArrowLeft, Plus, Minus, Trash2, Gift, ShoppingBag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function Cart() {
  const { state, dispatch } = useApp();

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'catalog' });
  };

  const handleCheckout = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'checkout' });
  };

  const updateQuantity = (perfumeId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: perfumeId });
    } else {
      dispatch({ 
        type: 'UPDATE_CART_QUANTITY', 
        payload: { id: perfumeId, quantity: newQuantity }
      });
    }
  };

  const removeItem = (perfumeId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: perfumeId });
  };

  const subtotal = state.cart.reduce((total, item) => total + (item.perfume.price * item.quantity), 0);
  const shipping = subtotal >= 300 ? 0 : 30;
  const total = subtotal + shipping;

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-essence-light/5">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-essence-navy hover:text-essence-purple mb-8 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Volver al Catálogo</span>
          </button>

          <div className="text-center py-16">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="font-playfair text-3xl font-bold text-essence-navy mb-4">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Explora nuestra colección de fragancias premium y encuentra tu perfume perfecto.
            </p>
            <button
              onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'catalog' })}
              className="bg-gradient-to-r from-essence-purple to-essence-plum text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-essence-purple/25 transition-all duration-300 hover:scale-105"
            >
              Explorar Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-essence-light/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-essence-navy hover:text-essence-purple group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Continuar Comprando</span>
          </button>
          
          <h1 className="font-playfair text-3xl font-bold text-essence-navy">
            Carrito de Compras
          </h1>
          
          <div className="text-sm text-gray-500">
            {state.cart.reduce((total, item) => total + item.quantity, 0)} productos
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {state.cart.map((item) => (
              <div key={item.perfume.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={item.perfume.image} 
                      alt={item.perfume.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-playfair text-lg font-semibold text-essence-navy">
                          {item.perfume.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">{item.perfume.brand}</p>
                        <p className="text-sm text-gray-600 truncate">{item.perfume.category} • {item.perfume.gender}</p>
                        
                        {item.isGift && (
                          <div className="flex items-center space-x-1 mt-2 text-essence-purple">
                            <Gift className="h-4 w-4" />
                            <span className="text-sm font-medium">Es un regalo</span>
                          </div>
                        )}
                        
                        {item.giftMessage && (
                          <p className="text-sm text-gray-600 mt-1 italic">
                            "{item.giftMessage}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(item.perfume.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.perfume.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.perfume.id, item.quantity + 1)}
                          disabled={item.quantity >= item.perfume.stock}
                          className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-essence-navy">
                          {item.perfume.price * item.quantity} BOB
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-sm text-gray-500">
                            {item.perfume.price} BOB c/u
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="font-playfair text-xl font-semibold text-essence-navy mb-6">
                Resumen del Pedido
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{subtotal} BOB</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      `${shipping} BOB`
                    )}
                  </span>
                </div>

                {shipping === 0 && (
                  <div className="text-sm text-green-600 bg-green-50 rounded-lg p-3">
                    🎉 ¡Envío gratuito aplicado!
                  </div>
                )}

                {subtotal < 300 && (
                  <div className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
                    💡 Agrega {300 - subtotal} BOB más para envío gratuito
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-essence-navy">{total} BOB</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-gradient-to-r from-essence-purple to-essence-plum text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 hover:shadow-xl hover:shadow-essence-purple/25 transition-all duration-300 hover:scale-105"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Proceder al Checkout</span>
              </button>

              <div className="mt-4 text-center text-sm text-gray-500">
                🔒 Compra segura y protegida
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-essence-light/10 rounded-2xl p-6">
              <h3 className="font-semibold text-essence-navy mb-4">Información de Envío</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>🚚</span>
                  <span>Envío gratuito en compras mayores a 300 BOB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📦</span>
                  <span>Envío express en 24-48 horas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🎁</span>
                  <span>Empaque de regalo gratuito disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}