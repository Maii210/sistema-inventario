// Nombres: solo letras, espacios y acentos.
export function soloLetras(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
}

// Teléfonos/celulares: solo dígitos.
export function soloDigitos(value: string): string {
  return value.replace(/\D/g, '');
}

// Cantidades/stock: solo enteros (dígitos).
export function soloEnteros(value: string): string {
  return value.replace(/\D/g, '');
}

// Precios/montos: dígitos y un punto decimal, máximo 2 decimales.
export function soloDecimales(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  const intPart = cleaned.slice(0, firstDot);
  const decPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
  return `${intPart}.${decPart}`;
}

// Primera letra en mayúscula, respetando el resto del texto.
export function capitalizeFirst(value: string): string {
  const v = value.trim();
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1);
}
