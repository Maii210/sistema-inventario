import { useState } from 'react';

interface Props {
  /** Fecha en formato 'YYYY-MM-DD' o '' (vacío). */
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

// Último día del mes de un 'YYYY-MM'.
function lastDayOf(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

// 'YYYY-MM' -> 'YYYY-MM-DD' usando el último día del mes (válido hasta fin de mes).
function monthToFull(ym: string): string {
  return ym ? `${ym}-${String(lastDayOf(ym)).padStart(2, '0')}` : '';
}

// ¿El value guardado corresponde a "solo mes y año" (día = último del mes)?
function isMonthOnly(value: string): boolean {
  if (!value) return false;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return d === new Date(y, m, 0).getDate();
}

/**
 * Caducidad con el calendario nativo de siempre (type="date"). Si el producto
 * solo trae mes y año, se marca "Solo mes y año" y el día pasa a ser opcional
 * (usa el selector nativo de mes); internamente se guarda el último día del mes.
 */
export function ExpiryInput({ value, onChange, disabled }: Props) {
  const [monthOnly, setMonthOnly] = useState(() => isMonthOnly(value));

  const cls = `input ${disabled ? 'bg-neutral-100 dark:bg-neutral-800 cursor-default' : ''}`;

  return (
    <div className="space-y-1.5">
      {monthOnly ? (
        <input
          type="month"
          value={value ? value.slice(0, 7) : ''}
          disabled={disabled}
          onChange={(e) => onChange(monthToFull(e.target.value))}
          className={cls}
        />
      ) : (
        <input
          type="date"
          value={value ? value.slice(0, 10) : ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
      {!disabled && (
        <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-500 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={monthOnly}
            onChange={(e) => {
              const on = e.target.checked;
              setMonthOnly(on);
              // Al activar, convierte la fecha actual a solo mes y año.
              if (on && value) onChange(monthToFull(value.slice(0, 7)));
            }}
            className="w-3.5 h-3.5 rounded text-primary-600"
          />
          Solo mes y año (día opcional)
        </label>
      )}
    </div>
  );
}
