const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyNewSchema() {
  console.log('🔄 Applying new database schema with data isolation...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system',
    port: 3306
  });

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
          await connection.query(statement);
        } catch (error) {
          console.log(`⚠️  Warning: ${error.message}`);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Database schema applied successfully!');
    
    // Verify the tables were created
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📊 Created tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });
    
    // Verify default users were created
    const [users] = await connection.query('SELECT email, role FROM users');
    console.log('\n👥 Default users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your backend API routes to use the new schema');
    console.log('2. Test the login system with different user types');
    console.log('3. Verify data isolation between admins');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
  } finally {
    await connection.end();
  }
}

applyNewSchema();
