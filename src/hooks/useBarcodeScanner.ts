import { useEffect, useRef } from 'react';

interface Options {
  /** Si está desactivado, no escucha teclas. */
  enabled?: boolean;
  /** Largo mínimo del código para considerarlo válido (evita disparos accidentales). */
  minLength?: number;
  /** Separación máxima (ms) entre teclas para seguir siendo la misma lectura. */
  maxGap?: number;
}

/**
 * Detecta lectores de código de barras USB, que funcionan como un teclado:
 * teclean los dígitos muy rápido y terminan con Enter. Captura esa secuencia
 * a nivel global y llama a onScan(code) sin necesidad de enfocar ningún campo.
 *
 * Ignora las pulsaciones cuando el foco está en un campo editable (input,
 * textarea, select) para no interferir con la escritura manual.
 */
export function useBarcodeScanner(onScan: (code: string) => void, opts: Options = {}) {
  const { enabled = true, minLength = 4, maxGap = 60 } = opts;
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!target?.isContentEditable;
      if (editable) { bufferRef.current = ''; return; }

      const now = Date.now();
      // Si pasó demasiado tiempo desde la última tecla, es una lectura nueva.
      if (now - lastTimeRef.current > maxGap) bufferRef.current = '';
      lastTimeRef.current = now;

      if (e.key === 'Enter') {
        const code = bufferRef.current;
        bufferRef.current = '';
        if (code.length >= minLength) { e.preventDefault(); onScanRef.current(code); }
        return;
      }
      // Solo caracteres imprimibles (dígitos/letras); ignora Shift, Ctrl, flechas, etc.
      if (e.key.length === 1) bufferRef.current += e.key;
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, minLength, maxGap]);
}
