import pkg from 'pg';
const { Client } = pkg;

const testConnections = [
  {
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
  },
  {
    user: 'postgres',
    password: '',
    host: 'localhost',
    port: 5432,
  },
  {
    user: 'jcbuser',
    password: 'jcbpassword',
    host: 'localhost',
    port: 5432,
  },
];

async function testConnection(config: any) {
  try {
    const client = new Client({
      ...config,
      database: 'postgres', // Connect to default database
    });
    
    await client.connect();
    console.log(`✓ Connected as ${config.user}`);
    
    // Try to list databases
    const result = await client.query('SELECT datname FROM pg_database WHERE datname = \'jcbdb\'');
    if (result.rows.length > 0) {
      console.log('  ✓ jcbdb database exists');
    } else {
      console.log('  ✗ jcbdb database does NOT exist');
    }
    
    await client.end();
    return true;
  } catch (error: any) {
    console.log(`✗ Failed as ${config.user}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing PostgreSQL connections...\n');
  
  for (const config of testConnections) {
    await testConnection(config);
  }
}

main();
