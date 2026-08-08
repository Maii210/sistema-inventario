import { QuizQuestion } from '../types';

export const quizQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: '¿Cuál es tu estilo de vida?',
    options: [
      { id: '1a', text: 'Activo y deportivo', value: 'active' },
      { id: '1b', text: 'Elegante y sofisticado', value: 'elegant' },
      { id: '1c', text: 'Casual y relajado', value: 'casual' },
      { id: '1d', text: 'Aventurero y espontáneo', value: 'adventurous' }
    ]
  },
  {
    id: '2',
    question: '¿Qué tipo de aromas prefieres?',
    options: [
      { id: '2a', text: 'Florales y delicados', value: 'floral' },
      { id: '2b', text: 'Frescos y acuáticos', value: 'fresh' },
      { id: '2c', text: 'Orientales y especiados', value: 'oriental' },
      { id: '2d', text: 'Amaderados y terrosos', value: 'woody' }
    ]
  },
  {
    id: '3',
    question: '¿Cuándo usarías principalmente este perfume?',
    options: [
      { id: '3a', text: 'Todos los días', value: 'daily' },
      { id: '3b', text: 'Ocasiones especiales', value: 'special' },
      { id: '3c', text: 'Trabajo y eventos profesionales', value: 'professional' },
      { id: '3d', text: 'Salidas nocturnas', value: 'evening' }
    ]
  },
  {
    id: '4',
    question: '¿Qué intensidad prefieres?',
    options: [
      { id: '4a', text: 'Suave y sutil', value: 'light' },
      { id: '4b', text: 'Moderada', value: 'moderate' },
      { id: '4c', text: 'Intensa y duradera', value: 'strong' },
      { id: '4d', text: 'Me adapto según la ocasión', value: 'variable' }
    ]
  },
  {
    id: '5',
    question: '¿Cuál de estos colores te representa mejor?',
    options: [
      { id: '5a', text: 'Rosa y tonos pastel', value: 'pink' },
      { id: '5b', text: 'Azul y verde', value: 'blue' },
      { id: '5c', text: 'Dorado y rojo', value: 'gold' },
      { id: '5d', text: 'Negro y púrpura', value: 'dark' }
    ]
  }
];