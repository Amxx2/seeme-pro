import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string ?? '';

// Graceful init — app won't crash if keys are missing; queries will just fail silently
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
