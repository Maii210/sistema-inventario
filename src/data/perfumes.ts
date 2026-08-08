import { Perfume } from '../types';

export const perfumes: Perfume[] = [
  {
    id: '1',
    name: 'Mystique Noir',
    brand: 'Essence Collection',
    price: 450,
    originalPrice: 520,
    image: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg',
    description: 'Una fragancia misteriosa y seductora que combina notas orientales con un toque moderno. Perfecta para ocasiones especiales.',
    notes: {
      top: ['Bergamota', 'Pimienta Rosa', 'Cardamomo'],
      middle: ['Rosa Búlgara', 'Jazmín', 'Violeta'],
      base: ['Oud', 'Vainilla', 'Sándalo']
    },
    category: 'oriental',
    gender: 'unissex',
    duration: 'longa',
    intensity: 'intensa',
    rating: 4.8,
    reviews: [
      {
        id: '1',
        userId: '1',
        userName: 'María González',
        rating: 5,
        comment: 'Absolutamente increíble, la duración es excepcional y las notas se desarrollan de manera perfecta.',
        date: '2024-01-15',
        verified: true
      }
    ],
    isPopular: true,
    stock: 25
  },
  {
    id: '2',
    name: 'Floral Dreams',
    brand: 'Essence Botanica',
    price: 380,
    image: 'https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg',
    description: 'Una composición floral delicada que evoca jardines primaverales. Ideal para el uso diario.',
    notes: {
      top: ['Limón', 'Pera', 'Cassis'],
      middle: ['Peonía', 'Rosa', 'Freesia'],
      base: ['Almizcle Blanco', 'Cedro', 'Ámbar']
    },
    category: 'floral',
    gender: 'feminino',
    duration: 'moderada',
    intensity: 'suave',
    rating: 4.5,
    reviews: [],
    isNew: true,
    stock: 40
  },
  {
    id: '3',
    name: 'Ocean Breeze',
    brand: 'Essence Fresh',
    price: 320,
    image: 'https://images.pexels.com/photos/1342609/pexels-photo-1342609.jpeg',
    description: 'Frescura marina que transporta a costas mediterráneas. Perfecto para el verano.',
    notes: {
      top: ['Sal Marina', 'Limón', 'Menta'],
      middle: ['Lavanda', 'Geranio', 'Salvia'],
      base: ['Drift Wood', 'Ámbar Gris', 'Almizcle']
    },
    category: 'fresco',
    gender: 'masculino',
    duration: 'moderada',
    intensity: 'moderada',
    rating: 4.3,
    reviews: [],
    stock: 30
  },
  {
    id: '4',
    name: 'Golden Sunset',
    brand: 'Essence Luxury',
    price: 680,
    originalPrice: 750,
    image: 'https://images.pexels.com/photos/1466852/pexels-photo-1466852.jpeg',
    description: 'Elegancia y sofisticación en cada gota. Una fragancia amadeirada con toques dorados.',
    notes: {
      top: ['Mandarina', 'Jengibre', 'Elemi'],
      middle: ['Cedro', 'Vetiver', 'Ciprés'],
      base: ['Patchouli', 'Ámbar', 'Almizcle']
    },
    category: 'amadeirado',
    gender: 'masculino',
    duration: 'longa',
    intensity: 'intensa',
    rating: 4.9,
    reviews: [],
    isPopular: true,
    stock: 15
  },
  {
    id: '5',
    name: 'Rose Velvet',
    brand: 'Essence Romance',
    price: 420,
    image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg',
    description: 'La elegancia de la rosa en su máxima expresión. Romántica y sofisticada.',
    notes: {
      top: ['Rosa de Damasco', 'Lichi', 'Peonía'],
      middle: ['Rosa Centifolia', 'Magnolia', 'Lirio'],
      base: ['Almizcle Rosa', 'Sándalo', 'Cashmeran']
    },
    category: 'floral',
    gender: 'feminino',
    duration: 'longa',
    intensity: 'moderada',
    rating: 4.7,
    reviews: [],
    stock: 35
  },
  {
    id: '6',
    name: 'Midnight Spice',
    brand: 'Essence Noir',
    price: 480,
    image: 'https://images.pexels.com/photos/1961794/pexels-photo-1961794.jpeg',
    description: 'Especias exóticas se encuentran en una danza nocturna. Misterioso y cautivador.',
    notes: {
      top: ['Canela', 'Nuez Moscada', 'Cardamomo'],
      middle: ['Clavo', 'Rosa', 'Geranio'],
      base: ['Vainilla', 'Benzoína', 'Almizcle']
    },
    category: 'oriental',
    gender: 'unissex',
    duration: 'longa',
    intensity: 'intensa',
    rating: 4.6,
    reviews: [],
    stock: 20
  }
];