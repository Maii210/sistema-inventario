import React from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function Login() {
  const { dispatch } = useApp();
  const [isLogin, setIsLogin] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simular login/registro exitoso
    const user = {
      id: '1',
      name: isLogin ? 'Usuario' : formData.name,
      email: formData.email,
      phone: formData.phone
    };
    
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-essence-navy via-essence-purple to-essence-plum">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-white hover:text-essence-light mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver al Inicio</span>
        </button>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-essence-coral rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-playfair text-3xl font-bold text-white">
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h1>
                <p className="text-essence-light">Essence Perfumería</p>
              </div>
            </div>
            <p className="text-essence-light">
              {isLogin 
                ? 'Accede a tu cuenta para una experiencia personalizada'
                : 'Únete a nuestra comunidad de amantes de las fragancias'
              }
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-white/10 border border-white/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-essence-coral focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-white/10 border border-white/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-essence-coral focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-white/10 border border-white/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-essence-coral focus:border-transparent"
                      placeholder="+591 70000000"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full bg-white/10 border border-white/30 rounded-xl pl-10 pr-12 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-essence-coral focus:border-transparent"
                    placeholder="Tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/70 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full bg-white/10 border border-white/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-essence-coral focus:border-transparent"
                      placeholder="Confirma tu contraseña"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-essence-coral to-essence-rose text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-essence-coral/25 transition-all duration-300 hover:scale-105"
              >
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-essence-light hover:text-white transition-colors"
              >
                {isLogin 
                  ? '¿No tienes cuenta? Regístrate aquí'
                  : '¿Ya tienes cuenta? Inicia sesión'
                }
              </button>
            </div>

            {isLogin && (
              <div className="mt-4 text-center">
                <button className="text-essence-light hover:text-white transition-colors text-sm">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-white/70">
            <p>Al continuar, aceptas nuestros términos y condiciones</p>
          </div>
        </div>
      </div>
    </div>
  );
}