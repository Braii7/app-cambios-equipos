import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useApproveSwap } from '@/hooks/useApproveSwap';
import { supabase } from '@/lib/supabase';
import { CircleCheck as CheckCircle, Loader as Loader2, LogOut, PackagePlus, MessageSquare, ArrowLeft, RefreshCw, Settings, Trash2, Plus, Users, Factory, Sun, Moon } from 'lucide-react';
import { NewSwapForm } from './NewSwapForm';
import { CompleteSwapForm } from './CompleteSwapForm';

export default function Dashboard() {
  const { role, session } = useAuth();
  const queryClient = useQueryClient();
  const approveMutation = useApproveSwap();

  // 🔥 ESTADO Y LÓGICA DEL MODO OSCURO INTELIGENTE
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.setProperty('color-scheme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('color-scheme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Estados de Navegación Básica
  const [view, setView] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('lineas');
  const [selectedLine, setSelectedLine] = useState(null);
  const [subTab, setSubTab] = useState('activos');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSwapForProd, setSelectedSwapForProd] = useState(null);

  // Estados para el Modal de Sistemas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSwapId, setActiveSwapId] = useState(null);
  const [systemsComment, setSystemsComment] = useState('CAMBIO REALIZADO');

  // Estado para crear línea en modo Admin
  const [newLineName, setNewLineName] = useState('');
  const [isCreatingLine, setIsCreatingLine] = useState(false);

  // 📡 1. Traemos las Líneas de la Base de Datos
  const {
    data: lines = [],
    isLoading: loadingLines,
    refetch: refetchLines,
  } = useQuery({
    queryKey: ['lines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lines')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // 📡 2. Traemos todos los Tickets (Swaps)
  const {
    data: swaps = [],
    isLoading: loadingSwaps,
    refetch: refetchSwaps,
    isRefetching,
  } = useQuery({
    queryKey: ['swaps'],
    queryFn: async () => {
      const res = await apiClient.get('/swaps');
      return res.data;
    },
  });

  // 📡 3. Traemos los Perfiles (Solo Admin)
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role');
      if (error) throw error;
      return data;
    },
    enabled: role === 'admin' && view === 'admin',
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 🔥 GESTIÓN DE LÍNEAS (MODO DIOS)
  const handleAddLine = async (e) => {
    e.preventDefault();
    if (!newLineName.trim()) return;
    setIsCreatingLine(true);
    try {
      const { error } = await supabase
        .from('lines')
        .insert([{ name: newLineName.trim() }]);
      if (error) throw error;
      setNewLineName('');
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      toast.success('Línea agregada con éxito.');
    } catch (err) {
      toast.error('Error al agregar línea: ' + err.message);
    } finally {
      setIsCreatingLine(false);
    }
  };

  const handleDeleteLine = async (id, name) => {
    const confirmar = window.confirm(
      `⚠️ ¿Estás seguro de eliminar la línea "${name}"?`
    );
    if (!confirmar) return;
    try {
      const { error } = await supabase.from('lines').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['lines'] });
    } catch (err) {
      toast.error('Error al eliminar línea: ' + err.message);
    }
  };

  // 🔥 GESTIÓN DE ROLES DE USUARIO
  const handleRoleChange = async (userId, newRole) => {
    const previousProfiles = profiles;
    queryClient.setQueryData(['profiles'], (old) =>
      old?.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
    );
    try {
      console.log('[handleRoleChange] userId:', userId, '| newRole:', newRole);
      const { data, error, status } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select();
      console.log('[handleRoleChange] status:', status, '| data:', data, '| error:', error);
      if (error) {
        console.error('[handleRoleChange] Supabase error detail:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }
      if (!data || data.length === 0) {
        console.warn('[handleRoleChange] UPDATE matched 0 rows for userId:', userId);
        throw new Error(`No se encontró el perfil con id ${userId} en la base de datos.`);
      }
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Rol actualizado correctamente');
    } catch (err) {
      console.error('[handleRoleChange] caught error:', err);
      queryClient.setQueryData(['profiles'], previousProfiles);
      toast.error('Error al actualizar el rol: ' + err.message);
    }
  };

  const openApprovalModal = (swapId) => {
    setActiveSwapId(swapId);
    setSystemsComment('CAMBIO REALIZADO');
    setIsModalOpen(true);
  };

  const handleConfirmApproval = () => {
    approveMutation.mutate(
      { swapId: activeSwapId, comment: systemsComment },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setActiveSwapId(null);
          refetchSwaps();
        },
      }
    );
  };

  if (loadingLines || loadingSwaps) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans text-slate-500 bg-slate-50 dark:bg-slate-950 dark:text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600 dark:text-blue-500" />{' '}
        Cargando sistema de planta...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-200 pb-12 transition-colors duration-300">
      {/* HEADER SUPERIOR */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm/50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Cambios de Equipos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Área:{' '}
              <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                {role}
              </span>{' '}
              · {session?.user?.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÓN MODO OSCURO */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Alternar Modo Oscuro"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* BOTÓN EXCLUSIVO MODO DIOS */}
            {role === 'admin' && (
              <button
                onClick={() => {
                  setView(view === 'admin' ? 'dashboard' : 'admin');
                  setSelectedLine(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  view === 'admin'
                    ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                {view === 'admin' ? 'Volver al Panel' : '⚙️ Panel Admin'}
              </button>
            )}

            <button
              onClick={() => {
                refetchSwaps();
                refetchLines();
              }}
              disabled={isRefetching}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Sincronizar Datos"
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  isRefetching ? 'animate-spin text-blue-500' : ''
                }`}
              />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        {view === 'admin' ? (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    👑 Centro de Control (Admin)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configuración de líneas y accesos de personal
                  </p>
                </div>
              </div>

              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-6">
                <button
                  onClick={() => setAdminTab('lineas')}
                  className={`pb-2.5 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    adminTab === 'lineas'
                      ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Factory className="w-4 h-4" /> Gestión de Líneas
                </button>
                <button
                  onClick={() => setAdminTab('usuarios')}
                  className={`pb-2.5 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    adminTab === 'usuarios'
                      ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Users className="w-4 h-4" /> Usuarios y Roles
                </button>
              </div>

              {adminTab === 'lineas' && (
                <div className="space-y-6 max-w-2xl">
                  <form
                    onSubmit={handleAddLine}
                    className="flex gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                    autoComplete="off"
                  >
                    <input
                      type="text"
                      placeholder="Nombre de la nueva línea"
                      value={newLineName}
                      onChange={(e) => setNewLineName(e.target.value)}
                      className="flex-1 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      required
                      disabled={isCreatingLine}
                    />
                    <button
                      type="submit"
                      disabled={isCreatingLine || !newLineName.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5 transition-colors disabled:bg-purple-400"
                    >
                      {isCreatingLine ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}{' '}
                      Agregar
                    </button>
                  </form>
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Líneas Registradas ({lines.length})
                    </h3>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                      {lines.map((line) => (
                        <div
                          key={line.id}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {line.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(line.id, line.name)}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            title="Eliminar Línea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO: GESTIÓN DE USUARIOS (AGRUPADOS POR ROL) */}
              {adminTab === 'usuarios' && (
                <div className="space-y-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                    <strong>💡 ¿Cómo agregar a alguien nuevo?</strong> Pedile a
                    la persona que se registre en la pantalla de inicio de
                    sesión de la app. Una vez que lo haga, va a aparecer acá en
                    "Sala de Espera" y vas a poder asignarle su rol.
                  </div>

                  {/* Agrupamos a los usuarios dinámicamente */}
                  {[
                    'sin_rol',
                    'calidad',
                    'produccion',
                    'sistemas',
                    'admin',
                  ].map((roleGroup) => {
                    const groupProfiles = profiles.filter((p) => {
                      if (roleGroup === 'sin_rol') return !p.role;
                      return p.role === roleGroup;
                    });

                    if (groupProfiles.length === 0) return null;

                    const roleTitles = {
                      sin_rol: '⏳ Nuevos / Sala de Espera (Sin Rol)',
                      calidad: '🔴 Equipo de Calidad',
                      produccion: '🔵 Equipo de Producción',
                      sistemas: '🟢 Equipo de Sistemas',
                      admin: '👑 Administradores',
                    };

                    return (
                      <div key={roleGroup} className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">
                          {roleTitles[roleGroup]} ({groupProfiles.length})
                        </h3>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500">
                              <tr>
                                <th className="px-4 py-3 w-1/2">
                                  Usuario (Email)
                                </th>
                                <th className="px-4 py-3 w-1/2">
                                  Modificar Rol
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {groupProfiles.map((profile) => (
                                <tr
                                  key={profile.id}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="px-4 py-4">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                      {profile.email || 'Sin Email'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <select
                                      value={profile.role || ''}
                                      onChange={(e) =>
                                        handleRoleChange(
                                          profile.id,
                                          e.target.value
                                        )
                                      }
                                      className={`w-full p-2 border rounded-lg text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-purple-500 transition-colors bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700`}
                                    >
                                      <option value="" disabled>
                                        Sin Rol
                                      </option>
                                      <option value="calidad">Calidad</option>
                                      <option value="produccion">
                                        Producción
                                      </option>
                                      <option value="sistemas">Sistemas</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISTA 2: CIRCUITO NORMAL (FORMULARIOS Y TARJETAS) */
          <>
            {isCreating ? (
              <NewSwapForm
                onCancel={() => setIsCreating(false)}
                initialLine={selectedLine}
              />
            ) : selectedSwapForProd ? (
              <CompleteSwapForm
                swap={selectedSwapForProd}
                onCancel={() => setSelectedSwapForProd(null)}
              />
            ) : !selectedLine ? (
              /* PANTALLA A: MAPA DE LÍNEAS (IMAGEN 2) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {lines.map((line) => {
                    const activosCount = swaps.filter(
                      (s) =>
                        s.line_id?.toLowerCase() === line.name?.toLowerCase() &&
                        s.status === 'pending'
                    ).length;

                    return (
                      <div
                        key={line.id}
                        onClick={() => {
                          setSelectedLine(line.name);
                          setSubTab('activos');
                        }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer relative flex flex-col justify-between min-h-[160px] group"
                      >
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {line.name}
                          </h3>
                          <p className="text-sm mt-1 transition-colors text-slate-400 dark:text-slate-500">
                            {activosCount === 0
                              ? 'Sin cambios activos'
                              : `${activosCount} ${
                                  activosCount === 1
                                    ? 'cambio activo'
                                    : 'cambios activos'
                                }`}
                          </p>
                        </div>

                        {activosCount > 0 && (
                          <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                            {activosCount}
                          </span>
                        )}

                        {/* 🔥 BLOQUEO PARA PRODUCCIÓN: Solo Calidad y Admin ven este botón en la tarjeta */}
                        {(role === 'calidad' || role === 'admin') && (
                          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-4 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                            <span>Generar cambios de equipos</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLine(line.name);
                                setIsCreating(true);
                              }}
                              className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold py-1.5 px-3 rounded-lg transition-colors group-hover:translate-x-1"
                            >
                              + Nuevo Cambio
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* PANTALLA B: DETALLE DE LA LÍNEA SELECCIONADA (IMAGEN 3) */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedLine(null)}
                      className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedLine}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Viendo el estado de reparaciones de este sector
                      </p>
                    </div>
                  </div>

                  {(role === 'calidad' || role === 'admin') && (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="bg-red-800 hover:bg-red-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center gap-2 text-sm"
                    >
                      + Nuevo Cambio
                    </button>
                  )}
                </div>

                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
                  <button
                    onClick={() => setSubTab('activos')}
                    className={`pb-2.5 px-2 text-sm font-semibold border-b-2 transition-all ${
                      subTab === 'activos'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Cambios Activos (
                    {
                      swaps.filter(
                        (s) =>
                          s.line_id?.toLowerCase() ===
                            selectedLine.toLowerCase() && s.status === 'pending'
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setSubTab('historial')}
                    className={`pb-2.5 px-2 text-sm font-semibold border-b-2 transition-all ${
                      subTab === 'historial'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Historial (Hoy)
                  </button>
                </div>

                {subTab === 'activos' && (
                  <div className="space-y-4">
                    {swaps.filter(
                      (s) =>
                        s.line_id?.toLowerCase() ===
                          selectedLine.toLowerCase() && s.status === 'pending'
                    ).length === 0 ? (
                      <p className="text-slate-400 text-sm italic bg-white dark:bg-slate-900 p-8 rounded-2xl border dark:border-slate-800 text-center shadow-sm">
                        No hay equipos en proceso de cambio en la línea{' '}
                        {selectedLine}.
                      </p>
                    ) : (
                      swaps
                        .filter(
                          (s) =>
                            s.line_id?.toLowerCase() ===
                              selectedLine.toLowerCase() &&
                            s.status === 'pending'
                        )
                        .map((swap) => {
                          const pasoProduccionCompleto = Boolean(swap.new_imei);

                          return (
                            <div
                              key={swap.id}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                      #{swap.id}
                                    </span>
                                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/50">
                                      Aprobado por Calidad
                                    </span>
                                  </div>
                                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                                    {swap.newsan_code || swap.material} ·{' '}
                                    {swap.model}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Caja Master:{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {swap.master_box}
                                    </span>
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  {(role === 'produccion' ||
                                    role === 'admin') &&
                                    !pasoProduccionCompleto && (
                                      <button
                                        onClick={() =>
                                          setSelectedSwapForProd(swap)
                                        }
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition duration-150 text-sm"
                                      >
                                        <PackagePlus className="w-4 h-4" />{' '}
                                        Cargar Equipo Nuevo
                                      </button>
                                    )}

                                  {(role === 'sistemas' || role === 'admin') &&
                                    pasoProduccionCompleto && (
                                      <button
                                        onClick={() =>
                                          openApprovalModal(swap.id)
                                        }
                                        disabled={approveMutation.isPending}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition duration-150 text-sm"
                                      >
                                        <CheckCircle className="w-4 h-4" />{' '}
                                        Aprobar Final
                                      </button>
                                    )}
                                </div>
                              </div>

                              <div className="text-sm space-y-1">
                                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  <strong className="text-red-700 dark:text-red-400 font-bold">
                                    IMEI NG:
                                  </strong>{' '}
                                  {swap.old_imei_1 || swap.old_imei}{' '}
                                  {swap.old_imei_2
                                    ? ` / ${swap.old_imei_2}`
                                    : ''}
                                </p>
                                {swap.new_imei && (
                                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium animate-in fade-in duration-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    <strong className="text-blue-700 dark:text-blue-400 font-bold">
                                      IMEI OK:
                                    </strong>{' '}
                                    {swap.new_imei}{' '}
                                    {swap.new_imei_2
                                      ? ` / ${swap.new_imei_2}`
                                      : ''}
                                  </p>
                                )}
                              </div>

                              <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center justify-between relative w-full max-w-3xl mx-auto px-4">
                                  <div className="absolute top-[15px] left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
                                  <div
                                    className={`absolute top-[15px] left-8 h-0.5 bg-blue-600 -z-10 transition-all duration-500`}
                                    style={{
                                      width: pasoProduccionCompleto
                                        ? '66%'
                                        : '33%',
                                    }}
                                  ></div>

                                  <div className="flex flex-col items-center text-center space-y-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-white text-xs font-bold">
                                      ✓
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      Calidad
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center space-y-1">
                                    <div
                                      className={`w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                                        pasoProduccionCompleto
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {pasoProduccionCompleto ? '✓' : '2'}
                                    </div>
                                    <span
                                      className={`text-xs font-bold ${
                                        pasoProduccionCompleto
                                          ? 'text-slate-800 dark:text-slate-200'
                                          : 'text-slate-400 dark:text-slate-500'
                                      }`}
                                    >
                                      Producción
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center space-y-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-xs font-bold">
                                      3
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                      Sistema
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center space-y-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-xs font-bold">
                                      4
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                      Completado
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {subTab === 'historial' && (
                  <div className="space-y-4">
                    {(() => {
                      const hoyArgentina = new Date().toLocaleDateString(
                        'es-AR',
                        { timeZone: 'America/Argentina/Buenos_Aires' }
                      );
                      const historialFiltrado = swaps.filter((s) => {
                        if (
                          s.status !== 'completed' ||
                          s.line_id?.toLowerCase() !==
                            selectedLine.toLowerCase()
                        )
                          return false;
                        const fechaUpdate = s.updated_at
                          ? new Date(s.updated_at).toLocaleDateString('es-AR', {
                              timeZone: 'America/Argentina/Buenos_Aires',
                            })
                          : hoyArgentina;
                        return fechaUpdate === hoyArgentina;
                      });

                      if (historialFiltrado.length === 0) {
                        return (
                          <p className="text-slate-400 text-sm italic bg-white dark:bg-slate-900 p-8 rounded-2xl border dark:border-slate-800 text-center shadow-sm">
                            No hay registros de cambios aprobados en el día de
                            hoy todavía en {selectedLine}.
                          </p>
                        );
                      }

                      return historialFiltrado.map((swap) => (
                        <div
                          key={swap.id}
                          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {swap.model}
                              </p>
                              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 uppercase">
                                COMPLETADO
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Caja Master:{' '}
                              {swap.new_master_box || swap.master_box}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-3 py-2 rounded-xl mt-2 italic flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <strong>Sistemas:</strong>{' '}
                              {swap.systems_observation || 'CAMBIO REALIZADO'}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border dark:border-slate-700">
                            Inspector: {swap.quality_inspector?.split('@')[0]}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN DE SISTEMAS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b dark:border-slate-800 pb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Confirmación de Sistemas
                </h3>
                <p className="text-xs text-slate-400">
                  Cierre definitivo y registro en Excel
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nota u Observación del Cambio
              </label>
              <input
                type="text"
                value={systemsComment}
                onChange={(e) => setSystemsComment(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 dark:text-white transition-all text-sm font-medium"
                required
                disabled={approveMutation.isPending}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setActiveSwapId(null);
                }}
                disabled={approveMutation.isPending}
                className="w-1/3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={approveMutation.isPending || !systemsComment.trim()}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:bg-emerald-800"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                  </>
                ) : (
                  '🚀 Enviar y Registrar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
