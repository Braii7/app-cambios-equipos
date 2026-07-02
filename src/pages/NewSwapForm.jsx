import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export const NewSwapForm = ({ onCancel, initialLine }) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const [commonData, setCommonData] = useState({
    line_id: initialLine || '',
    model: '',
    color_model: '',
    quality_observation: '',
    newsan_code: '',
    master_box: '',
  });

  const [equipos, setEquipos] = useState([
    { id: Date.now(), old_imei_1: '', old_imei_2: '', isDualSim: false },
  ]);

  const handleCommonChange = (e) => {
    setCommonData({ ...commonData, [e.target.name]: e.target.value });
  };

  const handleEquipoChange = (id, field, value) => {
    // 🔥 MAGIA: Filtramos cualquier cosa que no sea número y cortamos a 15 de máximo
    const soloNumeros = value.replace(/\D/g, '').slice(0, 15);
    setEquipos(
      equipos.map((eq) => (eq.id === id ? { ...eq, [field]: soloNumeros } : eq))
    );
  };

  const toggleDualSim = (id) => {
    setEquipos(
      equipos.map((eq) => {
        if (eq.id === id) {
          return {
            ...eq,
            isDualSim: !eq.isDualSim,
            old_imei_2: !eq.isDualSim ? eq.old_imei_2 : '',
          };
        }
        return eq;
      })
    );
  };

  const agregarEquipo = () => {
    setEquipos([
      ...equipos,
      { id: Date.now(), old_imei_1: '', old_imei_2: '', isDualSim: false },
    ]);
  };

  const eliminarEquipo = (id) => {
    if (equipos.length > 1) {
      setEquipos(equipos.filter((eq) => eq.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 VALIDACIONES ESTRICTAS DE IMEI ANTES DE ENVIAR
    for (const eq of equipos) {
      if (eq.old_imei_1.length !== 15) {
        return alert('🚨 Error: El IMEI 1 debe tener exactamente 15 números.');
      }
      if (eq.isDualSim) {
        if (eq.old_imei_2.length !== 15) {
          return alert(
            '🚨 Error: El IMEI 2 debe tener exactamente 15 números.'
          );
        }
        if (eq.old_imei_1 === eq.old_imei_2) {
          return alert(
            '🚨 Error: El IMEI 1 y el IMEI 2 no pueden ser iguales.'
          );
        }
      }
    }

    setIsPending(true);

    const opcionesHora = {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: 'numeric',
      hour12: false,
    };
    const horaActual = parseInt(
      new Intl.DateTimeFormat('es-AR', opcionesHora).format(new Date()),
      10
    );
    const turnoActual = horaActual >= 6 && horaActual < 15 ? 'Mañana' : 'Tarde';

    const ticketsARegistrar = equipos.map((eq) => ({
      line_id: commonData.line_id,
      model: commonData.model,
      color_model: commonData.color_model,
      quality_observation: commonData.quality_observation,
      newsan_code: commonData.newsan_code,
      material: commonData.newsan_code,
      master_box: commonData.master_box,
      old_imei_1: eq.old_imei_1,
      old_imei_2: eq.isDualSim ? eq.old_imei_2 : null,
      quality_inspector: session?.user?.email || 'Usuario Desconocido',
      status: 'pending',
      quality_status: 'PENDIENTE',
      shift: turnoActual,
      supervisor: 'No Asignado',
      quantity: 1,
    }));

    try {
      const { error } = await supabase.from('swaps').insert(ticketsARegistrar);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      onCancel();
    } catch (error) {
      alert('🚨 Hubo un error al guardar: ' + error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-200 mt-2">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📝 Nuevo Cambio de Equipo
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-slate-400 hover:text-red-500 font-bold px-3 py-2 rounded-lg bg-slate-50 hover:bg-red-50 transition-colors text-sm"
        >
          ✕ Cancelar
        </button>
      </div>

      {/* 🔥 autoComplete="off" para evitar historiales molestos */}
      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
            Datos de la Caja
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Línea Seleccionada
              </label>
              {/* LÍNEA FIJA */}
              <input
                type="text"
                value={commonData.line_id}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-200/60 text-slate-600 font-bold text-sm cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Modelo
              </label>
              <input
                type="text"
                name="model"
                onChange={handleCommonChange}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: PBBR0014AR"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Color
              </label>
              <input
                type="text"
                name="color_model"
                onChange={handleCommonChange}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: Blue Atoll"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Código Newsan
              </label>
              <input
                type="text"
                name="newsan_code"
                onChange={handleCommonChange}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: 07666000009681"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Caja Master
              </label>
              <input
                type="text"
                name="master_box"
                onChange={handleCommonChange}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: N2C002944194"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Motivo (Falla)
            </label>
            <textarea
              name="quality_observation"
              onChange={handleCommonChange}
              rows="2"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Ej: Lente flash NG"
              required
              disabled={isPending}
            ></textarea>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Equipos a Cambiar
          </h3>
          {equipos.map((equipo, index) => (
            <div
              key={equipo.id}
              className="relative bg-white p-5 rounded-xl border-2 border-red-100 shadow-sm transition-all hover:border-red-200"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                  Equipo Fallado #{index + 1}
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer gap-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={equipo.isDualSim}
                        onChange={() => toggleDualSim(equipo.id)}
                        disabled={isPending}
                      />
                      <div
                        className={`block w-10 h-6 rounded-full transition-colors ${
                          equipo.isDualSim ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                      ></div>
                      <div
                        className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          equipo.isDualSim ? 'transform translate-x-4' : ''
                        }`}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      Dual SIM
                    </span>
                  </label>
                  {equipos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarEquipo(equipo.id)}
                      className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-lg border border-red-50">
                <div>
                  <label className="block text-xs font-bold text-red-700 uppercase mb-1">
                    IMEI 1
                  </label>
                  <input
                    type="text"
                    value={equipo.old_imei_1}
                    onChange={(e) =>
                      handleEquipoChange(
                        equipo.id,
                        'old_imei_1',
                        e.target.value
                      )
                    }
                    className="w-full p-2.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 text-sm bg-white"
                    placeholder="15 dígitos"
                    required
                    disabled={isPending}
                    pattern="\d{15}"
                    maxLength="15"
                  />
                </div>
                {equipo.isDualSim && (
                  <div className="animate-in fade-in zoom-in duration-200">
                    <label className="block text-xs font-bold text-red-700 uppercase mb-1">
                      IMEI 2
                    </label>
                    <input
                      type="text"
                      value={equipo.old_imei_2}
                      onChange={(e) =>
                        handleEquipoChange(
                          equipo.id,
                          'old_imei_2',
                          e.target.value
                        )
                      }
                      className="w-full p-2.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 text-sm bg-white"
                      placeholder="15 dígitos"
                      required={equipo.isDualSim}
                      disabled={isPending}
                      pattern="\d{15}"
                      maxLength="15"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={agregarEquipo}
            disabled={isPending}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-semibold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Agregar otro equipo a esta caja
          </button>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100 flex gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:bg-blue-400"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
              </>
            ) : (
              `💾 Guardar ${equipos.length} ${
                equipos.length === 1 ? 'Equipo' : 'Equipos'
              }`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
