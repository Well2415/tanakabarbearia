import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE);

async function checkUsers() {
    const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('❌ Erro ao contar usuários:', error);
    } else {
        console.log(`✅ Total de usuários no banco: ${count}`);
    }

    const { data: latestUsers, error: listError } = await supabase
        .from('users')
        .select('username, email')
        .limit(5);

    if (listError) {
        console.error('❌ Erro ao listar usuários:', listError);
    } else {
        console.log('Últimos usuários:', latestUsers);
    }
}

checkUsers();
