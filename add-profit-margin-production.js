const mysql = require('mysql2/promise');

async function addProfitMarginColumnProduction() {
  console.log('🔄 Adding profit_margin column to production users table...');
  
  const connection = await mysql.createConnection({
    host: 'auth-db629.hstgr.io',
    user: 'u184056080_luxoneusernam',
    password: 'Luxone_quotation_@123321',
    database: 'u184056080_luxone_quot',
    port: 3306
  });



  try {
    // Check if profit_margin column already exists
    const [columns] = await connection.execute('DESCRIBE users');
    const profitMarginColumn = columns.find(col => col.Field === 'profit_margin');
    
    if (profitMarginColumn) {
      console.log('✅ Profit margin column already exists');
    } else {
      // Add profit_margin column to users table
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN profit_margin DECIMAL(5,2) DEFAULT 20.00
      `);
      console.log('✅ Profit margin column added to users table');
    }

    // Update existing admin users with default profit margin
    await connection.query(`
      UPDATE users 
      SET profit_margin = 20.00 
      WHERE role IN ('admin', 'super_admin') AND profit_margin IS NULL
    `);
    console.log('✅ Updated existing admin users with default profit margin');

    // Verify the changes
    const [users] = await connection.query(`
      SELECT id, email, role, profit_margin 
      FROM users 
      WHERE role IN ('admin', 'super_admin')
    `);
    
    console.log('\n📊 Admin users with profit margins:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}): ${user.profit_margin}%`);
    });

    console.log('\n🎉 Profit margin column setup completed successfully!');
    
  } catch (error) {
    console.error('Error adding profit margin column:', error);
  } finally {
    await connection.end();
  }
}

addProfitMarginColumnProduction();
