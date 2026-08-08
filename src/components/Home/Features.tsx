import React from 'react';
import { Sparkles, MessageCircle, Star, Gift, BarChart3, Info } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Test Interactivo',
    description: 'Descubre tu fragancia perfecta a través de nuestro test personalizado que analiza tu estilo y preferencias.',
    color: 'from-essence-coral to-essence-rose'
  },
  {
    icon: MessageCircle,
    title: 'Asistente Virtual',
    description: 'Nuestro chatbot con IA te ayuda a elegir, consultar envíos y encontrar productos fácilmente.',
    color: 'from-essence-purple to-essence-plum'
  },
  {
    icon: Star,
    title: 'Sistema de Reseñas',
    description: 'Lee opiniones auténticas con calificaciones, comentarios y videos de otros compradores.',
    color: 'from-essence-rose to-essence-plum'
  },
  {
    icon: Gift,
    title: 'Modo Regalo',
    description: 'Personaliza tu compra con empaques especiales y mensajes personalizados para ocasiones especiales.',
    color: 'from-essence-plum to-essence-navy'
  },
  {
    icon: BarChart3,
    title: 'Comparador',
    description: 'Compara diferentes fragancias lado a lado para tomar la mejor decisión de compra.',
    color: 'from-essence-navy to-essence-purple'
  },
  {
    icon: Info,
    title: 'Guía Visual',
    description: 'Infografías interactivas sobre duración, tipo de aroma, uso ideal y más características.',
    color: 'from-essence-light to-essence-coral'
  }
];

export function Features() {
  return (
    <section className="py-16 bg-gradient-to-b from-essence-light/5 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl font-bold text-essence-navy mb-4">
            Experiencia Única en Fragancias
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Revoluciona tu forma de comprar perfumes con nuestras herramientas innovadoras 
            diseñadas para brindarte la mejor experiencia de compra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
            >
              {/* Icon */}
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4 group-hover:text-essence-plum transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-essence-coral to-essence-rose group-hover:w-full transition-all duration-500 rounded-b-2xl"></div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-essence-navy to-essence-purple rounded-3xl p-12 text-white">
          <h3 className="font-playfair text-3xl font-bold mb-4">
            ¿Listo para encontrar tu fragancia perfecta?
          </h3>
          <p className="text-essence-light text-lg mb-8 max-w-2xl mx-auto">
            Comienza tu viaje olfativo con nuestro test personalizado y descubre 
            qué fragancia refleja mejor tu personalidad y estilo.
          </p>
          <button 
            onClick={() => {}} // Will be implemented when Quiz component is ready
            className="bg-gradient-to-r from-essence-coral to-essence-rose text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-essence-coral/25 transition-all duration-300 hover:scale-105"
          >
            Comenzar Test de Fragancia
          </button>
        </div>
      </div>
    </section>
  );
}