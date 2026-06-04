import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ipdosmdjbcftcbqhxqle.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZG9zbWRqYmNmdGNicWh4cWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg5OTgzNCwiZXhwIjoyMDkyNDc1ODM0fQ.oayb3Elob4f9QR2QfkXiJnzyDLPO5VH_yQaN0E1jKBw'
);

async function checkColumns() {
    const { data, error } = await supabase.from('recurring_schedules').select('*').limit(1);
    if (error) {
        console.error('❌ Erro ao buscar dados:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Colunas encontradas:', Object.keys(data[0]));
    } else {
        console.log('ℹ️ Tabela vazia ou sem dados para verificar colunas.');
    }
}

checkColumns();
