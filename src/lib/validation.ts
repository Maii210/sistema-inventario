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

// Formato Título: primera letra de cada palabra en mayúscula, el resto en minúscula.
// "PEDRO" -> "Pedro", "MARIA DE LA CRUZ" -> "Maria De La Cruz".
export function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-záéíóúüñ])/g, (_m, sep, ch) => sep + ch.toUpperCase());
}

// Teléfono Bolivia: solo dígitos, máximo 8.
export const PHONE_PREFIX = '+591';
export const PHONE_LENGTH = 8;

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_LENGTH);
}

export function isValidPhone(value: string): boolean {
  const v = value.trim();
  return v.length === 0 || new RegExp(`^\\d{${PHONE_LENGTH}}$`).test(v);
}
