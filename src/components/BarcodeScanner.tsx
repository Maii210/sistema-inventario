import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, CameraOff, ScanLine, X } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!open) {
      stopScanning();
      setManualCode('');
      setError(null);
    }
  }, [open]);

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.stopContinuousDecode();
      readerRef.current.reset();
      readerRef.current = null;
    }
    setScanning(false);
  };

  const startScanning = async () => {
    setError(null);
    if (!videoRef.current) return;

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      await reader.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, _err) => {
          if (result) {
            const text = result.getText();
            stopScanning();
            onDetected(text);
          }
        }
      );
      setScanning(true);
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos o ingresa el código manualmente.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onDetected(manualCode.trim());
      setManualCode('');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ScanLine size={22} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Escanear código</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="relative rounded-xl overflow-hidden bg-neutral-900 aspect-video mb-4">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                <CameraOff size={36} className="mb-2" />
                <span className="text-sm">Cámara apagada</span>
              </div>
            )}
            {scanning && (
              <>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-primary-400 animate-pulse rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-32 border-2 border-primary-400/60 rounded-lg" />
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-error-600 bg-error-50 dark:bg-error-900/30 dark:text-error-400 px-3 py-2 rounded-lg mb-3">{error}</p>
          )}

          <button
            onClick={scanning ? stopScanning : startScanning}
            className={scanning ? 'btn-danger w-full mb-4' : 'btn-primary w-full mb-4'}
          >
            {scanning ? <CameraOff size={18} /> : <Camera size={18} />}
            {scanning ? 'Detener escaneo' : 'Activar cámara'}
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-neutral-900 px-3 text-xs text-neutral-400">o ingresa manualmente</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Código de barras"
              className="input"
              autoFocus
            />
            <button type="submit" className="btn-primary px-5" disabled={!manualCode.trim()}>
              Buscar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
