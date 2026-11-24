import { useState } from 'react';
import { ScanLine, Minus, Plus, Check } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useToast } from '@/components/ui/Toast';

interface Props {
  /** Código esperado; si se pasa, solo cuenta lecturas de ese código. */
  expectedCode?: string | null;
  onFinish: (count: number, code: string) => void;
  onCancel: () => void;
}

/**
 * Cuenta unidades de un lote escaneándolas una por una: cada lectura suma +1.
 * Como todas las unidades del mismo producto comparten el mismo código, la
 * primera lectura fija el código y las siguientes deben coincidir.
 */
export function ScanCounter({ expectedCode, onFinish, onCancel }: Props) {
  const { show } = useToast();
  const [count, setCount] = useState(0);
  const [code, setCode] = useState(expectedCode || '');

  useBarcodeScanner((scanned) => {
    const current = code || expectedCode || '';
    if (!current) { setCode(scanned); setCount((c) => c + 1); return; }
    if (scanned !== current) { show(`Código distinto (${scanned}); se esperaba ${current}`, 'error'); return; }
    setCount((c) => c + 1);
  });

  return (
    <div className="rounded-lg border-2 border-primary-400/60 bg-primary-50/50 dark:bg-primary-900/10 p-3 space-y-3">
      <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300">
        <ScanLine size={18} className="animate-pulse" />
        <p className="text-sm font-semibold">Escanea cada unidad…</p>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={() => setCount((c) => Math.max(0, c - 1))} className="btn-secondary px-3"><Minus size={16} /></button>
        <span className="text-3xl font-bold tabular-nums text-neutral-800 dark:text-neutral-100 w-16 text-center">{count}</span>
        <button type="button" onClick={() => setCount((c) => c + 1)} className="btn-secondary px-3"><Plus size={16} /></button>
      </div>
      {code && <p className="text-center text-xs text-neutral-400 font-mono">Código: {code}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="button" onClick={() => onFinish(count, code)} className="btn-primary flex-1"><Check size={16} /> Listo ({count})</button>
      </div>
    </div>
  );
}
