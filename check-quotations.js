const mysql = require('mysql2/promise');

async function checkQuotations() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system'
  });

  try {
    console.log('Checking quotations in database...');
    
    // Check quotations
    const [quotations] = await connection.query(`
      SELECT id, customer_name, admin_user_id, user_id, created_at 
      FROM quotations
    `);
    
    console.log('\n📋 Quotations in database:');
    if (quotations.length === 0) {
      console.log('No quotations found');
    } else {
      quotations.forEach(q => {
        console.log(`ID: ${q.id}, Customer: ${q.customer_name}, Admin ID: ${q.admin_user_id}, User ID: ${q.user_id}, Created: ${q.created_at}`);
      });
    }

    // Check users
    const [users] = await connection.query(`
      SELECT id, email, full_name, role 
      FROM users
    `);
    
    console.log('\n👥 Users in database:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.full_name}, Role: ${u.role}`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await connection.end();
  }
}

checkQuotations();
