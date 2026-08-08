import React from 'react';
import { Star, ShoppingBag, Heart, Eye, Filter } from 'lucide-react';
import { perfumes } from '../../data/perfumes';
import { useApp } from '../../contexts/AppContext';
import { ProductFilters } from './ProductFilters';

export function ProductGrid() {
  const { state, dispatch } = useApp();
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter perfumes based on current filters and search
  const filteredPerfumes = React.useMemo(() => {
    let filtered = [...perfumes];

    // Search filter
    if (state.searchQuery) {
      filtered = filtered.filter(perfume =>
        perfume.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        perfume.brand.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        perfume.description.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (state.filters.category?.length) {
      filtered = filtered.filter(perfume =>
        state.filters.category!.includes(perfume.category)
      );
    }

    // Gender filter
    if (state.filters.gender?.length) {
      filtered = filtered.filter(perfume =>
        state.filters.gender!.includes(perfume.gender)
      );
    }

    // Price range filter
    if (state.filters.priceRange) {
      const [min, max] = state.filters.priceRange;
      filtered = filtered.filter(perfume =>
        perfume.price >= min && perfume.price <= max
      );
    }

    // Duration filter
    if (state.filters.duration?.length) {
      filtered = filtered.filter(perfume =>
        state.filters.duration!.includes(perfume.duration)
      );
    }

    // Intensity filter
    if (state.filters.intensity?.length) {
      filtered = filtered.filter(perfume =>
        state.filters.intensity!.includes(perfume.intensity)
      );
    }

    // Brand filter
    if (state.filters.brand?.length) {
      filtered = filtered.filter(perfume =>
        state.filters.brand!.includes(perfume.brand)
      );
    }

    // Sort
    if (state.filters.sortBy) {
      switch (state.filters.sortBy) {
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'popular':
          filtered.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
          break;
      }
    }

    return filtered;
  }, [perfumes, state.filters, state.searchQuery]);

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
    <div className="min-h-screen bg-gradient-to-b from-white to-essence-light/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-4xl font-bold text-essence-navy mb-2">
              Catálogo de Fragancias
            </h1>
            <p className="text-gray-600">
              {filteredPerfumes.length} productos encontrados
            </p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 bg-essence-navy text-white px-4 py-2 rounded-lg"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </button>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden lg:block'} w-full lg:w-80 space-y-6`}>
            <ProductFilters />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredPerfumes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600 mb-6">
                  Intenta ajustar tus filtros o búsqueda
                </p>
                <button 
                  onClick={() => dispatch({ type: 'SET_FILTERS', payload: {} })}
                  className="bg-essence-navy text-white px-6 py-3 rounded-lg hover:bg-essence-purple transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredPerfumes.map((perfume) => (
                  <div key={perfume.id} className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2">
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
                        {perfume.stock < 10 && (
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ¡Últimas unidades!
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
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 font-medium">{perfume.brand}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{perfume.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-2 group-hover:text-essence-plum transition-colors">
                        {perfume.name}
                      </h3>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {perfume.description}
                      </p>

                      {/* Notes Preview */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">Notas principales:</div>
                        <div className="flex flex-wrap gap-1">
                          {perfume.notes.top.slice(0, 2).map((note, index) => (
                            <span key={index} className="text-xs bg-essence-light/20 text-essence-navy px-2 py-1 rounded-full">
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>

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
                          disabled={perfume.stock === 0}
                          className="bg-gradient-to-r from-essence-purple to-essence-plum text-white p-3 rounded-full hover:shadow-lg hover:shadow-essence-purple/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingBag className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Category & Details */}
                      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded-full">
                          {perfume.category}
                        </span>
                        <span className="capitalize">
                          {perfume.gender}
                        </span>
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded-full">
                          {perfume.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}