import { Product } from '../types';

// Productos de ejemplo para Comercial Camila (tienda de comercio general).
export const products: Product[] = [
  { id: '1', name: 'Cuaderno universitario 100 hojas', brand: 'Norma', category: 'Papelería', price: 25, purchasePrice: 16, stock: 120, description: 'Cuaderno tapa dura, cuadriculado.' },
  { id: '2', name: 'Bolígrafo azul', brand: 'Bic', category: 'Papelería', price: 3, purchasePrice: 1.5, stock: 400, description: 'Bolígrafo tinta azul.' },
  { id: '3', name: 'Detergente en polvo 1kg', brand: 'Ola', category: 'Limpieza', price: 28, purchasePrice: 20, stock: 60, description: 'Detergente multiusos.' },
  { id: '4', name: 'Aceite comestible 900ml', brand: 'Fino', category: 'Abarrotes', price: 18, purchasePrice: 14, stock: 80, description: 'Aceite vegetal.' },
  { id: '5', name: 'Arroz 1kg', brand: 'Grano de Oro', category: 'Abarrotes', price: 12, purchasePrice: 9, stock: 150, description: 'Arroz grano largo.' },
  { id: '6', name: 'Gaseosa 2L', brand: 'Coca-Cola', category: 'Bebidas', price: 15, purchasePrice: 11, stock: 90, description: 'Bebida gasificada 2 litros.' }
];
