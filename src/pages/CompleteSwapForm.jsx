import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Smartphone } from 'lucide-react';

export const CompleteSwapForm = ({ swap, onCancel }) => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const isDualSim = Boolean(swap.old_imei_2);

  const [formData, setFormData] = useState({
    new_imei: '',
    new_imei_2: '',
    new_master_box: swap.master_box || '',
  });

  const handleChange = (e) => {
    // Si están tipeando en los imei, forzamos que sean solo números y 15 máximo
    if (e.target.name === 'new_imei' || e.target.name === 'new_imei_2') {
      const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 15);
      setFormData({ ...formData, [e.target.name]: soloNumeros });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones estrictas
    if (formData.new_imei.length !== 15)
      return alert('🚨 Error: El IMEI 1 debe tener exactamente 15 números.');
    if (isDualSim) {
      if (formData.new_imei_2.length !== 15)
        return alert('🚨 Error: El IMEI 2 debe tener exactamente 15 números.');
      if (formData.new_imei === formData.new_imei_2)
        return alert('🚨 Error: El IMEI 1 y el IMEI 2 no pueden ser iguales.');
    }

    setIsPending(true);

    try {
      const { error } = await supabase
        .from('swaps')
        .update({
          new_imei: formData.new_imei,
          new_imei_2: isDualSim ? formData.new_imei_2 : null,
          new_master_box: formData.new_master_box,
        })
        .eq('id', swap.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      onCancel();
    } catch (error) {
      alert('🚨 Error al actualizar el ticket: ' + error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100 mt-2 font-sans">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> Cargar Equipo de
            Reemplazo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Completando Ticket de {swap.model}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-slate-400 hover:text-slate-600 font-medium text-sm px-3 py-1.5 rounded-lg border border-slate-200 transition-colors bg-slate-50 hover:bg-slate-100"
        >
          ✕ Volver
        </button>
      </div>

      <div className="mb-6 p-5 bg-red-50/50 border border-red-100 rounded-xl space-y-2 text-sm text-slate-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
        <div className="flex items-center gap-2 text-red-700 font-bold mb-3 border-b border-red-200 pb-2">
          <Smartphone className="w-4 h-4" /> Información de la Falla Original
        </div>
        <div className="grid grid-cols-2 gap-4">
          <p>
            <span className="font-semibold text-slate-700 block text-xs uppercase mb-0.5">
              Caja Master Original
            </span>{' '}
            {swap.master_box || 'N/A'}
          </p>
          <p>
            <span className="font-semibold text-slate-700 block text-xs uppercase mb-0.5">
              Línea de Origen
            </span>{' '}
            {swap.line_id || 'N/A'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <p>
            <span className="font-semibold text-red-700 block text-xs uppercase mb-0.5">
              IMEI Fallado 1
            </span>{' '}
            {swap.old_imei || swap.old_imei_1 || 'S/N'}
          </p>
          {isDualSim && (
            <p>
              <span className="font-semibold text-red-700 block text-xs uppercase mb-0.5">
                IMEI Fallado 2
              </span>{' '}
              {swap.old_imei_2}
            </p>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-red-100">
          <span className="font-semibold text-slate-700 block text-xs uppercase mb-0.5">
            Motivo del rechazo (Calidad)
          </span>
          <span className="italic text-slate-700">
            {swap.quality_observation || 'Sin observaciones'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <div className="p-5 bg-blue-50/60 rounded-xl border border-blue-100/70">
          <span className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-4 pb-2 border-b border-blue-200/50">
            Escáner de Equipo Nuevo (OK)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase mb-1">
                IMEI Nuevo 1
              </label>
              <input
                type="text"
                name="new_imei"
                value={formData.new_imei}
                onChange={handleChange}
                className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm bg-white shadow-sm"
                placeholder="15 dígitos"
                required
                disabled={isPending}
                pattern="\d{15}"
                maxLength="15"
              />
            </div>
            {isDualSim ? (
              <div className="animate-in fade-in zoom-in duration-200">
                <label className="block text-xs font-bold text-blue-700 uppercase mb-1">
                  IMEI Nuevo 2
                </label>
                <input
                  type="text"
                  name="new_imei_2"
                  value={formData.new_imei_2}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm bg-white shadow-sm"
                  placeholder="15 dígitos"
                  required
                  disabled={isPending}
                  pattern="\d{15}"
                  maxLength="15"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center border border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                <span className="text-xs font-medium text-blue-400">
                  Equipo Single SIM
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Caja Master de Destino
          </label>
          <input
            type="text"
            name="new_master_box"
            value={formData.new_master_box}
            onChange={handleChange}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-sm shadow-sm bg-white"
            placeholder="Escaneá el código de la caja master"
            required
            disabled={isPending}
          />
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="w-1/3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm disabled:bg-blue-400"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
              </>
            ) : (
              '📦 Confirmar Repuesto'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
