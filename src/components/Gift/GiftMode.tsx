import React from 'react';
import { ArrowLeft, Gift, Heart, Star, Package, MessageCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { perfumes } from '../../data/perfumes';

export function GiftMode() {
  const { dispatch } = useApp();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = React.useState<string>('');
  const [priceRange, setPriceRange] = React.useState<string>('');

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  };

  const giftCategories = [
    { id: 'all', name: 'Todos', icon: Gift },
    { id: 'romantic', name: 'Romántico', icon: Heart },
    { id: 'luxury', name: 'Lujo', icon: Star },
    { id: 'fresh', name: 'Fresco', icon: Sparkles }
  ];

  const occasions = [
    'Cumpleaños',
    'Aniversario',
    'San Valentín',
    'Día de la Madre',
    'Día del Padre',
    'Graduación',
    'Boda',
    'Navidad'
  ];

  const priceRanges = [
    { id: 'budget', label: 'Hasta 400 BOB', min: 0, max: 400 },
    { id: 'mid', label: '400 - 600 BOB', min: 400, max: 600 },
    { id: 'premium', label: 'Más de 600 BOB', min: 600, max: 1000 }
  ];

  const filteredPerfumes = React.useMemo(() => {
    let filtered = [...perfumes];

    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'romantic':
          filtered = filtered.filter(p => p.category === 'floral' || p.category === 'oriental');
          break;
        case 'luxury':
          filtered = filtered.filter(p => p.price > 500);
          break;
        case 'fresh':
          filtered = filtered.filter(p => p.category === 'fresco');
          break;
      }
    }

    if (priceRange) {
      const range = priceRanges.find(r => r.id === priceRange);
      if (range) {
        filtered = filtered.filter(p => p.price >= range.min && p.price <= range.max);
      }
    }

    return filtered.slice(0, 6);
  }, [selectedCategory, priceRange]);

  const handleViewProduct = (perfume: typeof perfumes[0]) => {
    dispatch({ type: 'SET_SELECTED_PERFUME', payload: perfume });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'product' });
  };

  const handleAddToCart = (perfume: typeof perfumes[0]) => {
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { perfume, quantity: 1, isGift: true }
    });
  };

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
            Modo Regalo
          </h1>
          
          <div></div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-essence-coral/10 rounded-full px-6 py-3 mb-6">
            <Gift className="h-6 w-6 text-essence-coral" />
            <span className="text-essence-coral font-medium">Regalos Especiales</span>
          </div>
          
          <h2 className="font-playfair text-4xl font-bold text-essence-navy mb-4">
            El Regalo Perfecto
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Encuentra la fragancia ideal para esa persona especial. Cada regalo incluye empaque premium y mensaje personalizado sin costo adicional.
          </p>
        </div>

        {/* Gift Categories */}
        <div className="mb-8">
          <h3 className="font-semibold text-essence-navy mb-4">Categorías de Regalo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {giftCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'border-essence-purple bg-essence-purple/5 shadow-lg'
                    : 'border-gray-200 hover:border-essence-purple/50'
                }`}
              >
                <category.icon className={`h-8 w-8 mx-auto mb-2 ${
                  selectedCategory === category.id ? 'text-essence-purple' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedCategory === category.id ? 'text-essence-purple' : 'text-gray-600'
                }`}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ocasión
            </label>
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
            >
              <option value="">Selecciona una ocasión</option>
              {occasions.map((occasion) => (
                <option key={occasion} value={occasion}>{occasion}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Precio
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
            >
              <option value="">Cualquier precio</option>
              {priceRanges.map((range) => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Gift Features */}
        <div className="bg-gradient-to-r from-essence-purple to-essence-plum rounded-3xl p-8 mb-12 text-white">
          <h3 className="font-playfair text-2xl font-semibold mb-6 text-center">
            Incluido en Todos los Regalos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-essence-light" />
              <h4 className="font-semibold mb-2">Empaque Premium</h4>
              <p className="text-essence-light text-sm">Caja elegante con lazo y papel de regalo de lujo</p>
            </div>
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-essence-light" />
              <h4 className="font-semibold mb-2">Mensaje Personalizado</h4>
              <p className="text-essence-light text-sm">Tarjeta con tu mensaje especial incluida</p>
            </div>
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-essence-light" />
              <h4 className="font-semibold mb-2">Entrega Especial</h4>
              <p className="text-essence-light text-sm">Opción de entrega en fecha específica</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-6">
            Fragancias Recomendadas
          </h3>
          
          {filteredPerfumes.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-600 mb-2">No se encontraron productos</h4>
              <p className="text-gray-500">Intenta ajustar los filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPerfumes.map((perfume) => (
                <div key={perfume.id} className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2">
                  {/* Gift Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-essence-coral text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <Gift className="h-3 w-3" />
                      <span>Regalo</span>
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <img 
                      src={perfume.image} 
                      alt={perfume.name}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button 
                        onClick={() => handleViewProduct(perfume)}
                        className="bg-white text-essence-navy px-6 py-2 rounded-full font-semibold hover:bg-essence-light transition-colors"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 font-medium">{perfume.brand}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{perfume.rating}</span>
                      </div>
                    </div>

                    <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-2">
                      {perfume.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {perfume.description}
                    </p>

                    <div className="flex items-center justify-between">
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

                      <button 
                        onClick={() => handleAddToCart(perfume)}
                        className="bg-gradient-to-r from-essence-coral to-essence-rose text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all flex items-center space-x-1"
                      >
                        <Gift className="h-4 w-4" />
                        <span>Regalar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}