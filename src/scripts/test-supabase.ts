// @ts-ignore
import { Client } from 'pg';

// Senha URL-encoded: VjYUL50noFni3wzWQ05bBm6Mh%218GYZzxcuM%25Ghgu
const url = 'postgresql://postgres.xzzvhwnxjfofhjvvzroz:VjYUL50noFni3wzWQ05bBm6Mh%218GYZzxcuM%25Ghgu@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function test() {
    console.log('Testando conexão com Supabase...');
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('✅ CONECTADO AO SUPABASE!');
        const res = await client.query('SELECT NOW()');
        console.log('Hora no banco:', res.rows[0].now);
        await client.end();
    } catch (err: any) {
        console.error('❌ FALHOU:', err.message);
    }
}

test();
