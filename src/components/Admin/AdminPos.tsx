import React from 'react';
import { Zap, Plus, Minus, Trash2, Search, Check, Package } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Order, PaymentMethod } from '../../types';
import { AdminModuleHeader } from './AdminModuleHeader';
import { formatBOB } from '../../utils/format';
import { exportOrderInvoicePdf } from '../../utils/pdf';

type Line = { productId: string; name: string; price: number; quantity: number };

const paymentOptions: { id: PaymentMethod; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'qr', label: 'QR' },
  { id: 'transfer', label: 'Transferencia' },
  { id: 'card', label: 'Tarjeta' }
];

export function AdminPos() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = React.useState('');
  const [lines, setLines] = React.useState<Line[]>([]);
  const [customerId, setCustomerId] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('efectivo');
  const [includeIva, setIncludeIva] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const catalog = state.products.filter(
    p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(query.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode ?? '').includes(query.trim())
  );

  const qtyInTicket = (id: string) => lines.find(l => l.productId === id)?.quantity ?? 0;
  const remaining = (id: string) => {
    const p = state.products.find(x => x.id === id);
    return (p?.stock ?? 0) - qtyInTicket(id);
  };

  const addLine = (id: string) => {
    const p = state.products.find(x => x.id === id);
    if (!p || remaining(id) <= 0) return;
    setFeedback(null);
    setLines(prev => {
      const found = prev.find(l => l.productId === id);
      if (found) return prev.map(l => (l.productId === id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId: id, name: p.name, price: p.price, quantity: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setLines(prev =>
      prev
        .map(l => {
          if (l.productId !== id) return l;
          const p = state.products.find(x => x.id === id);
          const max = p?.stock ?? 0;
          const next = Math.min(Math.max(1, l.quantity + delta), max);
          return { ...l, quantity: next };
        })
        .filter(l => l.quantity > 0)
    );
  };

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.productId !== id));

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const total = subtotal;
  const iva = includeIva ? total - total / 1.13 : 0;

  const register = () => {
    if (lines.length === 0) return;
    const customer = state.users.find(u => u.id === customerId);
    const order: Order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer: {
        name: customer?.name || 'Consumidor final',
        email: customer?.email || '',
        phone: customer?.phone || ''
      },
      items: lines.map(l => ({ productId: l.productId, name: l.name, price: l.price, quantity: l.quantity })),
      subtotal,
      total,
      paymentMethod
    };
    dispatch({ type: 'REGISTER_SALE', payload: { order } });
    exportOrderInvoicePdf(order, { includeIva });
    setLines([]);
    setCustomerId('');
    setFeedback(`Venta registrada (#${order.id}) por ${formatBOB(total)}. Se descontó el stock y se generó el comprobante.`);
  };

  const cardCls = 'bg-white rounded-2xl shadow-lg p-6';

  return (
    <div>
      <AdminModuleHeader
        title="Venta rápida"
        subtitle="Registra ventas en la tienda: agrega productos, cobra y genera el comprobante"
        icon={Zap}
      />

      {feedback && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3">
          <Check className="h-5 w-5" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Catálogo */}
        <div className={cardCls}>
          <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Productos</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20"
              placeholder="Buscar por nombre, categoría o código de barras..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
            {catalog.map(p => {
              const rem = remaining(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-lg bg-essence-navy/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-essence-navy/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-essence-navy truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">{formatBOB(p.price)} · Disponible: {rem}</div>
                  </div>
                  <button
                    onClick={() => addLine(p.id)}
                    disabled={rem <= 0}
                    className="inline-flex items-center gap-1 bg-essence-purple text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-essence-plum disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    {rem <= 0 ? 'Sin stock' : 'Agregar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ticket */}
        <div className={cardCls}>
          <h3 className="font-playfair text-xl font-semibold text-essence-navy mb-4">Ticket de venta</h3>

          {lines.length === 0 ? (
            <p className="text-gray-500 mb-4">Agrega productos desde la izquierda.</p>
          ) : (
            <div className="divide-y divide-gray-100 mb-4">
              {lines.map(l => (
                <div key={l.productId} className="flex items-center gap-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-essence-navy truncate">{l.name}</div>
                    <div className="text-xs text-gray-500">{formatBOB(l.price)} c/u</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(l.productId, -1)} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center">{l.quantity}</span>
                    <button onClick={() => changeQty(l.productId, 1)} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><Plus className="h-4 w-4" /></button>
                  </div>
                  <div className="w-24 text-right font-medium">{formatBOB(l.price * l.quantity)}</div>
                  <button onClick={() => removeLine(l.productId)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t pt-4">
            <label className="block">
              <span className="block text-sm font-medium text-essence-navy mb-1">Cliente (opcional)</span>
              <select className="w-full border border-gray-200 rounded-lg px-4 py-2" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Consumidor final</option>
                {state.users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </label>

            <div>
              <span className="block text-sm font-medium text-essence-navy mb-1">Método de pago</span>
              <div className="flex flex-wrap gap-2">
                {paymentOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${paymentMethod === opt.id ? 'bg-essence-purple text-white border-essence-purple' : 'bg-white text-essence-navy border-gray-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={includeIva} onChange={e => setIncludeIva(e.target.checked)} />
              <span>Habilitar IVA (13%) en el comprobante</span>
            </label>

            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatBOB(subtotal)}</span></div>
              {includeIva && <div className="flex justify-between text-gray-600"><span>IVA (13%) incluido</span><span>{formatBOB(iva)}</span></div>}
              <div className="flex justify-between text-lg font-bold text-essence-navy"><span>Total</span><span>{formatBOB(total)}</span></div>
            </div>

            <button
              onClick={register}
              disabled={lines.length === 0}
              className="w-full bg-gradient-to-r from-essence-coral to-essence-rose text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Registrar venta y generar comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
