import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const useApproveSwap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ swapId, comment }) => {
      // 🔥 MODO BLINDADO: Ya no armamos el paquete ni llamamos a Google desde acá.
      // Solo actualizamos la base de datos. El Webhook nativo de Supabase
      // detectará este cambio (UPDATE) y le enviará la fila entera a Google Sheets en secreto.

      const response = await apiClient.patch(`/swaps?id=eq.${swapId}`, {
        status: 'completed',
        quality_status: 'APROBADO',
        systems_observation: comment,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      // El cambio de pestaña en la interfaz ya es suficiente confirmación
    },
  });
};
