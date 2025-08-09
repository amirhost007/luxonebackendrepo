const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createEssentialTables() {
  console.log('🔄 Creating essential database tables...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system',
    port: 3306
  });

  try {
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        permissions JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_active (is_active)
      )
    `);
    console.log('✅ Users table created');

    // Create company_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_user_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        address TEXT,
        logo_url VARCHAR(500),
        logo_file_path VARCHAR(500),
        logo_file_name VARCHAR(255),
        whatsapp_india VARCHAR(50),
        whatsapp_uae VARCHAR(50),
        admin_email VARCHAR(255),
        form_fields JSON,
        pdf_templates JSON,
        active_pdf_template VARCHAR(255),
        pricing_rules JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_admin_settings (admin_user_id),
        INDEX idx_admin_user (admin_user_id)
      )
    `);
    console.log('✅ Company settings table created');

    // Update quotations table to include admin_user_id
    await connection.query(`
      ALTER TABLE quotations 
      ADD COLUMN IF NOT EXISTS admin_user_id INT NULL,
      ADD INDEX IF NOT EXISTS idx_admin_user (admin_user_id)
    `);
    console.log('✅ Updated quotations table with admin_user_id');

    // Create default users
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    // Insert super admin
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
    console.log('✅ Super admin user created');

    // Insert admin
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
    console.log('✅ Admin user created');

    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📊 Available tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Verify users
    const [users] = await connection.query('SELECT email, role FROM users');
    console.log('\n👥 Available users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    console.log('\n🎉 Essential tables created successfully!');
    console.log('\n📝 Login URLs:');
    console.log('- Super Admin: http://localhost:5174/super-admin-login');
    console.log('- Admin: http://localhost:5174/admin-login');
    console.log('- User: http://localhost:5174/user-login');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await connection.end();
  }
}

createEssentialTables();
