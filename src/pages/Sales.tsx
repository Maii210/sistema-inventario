import { useEffect, useState, useCallback, useRef } from 'react';
import { ScanLine, Search, Plus, Minus, Trash2, ShoppingCart, X, Loader2, Receipt, Printer, CheckCircle, User as UserIcon, Camera, MessageCircle, FileDown, PackagePlus, LayoutGrid, List } from 'lucide-react';
import { supabase, Product, Client, Profile, Sale, PaymentMethod, formatCurrency, formatDateTime } from '@/lib/supabase';
import { settingsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import jsPDF from 'jspdf';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountAmt: number;
  isExternal?: boolean;
  externalCost?: number;
}

export function Sales() {
  const { profile, user } = useAuth();
  const { show } = useToast();
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try { return (localStorage.getItem('camila_sales_view') as 'cards' | 'table') || 'cards'; } catch { return 'cards'; }
  });
  useEffect(() => { try { localStorage.setItem('camila_sales_view', viewMode); } catch { /* ignore */ } }, [viewMode]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [extModalOpen, setExtModalOpen] = useState(false);
  const [extForm, setExtForm] = useState({ name: '', cost: '', price: '', qty: '1' });
  const [bankQr, setBankQr] = useState('');
  const [bankQrOpen, setBankQrOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    settingsApi.get('bank_qr').then((s) => setBankQr(s?.value || '')).catch(() => setBankQr(''));
  }, []);

  const addExternalItem = () => {
    const name = extForm.name.trim();
    const price = parseFloat(extForm.price) || 0;
    const cost = parseFloat(extForm.cost) || 0;
    const qty = Math.max(parseInt(extForm.qty) || 1, 1);
    if (!name || price <= 0) { show('Completa nombre y precio de venta', 'error'); return; }
    // Producto sintético para reutilizar la lógica del carrito (no afecta inventario).
    const synthetic: Product = {
      id: `ext-${Date.now()}`, name, barcode: null, category: '', brand: 'Prestado', description: null,
      cost_price: cost, sale_price: price, stock: 999999, min_stock: 0, supplier_id: null,
      image_url: null, use: null, expiry_date: null, active: true, created_at: '', updated_at: '',
    };
    setCart((prev) => [...prev, { product: synthetic, quantity: qty, unitPrice: price, discountAmt: 0, isExternal: true, externalCost: cost }]);
    setExtForm({ name: '', cost: '', price: '', qty: '1' });
    setExtModalOpen(false);
  };

  const loadData = async () => {
    setLoading(true);
    const [prodRes, clientRes, sellerRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('users').select('*').order('full_name'),
    ]);
    setProducts((prodRes.data as Product[]) ?? []);
    setClients((clientRes.data as Client[]) ?? []);
    const activeSellers = ((sellerRes.data as Profile[]) ?? []).filter((s) => s.active);
    setSellers(activeSellers);
    // Por defecto, la vendedora es el usuario que inició sesión.
    setSelectedSeller((prev) => prev || user?.id || '');
    setLoading(false);
  };

  const filteredProducts = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.brand?.toLowerCase().includes(search.toLowerCase()));

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { show(`Solo hay ${product.stock} unidades`, 'error'); return prev; }
        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock === 0) { show('Sin stock', 'error'); return prev; }
      return [...prev, { product, quantity: 1, unitPrice: Number(product.sale_price), discountAmt: 0 }];
    });
  }, [show]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty > item.product.stock) { show(`Solo hay ${item.product.stock} unidades`, 'error'); return item; }
      return { ...item, quantity: newQty };
    }).filter((item) => item.quantity > 0));
  };

  const setQuantity = (productId: string, qty: number) => {
    setCart((prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity: Math.min(Math.max(qty, 1), item.product.stock) } : item));
  };

  const updatePrice = (productId: string, price: number) => {
    setCart((prev) => prev.map((item) => item.product.id === productId ? { ...item, unitPrice: price } : item));
  };

  const updateItemDiscount = (productId: string, amt: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id !== productId) return item;
      return { ...item, discountAmt: Math.min(Math.max(amt, 0), item.unitPrice * item.quantity) };
    }));
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((item) => item.product.id !== productId));

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discountAmt, 0);
  const globalDiscountAmt = globalDiscount;
  const totalDiscount = itemDiscounts + globalDiscountAmt;
  const total = Math.max(subtotal - totalDiscount, 0);

  const handleScan = (code: string) => {
    const product = products.find((p) => p.barcode === code);
    if (product) { addToCart(product); show(`Añadido: ${product.name}`); } else { show(`No encontrado: ${code}`, 'error'); }
    setScannerOpen(false);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const completeSale = async () => {
    if (cart.length === 0) { show('El carrito está vacío', 'error'); return; }
    setCompleting(true);

    // Los ítems van en línea: el backend persiste la venta + ítems y descuenta
    // el stock de los productos propios (no de los prestados/externos).
    const items = cart.map((item) => ({
      product_id: item.isExternal ? null : item.product.id,
      product_name: item.product.name,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      discount: item.discountAmt,
      is_external: item.isExternal || false,
      external_cost: item.externalCost ?? null,
    }));

    const salePayload = {
      client_id: selectedClient || null, seller_id: selectedSeller || user?.id || null,
      subtotal, discount: totalDiscount, tax: 0, total,
      payment_method: paymentMethod, payment_reference: paymentMethod === 'QR' ? 'QR adjuntado' : null,
      payment_image_url: qrImage || null,
      status: 'completada' as const, notes: notes || null,
      items,
    };

    const { data: saleData, error: saleError } = await supabase.from('sales').insert(salePayload).select().single();
    if (saleError) { show(saleError.message, 'error'); setCompleting(false); return; }

    const { data: fullSale } = await supabase.from('sales').select('*, client:clients(*), seller:profiles(*), sale_items(*)').eq('id', saleData.id).single();
    setLastSale(fullSale as Sale);
    setReceiptOpen(true);
    setCart([]); setSelectedClient(''); setGlobalDiscount(0); setNotes(''); setQrImage('');
    loadData();
    show('Venta completada');
    setCompleting(false);
  };

  const loadRecentSales = async () => {
    const { data } = await supabase.from('sales').select('*, client:clients(*), seller:profiles(*)').order('created_at', { ascending: false }).limit(10);
    setRecentSales((data as Sale[]) ?? []);
  };

  const generatePDF = (sale: Sale) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
    let y = 10;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Comercial Camila', 40, y, { align: 'center' }); y += 5;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('Belleza & Cuidado Personal', 40, y, { align: 'center' }); y += 8;
    doc.setFontSize(7);
    doc.text(`Factura: ${sale.invoice_number.slice(0, 8).toUpperCase()}`, 5, y); y += 4;
    doc.text(`Fecha: ${formatDateTime(sale.created_at)}`, 5, y); y += 4;
    doc.text(`Cliente: ${sale.client?.name ?? 'General'}`, 5, y); y += 4;
    doc.text(`Pago: ${sale.payment_method}`, 5, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.line(5, y, 75, y); y += 4;
    doc.setFontSize(6);
    doc.text('Producto', 5, y); doc.text('Cant', 50, y); doc.text('Subtotal', 60, y); y += 4;
    doc.setFont('helvetica', 'normal');
    sale.sale_items?.forEach((item) => {
      doc.setFontSize(6);
      const name = item.product_name.length > 18 ? item.product_name.slice(0, 18) + '...' : item.product_name;
      doc.text(name, 5, y); doc.text(String(item.quantity), 52, y); doc.text(formatCurrency(Number(item.subtotal)), 60, y); y += 4;
    });
    y += 2; doc.line(5, y, 75, y); y += 5;
    doc.setFontSize(7);
    doc.text(`Subtotal: ${formatCurrency(Number(sale.subtotal))}`, 5, y); y += 4;
    if (Number(sale.discount) > 0) { doc.text(`Descuento: -${formatCurrency(Number(sale.discount))}`, 5, y); y += 4; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(`TOTAL: ${formatCurrency(Number(sale.total))}`, 5, y); y += 6;
    doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });
    doc.save(`recibo-${sale.invoice_number.slice(0, 8)}.pdf`);
  };

  const sendWhatsApp = (sale: Sale) => {
    const phone = sale.client?.phone;
    if (!phone) { show('El cliente no tiene teléfono registrado', 'error'); return; }
    let msg = `*Comercial Camila*\nFactura: ${sale.invoice_number.slice(0, 8).toUpperCase()}\nFecha: ${formatDateTime(sale.created_at)}\n`;
    msg += `Cliente: ${sale.client?.name ?? 'General'}\n\n`;
    sale.sale_items?.forEach((item) => { msg += `${item.product_name} x${item.quantity} = ${formatCurrency(Number(item.subtotal))}\n`; });
    msg += `\n*Total: ${formatCurrency(Number(sale.total))}*\n¡Gracias por su compra!`;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Punto de Venta</h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Escanea o busca productos para iniciar una venta</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setExtModalOpen(true)} className="btn-secondary"><PackagePlus size={18} /> Prestado</button>
          <button onClick={() => { loadRecentSales(); setHistoryOpen(true); }} className="btn-secondary"><Receipt size={18} /> Historial</button>
          <button onClick={() => setScannerOpen(true)} className="btn-primary"><ScanLine size={18} /> Escanear</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto por nombre, marca o código..." className="input pl-11" autoFocus />
              </div>
              <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shrink-0">
                <button type="button" onClick={() => setViewMode('cards')} title="Tarjetas" className={`px-3 ${viewMode === 'cards' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'text-neutral-400 hover:text-neutral-600'}`}><LayoutGrid size={18} /></button>
                <button type="button" onClick={() => setViewMode('table')} title="Tabla" className={`px-3 ${viewMode === 'table' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'text-neutral-400 hover:text-neutral-600'}`}><List size={18} /></button>
              </div>
            </div>
          </div>
          <div className="card p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-sm">{search ? 'No se encontraron productos' : 'No hay productos'}</div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((product) => {
                  const out = product.stock === 0;
                  return (
                    <button key={product.id} onClick={() => addToCart(product)} disabled={out}
                      className={`p-3 rounded-xl border text-left transition-all ${out ? 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 opacity-50 cursor-not-allowed' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 active:scale-[0.97]'}`}>
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover mb-2" /> : <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/40 dark:to-secondary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-2"><ShoppingCart size={18} /></div>}
                      <p className="text-xs font-medium text-neutral-800 dark:text-neutral-100 line-clamp-2 leading-tight mb-1">{product.name}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{product.brand}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.sale_price)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${out ? 'bg-error-100 text-error-600' : product.stock <= product.min_stock ? 'bg-error-100 text-error-600' : 'bg-success-100 text-success-600'}`}>{product.stock}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-neutral-400">
                  <tr><th className="py-2 pr-2">Producto</th><th className="py-2 pr-2">Precio</th><th className="py-2 pr-2">Stock</th><th className="py-2"></th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredProducts.map((product) => {
                    const out = product.stock === 0;
                    return (
                      <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="py-2 pr-2">
                          <p className="font-medium text-neutral-800 dark:text-neutral-100">{product.name}</p>
                          <p className="text-xs text-neutral-400">{product.brand}</p>
                        </td>
                        <td className="py-2 pr-2 font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(product.sale_price)}</td>
                        <td className="py-2 pr-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${out ? 'bg-error-100 text-error-600' : product.stock <= product.min_stock ? 'bg-error-100 text-error-600' : 'bg-success-100 text-success-600'}`}>{product.stock}</span>
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => addToCart(product)} disabled={out} className="btn-primary px-2 py-1 text-xs disabled:opacity-40"><Plus size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-4 flex flex-col max-h-[calc(100vh-120px)]">
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-primary-600 dark:text-primary-400" />
                <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">Carrito</h2>
                <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">{cart.length}</span>
              </div>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-neutral-400 hover:text-error-600">Vaciar</button>}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="py-12 text-center"><ShoppingCart size={36} className="mx-auto text-neutral-200 dark:text-neutral-700 mb-2" /><p className="text-sm text-neutral-400 dark:text-neutral-500">Carrito vacío</p></div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-neutral-200 dark:hover:border-neutral-700 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">
                          {item.product.name}
                          {item.isExternal && <span className="ml-1.5 badge bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">Prestado</span>}
                        </p>
                        {item.isExternal && (item.externalCost ?? 0) > 0 && (
                          <p className="text-[10px] text-success-600 dark:text-success-400">Ganancia: {formatCurrency((item.unitPrice - (item.externalCost ?? 0)) * item.quantity)}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <input type="number" value={item.unitPrice} onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary-400" step="0.01" />
                          <span className="text-xs text-neutral-400">c/u</span>
                          <input type="number" value={item.discountAmt} onChange={(e) => updateItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-1 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary-400" min="0" placeholder="0" />
                          <span className="text-[10px] text-neutral-400">dto Bs</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 rounded-md hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"><Minus size={14} /></button>
                          <input type="number" value={item.quantity} onChange={(e) => setQuantity(item.product.id, parseInt(e.target.value) || 1)} className="w-8 text-center text-sm bg-transparent text-neutral-800 dark:text-neutral-100 focus:outline-none" />
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 rounded-md hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"><Plus size={14} /></button>
                        </div>
                        {item.discountAmt > 0 && <p className="text-[10px] text-success-600">-{formatCurrency(item.discountAmt)}</p>}
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(item.unitPrice * item.quantity - item.discountAmt)}</p>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-xs text-neutral-300 hover:text-error-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Cliente (opcional)</label>
                    <div className="relative">
                      <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="select pl-9 py-2 text-sm">
                        <option value="">Cliente general</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.name} {c.last_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Vendedora</label>
                    <div className="relative">
                      <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <select value={selectedSeller} onChange={(e) => setSelectedSeller(e.target.value)} className="select pl-9 py-2 text-sm">
                        <option value="">Sin asignar</option>
                        {sellers.map((s) => <option key={s.id} value={s.id}>{s.full_name} {s.last_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Método de pago</label>
                      <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value as PaymentMethod); setQrImage(''); }} className="select py-2 text-sm">
                        <option value="Efectivo">Efectivo</option>
                        <option value="QR">QR</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Descuento global (Bs)</label>
                      <input type="number" min="0" value={globalDiscount} onChange={(e) => setGlobalDiscount(Math.max(parseFloat(e.target.value) || 0, 0))} className="input py-2 text-sm" />
                    </div>
                  </div>

                  {paymentMethod === 'QR' && bankQr && (
                    <div>
                      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">QR del banco (muéstraselo al cliente)</label>
                      <button type="button" onClick={() => setBankQrOpen(true)} className="mx-auto block">
                        <img src={bankQr} alt="QR del banco" className="w-40 h-40 object-contain rounded-lg border border-neutral-200 dark:border-neutral-700 hover:scale-105 transition-transform" />
                      </button>
                      <p className="text-center text-[10px] text-neutral-400 mt-1">Toca para agrandar</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {totalDiscount > 0 && <div className="flex justify-between text-sm text-success-600 dark:text-success-400"><span>Descuento</span><span>-{formatCurrency(totalDiscount)}</span></div>}
                  <div className="flex justify-between text-lg font-bold text-neutral-800 dark:text-neutral-100 pt-2 border-t border-neutral-100 dark:border-neutral-800"><span>Total</span><span className="text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span></div>
                </div>

                <div className="flex gap-2">
                  <button onClick={completeSale} className="btn-primary flex-1 py-3" disabled={completing}>{completing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Vender</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {bankQrOpen && bankQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/90 dark:bg-black/90 backdrop-blur-sm p-6 animate-fade-in" onClick={() => setBankQrOpen(false)}>
          <button onClick={() => setBankQrOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"><X size={24} /></button>
          <img src={bankQr} alt="QR del banco" className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleScan} />

      <Modal open={extModalOpen} onClose={() => setExtModalOpen(false)} title="Producto prestado" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Producto que traes de otra tienda para revender. No afecta tu inventario.</p>
          <div>
            <label className="label">Nombre *</label>
            <input value={extForm.name} onChange={(e) => setExtForm({ ...extForm, name: e.target.value })} className="input" placeholder="Ej: Perfume X 100ml" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Costo (lo que pagas)</label><input type="number" min="0" step="0.01" value={extForm.cost} onChange={(e) => setExtForm({ ...extForm, cost: e.target.value })} className="input" /></div>
            <div><label className="label">Precio de venta *</label><input type="number" min="0" step="0.01" value={extForm.price} onChange={(e) => setExtForm({ ...extForm, price: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Cantidad</label><input type="number" min="1" value={extForm.qty} onChange={(e) => setExtForm({ ...extForm, qty: e.target.value })} className="input" /></div>
          {parseFloat(extForm.price) > 0 && (
            <p className="text-sm text-success-600 dark:text-success-400">Ganancia estimada: {formatCurrency((parseFloat(extForm.price || '0') - parseFloat(extForm.cost || '0')) * (parseInt(extForm.qty) || 1))}</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setExtModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={addExternalItem} className="btn-primary">Agregar al carrito</button>
          </div>
        </div>
      </Modal>

      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Recibo de venta" size="sm">
        {lastSale && (
          <div className="space-y-4">
            <div className="text-center py-4 border-b border-dashed border-neutral-200 dark:border-neutral-700">
              <div className="w-14 h-14 rounded-full bg-success-100 dark:bg-success-900/40 flex items-center justify-center text-success-600 dark:text-success-400 mx-auto mb-3"><CheckCircle size={28} /></div>
              <h3 className="font-display text-xl font-bold text-neutral-800 dark:text-neutral-100">Venta completada</h3>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">Comercial Camila</p>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400"><span>No. Factura</span><span className="font-mono text-neutral-700 dark:text-neutral-300">{lastSale.invoice_number.slice(0, 8).toUpperCase()}</span></div>
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400"><span>Fecha</span><span className="text-neutral-700 dark:text-neutral-300">{formatDateTime(lastSale.created_at)}</span></div>
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400"><span>Cliente</span><span className="text-neutral-700 dark:text-neutral-300">{lastSale.client?.name ?? 'General'}</span></div>
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400"><span>Pago</span><span className="text-neutral-700 dark:text-neutral-300">{lastSale.payment_method}</span></div>
            </div>
            {lastSale.sale_items && lastSale.sale_items.length > 0 && (
              <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-3 space-y-2">
                {lastSale.sale_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div><p className="text-neutral-700 dark:text-neutral-200">{item.product_name}</p><p className="text-xs text-neutral-400">{item.quantity} x {formatCurrency(Number(item.unit_price))}</p></div>
                    <span className="text-neutral-700 dark:text-neutral-200 font-medium">{formatCurrency(Number(item.subtotal))}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-neutral-500"><span>Subtotal</span><span>{formatCurrency(Number(lastSale.subtotal))}</span></div>
              {Number(lastSale.discount) > 0 && <div className="flex justify-between text-sm text-success-600"><span>Descuento</span><span>-{formatCurrency(Number(lastSale.discount))}</span></div>}
              <div className="flex justify-between text-lg font-bold text-neutral-800 dark:text-neutral-100 pt-1"><span>Total</span><span className="text-primary-600 dark:text-primary-400">{formatCurrency(Number(lastSale.total))}</span></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => generatePDF(lastSale)} className="btn-secondary flex-1"><FileDown size={16} /> PDF</button>
              <button onClick={() => sendWhatsApp(lastSale)} className="btn-secondary flex-1 bg-success-500 hover:bg-success-600 text-white border-success-500"><MessageCircle size={16} /> WhatsApp</button>
              <button onClick={() => window.print()} className="btn-secondary flex-1"><Printer size={16} /> Imprimir</button>
            </div>
            <button onClick={() => setReceiptOpen(false)} className="btn-primary w-full">Nueva venta</button>
          </div>
        )}
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Ventas recientes" size="lg">
        {recentSales.length === 0 ? (
          <div className="py-10 text-center text-neutral-400 dark:text-neutral-500 text-sm">No hay ventas</div>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600"><Receipt size={18} /></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{sale.client?.name ?? 'General'}</p>
                    <p className="text-xs text-neutral-400">{formatDateTime(sale.created_at)} · {sale.payment_method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(Number(sale.total))}</p>
                  <div className="flex gap-1 justify-end mt-1">
                    <button onClick={() => generatePDF(sale)} className="p-1 rounded text-neutral-400 hover:text-primary-600"><FileDown size={14} /></button>
                    <button onClick={() => sendWhatsApp(sale)} className="p-1 rounded text-neutral-400 hover:text-success-600"><MessageCircle size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
