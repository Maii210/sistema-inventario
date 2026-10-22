import { useEffect, useState } from 'react';
import { Loader2, LockOpen, Lock, Wallet } from 'lucide-react';
import { cashApi, CashSession } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/supabase';

const METHOD_LABELS: Record<string, string> = { efectivo: 'Efectivo (caja)', qr: 'QR' };
const METHOD_ORDER = ['efectivo', 'qr'];

export function Cash() {
  const { profile, user } = useAuth();
  const { show } = useToast();
  const isVendor = profile?.role === 'vendedor';
  const [session, setSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState('');
  const [counted, setCounted] = useState('');
  const [qrCounted, setQrCounted] = useState('');
  const [leftInCash, setLeftInCash] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const [cur, hist] = await Promise.all([
      cashApi.current().catch(() => null),
      cashApi.history().catch(() => []),
    ]);
    setSession(cur);
    const last = (hist as CashSession[]).find((h) => h.status === 'closed') ?? null;
    // Al no haber caja abierta, se precarga el monto dejado en la caja anterior (editable).
    if (!cur && last) setOpening(String(last.leftInCash ?? last.countedAmount ?? ''));
    if (!silent) setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCash = async () => {
    setBusy(true);
    try {
      await cashApi.open({ openingAmount: parseFloat(opening) || 0, openedById: user?.id, openedByName: profile?.full_name });
      show('Caja abierta');
      setOpening('');
      load(true);
    } catch (e: any) { show(e.message || 'Error al abrir caja', 'error'); }
    setBusy(false);
  };

  const closeCash = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const expQr = session.totals?.byMethod?.['qr'] ?? 0;
      await cashApi.close(session.id, {
        // Efectivo total contado = lo contado + lo que se deja en caja.
        countedAmount: (parseFloat(counted) || 0) + (parseFloat(leftInCash) || 0),
        qrCounted: qrCounted !== '' ? (parseFloat(qrCounted) || 0) : expQr,
        expectedCashManual: session.expectedCash ?? 0,
        expectedQrManual: session.totals?.byMethod?.['qr'] ?? 0,
        leftInCash: parseFloat(leftInCash) || 0,
        closedById: user?.id, closedByName: profile?.full_name, notes,
      });
      show('Caja cerrada');
      setCounted(''); setQrCounted(''); setLeftInCash(''); setNotes('');
      load(true);
    } catch (e: any) { show(e.message || 'Error al cerrar caja', 'error'); }
    setBusy(false);
  };

  const expected = session?.expectedCash ?? 0;
  const expectedQr = session?.totals?.byMethod?.['qr'] ?? 0;
  const num = (v: string) => parseFloat(v) || 0;
  // El efectivo cuadra si: lo contado + lo que se deja en caja = lo esperado.
  const efectivoDiff = (counted !== '' || leftInCash !== '') ? (num(counted) + num(leftInCash)) - expected : null;
  const qrDiff = qrCounted !== '' ? num(qrCounted) - expectedQr : null;
  const totalDiscount = session?.totals?.discount ?? 0;
  const myDiscount = session?.totals?.discountsBySeller?.find((d) => d.sellerId === user?.id)?.discount ?? 0;
  const netSales = session?.totals?.total ?? 0;        // ventas ya con el descuento restado
  const grossSales = netSales + totalDiscount;          // ventas antes del descuento
  const expectedEfectivo = session?.totals?.byMethod?.['efectivo'] ?? 0;

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
        isVendor ? (
          <div className="card p-6 max-w-md space-y-2">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200"><Lock size={20} className="text-primary-500" /><h2 className="font-semibold">Caja cerrada</h2></div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay una caja abierta. Pídele a un administrador que la abra para comenzar el turno.</p>
          </div>
        ) : (
          <div className="card p-6 max-w-md space-y-4">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200"><LockOpen size={20} className="text-primary-500" /><h2 className="font-semibold">Abrir caja</h2></div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay una caja abierta. Ingresa el monto inicial en efectivo para comenzar el turno.</p>
            <div>
              <label className="label">Monto inicial (Bs)</label>
              <input type="number" min="0" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} className="input" placeholder="0.00" />
            </div>
            <button onClick={openCash} disabled={busy} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <LockOpen size={16} />} Abrir caja</button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumen de la sesión abierta */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={stat}><div className="text-sm text-neutral-400">Fecha de apertura</div><div className="text-base font-bold text-neutral-800 dark:text-neutral-100">{formatDate(session.openedAt)}</div><div className="text-xs text-neutral-400">{formatDateTime(session.openedAt)}</div></div>
              <div className={stat}><div className="text-sm text-neutral-400">Monto inicial</div><div className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(session.openingAmount)}</div></div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3"><Wallet size={18} className="text-primary-500" /><h2 className="font-semibold text-neutral-800 dark:text-neutral-100">Resumen del turno</h2></div>

              {/* Brutas - descuentos = netas (la resta a la vista) */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Ventas brutas</span>
                  <span className="text-neutral-800 dark:text-neutral-100">{formatCurrency(grossSales)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Descuentos</span>
                  <span className="text-success-600 font-medium">- {formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-neutral-100 dark:border-neutral-800 font-semibold">
                  <span className="text-neutral-700 dark:text-neutral-200">Ventas netas</span>
                  <span className="text-neutral-800 dark:text-neutral-100">{formatCurrency(netSales)}</span>
                </div>
              </div>

              {/* Desglose por método (ya neto) */}
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Cobrado por método</p>
                {METHOD_ORDER.map((m) => (
                  <div key={m} className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">{METHOD_LABELS[m]}</span>
                    <span className="text-neutral-800 dark:text-neutral-100 font-medium">{formatCurrency(session.totals?.byMethod?.[m] ?? 0)}</span>
                  </div>
                ))}
              </div>

              {/* Efectivo esperado = inicial + efectivo cobrado */}
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-end">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm">Efectivo esperado en caja</span>
                  <p className="text-xs text-neutral-400">Monto inicial ({formatCurrency(session.openingAmount)}) + efectivo cobrado ({formatCurrency(expectedEfectivo)})</p>
                </div>
                <span className="text-primary-600 dark:text-primary-400 font-bold text-lg">{formatCurrency(expected)}</span>
              </div>

              {isVendor && <p className="text-xs text-neutral-400 mt-3">Tus descuentos en este turno: <span className="text-success-600 font-medium">{formatCurrency(myDiscount)}</span></p>}
              <p className="text-xs text-neutral-400 mt-3">Abierta: {formatDateTime(session.openedAt)}{session.openedByName ? ` · ${session.openedByName}` : ''}</p>
            </div>
          </div>

          {/* Cierre / arqueo */}
          {isVendor ? (
            <div className="card p-6 space-y-3 self-start">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200"><Lock size={20} className="text-primary-500" /><h2 className="font-semibold">Resumen del turno</h2></div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Efectivo esperado en caja</span>
                <span className="text-primary-600 dark:text-primary-400 font-bold">{formatCurrency(expected)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Tus descuentos en este turno</span>
                <span className="text-success-600 font-medium">{formatCurrency(myDiscount)}</span>
              </div>
              <p className="text-xs text-neutral-400">El cierre de caja (arqueo) lo realiza un administrador.</p>
            </div>
          ) : (
            <div className="card p-6 space-y-4 self-start">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200"><Lock size={20} className="text-primary-500" /><h2 className="font-semibold">Cerrar caja (arqueo)</h2></div>

              {/* Descuentos del turno */}
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/40 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Descuentos del turno</span>
                  <span className="text-success-600 font-medium">-{formatCurrency(totalDiscount)}</span>
                </div>
              </div>

              {/* Descuentos por vendedora */}
              {(session.totals?.discountsBySeller?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">Descuentos por vendedora</p>
                  <div className="space-y-1">
                    {session.totals?.discountsBySeller.filter((d) => d.discount > 0).map((d) => (
                      <div key={d.sellerId ?? d.sellerName} className="flex justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">{d.sellerName}</span>
                        <span className="text-neutral-700 dark:text-neutral-200">{formatCurrency(d.discount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Efectivo: esperado (lectura) vs contado (editable) */}
              <div className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Efectivo</p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Esperado (Bs)</span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold">{formatCurrency(expected)}</span>
                </div>
                <div>
                  <label className="label">Contado (Bs)</label>
                  <input type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} className="input" placeholder="0.00" />
                </div>
                {efectivoDiff !== null && (
                  <div className={`text-sm font-medium ${Math.abs(efectivoDiff) < 0.01 ? 'text-success-600' : efectivoDiff > 0 ? 'text-warning-600' : 'text-error-600'}`}>
                    {Math.abs(efectivoDiff) < 0.01 ? 'Cuadra ✓' : `Diferencia: ${formatCurrency(efectivoDiff)} (${efectivoDiff > 0 ? 'sobrante' : 'faltante'})`}
                  </div>
                )}
                <p className="text-[11px] text-neutral-400">Cuadra si contado + lo que se deja en caja = esperado.</p>
              </div>

              {/* QR: esperado (lectura) vs contado (editable) */}
              <div className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">QR</p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Esperado (Bs)</span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold">{formatCurrency(expectedQr)}</span>
                </div>
                <div>
                  <label className="label">Contado (Bs)</label>
                  <input type="number" min="0" step="0.01" value={qrCounted} onChange={(e) => setQrCounted(e.target.value)} className="input" placeholder="0.00" />
                </div>
                {qrDiff !== null && (
                  <div className={`text-sm font-medium ${Math.abs(qrDiff) < 0.01 ? 'text-success-600' : qrDiff > 0 ? 'text-warning-600' : 'text-error-600'}`}>
                    {Math.abs(qrDiff) < 0.01 ? 'Cuadra ✓' : `Diferencia: ${formatCurrency(qrDiff)} (${qrDiff > 0 ? 'sobrante' : 'faltante'})`}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Monto que se deja en caja (efectivo, Bs)</label>
                <input type="number" min="0" step="0.01" value={leftInCash} onChange={(e) => setLeftInCash(e.target.value)} className="input" placeholder="0.00" />
                <p className="text-xs text-neutral-400 mt-1">Este monto será el monto inicial al abrir la caja del día siguiente.</p>
              </div>

              <div>
                <label className="label">Notas (opcional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[70px] resize-none" placeholder="Observaciones del cierre" />
              </div>
              <p className="text-xs text-neutral-400">Cierra: {profile?.full_name || 'Administrador'}</p>
              <button onClick={closeCash} disabled={busy} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Cerrar caja</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
