import React from 'react';
import { ArrowLeft, Clock, Droplets, Flower, Wind, TreePine, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function FragranceGuide() {
  const { dispatch } = useApp();

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  };

  const categories = [
    {
      name: 'Floral',
      icon: Flower,
      color: 'from-pink-400 to-rose-500',
      description: 'Fragancias femeninas y románticas con notas de flores',
      characteristics: ['Romántico', 'Delicado', 'Femenino', 'Primaveral'],
      examples: ['Rosa', 'Jazmín', 'Peonía', 'Lirio']
    },
    {
      name: 'Fresco',
      icon: Wind,
      color: 'from-blue-400 to-cyan-500',
      description: 'Aromas ligeros y refrescantes, ideales para el día',
      characteristics: ['Energizante', 'Limpio', 'Deportivo', 'Veraniego'],
      examples: ['Cítricos', 'Menta', 'Eucalipto', 'Ozono']
    },
    {
      name: 'Oriental',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-600',
      description: 'Fragancias exóticas y sensuales con especias',
      characteristics: ['Sensual', 'Misterioso', 'Nocturno', 'Exótico'],
      examples: ['Vainilla', 'Ámbar', 'Especias', 'Incienso']
    },
    {
      name: 'Amaderado',
      icon: TreePine,
      color: 'from-amber-600 to-orange-700',
      description: 'Aromas masculinos y sofisticados con maderas',
      characteristics: ['Masculino', 'Elegante', 'Maduro', 'Sofisticado'],
      examples: ['Sándalo', 'Cedro', 'Vetiver', 'Patchouli']
    }
  ];

  const intensityLevels = [
    {
      name: 'Eau de Cologne',
      concentration: '2-5%',
      duration: '1-2 horas',
      description: 'Muy ligero, ideal para refrescar'
    },
    {
      name: 'Eau de Toilette',
      concentration: '5-15%',
      duration: '2-4 horas',
      description: 'Ligero, perfecto para uso diario'
    },
    {
      name: 'Eau de Parfum',
      concentration: '15-20%',
      duration: '4-6 horas',
      description: 'Intenso, ideal para ocasiones especiales'
    },
    {
      name: 'Parfum',
      concentration: '20-40%',
      duration: '6-8 horas',
      description: 'Muy intenso, la máxima concentración'
    }
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
            <span className="font-medium">Volver</span>
          </button>
          
          <h1 className="font-playfair text-3xl font-bold text-essence-navy">
            Guía de Fragancias
          </h1>
          
          <div></div>
        </div>

        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl font-bold text-essence-navy mb-4">
            Descubre el Mundo de las Fragancias
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Aprende sobre las diferentes familias olfativas, concentraciones y cómo elegir 
            la fragancia perfecta para cada ocasión.
          </p>
        </div>

        {/* Fragrance Categories */}
        <section className="mb-16">
          <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-8 text-center">
            Familias Olfativas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className={`h-32 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <category.icon className="h-12 w-12 text-white" />
                </div>
                
                <div className="p-6">
                  <h4 className="font-playfair text-xl font-semibold text-essence-navy mb-3">
                    {category.name}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {category.description}
                  </p>
                  
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-700 mb-2">Características:</h5>
                    <div className="flex flex-wrap gap-1">
                      {category.characteristics.map((char, i) => (
                        <span key={i} className="text-xs bg-essence-light/20 text-essence-navy px-2 py-1 rounded-full">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">Ejemplos:</h5>
                    <p className="text-sm text-gray-600">
                      {category.examples.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Concentration Levels */}
        <section className="mb-16">
          <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-8 text-center">
            Concentraciones y Duración
          </h3>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {intensityLevels.map((level, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-essence-purple to-essence-plum rounded-full mx-auto flex items-center justify-center">
                      <Droplets className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-essence-coral text-white text-xs px-2 py-1 rounded-full">
                      {level.concentration}
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-essence-navy mb-2">{level.name}</h4>
                  <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-2">
                    <Clock className="h-4 w-4" />
                    <span>{level.duration}</span>
                  </div>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-16">
          <h3 className="font-playfair text-2xl font-semibold text-essence-navy mb-8 text-center">
            Consejos de Aplicación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="w-12 h-12 bg-essence-coral/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👃</span>
              </div>
              <h4 className="font-semibold text-essence-navy mb-3">Puntos de Pulso</h4>
              <p className="text-gray-600 text-sm">
                Aplica en muñecas, cuello, detrás de las orejas y en el escote para una mejor proyección.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="w-12 h-12 bg-essence-rose/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🌡️</span>
              </div>
              <h4 className="font-semibold text-essence-navy mb-3">Temperatura</h4>
              <p className="text-gray-600 text-sm">
                Aplica sobre piel limpia y seca. El calor corporal ayuda a que la fragancia se desarrolle mejor.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="w-12 h-12 bg-essence-plum/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">💧</span>
              </div>
              <h4 className="font-semibold text-essence-navy mb-3">Cantidad</h4>
              <p className="text-gray-600 text-sm">
                Menos es más. 2-3 pulverizaciones son suficientes para la mayoría de fragancias.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-essence-navy to-essence-purple rounded-3xl p-12 text-white">
          <h3 className="font-playfair text-3xl font-bold mb-4">
            ¿Listo para encontrar tu fragancia ideal?
          </h3>
          <p className="text-essence-light text-lg mb-8 max-w-2xl mx-auto">
            Usa nuestro test personalizado para descubrir qué fragancia se adapta mejor a tu personalidad.
          </p>
          <button 
            onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'quiz' })}
            className="bg-gradient-to-r from-essence-coral to-essence-rose text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-essence-coral/25 transition-all duration-300 hover:scale-105"
          >
            Comenzar Test de Fragancia
          </button>
        </div>
      </div>
    </div>
  );
}