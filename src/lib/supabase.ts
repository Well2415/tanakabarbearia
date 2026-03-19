// Usando a instância global carregada via script no index.html para compatibilidade total com Vite/Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key must be provided in Environment Variables');
}

// @ts-ignore - a biblioteca é carregada globalmente pelo index.html
export const supabase = (window as any).supabase.createClient(supabaseUrl, supabaseAnonKey);
