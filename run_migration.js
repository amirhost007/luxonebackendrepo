const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'luxone_quotation_system'
  });

  try {
    console.log('Running migration: Adding logo file columns to company_settings table...');
    
    // Add logo file columns to company_settings table
    await connection.execute(`
      ALTER TABLE company_settings 
      ADD COLUMN logo_file_name VARCHAR(255) DEFAULT NULL AFTER logo_url,
      ADD COLUMN logo_file_path VARCHAR(500) DEFAULT NULL AFTER logo_file_name,
      ADD COLUMN logo_file_size INT DEFAULT NULL AFTER logo_file_path,
      ADD COLUMN logo_mime_type VARCHAR(100) DEFAULT NULL AFTER logo_file_size
    `);
    
    console.log('✓ Added logo file columns to company_settings table');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Logo file columns already exist, skipping...');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await connection.end();
  }
}

runMigration(); 