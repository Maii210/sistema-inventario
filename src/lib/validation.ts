// Nombres: solo letras, espacios y acentos.
export function soloLetras(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
}

// Teléfonos/celulares: solo dígitos.
export function soloDigitos(value: string): string {
  return value.replace(/\D/g, '');
}
