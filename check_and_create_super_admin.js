const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './production-config.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'luxone_quotation_system',
  port: Number(process.env.DB_PORT || 3306),
});

async function checkAndCreateSuperAdmin() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Check if users table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('❌ Users table does not exist!');
      return;
    }
    
    // Get all users
    const [users] = await pool.query('SELECT id, email, full_name, role, created_at FROM users ORDER BY id');
    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Name: ${user.full_name}`);
    });
    
    // Check for super admin
    const superAdmins = users.filter(user => user.role === 'super_admin');
    console.log(`\n👑 Found ${superAdmins.length} super admin(s):`);
    
    superAdmins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.full_name})`);
    });
    
    // Create super admin if none exists
    if (superAdmins.length === 0) {
      console.log('\n➕ No super admin found. Creating one...');
      
      const email = 'superadmin@luxone.com';
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await pool.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active, permissions, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        email,
        hashedPassword,
        'Super Administrator',
        'super_admin',
        1,
        JSON.stringify({
          can_manage_users: true,
          can_manage_company_settings: true,
          can_access_admin_panel: true,
          can_change_passwords: true,
          can_access_super_admin: true
        })
      ]);
      
      console.log(`✅ Super admin created successfully!`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   User ID: ${result.insertId}`);
    } else {
      console.log('\n✅ Super admin already exists. No action needed.');
    }
    
    // Test login
    console.log('\n🧪 Testing super admin login...');
    const testEmail = 'superadmin@luxone.com';
    const testPassword = 'password';
    
    const [testUser] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "super_admin"', [testEmail]);
    
    if (testUser.length > 0) {
      const user = testUser[0];
      const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
      
      if (passwordMatch) {
        console.log('✅ Login test successful!');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);
      } else {
        console.log('❌ Login test failed - password mismatch');
        console.log('   You may need to reset the password manually');
      }
    } else {
      console.log('❌ Login test failed - user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndCreateSuperAdmin();
