import { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

const variants: Record<Variant, string> = {
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300',
  success: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  error: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: Variant }) {
  return <span className={`badge ${variants[variant]}`}>{children}</span>;
}
