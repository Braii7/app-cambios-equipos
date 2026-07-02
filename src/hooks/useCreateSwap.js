import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const useCreateSwap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSwapData) => {
      // Inyectamos todos los comodines para pasar los candados de Supabase
      const dataToSend = {
        ...newSwapData,
        status: 'pending',
        shift: 'Turno Mañana',
        supervisor: 'Supervisor de Turno',
        material: '123456',
        quantity: 1,
        color_model: newSwapData.color || 'S/N', // <-- ¡Engañamos a la columna vieja usando el color nuevo!
        quality_status: 'PENDIENTE',
        it_confirmation: 'Pendiente',
      };

      const response = await apiClient.post('/swaps', dataToSend);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
    },
  });
};
