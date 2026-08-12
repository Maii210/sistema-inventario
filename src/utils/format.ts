// Formato de números y moneda para Bolivia (separador de miles con punto,
// decimales con coma). Ej: 70550 -> "70.550", 1234.5 -> "1.234,5".

const nf = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 });

export function formatNumber(value: number | undefined | null): string {
  return nf.format(Number(value) || 0);
}

export function formatBOB(value: number | undefined | null): string {
  return `${formatNumber(value)} BOB`;
}
