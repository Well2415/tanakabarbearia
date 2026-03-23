import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 * Este arquivo estabelece a conexão com o banco de dados Supabase.
 * As chaves são lidas das variáveis de ambiente definidas no provedor de hospedagem (Vercel).
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança para garantir que as chaves existem
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: Supabase URL e Anon Key precisam estar configurados nas Variáveis de Ambiente.');
}

// Inicializa o cliente único do Supabase usado em toda a aplicação.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
