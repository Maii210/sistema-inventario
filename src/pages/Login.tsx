import { useState } from 'react';
import { Sparkles, Mail, Lock, User, Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export function Login() {
  const { signIn, signUp } = useAuth();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700">
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
          <div className="mt-12 space-y-4">
            {[
              'Control de inventario en tiempo real',
              'Ventas rápidas con código de barras',
              'Reportes y estadísticas detalladas',
              'Gestión de clientes y proveedores',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-primary-50">
                <div className="w-6 h-6 bg-white/15 rounded-full flex items-center justify-center text-xs">✓</div>
                <span>{item}</span>
              </div>
            ))}
          </div>
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
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-800 dark:text-neutral-100">Camila</h1>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">Belleza & Cuidado Personal</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
            {mode === 'signin' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h2>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-8">
            {mode === 'signin' ? 'Ingresa tus credenciales para continuar' : 'Completa los datos para registrarte'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Nombre completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    className="input pl-11"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
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
              {mode === 'signin' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 mt-6">
            {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
