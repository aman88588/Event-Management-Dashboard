import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function testConnection() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // Hide password

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log('\nAttempting to connect...');
        const client = await pool.connect();
        console.log('✅ Connection successful!');

        const result = await client.query('SELECT NOW()');
        console.log('✅ Query successful!');
        console.log('Server time:', result.rows[0].now);

        client.release();
        await pool.end();

        console.log('\n✅ Database is working correctly!');
    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error('Error:', error.message);

        if (error.code === 'ENOTFOUND') {
            console.log('\n🔍 Troubleshooting steps:');
            console.log('1. Check if your Supabase project is PAUSED');
            console.log('   → Go to: https://supabase.com/dashboard');
            console.log('   → Find your project and click "Resume" if paused');
            console.log('\n2. Verify your DATABASE_URL in .env file');
            console.log('   → Go to Supabase Dashboard → Settings → Database');
            console.log('   → Copy the connection string');
            console.log('\n3. Check your internet connection');
        }

        process.exit(1);
    }
}

testConnection();