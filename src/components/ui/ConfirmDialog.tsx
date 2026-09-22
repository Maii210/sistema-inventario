import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-xl animate-scale-in p-6">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-neutral-300 dark:text-neutral-600 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-400 dark:text-neutral-500 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
