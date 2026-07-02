import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);

  // Ahora estos datos arrancan vacíos y se llenan con lo que diga la base de datos
  const [role, setRole] = useState(null);
  const [linea, setLinea] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función especial que busca tu "carnet" en la tabla profiles
    const fetchProfile = async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, linea')
        .eq('id', userId)
        .single();

      if (data) {
        setRole(data.role);
        setLinea(data.linea);
      }
    };

    // Al abrir la app, vemos si hay sesión y buscamos tu perfil
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Escuchamos los ingresos y salidas
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setRole(null);
        setLinea(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mientras busca tus poderes en Supabase, mostramos una pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-500">
        Validando credenciales...
      </div>
    );
  }

  // Si todo sale bien, repartimos tu sesión, tu rol y tu línea a toda la app
  return (
    <AuthContext.Provider value={{ session, role, linea }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
