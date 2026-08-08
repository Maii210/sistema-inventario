import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { quizQuestions } from '../../data/quiz';
import { perfumes } from '../../data/perfumes';

export function FragranceQuiz() {
  const { dispatch } = useApp();
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [showResult, setShowResult] = React.useState(false);
  const [recommendedPerfume, setRecommendedPerfume] = React.useState<typeof perfumes[0] | null>(null);

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResult = () => {
    // Simple recommendation algorithm based on answers
    const answerValues = Object.values(answers);
    
    let recommendedId = '1'; // Default to first perfume
    
    // Basic logic to match answers to perfumes
    if (answerValues.includes('elegant') && answerValues.includes('oriental')) {
      recommendedId = '1'; // Mystique Noir
    } else if (answerValues.includes('casual') && answerValues.includes('floral')) {
      recommendedId = '2'; // Floral Dreams
    } else if (answerValues.includes('active') && answerValues.includes('fresh')) {
      recommendedId = '3'; // Ocean Breeze
    } else if (answerValues.includes('elegant') && answerValues.includes('woody')) {
      recommendedId = '4'; // Golden Sunset
    } else if (answerValues.includes('casual') && answerValues.includes('floral')) {
      recommendedId = '5'; // Rose Velvet
    } else if (answerValues.includes('adventurous') && answerValues.includes('oriental')) {
      recommendedId = '6'; // Midnight Spice
    }

    const perfume = perfumes.find(p => p.id === recommendedId) || perfumes[0];
    setRecommendedPerfume(perfume);
    setShowResult(true);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    setRecommendedPerfume(null);
  };

  const viewProduct = () => {
    if (recommendedPerfume) {
      dispatch({ type: 'SET_SELECTED_PERFUME', payload: recommendedPerfume });
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'product' });
    }
  };

  const addToCart = () => {
    if (recommendedPerfume) {
      dispatch({ 
        type: 'ADD_TO_CART', 
        payload: { perfume: recommendedPerfume, quantity: 1 }
      });
    }
  };

  if (showResult && recommendedPerfume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-essence-navy via-essence-purple to-essence-plum">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-white hover:text-essence-light mb-8 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Volver al Inicio</span>
          </button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
                <Sparkles className="h-6 w-6 text-essence-light" />
                <span className="text-white font-medium">¡Tu fragancia perfecta!</span>
              </div>
              
              <h1 className="font-playfair text-5xl font-bold text-white mb-4">
                Resultado del Test
              </h1>
              <p className="text-essence-light text-xl max-w-2xl mx-auto">
                Basado en tus respuestas, hemos encontrado la fragancia que mejor se adapta a tu personalidad y estilo.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Product Image */}
                <div className="relative">
                  <img 
                    src={recommendedPerfume.image} 
                    alt={recommendedPerfume.name}
                    className="w-full h-96 lg:h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Product Info */}
                <div className="p-8 lg:p-12">
                  <div className="mb-6">
                    <span className="text-essence-purple font-medium text-lg">{recommendedPerfume.brand}</span>
                    <h2 className="font-playfair text-4xl font-bold text-essence-navy mt-2 mb-4">
                      {recommendedPerfume.name}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {recommendedPerfume.description}
                    </p>
                  </div>

                  {/* Match Reasons */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-essence-navy mb-4">¿Por qué es perfecta para ti?</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <span className="w-2 h-2 bg-essence-coral rounded-full"></span>
                        <span>Se adapta a tu estilo de vida</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <span className="w-2 h-2 bg-essence-rose rounded-full"></span>
                        <span>Coincide con tus preferencias aromáticas</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <span className="w-2 h-2 bg-essence-plum rounded-full"></span>
                        <span>Intensidad ideal para tus ocasiones</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-essence-light/10 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Categoría</div>
                      <div className="font-semibold text-essence-navy capitalize">{recommendedPerfume.category}</div>
                    </div>
                    <div className="bg-essence-light/10 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Intensidad</div>
                      <div className="font-semibold text-essence-navy capitalize">{recommendedPerfume.intensity}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold text-essence-navy">
                        {recommendedPerfume.price} BOB
                      </span>
                      {recommendedPerfume.originalPrice && (
                        <span className="text-xl text-gray-400 line-through">
                          {recommendedPerfume.originalPrice} BOB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    <button
                      onClick={addToCart}
                      className="w-full bg-gradient-to-r from-essence-purple to-essence-plum text-white py-4 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-essence-purple/25 transition-all duration-300 hover:scale-105"
                    >
                      Agregar al Carrito
                    </button>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={viewProduct}
                        className="flex-1 border-2 border-essence-purple text-essence-purple py-3 rounded-xl font-semibold hover:bg-essence-purple/5 transition-colors"
                      >
                        Ver Detalles
                      </button>
                      
                      <button
                        onClick={restartQuiz}
                        className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Repetir Test</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-essence-navy via-essence-purple to-essence-plum">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-white hover:text-essence-light mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver al Inicio</span>
        </button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Sparkles className="h-6 w-6 text-essence-light" />
              <span className="text-white font-medium">Test de Fragancia</span>
            </div>
            
            <h1 className="font-playfair text-4xl font-bold text-white mb-4">
              Encuentra tu Fragancia Perfecta
            </h1>
            <p className="text-essence-light text-lg">
              Responde algunas preguntas y te ayudaremos a descubrir el perfume ideal para ti.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-white text-sm mb-2">
              <span>Pregunta {currentQuestion + 1} de {quizQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-essence-coral to-essence-light h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <h2 className="font-playfair text-2xl font-semibold text-essence-navy mb-8 text-center">
              {currentQ.question}
            </h2>

            <div className="space-y-4">
              {currentQ.options.map((option) => (
                <label 
                  key={option.id}
                  className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    answers[currentQ.id] === option.value
                      ? 'border-essence-purple bg-essence-purple/5 shadow-lg'
                      : 'border-gray-200 hover:border-essence-purple/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQ.id}
                    value={option.value}
                    checked={answers[currentQ.id] === option.value}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQ.id] === option.value
                        ? 'border-essence-purple bg-essence-purple'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQ.id] === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-gray-700">{option.text}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!answers[currentQ.id]}
              className="flex items-center space-x-2 bg-gradient-to-r from-essence-coral to-essence-rose text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{currentQuestion === quizQuestions.length - 1 ? 'Ver Resultado' : 'Siguiente'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}