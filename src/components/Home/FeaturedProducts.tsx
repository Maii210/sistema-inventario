import React from 'react';
import { Star, ShoppingBag, Heart, Eye } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function FeaturedProducts() {
  const { state, dispatch } = useApp();
  const { perfumes } = state;

  const featuredPerfumes = perfumes.filter(p => p.isPopular || p.isNew).slice(0, 4);

  const handleViewProduct = (perfume: typeof perfumes[0]) => {
    dispatch({ type: 'SET_SELECTED_PERFUME', payload: perfume });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'product' });
  };

  const handleAddToCart = (perfume: typeof perfumes[0]) => {
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { perfume, quantity: 1 }
    });
  };

  return (
    <section className="py-20 bg-gradient-to-b from-essence-navy to-essence-purple">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl font-bold text-white mb-4">
            Colección destacada
          </h2>
          <p className="text-essence-light text-lg max-w-2xl mx-auto">
            Descubre nuestras fragancias más exclusivas, cuidadosamente seleccionadas 
            para ofrecerte una experiencia olfativa única.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredPerfumes.map((perfume) => (
            <div key={perfume.id} className="group relative bg-white/10 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2 border border-white/20">
              {/* Product Image */}
              <div className="relative overflow-hidden rounded-t-3xl">
                <img 
                  src={perfume.image} 
                  alt={perfume.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                  {perfume.isNew && (
                    <span className="bg-essence-coral text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Nuevo
                    </span>
                  )}
                  {perfume.originalPrice && (
                    <span className="bg-essence-rose text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Oferta
                    </span>
                  )}
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                  <button 
                    onClick={() => handleViewProduct(perfume)}
                    className="bg-white text-essence-navy p-3 rounded-full hover:bg-essence-light transition-colors shadow-lg"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="bg-white text-essence-navy p-3 rounded-full hover:bg-essence-light transition-colors shadow-lg">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-essence-light font-medium">{perfume.brand}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{perfume.rating}</span>
                  </div>
                </div>

                <h3 className="font-playfair text-xl font-semibold mb-2 group-hover:text-essence-coral transition-colors">
                  {perfume.name}
                </h3>

                <p className="text-essence-light text-sm mb-4 line-clamp-2">
                  {perfume.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">
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
                    className="bg-gradient-to-r from-essence-coral to-essence-rose text-white p-3 rounded-full hover:shadow-lg hover:shadow-essence-coral/25 transition-all duration-300 hover:scale-105"
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button 
            onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'catalog' })}
            className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all duration-300"
          >
            Ver toda la colección
          </button>
        </div>
      </div>
    </section>
  );
}