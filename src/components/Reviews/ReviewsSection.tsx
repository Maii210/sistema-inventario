import React from 'react';
import { ArrowLeft, Star, ThumbsUp, MessageCircle, Filter, Search, User, Calendar, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function ReviewsSection() {
  const { state, dispatch } = useApp();
  const { perfumes } = state;
const [selectedPerfume, setSelectedPerfume] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('recent');
  const [filterRating, setFilterRating] = React.useState<number>(0);
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  };

  // Generar reseñas de ejemplo
  const allReviews = React.useMemo(() => {
    const reviews = [];
    perfumes.forEach(perfume => {
      // Agregar reseñas existentes
      perfume.reviews.forEach(review => {
        reviews.push({
          ...review,
          perfumeName: perfume.name,
          perfumeId: perfume.id,
          perfumeImage: perfume.image
        });
      });

      // Agregar reseñas adicionales de ejemplo
      const additionalReviews = [
        {
          id: `${perfume.id}-2`,
          userId: '2',
          userName: 'Carlos Mendoza',
          rating: 4,
          comment: 'Excelente fragancia, muy duradera. La recomiendo para ocasiones especiales.',
          date: '2024-01-10',
          verified: true,
          perfumeName: perfume.name,
          perfumeId: perfume.id,
          perfumeImage: perfume.image,
          helpful: 12
        },
        {
          id: `${perfume.id}-3`,
          userId: '3',
          userName: 'Ana Rodríguez',
          rating: 5,
          comment: 'Me encanta! Es exactamente lo que esperaba. El empaque también es hermoso.',
          date: '2024-01-08',
          verified: false,
          perfumeName: perfume.name,
          perfumeId: perfume.id,
          perfumeImage: perfume.image,
          helpful: 8
        }
      ];
      reviews.push(...additionalReviews);
    });
    return reviews;
  }, []);

  const filteredReviews = React.useMemo(() => {
    let filtered = [...allReviews];

    // Filtrar por perfume
    if (selectedPerfume !== 'all') {
      filtered = filtered.filter(review => review.perfumeId === selectedPerfume);
    }

    // Filtrar por calificación
    if (filterRating > 0) {
      filtered = filtered.filter(review => review.rating >= filterRating);
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.perfumeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'rating-high':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating-low':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        filtered.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
    }

    return filtered;
  }, [allReviews, selectedPerfume, sortBy, filterRating, searchQuery]);

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`${starSize} ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: allReviews.filter(review => review.rating === rating).length,
    percentage: (allReviews.filter(review => review.rating === rating).length / allReviews.length) * 100
  }));

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
            Reseñas de Clientes
          </h1>
          
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Stats & Filters */}
          <div className="space-y-6">
            {/* Rating Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-essence-navy mb-4">Calificación General</h3>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-essence-navy mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {renderStars(Math.round(averageRating), 'md')}
                </div>
                <div className="text-sm text-gray-500">
                  Basado en {allReviews.length} reseñas
                </div>
              </div>

              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-2 text-sm">
                    <span className="w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-essence-navy mb-4 flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    value={selectedPerfume}
                    onChange={(e) => setSelectedPerfume(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                  >
                    <option value="all">Todos los productos</option>
                    {perfumes.map(perfume => (
                      <option key={perfume.id} value={perfume.id}>{perfume.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calificación mínima
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFilterRating(filterRating === rating ? 0 : rating)}
                        className={`p-1 rounded ${
                          filterRating >= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
                  >
                    <option value="recent">Más recientes</option>
                    <option value="rating-high">Mejor calificación</option>
                    <option value="rating-low">Menor calificación</option>
                    <option value="helpful">Más útiles</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en reseñas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple"
              />
            </div>

            {/* Reviews */}
            {filteredReviews.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600 mb-2">No se encontraron reseñas</h3>
                <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredReviews.map(review => (
                  <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                          src={review.perfumeImage} 
                          alt={review.perfumeName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <div className="w-8 h-8 bg-essence-purple text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {review.userName[0]}
                              </div>
                              <div>
                                <div className="font-medium text-essence-navy">{review.userName}</div>
                                <div className="text-sm text-gray-500">{review.perfumeName}</div>
                              </div>
                              {review.verified && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs font-medium">Verificado</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
                              {renderStars(review.rating)}
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(review.date).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Comment */}
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {review.comment}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center space-x-4 text-sm">
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-essence-purple transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            <span>Útil ({review.helpful || 0})</span>
                          </button>
                          <button className="text-gray-500 hover:text-essence-purple transition-colors">
                            Responder
                          </button>
                        </div>
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