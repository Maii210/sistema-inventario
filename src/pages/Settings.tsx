import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Save } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export function Settings() {
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.get('bank_qr').then((s) => setQr(s?.value || '')).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { show('La imagen no debe superar 10MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setQr(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.set('bank_qr', qr);
      show('Configuración guardada');
    } catch (e: any) {
      show(e.message || 'Error al guardar', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Ajustes</h1>
        <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Configuración de la tienda</p>
      </div>

      <div className="card p-6 max-w-lg space-y-4">
        <div>
          <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">QR del banco</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Esta imagen se le muestra al cliente al cobrar por QR. Reemplázala cuando tu QR caduque (cada 1-2 años).
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
        ) : (
          <>
            {qr ? (
              <img src={qr} alt="QR del banco" className="w-48 h-48 object-contain rounded-xl border border-neutral-200 dark:border-neutral-700" />
            ) : (
              <div className="w-48 h-48 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">Sin QR cargado</div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm"><Camera size={16} /> Subir imagen</button>
              {qr && <button type="button" onClick={() => setQr('')} className="text-xs text-error-500 hover:text-error-600">Quitar</button>}
            </div>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar</button>
          </>
        )}
      </div>
    </div>
  );
}
