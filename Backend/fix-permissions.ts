import pkg from 'pg';
const { Client } = pkg;

async function fixPermissions() {
  console.log('Fixing database permissions...\n');
  
  const adminClient = new Client({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'jcbdb',
  });

  try {
    await adminClient.connect();
    console.log('✓ Connected to jcbdb\n');

    console.log('Granting full schema permissions...');
    
    // Grant all privileges on schema public
    await adminClient.query('GRANT ALL ON SCHEMA public TO jcbuser;');
    console.log('✓ Granted ALL on SCHEMA public');
    
    // Make jcbuser the owner of public schema
    await adminClient.query('ALTER SCHEMA public OWNER TO jcbuser;');
    console.log('✓ Changed public schema owner to jcbuser');
    
    // Grant default privileges for future tables
    await adminClient.query(
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO jcbuser;"
    );
    console.log('✓ Set default privileges for tables');
    
    // Grant privileges on existing tables
    const tablesResult = await adminClient.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    
    for (const table of tablesResult.rows) {
      await adminClient.query(`GRANT ALL ON TABLE public.${table.tablename} TO jcbuser;`);
    }
    
    if (tablesResult.rows.length > 0) {
      console.log(`✓ Granted privileges on ${tablesResult.rows.length} existing tables`);
    }
    
    console.log('\n✅ Permission setup completed!');

    await adminClient.end();
  } catch (error) {
    console.error('❌ Permission fix failed:', error);
    await adminClient.end();
    process.exit(1);
  }
}

fixPermissions();
