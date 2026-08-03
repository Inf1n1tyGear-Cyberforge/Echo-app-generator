import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udkmhxmcmaykawkdynor.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka21oeG1jbWF5a2F3a2R5bm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTA4NjYsImV4cCI6MjEwMDcyNjg2Nn0.r8w_3ca6idjKz6peerWAnX-cXJhjZmz8qHZ7AZeDJqM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
  },
});

export const isSupabaseConnected = () => supabase !== null;
