import React from 'react';
import { ArrowLeft, CreditCard, MapPin, User, Mail, Phone, Gift, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function Checkout() {
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    needsInvoice: false,
    invoiceRuc: '',
    invoiceReason: '',
    specialInstructions: ''
  });

  const subtotal = state.cart.reduce((total, item) => total + (item.perfume.price * item.quantity), 0);
  const shipping = subtotal >= 300 ? 0 : 30;
  const total = subtotal + shipping;

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'cart' });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handlePlaceOrder = () => {
    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state
      },
      items: state.cart.map(item => ({
        perfumeId: item.perfume.id,
        name: item.perfume.name,
        price: item.perfume.price,
        quantity: item.quantity
      })),
      subtotal,
      shipping,
      total,
      paymentMethod: formData.paymentMethod as 'card' | 'qr' | 'transfer',
      paymentStatus: 'pendiente' as const,
      orderStatus: 'pendiente' as const
    };

    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({ type: 'CLEAR_CART' });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
    alert('¡Pedido realizado con éxito! Recibirás un email de confirmación.');
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.email && formData.firstName && formData.lastName && formData.phone;
      case 2:
        return formData.address && formData.city && formData.state && formData.zipCode;
      case 3:
        if (formData.paymentMethod === 'card') {
          return formData.cardNumber && formData.expiryDate && formData.cvv && formData.cardName;
        }
        return true;
      default:
        return false;
    }
  };

  const steps = [
    { id: 1, title: 'Información Personal', icon: User },
    { id: 2, title: 'Dirección de Envío', icon: MapPin },
    { id: 3, title: 'Pago', icon: CreditCard }
  ];

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
            <span className="font-medium">Volver al Carrito</span>
          </button>
          
          <h1 className="font-playfair text-3xl font-bold text-essence-navy">
            Finalizar Compra
          </h1>
          
          <div className="text-sm text-gray-500">
            Paso {currentStep} de 3
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    currentStep >= step.id 
                      ? 'bg-essence-purple text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className={`font-medium ${
                      currentStep >= step.id ? 'text-essence-navy' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-8 ${
                    currentStep > step.id ? 'bg-essence-purple' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="font-playfair text-2xl font-semibold text-essence-navy mb-6">
                    Información Personal
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                        placeholder="Tu apellido"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                      placeholder="+591 70000000"
                    />
                  </div>

                  <button
                    onClick={() => handleStepChange(2)}
                    disabled={!isStepValid(1)}
                    className="w-full bg-essence-purple text-white py-3 rounded-lg font-semibold hover:bg-essence-plum transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="font-playfair text-2xl font-semibold text-essence-navy mb-6">
                    Dirección de Envío
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                      placeholder="Calle, número, zona"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                        placeholder="La Paz"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento *
                      </label>
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                      >
                        <option value="">Selecciona</option>
                        <option value="La Paz">La Paz</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Cochabamba">Cochabamba</option>
                        <option value="Oruro">Oruro</option>
                        <option value="Potosí">Potosí</option>
                        <option value="Tarija">Tarija</option>
                        <option value="Sucre">Sucre</option>
                        <option value="Beni">Beni</option>
                        <option value="Pando">Pando</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                      placeholder="0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones Especiales
                    </label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple resize-none"
                      rows={3}
                      placeholder="Detalles para la entrega..."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleStepChange(1)}
                      className="flex-1 border border-essence-purple text-essence-purple py-3 rounded-lg font-semibold hover:bg-essence-purple/5 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handleStepChange(3)}
                      disabled={!isStepValid(2)}
                      className="flex-1 bg-essence-purple text-white py-3 rounded-lg font-semibold hover:bg-essence-plum transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="font-playfair text-2xl font-semibold text-essence-navy mb-6">
                    Método de Pago
                  </h2>

                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-essence-purple focus:ring-essence-purple/20"
                      />
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Tarjeta de Crédito/Débito</span>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qr"
                        checked={formData.paymentMethod === 'qr'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-essence-purple focus:ring-essence-purple/20"
                      />
                      <span className="text-2xl">📱</span>
                      <span className="font-medium">Pago QR (Tigomoney, Simple, etc.)</span>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-essence-purple focus:ring-essence-purple/20"
                      />
                      <span className="text-2xl">🏦</span>
                      <span className="font-medium">Transferencia Bancaria</span>
                    </label>
                  </div>

                  {/* Card Details */}
                  {formData.paymentMethod === 'card' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Tarjeta *
                        </label>
                        <input
                          type="text"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Vencimiento *
                          </label>
                          <input
                            type="text"
                            value={formData.expiryDate}
                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                            placeholder="MM/AA"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                            placeholder="123"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre en la Tarjeta *
                        </label>
                        <input
                          type="text"
                          value={formData.cardName}
                          onChange={(e) => handleInputChange('cardName', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                          placeholder="Nombre como aparece en la tarjeta"
                        />
                      </div>
                    </div>
                  )}

                  {/* Invoice Option */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.needsInvoice}
                        onChange={(e) => handleInputChange('needsInvoice', e.target.checked)}
                        className="rounded border-gray-300 text-essence-purple focus:ring-essence-purple/20"
                      />
                      <span className="font-medium">Necesito factura</span>
                    </label>

                    {formData.needsInvoice && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            NIT/RUC
                          </label>
                          <input
                            type="text"
                            value={formData.invoiceRuc}
                            onChange={(e) => handleInputChange('invoiceRuc', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                            placeholder="Número de NIT/RUC"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razón Social
                          </label>
                          <input
                            type="text"
                            value={formData.invoiceReason}
                            onChange={(e) => handleInputChange('invoiceReason', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                            placeholder="Nombre o razón social"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleStepChange(2)}
                      className="flex-1 border border-essence-purple text-essence-purple py-3 rounded-lg font-semibold hover:bg-essence-purple/5 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={!isStepValid(3)}
                      className="flex-1 bg-gradient-to-r from-essence-purple to-essence-plum text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Realizar Pedido
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="font-playfair text-xl font-semibold text-essence-navy mb-6">
                Resumen del Pedido
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {state.cart.map((item) => (
                  <div key={item.perfume.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.perfume.image} 
                        alt={item.perfume.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.perfume.name}</div>
                      <div className="text-xs text-gray-500">Cantidad: {item.quantity}</div>
                      {item.isGift && (
                        <div className="flex items-center space-x-1 text-xs text-essence-purple">
                          <Gift className="h-3 w-3" />
                          <span>Regalo</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {item.perfume.price * item.quantity} BOB
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
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

                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Total</span>
                  <span className="text-essence-navy">{total} BOB</span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-essence-light/10 rounded-2xl p-6">
              <h3 className="font-semibold text-essence-navy mb-4">Compra Segura</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>🔒</span>
                  <span>Conexión SSL segura</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🛡️</span>
                  <span>Datos protegidos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>↩️</span>
                  <span>Política de devoluciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}