import { Product } from '../types';

// Productos de ejemplo para Comercial Camila (cuidado personal y perfumería).
export const products: Product[] = [
  { id: '1', name: 'Perfume Mystique Noir 100ml', brand: 'Essence', category: 'Perfumería', price: 450, purchasePrice: 300, stock: 25, description: 'Fragancia oriental intensa.' },
  { id: '2', name: 'Body Splash Vainilla 250ml', brand: 'Camila', category: 'Perfumería', price: 65, purchasePrice: 40, stock: 40, description: 'Colonia corporal aroma vainilla.' },
  { id: '3', name: 'Crema hidratante corporal 400ml', brand: 'Nivea', category: 'Cuidado personal', price: 55, purchasePrice: 38, stock: 60, description: 'Hidratación profunda para piel seca.' },
  { id: '4', name: 'Shampoo anticaspa 400ml', brand: 'Head & Shoulders', category: 'Cuidado personal', price: 48, purchasePrice: 33, stock: 50, description: 'Control de caspa uso diario.' },
  { id: '5', name: 'Desodorante en barra 50g', brand: 'Rexona', category: 'Cuidado personal', price: 28, purchasePrice: 18, stock: 90, description: 'Protección antitranspirante 48h.' },
  { id: '6', name: 'Jabón líquido de manos 250ml', brand: 'Protex', category: 'Cuidado personal', price: 22, purchasePrice: 14, stock: 80, description: 'Jabón antibacterial.' }
];
