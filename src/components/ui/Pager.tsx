interface PagerProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}
