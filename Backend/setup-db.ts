import pkg from 'pg';
const { Client } = pkg;

async function setupDatabase() {
  console.log('Setting up JCB database...\n');
  
  // Connect as postgres admin
  const adminClient = new Client({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('✓ Connected as postgres admin\n');

    // Check if database exists
    console.log('Checking if jcbdb exists...');
    const dbCheck = await adminClient.query(
      "SELECT datname FROM pg_database WHERE datname = 'jcbdb'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('Creating jcbdb database...');
      await adminClient.query('CREATE DATABASE jcbdb;');
      console.log('✓ jcbdb database created\n');
    } else {
      console.log('✓ jcbdb database already exists\n');
    }

    // Check if user exists
    console.log('Checking if jcbuser exists...');
    const userCheck = await adminClient.query(
      "SELECT usename FROM pg_user WHERE usename = 'jcbuser'"
    );

    if (userCheck.rows.length === 0) {
      console.log('Creating jcbuser...');
      await adminClient.query(
        "CREATE USER jcbuser WITH PASSWORD 'jcbpassword';"
      );
      console.log('✓ jcbuser created\n');
    } else {
      console.log('✓ jcbuser already exists');
      console.log('Updating jcbuser password...');
      await adminClient.query(
        "ALTER USER jcbuser WITH PASSWORD 'jcbpassword';"
      );
      console.log('✓ jcbuser password updated\n');
    }

    // Grant privileges
    console.log('Granting privileges to jcbuser...');
    await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE jcbdb TO jcbuser;');
    await adminClient.query('GRANT ALL ON SCHEMA public TO jcbuser;');
    console.log('✓ Privileges granted\n');

    console.log('✅ Database setup completed!\n');
    console.log('Connection details:');
    console.log('  Host: localhost');
    console.log('  Port: 5432');
    console.log('  User: jcbuser');
    console.log('  Password: jcbpassword');
    console.log('  Database: jcbdb');

    await adminClient.end();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    await adminClient.end();
    process.exit(1);
  }
}

setupDatabase();
