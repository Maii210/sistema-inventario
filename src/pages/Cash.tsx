import { useEffect, useState } from 'react';
import { Loader2, LockOpen, Lock, Wallet } from 'lucide-react';
import { cashApi, CashSession } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDateTime } from '@/lib/supabase';

const METHOD_LABELS: Record<string, string> = { efectivo: 'Efectivo', qr: 'QR', transfer: 'Transferencia', card: 'Tarjeta' };

export function Cash() {
  const { profile, user } = useAuth();
  const { show } = useToast();
  const [session, setSession] = useState<CashSession | null>(null);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState('');
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [cur, h] = await Promise.all([cashApi.current().catch(() => null), cashApi.history().catch(() => [])]);
    setSession(cur);
    setHistory(h);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCash = async () => {
    setBusy(true);
    try {
      await cashApi.open({ openingAmount: parseFloat(opening) || 0, openedById: user?.id, openedByName: profile?.full_name });
      show('Caja abierta');
      setOpening('');
      load();
    } catch (e: any) { show(e.message || 'Error al abrir caja', 'error'); }
    setBusy(false);
  };

  const closeCash = async () => {
    if (!session) return;
    setBusy(true);
    try {
      await cashApi.close(session.id, { countedAmount: parseFloat(counted) || 0, closedById: user?.id, closedByName: profile?.full_name, notes });
      show('Caja cerrada');
      setCounted(''); setNotes('');
      load();
    } catch (e: any) { show(e.message || 'Error al cerrar caja', 'error'); }
    setBusy(false);
  };

  const expected = session?.expectedCash ?? 0;
  const diff = counted !== '' ? (parseFloat(counted) || 0) - expected : null;

  const stat = 'card p-4';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Caja</h1>
        <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Apertura, cierre y arqueo de caja</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
      ) : !session ? (
        <div className="card p-6 max-w-md space-y-4">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200"><LockOpen size={20} className="text-primary-500" /><h2 className="font-semibold">Abrir caja</h2></div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay una caja abierta. Ingresa el monto inicial en efectivo para comenzar el turno.</p>
          <div>
            <label className="label">Monto inicial (Bs)</label>
            <input type="number" min="0" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} className="input" placeholder="0.00" />
          </div>
          <button onClick={openCash} disabled={busy} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <LockOpen size={16} />} Abrir caja</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumen de la sesión abierta */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={stat}><div className="text-sm text-neutral-400">Monto inicial</div><div className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(session.openingAmount)}</div></div>
              <div className={stat}><div className="text-sm text-neutral-400">Ventas del turno</div><div className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(session.totals?.total ?? 0)}</div></div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3"><Wallet size={18} className="text-primary-500" /><h2 className="font-semibold text-neutral-800 dark:text-neutral-100">Ventas por método</h2></div>
              <div className="space-y-2">
                {Object.keys(METHOD_LABELS).map((m) => (
                  <div key={m} className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">{METHOD_LABELS[m]}</span>
                    <span className="text-neutral-800 dark:text-neutral-100 font-medium">{formatCurrency(session.totals?.byMethod?.[m] ?? 0)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Efectivo esperado en caja</span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold">{formatCurrency(expected)}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-3">Abierta: {formatDateTime(session.openedAt)}{session.openedByName ? ` · ${session.openedByName}` : ''}</p>
            </div>
          </div>

          {/* Cierre / arqueo */}
          <div className="card p-6 space-y-4 self-start">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200"><Lock size={20} className="text-primary-500" /><h2 className="font-semibold">Cerrar caja (arqueo)</h2></div>
            <div>
              <label className="label">Efectivo contado (Bs)</label>
              <input type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} className="input" placeholder="0.00" />
            </div>
            {diff !== null && (
              <div className={`text-sm font-medium ${Math.abs(diff) < 0.01 ? 'text-success-600' : diff > 0 ? 'text-warning-600' : 'text-error-600'}`}>
                {Math.abs(diff) < 0.01 ? 'Cuadra exactamente ✓' : `Diferencia: ${formatCurrency(diff)} (${diff > 0 ? 'sobrante' : 'faltante'})`}
              </div>
            )}
            <div>
              <label className="label">Notas (opcional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[70px] resize-none" placeholder="Observaciones del cierre" />
            </div>
            <button onClick={closeCash} disabled={busy || counted === ''} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Cerrar caja</button>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="card p-4">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">Historial de cajas</h2>
        {history.filter((h) => h.status === 'closed').length === 0 ? (
          <p className="text-sm text-neutral-400">Aún no hay cierres registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="text-left text-neutral-400">
                <tr><th className="py-2 pr-4">Apertura</th><th className="py-2 pr-4">Cierre</th><th className="py-2 pr-4">Inicial</th><th className="py-2 pr-4">Contado</th><th className="py-2 pr-4">Responsable</th></tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {history.filter((h) => h.status === 'closed').map((h) => (
                  <tr key={h.id}>
                    <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-300">{formatDateTime(h.openedAt)}</td>
                    <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-300">{h.closedAt ? formatDateTime(h.closedAt) : '—'}</td>
                    <td className="py-2 pr-4">{formatCurrency(h.openingAmount)}</td>
                    <td className="py-2 pr-4">{h.countedAmount != null ? formatCurrency(h.countedAmount) : '—'}</td>
                    <td className="py-2 pr-4 text-neutral-500">{h.closedByName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
