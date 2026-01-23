// @ts-ignore
import { Client } from 'pg';

const url = 'postgresql://postgres.xzzvhwnxjfofhjvvzroz:VjYUL50noFni3wzWQ05bBm6Mh%218GYZzxcuM%25Ghgu@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function verifyTables() {
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('--- Verificando Tabelas no Supabase ---');

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        const tables = res.rows.map((r: any) => r.table_name);
        console.log('Tabelas encontradas:', tables.join(', '));

        if (tables.includes('users') && tables.includes('study_plans')) {
            console.log('✅ DATABASE PRONTA! users e study_plans existem.');
        } else {
            console.log('⚠️ ALERTA: Algumas tabelas podem estar faltando.');
        }

        await client.end();
    } catch (err: any) {
        console.error('❌ ERRO NA VERIFICAÇÃO:', err.message);
    }
}

verifyTables();
