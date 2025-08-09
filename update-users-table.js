const mysql = require('mysql2/promise');

async function updateUsersTable() {
  console.log('Updating users table with role management...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system',
    port: 3306
  });

  try {
    // Add role column to users table if it doesn't exist
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS permissions JSON NULL
    `);
    console.log('✅ Users table updated with role management');

    // Create a super admin user if it doesn't exist
    const bcrypt = require('bcryptjs');
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO users (email, password_hash, full_name, role, permissions) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      'superadmin@theluxone.com',
      superAdminPassword,
      'Super Administrator',
      'super_admin',
      JSON.stringify({
        can_manage_users: true,
        can_manage_admins: true,
        can_view_quotes: true,
        can_edit_quotes: true,
        can_view_analytics: true,
        can_edit_company_settings: true,
        can_change_passwords: true,
        can_access_super_admin: true
      })
    ]);
    console.log('✅ Super admin user created/updated');

    // Create a default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO users (email, password_hash, full_name, role, permissions) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      'admin@theluxone.com',
      adminPassword,
      'System Administrator',
      'admin',
      JSON.stringify({
        can_manage_users: false,
        can_manage_admins: false,
        can_view_quotes: true,
        can_edit_quotes: true,
        can_view_analytics: true,
        can_edit_company_settings: true,
        can_change_passwords: false,
        can_access_super_admin: false
      })
    ]);
    console.log('✅ Default admin user created/updated');

    console.log('\n🎉 Users table updated successfully!');
    console.log('\nDefault credentials:');
    console.log('Super Admin: superadmin@theluxone.com / superadmin123');
    console.log('Admin: admin@theluxone.com / admin123');
    
  } catch (error) {
    console.error('Error updating users table:', error);
  } finally {
    await connection.end();
  }
}

updateUsersTable();
