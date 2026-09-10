import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatBOB } from './format';
import { Order } from '../types';

type WithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

const BRAND = 'Comercial Camila';
const PURPLE: [number, number, number] = [124, 58, 173];

// Exporta una tabla genérica a PDF (usado por los reportes).
export function exportTablePdf(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
}): void {
  const doc = new jsPDF() as WithAutoTable;

  doc.setFontSize(18);
  doc.text(BRAND, 14, 18);
  doc.setFontSize(13);
  doc.text(opts.title, 14, 27);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, 14, 33);
  let startY = 40;
  if (opts.subtitle) {
    doc.text(opts.subtitle, 14, 38);
    startY = 44;
  }
  doc.setTextColor(0);

  if (opts.summary && opts.summary.length) {
    autoTable(doc, {
      startY,
      body: opts.summary.map(s => [s.label, s.value]),
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    startY = (doc.lastAutoTable?.finalY ?? startY) + 4;
  }

  autoTable(doc, {
    startY,
    head: [opts.headers],
    body: opts.rows.map(r => r.map(String)),
    styles: { fontSize: 9 },
    headStyles: { fillColor: PURPLE }
  });

  doc.save(opts.filename);
}

// Genera el comprobante / nota de venta de un pedido, con IVA opcional (13%).
export function exportOrderInvoicePdf(order: Order, opts: { includeIva: boolean; ivaRate?: number }): void {
  const doc = new jsPDF() as WithAutoTable;
  const rate = opts.ivaRate ?? 0.13;

  doc.setFontSize(18);
  doc.text(BRAND, 14, 18);
  doc.setFontSize(12);
  doc.text('Comprobante de venta', 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Documento interno (no válido como factura fiscal)', 14, 31);
  doc.setTextColor(0);

  doc.setFontSize(10);
  doc.text(`Comprobante N°: ${order.id}`, 14, 40);
  doc.text(`Fecha: ${new Date(order.date).toLocaleString('es-BO')}`, 14, 46);
  doc.text(`Cliente: ${order.customer.name || 'Consumidor final'}`, 14, 52);
  if (order.customer.email) doc.text(`Correo: ${order.customer.email}`, 14, 58);
  if (order.customer.phone) doc.text(`Teléfono: ${order.customer.phone}`, 120, 52);

  autoTable(doc, {
    startY: 66,
    head: [['Producto', 'Cantidad', 'Precio unit.', 'Subtotal']],
    body: order.items.map(it => [
      it.name,
      String(it.quantity),
      formatBOB(it.price),
      formatBOB(it.price * it.quantity)
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: PURPLE }
  });

  // Totales con IVA opcional. Cuando el IVA está habilitado se desglosa
  // sobre el total (IVA incluido, 13%), como es habitual en Bolivia.
  const total = order.total;
  const totals: [string, string][] = [
    ['Subtotal productos', formatBOB(order.subtotal)]
  ];
  if (opts.includeIva) {
    const iva = total - total / (1 + rate);
    totals.push([`IVA (${Math.round(rate * 100)}%) incluido`, formatBOB(iva)]);
  }
  totals.push(['TOTAL', formatBOB(total)]);

  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY ?? 66) + 4,
    body: totals,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 110 }
  });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('Gracias por su compra — Comercial Camila', 14, 285);

  doc.save(`comprobante-${order.id}.pdf`);
}
