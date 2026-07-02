import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login'; // <-- IMPORTAMOS LA PANTALLA NUEVA
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Este es nuestro "Patovica". Decide si pasás o te quedás afuera.
function AppContent() {
  const { session } = useAuth();

  // Si no hay sesión (no tenés pulsera), te manda al Login
  if (!session) {
    return <Login />;
  }

  // Si tenés sesión, te abre las puertas del Dashboard
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Dashboard />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
