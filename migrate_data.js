import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://ipdosmdjbcftcbqhxqle.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZG9zbWRqYmNmdGNicWh4cWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg5OTgzNCwiZXhwIjoyMDkyNDc1ODM0fQ.oayb3Elob4f9QR2QfkXiJnzyDLPO5VH_yQaN0E1jKBw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const backupDir = './backup barbearia';

function parseCSV(content) {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        // Regex para lidar com vírgulas dentro de aspas (campos JSON)
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const obj = {};
        headers.forEach((h, i) => {
            let val = parts[i]?.trim();
            if (val && val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            
            // Tenta converter campos JSON de volta para objeto/array
            if (val && (val.startsWith('[') || val.startsWith('{'))) {
                try {
                    obj[h] = JSON.parse(val);
                } catch (e) {
                    obj[h] = val;
                }
            } else {
                obj[h] = (val === '' || val === undefined) ? null : val;
            }
        });
        return obj;
    });
}

async function migrate() {
    // Ordem de inserção respeitando as chaves estrangeiras (Foreign Keys)
    const tables = [
        'users',
        'barbers',
        'services',
        'products',
        'expense_categories',
        'expenses',
        'appointments',
        'recurring_schedules',
        'shop_settings',
        'notification_logs'
    ];

    for (const table of tables) {
        try {
            console.log(`🚀 Iniciando migração da tabela: ${table}...`);
            const filePath = path.join(backupDir, `${table}_rows.csv`);
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ Arquivo ${filePath} não encontrado. Pulando.`);
                continue;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const data = parseCSV(content);
            
            if (data.length === 0) {
                console.log(`ℹ️ Tabela ${table} está vazia.`);
                continue;
            }

            // Inserção em lotes de 50 para não sobrecarregar
            for (let i = 0; i < data.length; i += 50) {
                const batch = data.slice(i, i + 50);
                const { error } = await supabase.from(table).upsert(batch);
                if (error) {
                    console.error(`❌ Erro ao inserir lote na tabela ${table}:`, error.message);
                }
            }
            console.log(`✅ Tabela ${table} migrada com sucesso!`);
        } catch (err) {
            console.error(`❌ Erro crítico na tabela ${table}:`, err.message);
        }
    }
    console.log('\n✨ Migração concluída!');
}

migrate();
