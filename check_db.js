import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ipdosmdjbcftcbqhxqle.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZG9zbWRqYmNmdGNicWh4cWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg5OTgzNCwiZXhwIjoyMDkyNDc1ODM0fQ.oayb3Elob4f9QR2QfkXiJnzyDLPO5VH_yQaN0E1jKBw'
);

async function checkAllCounts() {
    const tables = [
        'users', 'barbers', 'services', 'products', 'appointments', 
        'expenses', 'expense_categories', 'recurring_schedules', 
        'shop_settings', 'notification_logs'
    ];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Erro na tabela ${table}:`, error.message);
        } else {
            console.log(`📊 ${table}: ${count} registros`);
        }
    }
}

checkAllCounts();
