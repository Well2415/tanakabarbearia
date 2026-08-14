import { createClient } from '@supabase/supabase-js';

// Carrega as variáveis do .env local (nunca deixe chaves hardcoded no código).
process.loadEnvFile();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE no arquivo .env antes de rodar este script.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkColumns() {
    const { data, error } = await supabase.from('appointments').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log(data);
    }
}

checkColumns();
