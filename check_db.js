import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ipdosmdjbcftcbqhxqle.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZG9zbWRqYmNmdGNicWh4cWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg5OTgzNCwiZXhwIjoyMDkyNDc1ODM0fQ.oayb3Elob4f9QR2QfkXiJnzyDLPO5VH_yQaN0E1jKBw'
);

async function checkUser() {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'MICHELE')
        .single();
    
    if (error) {
        console.log('❌ Usuário MICHELE não encontrado via exact match:', error.message);
        const { data: search, error: err2 } = await supabase
            .from('users')
            .select('username, password')
            .ilike('username', '%michele%');
        console.log('Busca aproximada por michele:', search);
    } else {
        console.log('✅ Usuário MICHELE encontrado:', user.username, 'Senha:', user.password);
    }
}

checkUser();
