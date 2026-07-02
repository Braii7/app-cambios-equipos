import axios from 'axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Configuramos la conexión directa y segura a PostgREST (el motor de Supabase)
export const apiClient = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
});

// Este puente adapta los códigos del arquitecto para que Supabase los entienda sin un servidor intermedio
apiClient.interceptors.request.use((config) => {
  // 1. Si pide /me, le traemos el primer usuario de la tabla para testear el Dashboard
  if (config.url === '/me') {
    config.url = '/users?limit=1';
  }
  // 2. Si aprueba un equipo, lo transformamos en una actualización (PATCH) de Supabase
  const approveMatch = config.url.match(
    /\/swaps\/(.+)\/actions\/approve-quality/
  );
  if (approveMatch) {
    const swapId = approveMatch[1];
    config.url = `/swaps?id=eq.${swapId}`;
    config.method = 'PATCH';
    config.data = { status: 'APPROVED_QA' };
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  if (response.config.url.includes('/users?limit=1')) {
    // Si no encuentra usuarios en tu tabla, te loguea temporalmente como admin para que puedas probar los botones
    response.data = response.data[0] || {
      id: 'mock-1',
      full_name: 'Brian (Newsan Admin)',
      role: 'admin',
    };
  }
  return response;
});
