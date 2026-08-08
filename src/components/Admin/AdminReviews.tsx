import React from 'react';
import { Star, Trash2, BadgeCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function AdminReviews() {
  const { state, dispatch } = useApp();
  const withReviews = state.perfumes.filter(p => p.reviews.length > 0);

  return (
    <div>
      <h1 className="font-playfair text-3xl font-bold text-essence-navy mb-8">Reseñas</h1>

      {withReviews.length === 0 ? (
        <p className="text-gray-500">Aún no hay reseñas.</p>
      ) : (
        <div className="space-y-8">
          {withReviews.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-playfair text-xl font-semibold text-essence-navy mb-4">{p.name}</h2>
              <ul className="space-y-4">
                {p.reviews.map(r => (
                  <li key={r.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-essence-navy">{r.userName}</span>
                          {r.verified && (
                            <span className="inline-flex items-center text-xs text-green-700">
                              <BadgeCheck className="h-4 w-4 mr-1" /> Verificada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-essence-coral mt-1">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-600 mt-2">{r.comment}</p>
                        <div className="text-xs text-gray-400 mt-1">{r.date}</div>
                      </div>
                      <div className="flex space-x-2">
                        {!r.verified && (
                          <button
                            onClick={() =>
                              dispatch({ type: 'UPDATE_REVIEW', payload: { perfumeId: p.id, review: { ...r, verified: true } } })
                            }
                            className="p-2 text-green-700 hover:bg-green-50 rounded-lg"
                            title="Marcar como verificada"
                          >
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar esta reseña?'))
                              dispatch({ type: 'DELETE_REVIEW', payload: { perfumeId: p.id, reviewId: r.id } });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
