const mysql = require('mysql2/promise');

async function updateCompanySettingsTable() {
  console.log('Updating company_settings table with new structure...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system',
    port: 3306
  });

  try {
    // Drop existing company_settings table if it exists
    await connection.query('DROP TABLE IF EXISTS company_settings');
    console.log('✅ Dropped existing company_settings table');

    // Create new company_settings table with updated structure
    await connection.query(`
      CREATE TABLE company_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_user_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        manager_name VARCHAR(255) NOT NULL,
        sales_contact_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        margin_rate DECIMAL(5,2) DEFAULT 0.00,
        email VARCHAR(255) NOT NULL,
        website VARCHAR(500),
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_admin_settings (admin_user_id),
        INDEX idx_admin_user (admin_user_id),
        INDEX idx_company_name (company_name)
      )
    `);
    console.log('✅ Created new company_settings table with updated structure');

    // Insert sample data for existing users
    const [users] = await connection.query('SELECT id, email, full_name FROM users WHERE role IN ("admin", "super_admin")');
    
    for (const user of users) {
      await connection.query(`
        INSERT INTO company_settings (
          admin_user_id, company_name, manager_name, sales_contact_name, 
          mobile_number, address, margin_rate, email, website, logo_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        `${user.full_name}'s Company`,
        user.full_name,
        'Sales Contact',
        '+1234567890',
        '123 Business Street, City, State 12345',
        15.00,
        user.email,
        'https://example.com',
        ''
      ]);
    }
    console.log(`✅ Inserted sample data for ${users.length} users`);

    // Verify the table structure
    const [columns] = await connection.query('DESCRIBE company_settings');
    console.log('\n📊 Company settings table structure:');
    columns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Verify sample data
    const [settings] = await connection.query(`
      SELECT cs.*, u.email as admin_email, u.full_name as admin_name 
      FROM company_settings cs 
      JOIN users u ON cs.admin_user_id = u.id
    `);
    console.log('\n📋 Sample company settings:');
    settings.forEach(setting => {
      console.log(`  - ${setting.admin_name}: ${setting.company_name} (${setting.margin_rate}% margin)`);
    });

    console.log('\n🎉 Company settings table updated successfully!');
    console.log('\n📝 New fields available:');
    console.log('  - company_name: Company name');
    console.log('  - manager_name: Manager name');
    console.log('  - sales_contact_name: Sales contact name');
    console.log('  - mobile_number: Mobile number');
    console.log('  - address: Company address');
    console.log('  - margin_rate: Commission margin rate (%)');
    console.log('  - email: Contact email');
    console.log('  - website: Company website (optional)');
    console.log('  - logo_url: Company logo URL (optional)');

  } catch (error) {
    console.error('❌ Error updating company settings table:', error);
  } finally {
    await connection.end();
  }
}

// Run the migration
updateCompanySettingsTable();
