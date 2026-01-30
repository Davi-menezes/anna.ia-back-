// @ts-ignore
import { Client } from 'pg';

const url = process.env.DATABASE_URL;

async function test() {
    console.log('Testando conexão com Supabase...');
    if (!url) {
        console.error('❌ FALHOU: DATABASE_URL não definido');
        return;
    }
    // Log URL sem senha
    const maskedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('URL (senha oculta):', maskedUrl);
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
