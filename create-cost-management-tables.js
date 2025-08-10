const mysql = require('mysql2/promise');

async function createCostManagementTables() {
  console.log('Creating cost management tables...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system',
    port: 3306
  });

  try {
    // Create cost_categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cost_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category_name (category_name),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Created cost_categories table');

    // Create cost_fields table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cost_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        field_name VARCHAR(255) NOT NULL,
        field_type ENUM('material', 'labor', 'overhead', 'transport', 'custom') NOT NULL,
        base_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        unit VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES cost_categories(id) ON DELETE CASCADE,
        INDEX idx_category_id (category_id),
        INDEX idx_field_type (field_type),
        INDEX idx_is_active (is_active),
        INDEX idx_field_name (field_name)
      )
    `);
    console.log('✅ Created cost_fields table');

    // Insert sample cost categories
    const sampleCategories = [
      {
        category_name: 'Material Costs',
        description: 'Costs related to raw materials and supplies'
      },
      {
        category_name: 'Labor Costs',
        description: 'Costs related to workforce and skilled labor'
      },
      {
        category_name: 'Overhead Costs',
        description: 'General business overhead and administrative costs'
      },
      {
        category_name: 'Transport Costs',
        description: 'Costs related to transportation and delivery'
      },
      {
        category_name: 'Installation Costs',
        description: 'Costs related to installation and setup services'
      }
    ];

    for (const category of sampleCategories) {
      await connection.query(
        'INSERT IGNORE INTO cost_categories (category_name, description) VALUES (?, ?)',
        [category.category_name, category.description]
      );
    }
    console.log('✅ Inserted sample cost categories');

    // Get category IDs for sample fields
    const [categories] = await connection.query('SELECT id, category_name FROM cost_categories');

    // Insert sample cost fields
    const sampleFields = [
      // Material Costs
      {
        category_name: 'Material Costs',
        field_name: 'Quartz Material',
        field_type: 'material',
        base_cost: 45.00,
        unit: 'per sq ft',
        description: 'High-quality quartz material for worktops'
      },
      {
        category_name: 'Material Costs',
        field_name: 'Granite Material',
        field_type: 'material',
        base_cost: 35.00,
        unit: 'per sq ft',
        description: 'Premium granite material for worktops'
      },
      {
        category_name: 'Material Costs',
        field_name: 'Marble Material',
        field_type: 'material',
        base_cost: 55.00,
        unit: 'per sq ft',
        description: 'Luxury marble material for worktops'
      },
      {
        category_name: 'Material Costs',
        field_name: 'Edge Banding',
        field_type: 'material',
        base_cost: 2.50,
        unit: 'per linear ft',
        description: 'Edge banding material for worktop edges'
      },

      // Labor Costs
      {
        category_name: 'Labor Costs',
        field_name: 'Fabrication Labor',
        field_type: 'labor',
        base_cost: 25.00,
        unit: 'per hour',
        description: 'Skilled labor for worktop fabrication'
      },
      {
        category_name: 'Labor Costs',
        field_name: 'Installation Labor',
        field_type: 'labor',
        base_cost: 30.00,
        unit: 'per hour',
        description: 'Professional installation services'
      },
      {
        category_name: 'Labor Costs',
        field_name: 'Cutting and Shaping',
        field_type: 'labor',
        base_cost: 15.00,
        unit: 'per cut',
        description: 'Precision cutting and shaping services'
      },

      // Overhead Costs
      {
        category_name: 'Overhead Costs',
        field_name: 'Shop Rent',
        field_type: 'overhead',
        base_cost: 2000.00,
        unit: 'per month',
        description: 'Monthly shop rental costs'
      },
      {
        category_name: 'Overhead Costs',
        field_name: 'Equipment Maintenance',
        field_type: 'overhead',
        base_cost: 500.00,
        unit: 'per month',
        description: 'Regular equipment maintenance costs'
      },
      {
        category_name: 'Overhead Costs',
        field_name: 'Utilities',
        field_type: 'overhead',
        base_cost: 300.00,
        unit: 'per month',
        description: 'Electricity, water, and other utilities'
      },

      // Transport Costs
      {
        category_name: 'Transport Costs',
        field_name: 'Local Delivery',
        field_type: 'transport',
        base_cost: 50.00,
        unit: 'per delivery',
        description: 'Local area delivery service'
      },
      {
        category_name: 'Transport Costs',
        field_name: 'Long Distance Delivery',
        field_type: 'transport',
        base_cost: 150.00,
        unit: 'per delivery',
        description: 'Long distance delivery service'
      },
      {
        category_name: 'Transport Costs',
        field_name: 'Fuel Surcharge',
        field_type: 'transport',
        base_cost: 0.15,
        unit: 'per km',
        description: 'Fuel surcharge for transportation'
      },

      // Installation Costs
      {
        category_name: 'Installation Costs',
        field_name: 'Sink Cutout',
        field_type: 'custom',
        base_cost: 75.00,
        unit: 'per cutout',
        description: 'Custom sink cutout service'
      },
      {
        category_name: 'Installation Costs',
        field_name: 'Faucet Installation',
        field_type: 'custom',
        base_cost: 45.00,
        unit: 'per faucet',
        description: 'Faucet installation service'
      },
      {
        category_name: 'Installation Costs',
        field_name: 'Sealing Service',
        field_type: 'custom',
        base_cost: 25.00,
        unit: 'per sq ft',
        description: 'Worktop sealing service'
      }
    ];

    for (const field of sampleFields) {
      const category = categories.find(cat => cat.category_name === field.category_name);
      if (category) {
        await connection.query(
          'INSERT IGNORE INTO cost_fields (category_id, field_name, field_type, base_cost, unit, description) VALUES (?, ?, ?, ?, ?, ?)',
          [category.id, field.field_name, field.field_type, field.base_cost, field.unit, field.description]
        );
      }
    }
    console.log('✅ Inserted sample cost fields');

    // Verify the table structure
    const [categoryColumns] = await connection.query('DESCRIBE cost_categories');
    console.log('\n📊 Cost categories table structure:');
    categoryColumns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    const [fieldColumns] = await connection.query('DESCRIBE cost_fields');
    console.log('\n📊 Cost fields table structure:');
    fieldColumns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Verify sample data
    const [categoryCount] = await connection.query('SELECT COUNT(*) as count FROM cost_categories');
    const [fieldCount] = await connection.query('SELECT COUNT(*) as count FROM cost_fields');
    
    console.log('\n📋 Sample data summary:');
    console.log(`  - Cost Categories: ${categoryCount[0].count}`);
    console.log(`  - Cost Fields: ${fieldCount[0].count}`);

    // Show sample categories with their fields
    const [categoriesWithFields] = await connection.query(`
      SELECT 
        cc.category_name,
        cc.description,
        COUNT(cf.id) as field_count,
        COALESCE(SUM(cf.base_cost), 0) as total_cost
      FROM cost_categories cc
      LEFT JOIN cost_fields cf ON cc.id = cf.category_id AND cf.is_active = 1
      GROUP BY cc.id
      ORDER BY cc.category_name
    `);

    console.log('\n📋 Sample cost categories:');
    categoriesWithFields.forEach(cat => {
      console.log(`  - ${cat.category_name}: ${cat.field_count} fields, $${parseFloat(cat.total_cost).toFixed(2)} total cost`);
    });

    console.log('\n🎉 Cost management tables created successfully!');
    console.log('\n📝 Available features:');
    console.log('  - Cost Categories: Organize costs by category');
    console.log('  - Cost Fields: Individual cost items with types');
    console.log('  - Field Types: material, labor, overhead, transport, custom');
    console.log('  - Cost Tracking: Base costs with units');
    console.log('  - Active/Inactive: Toggle field status');
    console.log('  - Total Calculations: Automatic cost summaries');

  } catch (error) {
    console.error('❌ Error creating cost management tables:', error);
  } finally {
    await connection.end();
  }
}

// Run the migration
createCostManagementTables();
