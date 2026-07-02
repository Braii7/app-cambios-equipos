import React, { useState } from 'react';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Aseguramos la conexión directa

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Intentamos abrir la puerta con Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // Si todo sale bien, la página se recarga sola y te lleva al Dashboard
      window.location.href = '/';
    } catch (error) {
      setError('Correo o contraseña incorrectos. Revisá los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans antialiased">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        {/* Encabezado del Login */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Control de Cambios de Equipos
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-6 flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="usuario@newsan.com.ar"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:bg-blue-400"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Entrar al Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
