const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  const config = {
    host: 'localhost',
    user: 'root',
    password: '', // Update this if you have a password
    database: 'luxone_quotation_system',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful:', rows);
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
    console.log('\n🎉 Database is ready for use!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure MySQL is running on localhost:3306');
    console.log('2. Check if the database "luxone_quotation_system" exists');
    console.log('3. Verify your MySQL username and password');
    console.log('4. Run setup-local-db.js to create the database and tables');
  }
}

testDatabaseConnection();
