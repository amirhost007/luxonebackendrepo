const mysql = require('mysql2/promise');

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system'
  });

  try {
    console.log('Checking quotations table structure...');
    
    // Get table structure
    const [columns] = await connection.query(`
      DESCRIBE quotations
    `);
    
    console.log('\n📋 Quotations table structure:');
    columns.forEach(column => {
      console.log(`  ${column.Field} - ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });

    // Check for constraints
    const [constraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        CONSTRAINT_TYPE
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations'
    `);
    
    console.log('\n🔒 Table constraints:');
    constraints.forEach(constraint => {
      console.log(`  ${constraint.CONSTRAINT_NAME} - ${constraint.COLUMN_NAME} (${constraint.CONSTRAINT_TYPE})`);
    });

  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    await connection.end();
  }
}

checkTableStructure();
