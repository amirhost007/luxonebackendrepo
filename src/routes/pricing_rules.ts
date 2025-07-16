import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Define the actual columns in the pricing_rules table
const ALLOWED_FIELDS = [
  'rule_name',
  'rule_type', 
  'category',
  'condition_field',
  'condition_value',
  'price_value',
  'unit',
  'is_active',
  'description',
  'created_at',
  'updated_at'
];

// Filter data to only include allowed fields
const filterAllowedFields = (data: any) => {
  const filtered: any = {};
  ALLOWED_FIELDS.forEach(field => {
    if (data[field] !== undefined) {
      filtered[field] = data[field];
    }
  });
  return filtered;
};

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pricing_rules');
    const rows = result[0] as any[];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [req.params.id]);
    const rows = result[0] as any[];
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = filterAllowedFields(req.body);
    const result = await pool.query('INSERT INTO pricing_rules SET ?', [data]);
    res.status(201).json({ id: (result[0] as any).insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = filterAllowedFields(req.body);
    const result = await pool.query('UPDATE pricing_rules SET ? WHERE id = ?', [data, req.params.id]);
    res.json({ affectedRows: (result[0] as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
    res.json({ affectedRows: (result[0] as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

export default router; 