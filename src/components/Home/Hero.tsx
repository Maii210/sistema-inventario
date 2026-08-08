import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function Hero() {
  const { dispatch } = useApp();

  const handleFindFragrance = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'quiz' });
  };

  const handleExploreGuide = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'guide' });
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-essence-navy via-essence-purple to-essence-plum overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-essence-coral/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-essence-light/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-essence-rose/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative container mx-auto px-4 min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Content */}
          <div className="text-white space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="font-playfair text-5xl lg:text-6xl font-bold leading-tight">
                Descubre Tu
                <br />
                <span className="bg-gradient-to-r from-essence-coral to-essence-light bg-clip-text text-transparent">
                  Fragancia
                </span>{' '}
                Ideal
              </h1>
              
              <p className="text-lg text-gray-200 leading-relaxed max-w-lg">
                Experimenta el arte de la perfumería con nuestra exclusiva colección 
                de fragancias de lujo, diseñadas para capturar tu esencia
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleFindFragrance}
                className="group bg-gradient-to-r from-essence-coral to-essence-rose text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center space-x-2 hover:shadow-2xl hover:shadow-essence-coral/25 transition-all duration-300 hover:scale-105"
              >
                <span>Encuentra tu fragancia</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={handleExploreGuide}
                className="group border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center space-x-2 hover:bg-white/10 transition-all duration-300"
              >
                <Play className="h-5 w-5" />
                <span>Explorar guía</span>
              </button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-in">
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg" 
                alt="Perfume Essence Collection"
                className="w-full max-w-md mx-auto rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-700"
              />
              
              {/* Floating Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-essence-purple/20 to-transparent rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}