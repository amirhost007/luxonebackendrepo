const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'auth-db629.hstgr.io',
  user: 'u184056080_luxoneusernam',
  password: 'Luxone_quotation_@123321',
  database: 'u184056080_luxone_quot',
  port: 3306
};

async function testProfitMargin() {
  let connection;
  try {
    console.log('🔍 Testing profit margin functionality...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check table structure
    console.log('\n📋 Checking table structure...');
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Check if profit_margin column exists
    const profitMarginColumn = columns.find(col => col.Field === 'profit_margin');
    if (!profitMarginColumn) {
      console.log('\n❌ profit_margin column does not exist!');
      return;
    }
    console.log('\n✅ profit_margin column exists');
    
    // Check existing users with profit margins
    console.log('\n👥 Checking existing users...');
    const [users] = await connection.execute('SELECT id, email, role, profit_margin FROM users');
    console.log('Existing users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}): ${user.profit_margin}%`);
    });
    
    // Test inserting a user with profit margin
    console.log('\n🧪 Testing user insertion with profit margin...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testUser = {
      email: testEmail,
      password_hash: 'test_hash',
      full_name: 'Test User',
      role: 'admin',
      permissions: JSON.stringify({}),
      profit_margin: 25.50
    };
    
    await connection.execute(
      'INSERT INTO users (email, password_hash, full_name, role, permissions, profit_margin) VALUES (?, ?, ?, ?, ?, ?)',
      [testUser.email, testUser.password_hash, testUser.full_name, testUser.role, testUser.permissions, testUser.profit_margin]
    );
    console.log('✅ Test user inserted');
    
    // Verify the inserted user
    const [insertedUser] = await connection.execute('SELECT * FROM users WHERE email = ?', [testEmail]);
    console.log('Inserted user data:', insertedUser[0]);
    
    // Clean up test user
    await connection.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testProfitMargin();
