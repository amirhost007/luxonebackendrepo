import { pool } from './src/db.js';

const materials = [
  // Standard Quartz (280 AED/sqm base cost)
  ['quartz', 'Golden River 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 280.00, true],
  ['quartz', 'The Grold 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 280.00, true],
  ['quartz', 'Megistic White 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 260.00, true],
  ['quartz', 'Royal Statuario 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 280.00, true],
  ['quartz', 'Universe Grey 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 280.00, true],
  ['quartz', 'Strike Light 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 280.00, true],
  ['quartz', 'Grey Leather 20mm Leather', 'Leather', '20mm', '5.12', 5.12, 280.00, true],

  // Premium Quartz (320 AED/sqm base cost)
  ['quartz', 'White Pazzal 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'The Saint 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'The Saint 20mm Matt', 'Matt', '20mm', '5.12', 5.12, 350.00, true],
  ['quartz', 'Super Wave 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'White Beauty 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'Grey Wonder 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'Supreme Taj 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'Golden Track 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'The Ambience 20mm Leather', 'Leather', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'The Glacier 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'Imperial White 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'Ambience Touch 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'Amazed Grey 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 320.00, true],
  ['quartz', 'Moon White 20mm Polish', 'Polish', '20mm', '5.12', 5.12, 220.00, true]
];

async function insertMaterials() {
  try {
    console.log('Starting to insert quartz materials...');
    
    // First, let's add the base_cost column if it doesn't exist
    try {
      await pool.query('ALTER TABLE material_options ADD COLUMN base_cost DECIMAL(10,2) DEFAULT 280.00 AFTER costing_online_quote');
      console.log('Added base_cost column to material_options table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('base_cost column already exists');
      } else {
        throw err;
      }
    }

    // Insert materials
    for (const material of materials) {
      const [type, color_name, finishing, thickness, slab_size, slab_qty_sqm, base_cost, is_available] = material;
      
      try {
        await pool.query(`
          INSERT INTO material_options (type, color_name, finishing, thickness, slab_size, slab_qty_sqm, base_cost, is_available) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [type, color_name, finishing, thickness, slab_size, slab_qty_sqm, base_cost, is_available]);
        
        console.log(`✓ Inserted: ${color_name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠ Skipped (duplicate): ${color_name}`);
        } else {
          console.error(`✗ Error inserting ${color_name}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ Material insertion completed!');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

insertMaterials(); 