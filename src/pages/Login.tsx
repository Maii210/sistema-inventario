import { useState } from 'react';
import { Sparkles, Mail, Lock, Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

// TEMPORAL: acceso rápido de pruebas. Poner en false para ocultar al terminar las pruebas.
const SHOW_QUICK_LOGIN = true;

// Foto de la perfumería para el panel de inicio (pegar URL cuando la envíen).
const STORE_PHOTO_URL = '';

const QUICK_USERS = [
  { title: 'Administrador', who: 'Admin Camila', email: 'admin@comercialcamila.com', password: 'admin123' },
  { title: 'Vendedora', who: 'Daniela Rojas', email: 'daniela@comercialcamila.com', password: 'vendedora123' },
  { title: 'Vendedora', who: 'Carolina Méndez', email: 'carolina@comercialcamila.com', password: 'vendedora123' },
  { title: 'Inventarista', who: 'Luis Gómez', email: 'luis@comercialcamila.com', password: 'inventarista123' },
];

export function Login() {
  const { signIn } = useAuth();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const quickLogin = async (u: (typeof QUICK_USERS)[number]) => {
    setLoading(true);
    setError(null);
    const { error } = await signIn(u.email, u.password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700">
        {STORE_PHOTO_URL && (
          <img src={STORE_PHOTO_URL} alt="Perfumería" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center">
              <Sparkles size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Camila</h1>
              <p className="text-primary-100 text-sm">Belleza & Cuidado Personal</p>
            </div>
          </div>
          <h2 className="text-4xl font-display font-bold leading-tight mb-4">
            Sistema de Inventario<br />y Punto de Venta
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed max-w-md">
            Gestiona tus productos, controla tu inventario y registra tus ventas
            de forma rápida y sencilla con lector de código de barras integrado.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-neutral-50 dark:bg-neutral-950 relative">
        <button
          onClick={toggle}
          className="absolute top-5 right-5 p-2.5 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition"
          title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="absolute bottom-5 right-5 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 pointer-events-none select-none">
          <span>Desarrollado por</span>
          <img src="/logo-afr.png" alt="AFR" className="h-10 object-contain" />
        </div>
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
            Bienvenido de nuevo
          </h2>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-8">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Correo o teléfono</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com o 70000000"
                  className="input pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-error-600 bg-error-50 dark:bg-error-900/30 dark:text-error-400 border border-error-100 dark:border-error-900/50 px-4 py-3 rounded-xl animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              Iniciar sesión
            </button>
          </form>

          {SHOW_QUICK_LOGIN && (
            <div className="mt-8">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mb-3">Acceso rápido (pruebas)</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => quickLogin(u)}
                    disabled={loading}
                    className="text-left p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition disabled:opacity-40"
                  >
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{u.title}</p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">{u.who}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
