import React from 'react';
import { ArrowLeft, Star, ShoppingBag, Heart, Share2, Plus, Minus, Gift, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function ProductDetail() {
  const { state, dispatch } = useApp();
  const [quantity, setQuantity] = React.useState(1);
  const [selectedTab, setSelectedTab] = React.useState<'description' | 'notes' | 'reviews'>('description');
  const [isGift, setIsGift] = React.useState(false);
  const [giftMessage, setGiftMessage] = React.useState('');

  const perfume = state.selectedPerfume;

  if (!perfume) {
    return <div>Perfume no encontrado</div>;
  }

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'catalog' });
  };

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        perfume,
        quantity,
        isGift,
        giftMessage: isGift ? giftMessage : undefined
      }
    });
    // Reset form
    setQuantity(1);
    setIsGift(false);
    setGiftMessage('');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-essence-light/5">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-essence-navy hover:text-essence-purple mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver al Catálogo</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              <img 
                src={perfume.image} 
                alt={perfume.name}
                className="w-full h-96 lg:h-[500px] object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col space-y-2">
                {perfume.isNew && (
                  <span className="bg-essence-coral text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Nuevo
                  </span>
                )}
                {perfume.originalPrice && (
                  <span className="bg-essence-rose text-white px-4 py-2 rounded-full text-sm font-semibold">
                    {Math.round(((perfume.originalPrice - perfume.price) / perfume.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-6 right-6 flex flex-col space-y-2">
                <button className="bg-white/90 backdrop-blur-sm text-essence-navy p-3 rounded-full hover:bg-white transition-colors shadow-lg">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="bg-white/90 backdrop-blur-sm text-essence-navy p-3 rounded-full hover:bg-white transition-colors shadow-lg">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-essence-purple font-medium">{perfume.brand}</span>
                <div className="flex items-center space-x-1">
                  {renderStars(Math.floor(perfume.rating))}
                  <span className="text-sm font-medium ml-2">({perfume.rating})</span>
                </div>
              </div>
              
              <h1 className="font-playfair text-4xl font-bold text-essence-navy mb-4">
                {perfume.name}
              </h1>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-essence-navy">
                    {perfume.price} BOB
                  </span>
                  {perfume.originalPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      {perfume.originalPrice} BOB
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed text-lg">
                {perfume.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-essence-light/10 rounded-2xl p-4">
                <div className="text-sm text-gray-500 mb-1">Categoría</div>
                <div className="font-semibold text-essence-navy capitalize">{perfume.category}</div>
              </div>
              <div className="bg-essence-light/10 rounded-2xl p-4">
                <div className="text-sm text-gray-500 mb-1">Género</div>
                <div className="font-semibold text-essence-navy capitalize">{perfume.gender}</div>
              </div>
              <div className="bg-essence-light/10 rounded-2xl p-4">
                <div className="text-sm text-gray-500 mb-1">Duración</div>
                <div className="font-semibold text-essence-navy capitalize">{perfume.duration}</div>
              </div>
              <div className="bg-essence-light/10 rounded-2xl p-4">
                <div className="text-sm text-gray-500 mb-1">Intensidad</div>
                <div className="font-semibold text-essence-navy capitalize">{perfume.intensity}</div>
              </div>
            </div>

            {/* Quantity & Gift Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-700">Cantidad:</span>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(perfume.stock, quantity + 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {perfume.stock} disponibles
                </span>
              </div>

              {/* Gift Option */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="rounded border-gray-300 text-essence-purple focus:ring-essence-purple/20"
                  />
                  <div className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-essence-purple" />
                    <span className="font-medium">Es un regalo</span>
                  </div>
                </label>
                
                {isGift && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensaje personalizado
                      </label>
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Escribe un mensaje especial..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <Info className="h-4 w-4" />
                      <span>Se incluirá empaque especial sin costo adicional</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={perfume.stock === 0}
              className="w-full bg-gradient-to-r from-essence-purple to-essence-plum text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 hover:shadow-xl hover:shadow-essence-purple/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="h-6 w-6" />
              <span>{perfume.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}</span>
            </button>

            <div className="text-center text-sm text-gray-500">
              🚚 Envío gratis en compras mayores a 300 BOB
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-8">
            {[
              { id: 'description', label: 'Descripción' },
              { id: 'notes', label: 'Notas Olfativas' },
              { id: 'reviews', label: 'Reseñas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-essence-purple text-essence-purple'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {selectedTab === 'description' && (
              <div className="prose max-w-none">
                <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-4">
                  Acerca de {perfume.name}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">
                  {perfume.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-essence-navy mb-2">Características</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Categoría: {perfume.category}</li>
                      <li>• Género: {perfume.gender}</li>
                      <li>• Duración: {perfume.duration}</li>
                      <li>• Intensidad: {perfume.intensity}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-essence-navy mb-2">Uso Recomendado</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• {perfume.intensity === 'suave' ? 'Uso diario' : 'Ocasiones especiales'}</li>
                      <li>• {perfume.category === 'fresco' ? 'Ideal para el día' : 'Perfecto para la noche'}</li>
                      <li>• Duración: {perfume.duration === 'longa' ? '6-8 horas' : perfume.duration === 'moderada' ? '4-6 horas' : '2-4 horas'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'notes' && (
              <div>
                <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-6">
                  Pirámide Olfativa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-b from-essence-light to-essence-coral rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-semibold">TOP</span>
                    </div>
                    <h4 className="font-semibold text-essence-navy mb-3">Notas de Salida</h4>
                    <ul className="space-y-1 text-gray-600">
                      {perfume.notes.top.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-b from-essence-rose to-essence-plum rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-semibold">MID</span>
                    </div>
                    <h4 className="font-semibold text-essence-navy mb-3">Notas de Corazón</h4>
                    <ul className="space-y-1 text-gray-600">
                      {perfume.notes.middle.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-b from-essence-plum to-essence-navy rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-semibold">BASE</span>
                    </div>
                    <h4 className="font-semibold text-essence-navy mb-3">Notas de Fondo</h4>
                    <ul className="space-y-1 text-gray-600">
                      {perfume.notes.base.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div>
                <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-6">
                  Reseñas de Clientes
                </h3>
                {perfume.reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⭐</div>
                    <p className="text-gray-600">Sé el primero en dejar una reseña</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {perfume.reviews.map(review => (
                      <div key={review.id} className="border-b border-gray-200 pb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-essence-purple text-white rounded-full flex items-center justify-center font-semibold">
                              {review.userName[0]}
                            </div>
                            <div>
                              <div className="font-medium">{review.userName}</div>
                              <div className="text-sm text-gray-500">{review.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                        {review.verified && (
                          <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            ✓ Compra verificada
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}