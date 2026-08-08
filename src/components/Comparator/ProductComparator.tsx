import React from 'react';
import { ArrowLeft, Plus, X, Star, ShoppingBag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function ProductComparator() {
  const { state, dispatch } = useApp();
  const { perfumes } = state;
  const [selectedPerfumes, setSelectedPerfumes] = React.useState<typeof perfumes>([]);
  const [showSelector, setShowSelector] = React.useState(false);

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  };

  const addPerfume = (perfume: typeof perfumes[0]) => {
    if (selectedPerfumes.length < 3 && !selectedPerfumes.find(p => p.id === perfume.id)) {
      setSelectedPerfumes(prev => [...prev, perfume]);
      setShowSelector(false);
    }
  };

  const removePerfume = (perfumeId: string) => {
    setSelectedPerfumes(prev => prev.filter(p => p.id !== perfumeId));
  };

  const handleAddToCart = (perfume: typeof perfumes[0]) => {
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { perfume, quantity: 1 }
    });
  };

  const availablePerfumes = perfumes.filter(p => !selectedPerfumes.find(sp => sp.id === p.id));

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
            <span className="font-medium">Volver</span>
          </button>
          
          <h1 className="font-playfair text-3xl font-bold text-essence-navy">
            Comparador de Fragancias
          </h1>
          
          <div className="text-sm text-gray-500">
            {selectedPerfumes.length}/3 seleccionados
          </div>
        </div>

        {selectedPerfumes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">⚖️</div>
            <h2 className="font-playfair text-3xl font-bold text-essence-navy mb-4">
              Compara Fragancias
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Selecciona hasta 3 fragancias para comparar sus características, notas y precios.
            </p>
            <button
              onClick={() => setShowSelector(true)}
              className="bg-gradient-to-r from-essence-purple to-essence-plum text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-essence-purple/25 transition-all duration-300 hover:scale-105"
            >
              Seleccionar Fragancias
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Add More Button */}
            {selectedPerfumes.length < 3 && (
              <div className="text-center">
                <button
                  onClick={() => setShowSelector(true)}
                  className="inline-flex items-center space-x-2 bg-white border-2 border-dashed border-essence-purple text-essence-purple px-6 py-3 rounded-xl hover:bg-essence-purple/5 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Agregar Fragancia</span>
                </button>
              </div>
            )}

            {/* Comparison Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {selectedPerfumes.map((perfume, index) => (
                  <div key={perfume.id} className={`p-6 ${index < selectedPerfumes.length - 1 ? 'border-r border-gray-200' : ''}`}>
                    {/* Product Header */}
                    <div className="relative mb-6">
                      <button
                        onClick={() => removePerfume(perfume.id)}
                        className="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      
                      <img 
                        src={perfume.image} 
                        alt={perfume.name}
                        className="w-full h-48 object-cover rounded-xl mb-4"
                      />
                      
                      <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-1">
                        {perfume.name}
                      </h3>
                      <p className="text-essence-purple font-medium">{perfume.brand}</p>
                    </div>

                    {/* Comparison Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Precio</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-essence-navy">
                            {perfume.price} BOB
                          </span>
                          {perfume.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              {perfume.originalPrice} BOB
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Calificación</h4>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(perfume.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-sm font-medium ml-2">({perfume.rating})</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Características</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Categoría:</span>
                            <span className="capitalize font-medium">{perfume.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Género:</span>
                            <span className="capitalize font-medium">{perfume.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duración:</span>
                            <span className="capitalize font-medium">{perfume.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Intensidad:</span>
                            <span className="capitalize font-medium">{perfume.intensity}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Notas Principales</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-gray-500">Salida:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {perfume.notes.top.slice(0, 2).map((note, i) => (
                                <span key={i} className="text-xs bg-essence-light/20 text-essence-navy px-2 py-1 rounded-full">
                                  {note}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Corazón:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {perfume.notes.middle.slice(0, 2).map((note, i) => (
                                <span key={i} className="text-xs bg-essence-rose/20 text-essence-navy px-2 py-1 rounded-full">
                                  {note}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(perfume)}
                        className="w-full bg-gradient-to-r from-essence-purple to-essence-plum text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Agregar al Carrito</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Selector Modal */}
        {showSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-playfair text-2xl font-semibold text-essence-navy">
                    Seleccionar Fragancia
                  </h3>
                  <button
                    onClick={() => setShowSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePerfumes.map((perfume) => (
                    <div 
                      key={perfume.id}
                      onClick={() => addPerfume(perfume)}
                      className="cursor-pointer bg-gray-50 rounded-xl p-4 hover:bg-essence-light/10 transition-colors"
                    >
                      <img 
                        src={perfume.image} 
                        alt={perfume.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-semibold text-essence-navy">{perfume.name}</h4>
                      <p className="text-sm text-gray-600">{perfume.brand}</p>
                      <p className="text-lg font-bold text-essence-purple mt-2">{perfume.price} BOB</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}