import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ipdosmdjbcftcbqhxqle.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZG9zbWRqYmNmdGNicWh4cWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTk4MzQsImV4cCI6MjA5MjQ3NTgzNH0.lrA8NZ3M0shSROPDYw3rkcdlcy71FXkLcB5S-MDNJVo'
);

async function checkColumns() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('❌ Erro ao buscar dados:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Colunas de users:', Object.keys(data[0]));
    } else {
        console.log('ℹ️ Tabela users vazia.');
    }
}

checkColumns();
