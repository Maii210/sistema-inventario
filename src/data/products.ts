import { Product } from '../types';

// Catálogo de ejemplo para Comercial Camila (perfumería y cuidado personal).
export const products: Product[] = [
  // Perfumería
  { id: '1', name: 'Perfume Mystique Noir 100ml', brand: 'Essence', category: 'Perfumería', price: 450, purchasePrice: 300, stock: 25, description: 'Fragancia oriental intensa, larga duración.' },
  { id: '2', name: 'Perfume Flor de Almendro 90ml', brand: 'Camila', category: 'Perfumería', price: 380, purchasePrice: 250, stock: 18, description: 'Aroma floral suave para dama.' },
  { id: '3', name: 'Body Splash Vainilla 250ml', brand: 'Camila', category: 'Perfumería', price: 65, purchasePrice: 40, stock: 40, description: 'Colonia corporal aroma vainilla.' },
  { id: '4', name: 'Colonia Cítrica Hombre 100ml', brand: 'Adiction', category: 'Perfumería', price: 220, purchasePrice: 150, stock: 22, description: 'Fragancia fresca cítrica para caballero.' },

  // Cuidado personal
  { id: '5', name: 'Crema hidratante corporal 400ml', brand: 'Nivea', category: 'Cuidado personal', price: 55, purchasePrice: 38, stock: 60, description: 'Hidratación profunda para piel seca.' },
  { id: '6', name: 'Shampoo anticaspa 400ml', brand: 'Head & Shoulders', category: 'Cuidado personal', price: 48, purchasePrice: 33, stock: 50, description: 'Control de caspa uso diario.' },
  { id: '7', name: 'Acondicionador reparador 400ml', brand: 'Sedal', category: 'Cuidado personal', price: 38, purchasePrice: 25, stock: 45, description: 'Repara el cabello dañado.' },
  { id: '8', name: 'Desodorante en barra 50g', brand: 'Rexona', category: 'Cuidado personal', price: 28, purchasePrice: 18, stock: 90, description: 'Protección antitranspirante 48h.' },
  { id: '9', name: 'Jabón líquido de manos 250ml', brand: 'Protex', category: 'Cuidado personal', price: 22, purchasePrice: 14, stock: 80, description: 'Jabón antibacterial.' },
  { id: '10', name: 'Pasta dental 90g', brand: 'Colgate', category: 'Cuidado personal', price: 18, purchasePrice: 11, stock: 120, description: 'Protección anticaries.' },

  // Cosméticos
  { id: '11', name: 'Labial mate rojo', brand: 'Vogue', category: 'Cosméticos', price: 35, purchasePrice: 20, stock: 35, description: 'Labial de larga duración acabado mate.' },
  { id: '12', name: 'Base líquida tono natural 30ml', brand: 'Maybelline', category: 'Cosméticos', price: 95, purchasePrice: 65, stock: 20, description: 'Cobertura media, acabado natural.' }
];
