import { createClient } from '@supabase/supabase-js';

// Leemos las llaves secretas que ya tenés en tu proyecto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos el conector oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
