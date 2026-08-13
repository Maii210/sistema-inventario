import React from 'react';
import { X, Plus } from 'lucide-react';

const inputCls =
  'flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-essence-purple/20 focus:border-essence-purple';

// Selector de notas en forma de etiquetas: se agregan escribiendo o eligiendo
// de una lista de sugerencias comunes, y se quitan con la ×.
export function NoteSelector({
  label,
  hint,
  values,
  suggestions,
  onChange
}: {
  label: string;
  hint?: string;
  values: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState('');

  const exists = (note: string) => values.some(v => v.toLowerCase() === note.trim().toLowerCase());

  const add = (note: string) => {
    const n = note.trim();
    if (!n || exists(n)) return;
    onChange([...values, n]);
    setDraft('');
  };

  const remove = (note: string) => onChange(values.filter(v => v !== note));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter agrega la nota sin enviar el formulario.
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    }
  };

  const available = suggestions.filter(s => !exists(s));

  return (
    <div className="block">
      <span className="block text-sm font-medium text-essence-navy mb-1">{label}</span>

      {/* Notas ya agregadas */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map(note => (
            <span key={note} className="inline-flex items-center gap-1 bg-essence-purple/10 text-essence-purple px-3 py-1 rounded-full text-sm">
              {note}
              <button type="button" onClick={() => remove(note)} className="hover:text-essence-plum" aria-label={`Quitar ${note}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Campo para agregar una nota personalizada */}
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Escribe una nota y presiona Enter"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={() => add(draft)}
          className="inline-flex items-center gap-1 bg-essence-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-essence-plum disabled:opacity-40"
          disabled={!draft.trim()}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {/* Sugerencias de notas comunes */}
      {available.length > 0 && (
        <div className="mt-2">
          <span className="block text-xs text-gray-400 mb-1">Sugerencias (toca para agregar):</span>
          <div className="flex flex-wrap gap-2">
            {available.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="inline-flex items-center gap-1 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-essence-purple/5 hover:border-essence-purple/30"
              >
                <Plus className="h-3 w-3" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {hint && <span className="block text-xs text-gray-400 mt-2">{hint}</span>}
    </div>
  );
}
