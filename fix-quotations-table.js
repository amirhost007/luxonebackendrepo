const mysql = require('mysql2/promise');

async function fixQuotationsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system'
  });

  try {
    console.log('Checking quotations table structure...');
    
    // Check if quote_id column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'quote_id'
    `);
    
    if (columns.length === 0) {
      console.log('Adding quote_id column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN quote_id VARCHAR(50) AFTER id
      `);
      console.log('✅ quote_id column added successfully');
    } else {
      console.log('✅ quote_id column already exists');
    }
    
    // Check if admin_user_id column exists
    const [adminColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'admin_user_id'
    `);
    
    if (adminColumns.length === 0) {
      console.log('Adding admin_user_id column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN admin_user_id INT AFTER user_id,
        ADD FOREIGN KEY (admin_user_id) REFERENCES users(id)
      `);
      console.log('✅ admin_user_id column added successfully');
    } else {
      console.log('✅ admin_user_id column already exists');
    }

    // Check if customer_location column exists
    const [locationColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'customer_location'
    `);
    
    if (locationColumns.length === 0) {
      console.log('Adding customer_location column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN customer_location VARCHAR(255) AFTER customer_phone
      `);
      console.log('✅ customer_location column added successfully');
    } else {
      console.log('✅ customer_location column already exists');
    }

    // Check if service_level column exists
    const [serviceColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'service_level'
    `);
    
    if (serviceColumns.length === 0) {
      console.log('Adding service_level column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN service_level VARCHAR(100) AFTER customer_location
      `);
      console.log('✅ service_level column added successfully');
    } else {
      console.log('✅ service_level column already exists');
    }

    // Check if material_source column exists
    const [sourceColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'material_source'
    `);
    
    if (sourceColumns.length === 0) {
      console.log('Adding material_source column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN material_source VARCHAR(100) AFTER service_level
      `);
      console.log('✅ material_source column added successfully');
    } else {
      console.log('✅ material_source column already exists');
    }

    // Check if material_type column exists
    const [typeColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'material_type'
    `);
    
    if (typeColumns.length === 0) {
      console.log('Adding material_type column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN material_type VARCHAR(100) AFTER material_source
      `);
      console.log('✅ material_type column added successfully');
    } else {
      console.log('✅ material_type column already exists');
    }

    // Check if material_color column exists
    const [colorColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'material_color'
    `);
    
    if (colorColumns.length === 0) {
      console.log('Adding material_color column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN material_color VARCHAR(100) AFTER material_type
      `);
      console.log('✅ material_color column added successfully');
    } else {
      console.log('✅ material_color column already exists');
    }

    // Check if worktop_layout column exists
    const [layoutColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'worktop_layout'
    `);
    
    if (layoutColumns.length === 0) {
      console.log('Adding worktop_layout column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN worktop_layout TEXT AFTER material_color
      `);
      console.log('✅ worktop_layout column added successfully');
    } else {
      console.log('✅ worktop_layout column already exists');
    }

    // Check if sink_option column exists
    const [sinkColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'sink_option'
    `);
    
    if (sinkColumns.length === 0) {
      console.log('Adding sink_option column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN sink_option VARCHAR(100) AFTER worktop_layout
      `);
      console.log('✅ sink_option column added successfully');
    } else {
      console.log('✅ sink_option column already exists');
    }

    // Check if additional_comments column exists
    const [commentsColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'additional_comments'
    `);
    
    if (commentsColumns.length === 0) {
      console.log('Adding additional_comments column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN additional_comments TEXT AFTER sink_option
      `);
      console.log('✅ additional_comments column added successfully');
    } else {
      console.log('✅ additional_comments column already exists');
    }

    // Check if quote_data column exists
    const [quoteDataColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'quote_data'
    `);
    
    if (quoteDataColumns.length === 0) {
      console.log('Adding quote_data column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN quote_data JSON AFTER additional_comments
      `);
      console.log('✅ quote_data column added successfully');
    } else {
      console.log('✅ quote_data column already exists');
    }

    // Check if pricing_data column exists
    const [pricingDataColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'pricing_data'
    `);
    
    if (pricingDataColumns.length === 0) {
      console.log('Adding pricing_data column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN pricing_data JSON AFTER quote_data
      `);
      console.log('✅ pricing_data column added successfully');
    } else {
      console.log('✅ pricing_data column already exists');
    }

    // Check if total_amount column exists
    const [totalAmountColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'luxone_quotation_system' 
      AND TABLE_NAME = 'quotations' 
      AND COLUMN_NAME = 'total_amount'
    `);
    
    if (totalAmountColumns.length === 0) {
      console.log('Adding total_amount column to quotations table...');
      await connection.query(`
        ALTER TABLE quotations 
        ADD COLUMN total_amount DECIMAL(10,2) AFTER pricing_data
      `);
      console.log('✅ total_amount column added successfully');
    } else {
      console.log('✅ total_amount column already exists');
    }

    // Fix worktop_layout column if it has constraint issues
    console.log('Checking worktop_layout column for constraint issues...');
    try {
      await connection.query(`
        ALTER TABLE quotations 
        MODIFY COLUMN worktop_layout LONGTEXT NULL
      `);
      console.log('✅ worktop_layout column fixed successfully');
    } catch (error) {
      console.log('⚠️ worktop_layout column modification failed, but continuing...');
    }

    // Fix timeline column if it has constraint issues
    console.log('Checking timeline column for constraint issues...');
    try {
      await connection.query(`
        ALTER TABLE quotations 
        MODIFY COLUMN timeline LONGTEXT NULL
      `);
      console.log('✅ timeline column fixed successfully');
    } catch (error) {
      console.log('⚠️ timeline column modification failed, but continuing...');
    }

    // Fix quote_data column if it has constraint issues
    console.log('Checking quote_data column for constraint issues...');
    try {
      await connection.query(`
        ALTER TABLE quotations 
        MODIFY COLUMN quote_data LONGTEXT NULL
      `);
      console.log('✅ quote_data column fixed successfully');
    } catch (error) {
      console.log('⚠️ quote_data column modification failed, but continuing...');
    }

    // Fix pricing_data column if it has constraint issues
    console.log('Checking pricing_data column for constraint issues...');
    try {
      await connection.query(`
        ALTER TABLE quotations 
        MODIFY COLUMN pricing_data LONGTEXT NULL
      `);
      console.log('✅ pricing_data column fixed successfully');
    } catch (error) {
      console.log('⚠️ pricing_data column modification failed, but continuing...');
    }
    
    console.log('✅ Database schema updated successfully');
    
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await connection.end();
  }
}

fixQuotationsTable();
