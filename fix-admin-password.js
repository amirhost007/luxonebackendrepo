const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fixAdminPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system'
  });

  try {
    console.log('Fixing admin user passwords...');
    
    // Hash the admin password
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    // Update admin users with correct password
    await connection.query(`
      UPDATE users 
      SET password_hash = ? 
      WHERE role = 'admin'
    `, [adminPassword]);
    
    console.log('✅ Admin passwords updated successfully');
    
    // Verify the update
    const [users] = await connection.query(`
      SELECT id, email, full_name, role 
      FROM users 
      WHERE role = 'admin'
    `);
    
    console.log('\n👥 Admin users:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.full_name}, Role: ${u.role}`);
    });
    
  } catch (error) {
    console.error('Error fixing admin passwords:', error);
  } finally {
    await connection.end();
  }
}

fixAdminPassword();
