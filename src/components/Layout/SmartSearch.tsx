import React from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'product' | 'brand' | 'category';
  count?: number;
}

export function SmartSearch() {
  const { state, dispatch } = useApp();
  const { perfumes } = state;
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(state.searchQuery);
  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('essence-recent-searches');
    return saved ? JSON.parse(saved) : [];
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sugerencias populares predefinidas
  const popularSearches = [
    'perfume floral',
    'fragancia masculina',
    'perfume para regalo',
    'eau de parfum',
    'perfume duradero',
    'fragancia fresca'
  ];

  // Generar sugerencias basadas en productos
  const productSuggestions = React.useMemo(() => {
    const suggestions: SearchSuggestion[] = [];
    
    // Nombres de productos
    perfumes.forEach(perfume => {
      suggestions.push({
        id: `product-${perfume.id}`,
        text: perfume.name,
        type: 'product'
      });
    });

    // Marcas únicas
    const brands = [...new Set(perfumes.map(p => p.brand))];
    brands.forEach(brand => {
      suggestions.push({
        id: `brand-${brand}`,
        text: brand,
        type: 'brand'
      });
    });

    // Categorías
    const categories = [...new Set(perfumes.map(p => p.category))];
    categories.forEach(category => {
      suggestions.push({
        id: `category-${category}`,
        text: category,
        type: 'category'
      });
    });

    return suggestions;
  }, []);

  // Filtrar sugerencias basadas en el input
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) {
      const suggestions: SearchSuggestion[] = [];
      
      // Búsquedas recientes
      recentSearches.slice(0, 3).forEach((search, index) => {
        suggestions.push({
          id: `recent-${index}`,
          text: search,
          type: 'recent'
        });
      });

      // Búsquedas populares
      popularSearches.slice(0, 4).forEach((search, index) => {
        suggestions.push({
          id: `popular-${index}`,
          text: search,
          type: 'popular'
        });
      });

      return suggestions;
    }

    const query = inputValue.toLowerCase();
    const filtered = productSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(query)
    );

    return filtered.slice(0, 8);
  }, [inputValue, recentSearches, productSuggestions]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(true);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    // Actualizar búsquedas recientes
    const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updatedRecent);
    localStorage.setItem('essence-recent-searches', JSON.stringify(updatedRecent));

    // Actualizar estado global
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    setInputValue(query);
    setIsOpen(false);

    // Navegar al catálogo si no estamos ahí
    if (state.currentView !== 'catalog') {
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'catalog' });
    }

    // Quitar foco del input
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(inputValue);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('essence-recent-searches');
  };

  const removeRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem('essence-recent-searches', JSON.stringify(updated));
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-essence-coral" />;
      case 'product':
        return <Search className="h-4 w-4 text-essence-purple" />;
      case 'brand':
        return <span className="text-xs font-bold text-essence-plum bg-essence-plum/10 px-2 py-1 rounded">M</span>;
      case 'category':
        return <span className="text-xs font-bold text-essence-navy bg-essence-navy/10 px-2 py-1 rounded">C</span>;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar fragancias..."
          className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-2 pr-10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-essence-coral focus:bg-white/20 transition-all"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={() => handleSearch(inputValue)}
          className="absolute right-3 top-2.5 text-white/70 hover:text-white transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Suggestions */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
            {filteredSuggestions.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                No se encontraron sugerencias
              </div>
            ) : (
              <>
                {/* Header para búsquedas recientes */}
                {!inputValue.trim() && recentSearches.length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Búsquedas recientes</span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-essence-purple hover:text-essence-plum transition-colors"
                      >
                        Limpiar todo
                      </button>
                    </div>
                  </div>
                )}

                {/* Sugerencias */}
                {filteredSuggestions.map((suggestion, index) => (
                  <div key={suggestion.id}>
                    {/* Separador para búsquedas populares */}
                    {!inputValue.trim() && suggestion.type === 'popular' && index === recentSearches.slice(0, 3).length && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Búsquedas populares</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        {getSuggestionIcon(suggestion.type)}
                        <span className="text-gray-700 group-hover:text-essence-navy">
                          {suggestion.text}
                        </span>
                        {suggestion.type === 'popular' && (
                          <span className="text-xs text-essence-coral bg-essence-coral/10 px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>

                      {suggestion.type === 'recent' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(suggestion.text);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </button>
                  </div>
                ))}

                {/* Footer con tips */}
                {inputValue.trim() && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      💡 Tip: Prueba buscar por marca, categoría o tipo de fragancia
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}