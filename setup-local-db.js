const mysql = require('mysql2/promise');

async function setupLocalDatabase() {
  console.log('Setting up local database...');
  
  // First, connect without specifying a database to create it
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Update this if you have a password
    port: 3306
  });

  try {
    // Create database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS luxone_quotation_system');
    console.log('Database "luxone_quotation_system" created or already exists');
    
    // Use the database
    await connection.query('USE luxone_quotation_system');
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or already exists');
    
    // Create admin_users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Admin users table created or already exists');
    
    // Create quotations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quote_id VARCHAR(255) UNIQUE,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_location VARCHAR(255),
        service_level VARCHAR(100),
        material_source VARCHAR(100),
        material_type VARCHAR(100),
        material_color VARCHAR(100),
        worktop_layout TEXT,
        project_type VARCHAR(100),
        timeline VARCHAR(100),
        sink_option VARCHAR(100),
        additional_comments TEXT,
        quote_data JSON,
        pricing_data JSON,
        total_area DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'AED',
        status VARCHAR(50) DEFAULT 'pending',
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Quotations table created or already exists');
    
    console.log('\n✅ Local database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Create a .env file in the luxonebackendrepo directory');
    console.log('2. Add the database configuration from env-config.txt');
    console.log('3. Start the backend server with: npm run dev');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

setupLocalDatabase();
